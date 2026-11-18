package com.varellion.store.security;

import com.varellion.store.security.jwt.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    private JwtService jwtService;
    private UserDetails userDetails;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        // 256-bit test secret Base64 encoded
        ReflectionTestUtils.setField(jwtService, "secret", "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970");
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", 900000L); // 15 mins
        ReflectionTestUtils.setField(jwtService, "refreshExpiration", 604800000L); // 7 days
        jwtService.init();

        userDetails = new User("admin@varellion.com", "password", List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
    }

    @Test
    @DisplayName("Should generate valid ACCESS token with ACCESS token_type")
    void testGenerateAccessToken() {
        String token = jwtService.generateToken(userDetails);

        assertThat(token).isNotBlank();
        assertThat(jwtService.extractUsername(token)).isEqualTo("admin@varellion.com");
        assertThat(jwtService.isTokenType(token, JwtService.ACCESS_TOKEN_TYPE)).isTrue();
        assertThat(jwtService.isTokenValid(token, userDetails)).isTrue();
        // Access token must NOT be valid as a refresh token
        assertThat(jwtService.isRefreshTokenValid(token, userDetails)).isFalse();
    }

    @Test
    @DisplayName("Should generate valid REFRESH token with REFRESH token_type")
    void testGenerateRefreshToken() {
        String refreshToken = jwtService.generateRefreshToken(userDetails);

        assertThat(refreshToken).isNotBlank();
        assertThat(jwtService.extractUsername(refreshToken)).isEqualTo("admin@varellion.com");
        assertThat(jwtService.isTokenType(refreshToken, JwtService.REFRESH_TOKEN_TYPE)).isTrue();
        assertThat(jwtService.isRefreshTokenValid(refreshToken, userDetails)).isTrue();
        // Refresh token must NOT be valid as an access token
        assertThat(jwtService.isTokenValid(refreshToken, userDetails)).isFalse();
    }

    @Test
    @DisplayName("P0 Fix: isTokenValid MUST return false when user is disabled")
    void testTokenInvalidWhenUserDisabled() {
        String token = jwtService.generateToken(userDetails);
        UserDetails disabledUser = new User("admin@varellion.com", "password", false, true, true, true,
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));

        assertThat(jwtService.isTokenValid(token, disabledUser)).isFalse();
    }

    @Test
    @DisplayName("P0 Fix: isTokenValid MUST return false when user account is locked")
    void testTokenInvalidWhenUserLocked() {
        String token = jwtService.generateToken(userDetails);
        UserDetails lockedUser = new User("admin@varellion.com", "password", true, true, true, false,
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));

        assertThat(jwtService.isTokenValid(token, lockedUser)).isFalse();
    }

    @Test
    @DisplayName("P0 Fix: isRefreshTokenValid MUST return false when user is disabled")
    void testRefreshTokenInvalidWhenUserDisabled() {
        String refreshToken = jwtService.generateRefreshToken(userDetails);
        UserDetails disabledUser = new User("admin@varellion.com", "password", false, true, true, true,
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));

        assertThat(jwtService.isRefreshTokenValid(refreshToken, disabledUser)).isFalse();
    }

    @Test
    @DisplayName("P0 Fix: isRefreshTokenValid MUST return false when user account is locked")
    void testRefreshTokenInvalidWhenUserLocked() {
        String refreshToken = jwtService.generateRefreshToken(userDetails);
        UserDetails lockedUser = new User("admin@varellion.com", "password", true, true, true, false,
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));

        assertThat(jwtService.isRefreshTokenValid(refreshToken, lockedUser)).isFalse();
    }
}
