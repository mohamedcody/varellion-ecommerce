package com.varellion.store.security;

import com.varellion.store.security.filter.ClientIpResolver;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ClientIpResolverTest {

    // Configured with loopback and production Nginx static IP /32
    private static final String PROD_CONFIG = "127.0.0.1,::1,172.28.0.10/32";
    private ClientIpResolver resolver;

    @BeforeEach
    void setUp() {
        resolver = new ClientIpResolver(PROD_CONFIG);
    }

    @Nested
    @DisplayName("Configuration & Fail-Secure Tests")
    class ConfigurationTests {

        @Test
        @DisplayName("Default configuration with empty property should trust ONLY loopback (127.0.0.1, ::1)")
        void testDefaultConfigurationLoopbackOnly() {
            ClientIpResolver defaultResolver = new ClientIpResolver("");

            // Loopback trusted
            assertThat(defaultResolver.isTrustedProxy("127.0.0.1")).isTrue();
            assertThat(defaultResolver.isTrustedProxy("::1")).isTrue();

            // Broad RFC 1918 / Docker networks MUST NOT be trusted by default!
            assertThat(defaultResolver.isTrustedProxy("172.16.0.1")).isFalse();
            assertThat(defaultResolver.isTrustedProxy("172.18.0.3")).isFalse();
            assertThat(defaultResolver.isTrustedProxy("10.0.0.1")).isFalse();
            assertThat(defaultResolver.isTrustedProxy("192.168.1.1")).isFalse();
        }

        @Test
        @DisplayName("Explicitly empty or 'none' configuration should trust NO proxies (fail-secure)")
        void testExplicitNoneConfiguration() {
            ClientIpResolver noneResolver = new ClientIpResolver("none");

            assertThat(noneResolver.isTrustedProxy("127.0.0.1")).isFalse();
            assertThat(noneResolver.isTrustedProxy("172.28.0.10")).isFalse();

            MockHttpServletRequest req = new MockHttpServletRequest();
            req.setRemoteAddr("127.0.0.1");
            req.addHeader("X-Forwarded-For", "203.0.113.50");

            // Even from localhost, headers are ignored if trust is disabled
            assertThat(noneResolver.resolveClientIp(req)).isEqualTo("127.0.0.1");
        }

        @Test
        @DisplayName("Invalid CIDR configuration MUST abort application startup (throw IllegalStateException)")
        void testInvalidCidrAbortsStartup() {
            assertThatThrownBy(() -> new ClientIpResolver("172.28.0.10/999"))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("FATAL: Invalid trusted proxy CIDR or IP");

            assertThatThrownBy(() -> new ClientIpResolver("not-an-ip-or-cidr"))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("FATAL: Invalid trusted proxy CIDR or IP");
        }
    }

    @Nested
    @DisplayName("Trusted Nginx Proxy (/32) vs Untrusted Network Entities")
    class TrustBoundaryTests {

        @Test
        @DisplayName("Trusted Nginx static IP (172.28.0.10) can provide client IP via XFF")
        void testTrustedNginxProxy() {
            MockHttpServletRequest req = new MockHttpServletRequest();
            req.setRemoteAddr("172.28.0.10"); // Exactly matches configured /32
            req.addHeader("X-Forwarded-For", "203.0.113.195");

            assertThat(resolver.resolveClientIp(req)).isEqualTo("203.0.113.195");
        }

        @Test
        @DisplayName("Untrusted Frontend container IP (172.28.0.30) CANNOT provide client IP through XFF")
        void testFrontendContainerUntrusted() {
            MockHttpServletRequest req = new MockHttpServletRequest();
            req.setRemoteAddr("172.28.0.30"); // Frontend container on same Docker network
            req.addHeader("X-Forwarded-For", "198.51.100.99"); // Attempted spoof

            // Must NOT trust XFF from Frontend container; must bind to frontend's actual IP
            assertThat(resolver.resolveClientIp(req)).isEqualTo("172.28.0.30");
        }

        @Test
        @DisplayName("Neighboring container outside the /32 (e.g. 172.28.0.11) is NOT trusted")
        void testNeighboringContainerUntrusted() {
            MockHttpServletRequest req = new MockHttpServletRequest();
            req.setRemoteAddr("172.28.0.11"); // Adjacent IP in same /24 subnet, but outside /32
            req.addHeader("X-Forwarded-For", "198.51.100.99");

            assertThat(resolver.resolveClientIp(req)).isEqualTo("172.28.0.11");
        }

        @Test
        @DisplayName("Arbitrary container in previous 172.16.0.0/12 range is NOT trusted")
        void testArbitraryDockerContainerUntrusted() {
            MockHttpServletRequest req = new MockHttpServletRequest();
            req.setRemoteAddr("172.18.0.3");
            req.addHeader("X-Forwarded-For", "1.1.1.1");

            assertThat(resolver.resolveClientIp(req)).isEqualTo("172.18.0.3");
        }

        @Test
        @DisplayName("Untrusted direct client from public internet cannot spoof address using XFF")
        void testUntrustedDirectPublicClient() {
            MockHttpServletRequest req = new MockHttpServletRequest();
            req.setRemoteAddr("203.0.113.50");
            req.addHeader("X-Forwarded-For", "8.8.8.8");

            assertThat(resolver.resolveClientIp(req)).isEqualTo("203.0.113.50");
        }
    }

    @Nested
    @DisplayName("Duplicate & Multi-Line X-Forwarded-For Header Handling")
    class DuplicateHeaderTests {

        @Test
        @DisplayName("Multiple XFF header fields must be processed in order and resolve the rightmost untrusted hop")
        void testDuplicateXffHeaders() {
            MockHttpServletRequest req = new MockHttpServletRequest();
            req.setRemoteAddr("172.28.0.10"); // Trusted Nginx
            // Attacker sent forged header first, Nginx appended second header line
            req.addHeader("X-Forwarded-For", "8.8.8.8");
            req.addHeader("X-Forwarded-For", "203.0.113.50");

            // Must NOT return the first header (8.8.8.8); must inspect entire chain and return 203.0.113.50!
            assertThat(resolver.resolveClientIp(req)).isEqualTo("203.0.113.50");
        }

        @Test
        @DisplayName("Multiple comma-separated entries across multiple header fields")
        void testMultipleValuesAcrossDuplicateHeaders() {
            MockHttpServletRequest req = new MockHttpServletRequest();
            req.setRemoteAddr("172.28.0.10");
            req.addHeader("X-Forwarded-For", "1.1.1.1, 2.2.2.2");
            req.addHeader("X-Forwarded-For", "3.3.3.3, 203.0.113.77");

            assertThat(resolver.resolveClientIp(req)).isEqualTo("203.0.113.77");
        }

        @Test
        @DisplayName("Multiple trusted proxy hops in chain with duplicate headers")
        void testMultiTrustedProxyChainAcrossDuplicateHeaders() {
            // Resolver with Nginx (172.28.0.10) and internal LB (10.0.1.5)
            ClientIpResolver multiResolver = new ClientIpResolver("127.0.0.1,172.28.0.10/32,10.0.1.5/32");

            MockHttpServletRequest req = new MockHttpServletRequest();
            req.setRemoteAddr("172.28.0.10"); // Nginx
            req.addHeader("X-Forwarded-For", "203.0.113.88"); // Client
            req.addHeader("X-Forwarded-For", "10.0.1.5");      // Internal LB (trusted)

            // Rightmost is 10.0.1.5 (trusted), steps left to 203.0.113.88 (untrusted client)
            assertThat(multiResolver.resolveClientIp(req)).isEqualTo("203.0.113.88");
        }

        @Test
        @DisplayName("Malformed tokens in duplicate headers must be skipped without crashing")
        void testMalformedTokensInDuplicateHeaders() {
            MockHttpServletRequest req = new MockHttpServletRequest();
            req.setRemoteAddr("172.28.0.10");
            req.addHeader("X-Forwarded-For", "malicious.domain.com, <script>");
            req.addHeader("X-Forwarded-For", "203.0.113.55");

            assertThat(resolver.resolveClientIp(req)).isEqualTo("203.0.113.55");
        }
    }

    @Nested
    @DisplayName("Edge Cases & IPv6 Sanitization")
    class EdgeCaseTests {

        @Test
        @DisplayName("Should correctly sanitize IPv4 with port")
        void testIpv4WithPort() {
            MockHttpServletRequest req = new MockHttpServletRequest();
            req.setRemoteAddr("127.0.0.1");
            req.addHeader("X-Forwarded-For", "203.0.113.10:54321");

            assertThat(resolver.resolveClientIp(req)).isEqualTo("203.0.113.10");
        }

        @Test
        @DisplayName("Should correctly handle standard IPv6 client address")
        void testStandardIpv6() {
            MockHttpServletRequest req = new MockHttpServletRequest();
            req.setRemoteAddr("::1");
            req.addHeader("X-Forwarded-For", "2001:db8:85a3::8a2e:370:7334");

            assertThat(resolver.resolveClientIp(req)).isEqualTo("2001:db8:85a3::8a2e:370:7334");
        }

        @Test
        @DisplayName("Should sanitize bracketed IPv6 with port")
        void testBracketedIpv6WithPort() {
            MockHttpServletRequest req = new MockHttpServletRequest();
            req.setRemoteAddr("127.0.0.1");
            req.addHeader("X-Forwarded-For", "[2001:db8::1]:8080");

            assertThat(resolver.resolveClientIp(req)).isEqualTo("2001:db8::1");
        }

        @Test
        @DisplayName("Should fallback to X-Real-IP if XFF is absent")
        void testFallbackToXRealIp() {
            MockHttpServletRequest req = new MockHttpServletRequest();
            req.setRemoteAddr("172.28.0.10");
            req.addHeader("X-Real-IP", "198.51.100.80");

            assertThat(resolver.resolveClientIp(req)).isEqualTo("198.51.100.80");
        }

        @Test
        @DisplayName("Should fallback to remoteAddr if all headers are missing or whitespace")
        void testFallbackToRemoteAddrWhenHeadersMissing() {
            MockHttpServletRequest req = new MockHttpServletRequest();
            req.setRemoteAddr("172.28.0.10");
            req.addHeader("X-Forwarded-For", "   ");

            assertThat(resolver.resolveClientIp(req)).isEqualTo("172.28.0.10");
        }
    }
}
