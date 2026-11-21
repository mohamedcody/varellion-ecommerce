package com.varellion.store.security.controller;

import com.varellion.store.security.dto.AuthResponse;
import com.varellion.store.security.dto.AuthResult;
import com.varellion.store.security.dto.GoogleLoginRequest;
import com.varellion.store.security.dto.LoginRequest;
import com.varellion.store.security.dto.RegisterRequest;
import com.varellion.store.security.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Value("${app.security.cookie.secure:true}")
    private boolean cookieSecure;

    @Value("${jwt.refresh-expiration:604800000}")
    private long refreshExpirationMs;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResult result = authService.login(request);
        ResponseCookie cookie = buildRefreshTokenCookie(result.refreshToken(), refreshExpirationMs / 1000);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(result.response());
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResult result = authService.register(request);
        ResponseCookie cookie = buildRefreshTokenCookie(result.refreshToken(), refreshExpirationMs / 1000);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(result.response());
    }

    @PostMapping("/google")
    public ResponseEntity<AuthResponse> googleLogin(@Valid @RequestBody GoogleLoginRequest request) {
        AuthResult result = authService.googleLogin(request);
        ResponseCookie cookie = buildRefreshTokenCookie(result.refreshToken(), refreshExpirationMs / 1000);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(result.response());
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(
            @CookieValue(name = "refresh_token", required = false) String cookieRefreshToken,
            @RequestBody(required = false) Map<String, String> body) {

        String token = cookieRefreshToken;
        if ((token == null || token.isBlank()) && body != null) {
            token = body.get("refreshToken");
        }

        AuthResult result = authService.refreshToken(token);
        ResponseCookie cookie = buildRefreshTokenCookie(result.refreshToken(), refreshExpirationMs / 1000);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(result.response());
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(
            @CookieValue(name = "refresh_token", required = false) String cookieRefreshToken) {
        if (cookieRefreshToken != null && !cookieRefreshToken.isBlank()) {
            authService.logout(cookieRefreshToken);
        }
        ResponseCookie cookie = buildRefreshTokenCookie("", 0);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(Map.of("message", "Logged out successfully"));
    }

    private ResponseCookie buildRefreshTokenCookie(String token, long maxAgeSeconds) {
        return ResponseCookie.from("refresh_token", token)
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/")
                .maxAge(maxAgeSeconds)
                .sameSite("Lax")
                .build();
    }
}
