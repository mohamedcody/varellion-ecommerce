package com.varellion.store.security;

import com.varellion.store.security.service.GoogleTokenVerifier;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

class GoogleTokenVerifierTest {

    private GoogleTokenVerifier googleTokenVerifier;

    @BeforeEach
    void setUp() {
        // Initialize with test client ID
        googleTokenVerifier = new GoogleTokenVerifier("1003559537454-test.apps.googleusercontent.com");
    }

    @Test
    @DisplayName("Security Remediation F1: Should strictly reject the removed mock token")
    void shouldRejectRemovedBypassToken() {
        // The previous vulnerable mock token must now be rejected
        assertThatThrownBy(() -> googleTokenVerifier.verify("bruno-test-google-token"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"   ", "\t", "\n"})
    @DisplayName("Should reject null, empty, or whitespace-only token")
    void shouldRejectNullOrBlankToken(String token) {
        assertThatThrownBy(() -> googleTokenVerifier.verify(token))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Google ID token cannot be null or empty.");
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "invalid-token",
            "fake.jwt.token",
            "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.e30.fake_signature",
            "1003559537454-c93rrfj1ka0pjabj10g02eado3c9r2jg.apps.googleusercontent.com"
    })
    @DisplayName("Should reject arbitrary invalid or malformed tokens")
    void shouldRejectMalformedTokens(String malformedToken) {
        assertThatThrownBy(() -> googleTokenVerifier.verify(malformedToken))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
