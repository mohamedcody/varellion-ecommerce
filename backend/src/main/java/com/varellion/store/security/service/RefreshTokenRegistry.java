package com.varellion.store.security.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory server-side refresh token registry for single-instance deployment.
 * Provides explicit logout revocation, single-use refresh token rotation, and
 * refresh-token reuse detection (revoking the entire token family upon replay).
 */
@Service
@Slf4j
public class RefreshTokenRegistry {

    private static final int MAX_TRACKED_TOKENS = 100_000;
    private static final long DEFAULT_TTL_MILLIS = 7 * 24 * 60 * 60 * 1000L; // 7 days

    private enum TokenState {
        ACTIVE,
        ROTATED,
        REVOKED
    }

    private static final class TokenRecord {
        final String familyId;
        final Instant expiresAt;
        volatile TokenState state;

        TokenRecord(String familyId, Instant expiresAt, TokenState state) {
            this.familyId = familyId;
            this.expiresAt = expiresAt;
            this.state = state;
        }
    }

    private final ConcurrentHashMap<String, TokenRecord> tokens = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Instant> revokedFamilies = new ConcurrentHashMap<>();

    /**
     * Registers a newly issued refresh token in its token family.
     */
    public void register(String tokenId, String familyId, Instant expiresAt) {
        if (tokenId == null || tokenId.isBlank()) {
            return;
        }
        Instant effectiveExpiry = expiresAt != null ? expiresAt : Instant.now().plusMillis(DEFAULT_TTL_MILLIS);
        String effectiveFamily = (familyId != null && !familyId.isBlank()) ? familyId : tokenId;
        if (tokens.size() >= MAX_TRACKED_TOKENS) {
            cleanupExpired();
        }
        tokens.put(tokenId, new TokenRecord(effectiveFamily, effectiveExpiry, TokenState.ACTIVE));
    }

    /**
     * Validates that the presented refresh token is neither revoked nor previously rotated,
     * atomically marks it as ROTATED, and triggers family-wide revocation on replay detection.
     */
    public void consumeForRotation(String tokenId, String familyId, Instant expiresAt) {
        if (tokenId == null || tokenId.isBlank()) {
            throw new BadCredentialsException("Invalid refresh token identifier");
        }
        Instant now = Instant.now();
        Instant effectiveExpiry = expiresAt != null ? expiresAt : now.plusMillis(DEFAULT_TTL_MILLIS);
        String effectiveFamily = (familyId != null && !familyId.isBlank()) ? familyId : tokenId;

        Instant familyRevokedUntil = revokedFamilies.get(effectiveFamily);
        if (familyRevokedUntil != null && familyRevokedUntil.isAfter(now)) {
            throw new BadCredentialsException("Refresh token session has been revoked");
        }

        final boolean[] reuseDetected = {false};
        final boolean[] revoked = {false};

        tokens.compute(tokenId, (k, existing) -> {
            if (existing == null) {
                // Token issued before process restart or untracked in unit tests — mark rotated now
                return new TokenRecord(effectiveFamily, effectiveExpiry, TokenState.ROTATED);
            }
            if (existing.state == TokenState.REVOKED) {
                revoked[0] = true;
                return existing;
            }
            if (existing.state == TokenState.ROTATED) {
                reuseDetected[0] = true;
                existing.state = TokenState.REVOKED;
                return existing;
            }
            existing.state = TokenState.ROTATED;
            return existing;
        });

        if (reuseDetected[0]) {
            revokedFamilies.put(effectiveFamily, effectiveExpiry);
            log.warn("Refresh token reuse detected; revoking token family {}", effectiveFamily);
            throw new BadCredentialsException("Refresh token reuse detected. Please log in again.");
        }

        if (revoked[0]) {
            throw new BadCredentialsException("Refresh token has been revoked");
        }
    }

    /**
     * Explicitly revokes a refresh token and its entire family (e.g. on logout).
     */
    public void revoke(String tokenId, String familyId, Instant expiresAt) {
        Instant effectiveExpiry = expiresAt != null ? expiresAt : Instant.now().plusMillis(DEFAULT_TTL_MILLIS);
        if (familyId != null && !familyId.isBlank()) {
            revokedFamilies.put(familyId, effectiveExpiry);
        }
        if (tokenId != null && !tokenId.isBlank()) {
            tokens.compute(tokenId, (k, existing) -> {
                String effectiveFamily = (familyId != null && !familyId.isBlank())
                        ? familyId
                        : (existing != null ? existing.familyId : tokenId);
                revokedFamilies.put(effectiveFamily, effectiveExpiry);
                return new TokenRecord(effectiveFamily, effectiveExpiry, TokenState.REVOKED);
            });
        }
    }

    /**
     * Deterministic fallback identifier when a token lacks a JTI claim.
     */
    public static String fingerprint(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }

    @Scheduled(fixedRate = 300_000)
    public void cleanupExpired() {
        Instant now = Instant.now();
        tokens.entrySet().removeIf(entry -> entry.getValue().expiresAt.isBefore(now));
        revokedFamilies.entrySet().removeIf(entry -> entry.getValue().isBefore(now));
    }
}
