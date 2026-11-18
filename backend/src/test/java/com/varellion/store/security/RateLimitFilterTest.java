package com.varellion.store.security;

import com.varellion.store.security.filter.ClientIpResolver;
import com.varellion.store.security.filter.RateLimitFilter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class RateLimitFilterTest {

    private static final String TRUSTED_PROXIES = "127.0.0.1,::1,172.28.0.10/32";
    private RateLimitFilter rateLimitFilter;
    private FilterChain filterChain;

    @BeforeEach
    void setUp() {
        ClientIpResolver resolver = new ClientIpResolver(TRUSTED_PROXIES);
        rateLimitFilter = new RateLimitFilter(resolver);
        filterChain = mock(FilterChain.class);
    }

    @Test
    @DisplayName("Should allow requests within rate limit")
    void testRequestsWithinLimit() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/login");
        request.setRemoteAddr("192.168.1.100");
        MockHttpServletResponse response = new MockHttpServletResponse();

        rateLimitFilter.doFilter(request, response, filterChain);

        assertThat(response.getStatus()).isEqualTo(200);
        verify(filterChain, times(1)).doFilter(request, response);
    }

    @Test
    @DisplayName("Should block requests exceeding rate limit (20 requests for /api/auth)")
    void testRequestsExceedingLimit() throws ServletException, IOException {
        String clientIp = "192.168.1.200";

        // Perform 20 requests (within limit)
        for (int i = 0; i < 20; i++) {
            MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/auth/login");
            req.setRemoteAddr(clientIp);
            MockHttpServletResponse res = new MockHttpServletResponse();
            rateLimitFilter.doFilter(req, res, filterChain);
            assertThat(res.getStatus()).isEqualTo(200);
        }

        // 21st request should be rejected with 429 Too Many Requests
        MockHttpServletRequest blockedReq = new MockHttpServletRequest("POST", "/api/auth/login");
        blockedReq.setRemoteAddr(clientIp);
        MockHttpServletResponse blockedRes = new MockHttpServletResponse();
        rateLimitFilter.doFilter(blockedReq, blockedRes, filterChain);

        assertThat(blockedRes.getStatus()).isEqualTo(429);
        assertThat(blockedRes.getContentAsString()).contains("Too Many Requests");
        assertThat(blockedRes.getContentAsString()).contains("429");
    }

    @Test
    @DisplayName("Should bypass OPTIONS requests and non-rate-limited paths")
    void testBypassOptionsAndPublicPaths() throws ServletException, IOException {
        MockHttpServletRequest optionsReq = new MockHttpServletRequest("OPTIONS", "/api/auth/login");
        optionsReq.setRemoteAddr("10.0.0.1");
        MockHttpServletResponse optionsRes = new MockHttpServletResponse();

        rateLimitFilter.doFilter(optionsReq, optionsRes, filterChain);
        assertThat(optionsRes.getStatus()).isEqualTo(200);
        verify(filterChain, times(1)).doFilter(optionsReq, optionsRes);

        MockHttpServletRequest catalogReq = new MockHttpServletRequest("GET", "/api/products");
        catalogReq.setRemoteAddr("10.0.0.1");
        MockHttpServletResponse catalogRes = new MockHttpServletResponse();

        rateLimitFilter.doFilter(catalogReq, catalogRes, filterChain);
        assertThat(catalogRes.getStatus()).isEqualTo(200);
        verify(filterChain, times(1)).doFilter(catalogReq, catalogRes);
    }

    @Test
    @DisplayName("Should block order lookup requests exceeding 15 per minute")
    void testOrderLookupRateLimiting() throws ServletException, IOException {
        String clientIp = "192.168.1.50";

        for (int i = 0; i < 15; i++) {
            MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/orders/lookup");
            req.setRemoteAddr(clientIp);
            MockHttpServletResponse res = new MockHttpServletResponse();
            rateLimitFilter.doFilter(req, res, filterChain);
            assertThat(res.getStatus()).isEqualTo(200);
        }

        MockHttpServletRequest blockedReq = new MockHttpServletRequest("GET", "/api/orders/track");
        blockedReq.setRemoteAddr(clientIp);
        MockHttpServletResponse blockedRes = new MockHttpServletResponse();
        rateLimitFilter.doFilter(blockedReq, blockedRes, filterChain);

        assertThat(blockedRes.getStatus()).isEqualTo(429);
        assertThat(blockedRes.getContentAsString()).contains("Too Many Requests");
    }

    @Test
    @DisplayName("SEC-04: Two different clients behind trusted Nginx (172.28.0.10/32) have independent buckets")
    void testDifferentClientsBehindNginxDoNotShareBucket() throws ServletException, IOException {
        String nginxProxyIp = "172.28.0.10"; // Dedicated Nginx static IP
        String clientA = "203.0.113.10";
        String clientB = "203.0.113.20";

        // Client A consumes all 20 allowed auth requests
        for (int i = 0; i < 20; i++) {
            MockHttpServletRequest reqA = new MockHttpServletRequest("POST", "/api/auth/login");
            reqA.setRemoteAddr(nginxProxyIp);
            reqA.addHeader("X-Forwarded-For", clientA);
            MockHttpServletResponse resA = new MockHttpServletResponse();
            rateLimitFilter.doFilter(reqA, resA, filterChain);
            assertThat(resA.getStatus()).isEqualTo(200);
        }

        // Client A's 21st request should be blocked
        MockHttpServletRequest reqABlocked = new MockHttpServletRequest("POST", "/api/auth/login");
        reqABlocked.setRemoteAddr(nginxProxyIp);
        reqABlocked.addHeader("X-Forwarded-For", clientA);
        MockHttpServletResponse resABlocked = new MockHttpServletResponse();
        rateLimitFilter.doFilter(reqABlocked, resABlocked, filterChain);
        assertThat(resABlocked.getStatus()).isEqualTo(429);

        // Client B sending their first request through the SAME Nginx proxy must NOT be blocked!
        MockHttpServletRequest reqB = new MockHttpServletRequest("POST", "/api/auth/login");
        reqB.setRemoteAddr(nginxProxyIp);
        reqB.addHeader("X-Forwarded-For", clientB);
        MockHttpServletResponse resB = new MockHttpServletResponse();
        rateLimitFilter.doFilter(reqB, resB, filterChain);
        assertThat(resB.getStatus()).isEqualTo(200);
    }

    @Test
    @DisplayName("SEC-04: Malicious Frontend container (172.28.0.30) CANNOT spoof client IP or choose another user's bucket")
    void testFrontendContainerCannotEvadeRateLimitingOrSpoofOtherUsers() throws ServletException, IOException {
        String frontendIp = "172.28.0.30"; // Frontend container on same Docker network

        // Frontend container attempts to rotate spoofed XFF headers for every request
        for (int i = 0; i < 20; i++) {
            MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/auth/login");
            req.setRemoteAddr(frontendIp);
            req.addHeader("X-Forwarded-For", "203.0.113." + i); // Spoofed user IP
            MockHttpServletResponse res = new MockHttpServletResponse();
            rateLimitFilter.doFilter(req, res, filterChain);
            assertThat(res.getStatus()).isEqualTo(200);
        }

        // Because frontendIp is NOT in 172.28.0.10/32, all requests were keyed to 172.28.0.30!
        // The 21st request from frontend must be BLOCKED
        MockHttpServletRequest blockedReq = new MockHttpServletRequest("POST", "/api/auth/login");
        blockedReq.setRemoteAddr(frontendIp);
        blockedReq.addHeader("X-Forwarded-For", "203.0.113.99");
        MockHttpServletResponse blockedRes = new MockHttpServletResponse();
        rateLimitFilter.doFilter(blockedReq, blockedRes, filterChain);

        assertThat(blockedRes.getStatus()).isEqualTo(429);
        assertThat(blockedRes.getContentAsString()).contains("Too Many Requests");
    }

    @Test
    @DisplayName("SEC-04: Untrusted direct client cannot evade rate limits by forging X-Forwarded-For")
    void testUntrustedClientCannotEvadeRateLimitingByForgingXff() throws ServletException, IOException {
        String attackerDirectIp = "203.0.113.77"; // Untrusted direct connection

        // Attacker attempts to rotate forged X-Forwarded-For IPs on every request
        for (int i = 0; i < 20; i++) {
            MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/auth/login");
            req.setRemoteAddr(attackerDirectIp);
            req.addHeader("X-Forwarded-For", "198.51.100." + i); // Spoofed IP
            MockHttpServletResponse res = new MockHttpServletResponse();
            rateLimitFilter.doFilter(req, res, filterChain);
            assertThat(res.getStatus()).isEqualTo(200);
        }

        // 21st request from the same attacker (even with a new fake IP) must be BLOCKED
        MockHttpServletRequest blockedReq = new MockHttpServletRequest("POST", "/api/auth/login");
        blockedReq.setRemoteAddr(attackerDirectIp);
        blockedReq.addHeader("X-Forwarded-For", "1.2.3.4");
        MockHttpServletResponse blockedRes = new MockHttpServletResponse();
        rateLimitFilter.doFilter(blockedReq, blockedRes, filterChain);

        assertThat(blockedRes.getStatus()).isEqualTo(429);
        assertThat(blockedRes.getContentAsString()).contains("Too Many Requests");
    }

    @Test
    @DisplayName("SEC-04: Duplicate XFF headers behind Nginx resolve authentic client correctly in rate limiting")
    void testDuplicateHeadersInRateLimiting() throws ServletException, IOException {
        String nginxProxyIp = "172.28.0.10";
        String victimIp = "203.0.113.88";

        for (int i = 0; i < 20; i++) {
            MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/auth/login");
            req.setRemoteAddr(nginxProxyIp);
            req.addHeader("X-Forwarded-For", "1.1.1.1");       // Forged client header
            req.addHeader("X-Forwarded-For", victimIp);        // Appended by proxy
            MockHttpServletResponse res = new MockHttpServletResponse();
            rateLimitFilter.doFilter(req, res, filterChain);
            assertThat(res.getStatus()).isEqualTo(200);
        }

        MockHttpServletRequest blockedReq = new MockHttpServletRequest("POST", "/api/auth/login");
        blockedReq.setRemoteAddr(nginxProxyIp);
        blockedReq.addHeader("X-Forwarded-For", "1.1.1.1");
        blockedReq.addHeader("X-Forwarded-For", victimIp);
        MockHttpServletResponse blockedRes = new MockHttpServletResponse();
        rateLimitFilter.doFilter(blockedReq, blockedRes, filterChain);

        assertThat(blockedRes.getStatus()).isEqualTo(429);
    }
}
