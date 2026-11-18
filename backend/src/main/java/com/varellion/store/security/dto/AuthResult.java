package com.varellion.store.security.dto;

/**
 * Internal Authentication Result holding the sanitized client-facing
 * {@link AuthResponse} (which contains NO refresh token) and the raw refresh token
 * meant strictly for HttpOnly Set-Cookie delivery.
 */
public record AuthResult(AuthResponse response, String refreshToken) {

    public static AuthResult of(AuthResponse response, String refreshToken) {
        return new AuthResult(response, refreshToken);
    }

    public AuthResponse getResponse() {
        return response;
    }

    public String getRefreshToken() {
        return refreshToken;
    }
}
