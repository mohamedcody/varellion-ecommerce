package com.varellion.store.security;

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

    private RateLimitFilter rateLimitFilter;
    private FilterChain filterChain;

    @BeforeEach
    void setUp() {
        rateLimitFilter = new RateLimitFilter();
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
}
