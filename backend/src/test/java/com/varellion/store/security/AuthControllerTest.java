package com.varellion.store.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.varellion.store.security.controller.AuthController;
import com.varellion.store.security.dto.*;
import com.varellion.store.security.service.AuthService;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Map;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    private MockMvc mockMvc;

    @Mock
    private AuthService authService;

    @InjectMocks
    private AuthController authController;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authController, "cookieSecure", false);
        ReflectionTestUtils.setField(authController, "refreshExpirationMs", 604800000L);
        mockMvc = MockMvcBuilders.standaloneSetup(authController).build();
    }

    @Test
    @DisplayName("SEC-02: Login returns refresh token exclusively in HttpOnly cookie and OMITS it from JSON body")
    void login_ShouldSetHttpOnlyCookieAndOmitRefreshTokenFromJsonBody() throws Exception {
        AuthResponse authResponse = AuthResponse.builder()
                .accessToken("mock-access-token")
                .email("user@varellion.com")
                .username("varellion_user")
                .role("USER")
                .message("Login successful")
                .build();
        AuthResult authResult = new AuthResult(authResponse, "secret-refresh-token");

        when(authService.login(any(LoginRequest.class))).thenReturn(authResult);

        LoginRequest request = new LoginRequest();
        request.setIdentifier("user@varellion.com");
        request.setPassword("Password123!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(header().exists("Set-Cookie"))
                .andExpect(header().string("Set-Cookie", containsString("refresh_token=secret-refresh-token")))
                .andExpect(header().string("Set-Cookie", containsString("HttpOnly")))
                .andExpect(header().string("Set-Cookie", containsString("Path=/")))
                .andExpect(header().string("Set-Cookie", containsString("SameSite=Lax")))
                .andExpect(header().string("Set-Cookie", containsString("Max-Age=604800")))
                .andExpect(jsonPath("$.accessToken").value("mock-access-token"))
                .andExpect(jsonPath("$.email").value("user@varellion.com"))
                .andExpect(jsonPath("$.username").value("varellion_user"))
                .andExpect(jsonPath("$.role").value("USER"))
                // P0 Security Assertion: refreshToken MUST NOT exist in JSON body
                .andExpect(jsonPath("$.refreshToken").doesNotExist());
    }

    @Test
    @DisplayName("SEC-02: Register returns refresh token exclusively in HttpOnly cookie and OMITS it from JSON body")
    void register_ShouldSetHttpOnlyCookieAndOmitRefreshTokenFromJsonBody() throws Exception {
        AuthResponse authResponse = AuthResponse.builder()
                .accessToken("mock-access-token-reg")
                .email("new@varellion.com")
                .username("new_user")
                .role("USER")
                .message("Registration successful")
                .build();
        AuthResult authResult = new AuthResult(authResponse, "secret-refresh-token-reg");

        when(authService.register(any(RegisterRequest.class))).thenReturn(authResult);

        RegisterRequest request = new RegisterRequest();
        request.setUsername("new_user");
        request.setEmail("new@varellion.com");
        request.setPassword("Password123!");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(header().exists("Set-Cookie"))
                .andExpect(header().string("Set-Cookie", containsString("refresh_token=secret-refresh-token-reg")))
                .andExpect(header().string("Set-Cookie", containsString("HttpOnly")))
                .andExpect(header().string("Set-Cookie", containsString("Path=/")))
                .andExpect(header().string("Set-Cookie", containsString("SameSite=Lax")))
                .andExpect(jsonPath("$.accessToken").value("mock-access-token-reg"))
                .andExpect(jsonPath("$.email").value("new@varellion.com"))
                // P0 Security Assertion: refreshToken MUST NOT exist in JSON body
                .andExpect(jsonPath("$.refreshToken").doesNotExist());
    }

    @Test
    @DisplayName("SEC-02: Google OAuth returns refresh token exclusively in HttpOnly cookie and OMITS it from JSON body")
    void googleLogin_ShouldSetHttpOnlyCookieAndOmitRefreshTokenFromJsonBody() throws Exception {
        AuthResponse authResponse = AuthResponse.builder()
                .accessToken("mock-google-access-token")
                .email("google@varellion.com")
                .username("google_user")
                .role("USER")
                .message("Google login successful")
                .build();
        AuthResult authResult = new AuthResult(authResponse, "secret-google-refresh-token");

        when(authService.googleLogin(any(GoogleLoginRequest.class))).thenReturn(authResult);

        GoogleLoginRequest request = new GoogleLoginRequest("mock-google-id-token");

        mockMvc.perform(post("/api/auth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(header().exists("Set-Cookie"))
                .andExpect(header().string("Set-Cookie", containsString("refresh_token=secret-google-refresh-token")))
                .andExpect(header().string("Set-Cookie", containsString("HttpOnly")))
                .andExpect(header().string("Set-Cookie", containsString("Path=/")))
                .andExpect(header().string("Set-Cookie", containsString("SameSite=Lax")))
                .andExpect(jsonPath("$.accessToken").value("mock-google-access-token"))
                .andExpect(jsonPath("$.email").value("google@varellion.com"))
                // P0 Security Assertion: refreshToken MUST NOT exist in JSON body
                .andExpect(jsonPath("$.refreshToken").doesNotExist());
    }

    @Test
    @DisplayName("SEC-02: Refresh endpoint reads cookie, sets new HttpOnly cookie, and OMITS refreshToken from JSON body")
    void refreshToken_WithCookie_ShouldSetHttpOnlyCookieAndOmitRefreshTokenFromJsonBody() throws Exception {
        AuthResponse authResponse = AuthResponse.builder()
                .accessToken("new-access-token")
                .email("user@varellion.com")
                .username("varellion_user")
                .role("USER")
                .message("Token refreshed successfully")
                .build();
        AuthResult authResult = new AuthResult(authResponse, "new-rotated-refresh-token");

        when(authService.refreshToken("incoming-cookie-token")).thenReturn(authResult);

        mockMvc.perform(post("/api/auth/refresh")
                        .cookie(new Cookie("refresh_token", "incoming-cookie-token")))
                .andExpect(status().isOk())
                .andExpect(header().exists("Set-Cookie"))
                .andExpect(header().string("Set-Cookie", containsString("refresh_token=new-rotated-refresh-token")))
                .andExpect(header().string("Set-Cookie", containsString("HttpOnly")))
                .andExpect(header().string("Set-Cookie", containsString("Path=/")))
                .andExpect(header().string("Set-Cookie", containsString("SameSite=Lax")))
                .andExpect(jsonPath("$.accessToken").value("new-access-token"))
                .andExpect(jsonPath("$.email").value("user@varellion.com"))
                // P0 Security Assertion: refreshToken MUST NOT exist in JSON body
                .andExpect(jsonPath("$.refreshToken").doesNotExist());

        verify(authService).refreshToken("incoming-cookie-token");
    }

    @Test
    @DisplayName("SEC-02: Refresh endpoint supports request body fallback for non-browser clients")
    void refreshToken_WithRequestBody_ShouldSetHttpOnlyCookieAndOmitRefreshTokenFromJsonBody() throws Exception {
        AuthResponse authResponse = AuthResponse.builder()
                .accessToken("body-access-token")
                .email("client@varellion.com")
                .username("api_client")
                .role("USER")
                .message("Token refreshed successfully")
                .build();
        AuthResult authResult = new AuthResult(authResponse, "body-rotated-refresh-token");

        when(authService.refreshToken("body-token")).thenReturn(authResult);

        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("refreshToken", "body-token"))))
                .andExpect(status().isOk())
                .andExpect(header().exists("Set-Cookie"))
                .andExpect(header().string("Set-Cookie", containsString("refresh_token=body-rotated-refresh-token")))
                .andExpect(header().string("Set-Cookie", containsString("HttpOnly")))
                .andExpect(jsonPath("$.accessToken").value("body-access-token"))
                // P0 Security Assertion: refreshToken MUST NOT exist in JSON body
                .andExpect(jsonPath("$.refreshToken").doesNotExist());

        verify(authService).refreshToken("body-token");
    }

    @Test
    @DisplayName("SEC-02: Logout clears the refresh token cookie with Max-Age 0")
    void logout_ShouldClearHttpOnlyCookieWithMaxAgeZero() throws Exception {
        mockMvc.perform(post("/api/auth/logout"))
                .andExpect(status().isOk())
                .andExpect(header().exists("Set-Cookie"))
                .andExpect(header().string("Set-Cookie", containsString("refresh_token=")))
                .andExpect(header().string("Set-Cookie", containsString("Max-Age=0")))
                .andExpect(header().string("Set-Cookie", containsString("HttpOnly")))
                .andExpect(header().string("Set-Cookie", containsString("Path=/")))
                .andExpect(header().string("Set-Cookie", containsString("SameSite=Lax")))
                .andExpect(jsonPath("$.message").value("Logged out successfully"));
    }

    @Test
    @DisplayName("SEC-02: In production (cookieSecure=true), cookie includes Secure flag")
    void cookieSecurity_InProductionMode_ShouldIncludeSecureFlag() throws Exception {
        ReflectionTestUtils.setField(authController, "cookieSecure", true);

        AuthResponse authResponse = AuthResponse.builder()
                .accessToken("mock-access-token")
                .message("Login successful")
                .build();
        AuthResult authResult = new AuthResult(authResponse, "secure-refresh-token");

        when(authService.login(any(LoginRequest.class))).thenReturn(authResult);

        LoginRequest request = new LoginRequest();
        request.setIdentifier("user@varellion.com");
        request.setPassword("Password123!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(header().string("Set-Cookie", containsString("; Secure")))
                .andExpect(header().string("Set-Cookie", containsString("HttpOnly")))
                .andExpect(jsonPath("$.refreshToken").doesNotExist());
    }

    @Test
    @DisplayName("SEC-02: In development (cookieSecure=false), cookie does NOT include Secure flag")
    void cookieSecurity_InDevMode_ShouldNotIncludeSecureFlagWhenFalse() throws Exception {
        ReflectionTestUtils.setField(authController, "cookieSecure", false);

        AuthResponse authResponse = AuthResponse.builder()
                .accessToken("mock-access-token")
                .message("Login successful")
                .build();
        AuthResult authResult = new AuthResult(authResponse, "dev-refresh-token");

        when(authService.login(any(LoginRequest.class))).thenReturn(authResult);

        LoginRequest request = new LoginRequest();
        request.setIdentifier("user@varellion.com");
        request.setPassword("Password123!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(header().string("Set-Cookie", not(containsString("; Secure"))))
                .andExpect(header().string("Set-Cookie", containsString("HttpOnly")))
                .andExpect(jsonPath("$.refreshToken").doesNotExist());
    }
}
