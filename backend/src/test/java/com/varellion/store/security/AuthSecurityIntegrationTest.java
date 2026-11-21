package com.varellion.store.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.varellion.store.security.dto.LoginRequest;
import com.varellion.store.security.dto.RegisterRequest;
import com.varellion.store.security.entity.User;
import com.varellion.store.security.filter.RateLimitFilter;
import com.varellion.store.security.repository.UserRepository;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(locations = "classpath:application-test.properties")
class AuthSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private RateLimitFilter rateLimitFilter;

    private String uniquePrefix;

    @BeforeEach
    void setUp() {
        uniquePrefix = "sec_" + UUID.randomUUID().toString().substring(0, 8);
    }

    @Test
    @DisplayName("AUD-003: Account lockout persists across real @Transactional failed logins and returns 423 Locked")
    void accountLockout_PersistsInDatabaseAcrossFailedLogins() throws Exception {
        String email = uniquePrefix + "_lock@varellion.com";
        User user = User.builder()
                .email(email)
                .username(uniquePrefix + "_lock")
                .password(passwordEncoder.encode("CorrectPass123!"))
                .role("USER")
                .enabled(true)
                .emailVerified(true)
                .failedAttempts(0)
                .build();
        userRepository.save(user);

        LoginRequest badReq = new LoginRequest(email, "WrongPass!");

        // Attempts 1..4 -> 401 Unauthorized, failedAttempts persisted in DB
        for (int attempt = 1; attempt <= 4; attempt++) {
            final String ip = "198.51.100.1" + attempt;
            mockMvc.perform(post("/api/auth/login")
                            .with(req -> {
                                req.setRemoteAddr(ip);
                                return req;
                            })
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(badReq)))
                    .andExpect(status().isUnauthorized());

            User persisted = userRepository.findByEmail(email).orElseThrow();
            assertThat(persisted.getFailedAttempts()).isEqualTo(attempt);
        }

        // 5th attempt -> 423 Locked and lockoutTime persisted
        mockMvc.perform(post("/api/auth/login")
                        .with(req -> {
                            req.setRemoteAddr("198.51.100.15");
                            return req;
                        })
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badReq)))
                .andExpect(status().isLocked());

        User lockedUser = userRepository.findByEmail(email).orElseThrow();
        assertThat(lockedUser.getFailedAttempts()).isEqualTo(5);
        assertThat(lockedUser.getLockoutTime()).isNotNull();

        // 6th attempt even with CORRECT password -> still 423 Locked
        LoginRequest goodReq = new LoginRequest(email, "CorrectPass123!");
        mockMvc.perform(post("/api/auth/login")
                        .with(req -> {
                            req.setRemoteAddr("198.51.100.16");
                            return req;
                        })
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(goodReq)))
                .andExpect(status().isLocked());
    }

    @Test
    @DisplayName("AUD-002: Spring injects configured ClientIpResolver (172.28.0.10/32) into RateLimitFilter bean")
    void rateLimitFilterBean_UsesInjectedTrustedProxyConfig() throws Exception {
        String proxyIp = "172.28.0.10";
        String clientA = "203.0.113.51";
        String clientB = "203.0.113.52";

        // Client A consumes all 20 auth requests via Docker Nginx IP
        for (int i = 0; i < 20; i++) {
            MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/auth/login");
            req.setRemoteAddr(proxyIp);
            req.addHeader("X-Forwarded-For", clientA);
            MockHttpServletResponse res = new MockHttpServletResponse();
            rateLimitFilter.doFilter(req, res, (r, s) -> {});
            assertThat(res.getStatus()).isEqualTo(200);
        }

        // Client A's 21st request -> 429
        MockHttpServletRequest blockedA = new MockHttpServletRequest("POST", "/api/auth/login");
        blockedA.setRemoteAddr(proxyIp);
        blockedA.addHeader("X-Forwarded-For", clientA);
        MockHttpServletResponse resA = new MockHttpServletResponse();
        rateLimitFilter.doFilter(blockedA, resA, (r, s) -> {});
        assertThat(resA.getStatus()).isEqualTo(429);

        // Client B behind same Nginx IP MUST NOT be blocked (proves APP_TRUSTED_PROXIES was injected!)
        MockHttpServletRequest reqB = new MockHttpServletRequest("POST", "/api/auth/login");
        reqB.setRemoteAddr(proxyIp);
        reqB.addHeader("X-Forwarded-For", clientB);
        MockHttpServletResponse resB = new MockHttpServletResponse();
        rateLimitFilter.doFilter(reqB, resB, (r, s) -> {});
        assertThat(resB.getStatus()).isEqualTo(200);
    }

    @Test
    @DisplayName("AUD-004 & AUD-005: Rejects '@' in username (400), returns 401 on malformed refresh JWT, and 403 on unauthorized admin access")
    void validationAndErrorStatusHardening() throws Exception {
        RegisterRequest badUsername = new RegisterRequest("victim@varellion.com", uniquePrefix + "@evil.com", "Password123!");
        mockMvc.perform(post("/api/auth/register")
                        .with(req -> {
                            req.setRemoteAddr("198.51.100.21");
                            return req;
                        })
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badUsername)))
                .andExpect(status().isBadRequest());

        // Malformed refresh JWT -> 401 Unauthorized (NOT 500!)
        mockMvc.perform(post("/api/auth/refresh")
                        .with(req -> {
                            req.setRemoteAddr("198.51.100.22");
                            return req;
                        })
                        .cookie(new Cookie("refresh_token", "not.a.valid.jwt")))
                .andExpect(status().isUnauthorized());

        // Register regular USER and verify /api/admin/** returns 403 Forbidden (NOT 500!)
        RegisterRequest reg = new RegisterRequest(uniquePrefix + "_usr", uniquePrefix + "_usr@varellion.com", "Password123!");
        MvcResult regResult = mockMvc.perform(post("/api/auth/register")
                        .with(req -> {
                            req.setRemoteAddr("198.51.100.23");
                            return req;
                        })
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reg)))
                .andExpect(status().isOk())
                .andReturn();

        String accessToken = objectMapper.readTree(regResult.getResponse().getContentAsString())
                .get("accessToken").asText();

        mockMvc.perform(get("/api/admin/dashboard/summary")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("AUD-011: End-to-end logout revokes refresh token and rotated token replay revokes family")
    void refreshToken_LogoutAndRotationReuseDetection() throws Exception {
        RegisterRequest reg = new RegisterRequest(uniquePrefix + "_rt", uniquePrefix + "_rt@varellion.com", "Password123!");
        MvcResult regResult = mockMvc.perform(post("/api/auth/register")
                        .with(req -> {
                            req.setRemoteAddr("198.51.100.31");
                            return req;
                        })
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reg)))
                .andExpect(status().isOk())
                .andReturn();

        String token1 = extractRefreshCookie(regResult);
        assertThat(token1).isNotBlank();

        // Rotate token1 -> token2
        MvcResult refreshResult = mockMvc.perform(post("/api/auth/refresh")
                        .with(req -> {
                            req.setRemoteAddr("198.51.100.32");
                            return req;
                        })
                        .cookie(new Cookie("refresh_token", token1)))
                .andExpect(status().isOk())
                .andReturn();

        String token2 = extractRefreshCookie(refreshResult);
        assertThat(token2).isNotBlank().isNotEqualTo(token1);

        // Replay token1 -> 401 (reuse detected -> revokes entire family)
        mockMvc.perform(post("/api/auth/refresh")
                        .with(req -> {
                            req.setRemoteAddr("198.51.100.33");
                            return req;
                        })
                        .cookie(new Cookie("refresh_token", token1)))
                .andExpect(status().isUnauthorized());

        // token2 from compromised family -> also 401!
        mockMvc.perform(post("/api/auth/refresh")
                        .with(req -> {
                            req.setRemoteAddr("198.51.100.34");
                            return req;
                        })
                        .cookie(new Cookie("refresh_token", token2)))
                .andExpect(status().isUnauthorized());

        // Fresh login -> logout -> refresh must fail with 401
        LoginRequest loginReq = new LoginRequest(uniquePrefix + "_rt@varellion.com", "Password123!");
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .with(req -> {
                            req.setRemoteAddr("198.51.100.35");
                            return req;
                        })
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andReturn();

        String token3 = extractRefreshCookie(loginResult);
        mockMvc.perform(post("/api/auth/logout")
                        .with(req -> {
                            req.setRemoteAddr("198.51.100.36");
                            return req;
                        })
                        .cookie(new Cookie("refresh_token", token3)))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/auth/refresh")
                        .with(req -> {
                            req.setRemoteAddr("198.51.100.37");
                            return req;
                        })
                        .cookie(new Cookie("refresh_token", token3)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("AUD-014: GET /api/orders/track rejects invalid phone with 400 Bad Request via @Validated")
    void guestTrackEndpoint_InvalidPhone_Returns400() throws Exception {
        mockMvc.perform(get("/api/orders/track")
                        .with(req -> {
                            req.setRemoteAddr("198.51.100.40");
                            return req;
                        })
                        .param("orderNumber", "VAR-20261028-0001")
                        .param("phone", "12345"))
                .andExpect(status().isBadRequest());
    }

    private String extractRefreshCookie(MvcResult result) {
        String setCookie = result.getResponse().getHeader("Set-Cookie");
        assertThat(setCookie).isNotNull();
        for (String part : setCookie.split(";")) {
            String trimmed = part.trim();
            if (trimmed.startsWith("refresh_token=")) {
                return trimmed.substring("refresh_token=".length());
            }
        }
        return "";
    }
}
