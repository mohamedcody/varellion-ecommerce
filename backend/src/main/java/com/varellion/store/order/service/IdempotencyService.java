package com.varellion.store.order.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.json.JsonMapper;
import com.varellion.store.common.exception.BusinessException;
import com.varellion.store.order.dto.OrderResponseDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Supplier;

/**
 * In-memory idempotency cache for single-instance order submissions (AUD-001).
 * Enforces:
 * - Per-user key scoping to eliminate cross-user order PII leakage (IDOR)
 * - Atomic state transitions via ConcurrentHashMap.compute() to prevent TOCTOU duplicate orders
 * - Request payload SHA-256 fingerprinting to reject conflicting key reuse (409 Conflict)
 * - Safe conditional removal in finally so failed calls never clobber a newer active entry
 * - Bounded memory capacity and periodic TTL cleanup (TTL: 15 minutes).
 */
@Service
@Slf4j
public class IdempotencyService {

    private static final long TTL_MILLIS = 15 * 60 * 1000L; // 15 minutes
    private static final long IN_FLIGHT_TTL_SECONDS = 30L;
    private static final int MAX_KEY_LENGTH = 128;
    private static final int MAX_CACHE_ENTRIES = 20_000;

    private final ObjectMapper canonicalMapper;

    public IdempotencyService() {
        this.canonicalMapper = JsonMapper.builder()
                .configure(MapperFeature.SORT_PROPERTIES_ALPHABETICALLY, true)
                .configure(SerializationFeature.ORDER_MAP_ENTRIES_BY_KEYS, true)
                .build();
    }

    private static final class CacheEntry {
        final OrderResponseDto response;
        final Instant expiresAt;
        final boolean inFlight;
        final String payloadHash;

        CacheEntry(OrderResponseDto response, Instant expiresAt, String payloadHash) {
            this.response = response;
            this.expiresAt = expiresAt;
            this.inFlight = false;
            this.payloadHash = payloadHash;
        }

        CacheEntry(Instant expiresAt, String payloadHash) {
            this.response = null;
            this.expiresAt = expiresAt;
            this.inFlight = true;
            this.payloadHash = payloadHash;
        }
    }

    private final ConcurrentHashMap<String, CacheEntry> cache = new ConcurrentHashMap<>();

    /**
     * Backwards-compatible overload for isolated unit callers without explicit user/payload.
     */
    public OrderResponseDto execute(String key, Supplier<OrderResponseDto> action) {
        return execute("anonymous-scope", key, null, action);
    }

    /**
     * Executes order creation idempotently within a strict per-user namespace and payload fingerprint.
     *
     * @param userScope Authenticated principal identifier (e.g., email/userId)
     * @param key       Client-supplied Idempotency-Key header
     * @param payload   Request payload used to detect conflicting reuse of the same key
     * @param action    Authoritative order creation supplier
     * @return Fresh or cached OrderResponseDto
     */
    public OrderResponseDto execute(String userScope, String key, Object payload, Supplier<OrderResponseDto> action) {
        if (key == null || key.isBlank()) {
            return action.get();
        }

        String trimmedKey = key.trim();
        if (trimmedKey.length() > MAX_KEY_LENGTH) {
            throw new IllegalArgumentException("Idempotency-Key must not exceed " + MAX_KEY_LENGTH + " characters");
        }

        String effectiveScope = (userScope != null && !userScope.isBlank())
                ? userScope.trim().toLowerCase()
                : "anonymous-scope";
        String scopedKey = effectiveScope + "::" + trimmedKey;
        String payloadHash = computePayloadHash(payload);

        if (cache.size() >= MAX_CACHE_ENTRIES) {
            cleanExpired();
        }

        Instant now = Instant.now();
        CacheEntry myInFlight = new CacheEntry(now.plusSeconds(IN_FLIGHT_TTL_SECONDS), payloadHash);

        final CacheEntry[] existingResult = {null};
        final boolean[] acquired = {false};
        final boolean[] conflictInFlight = {false};
        final boolean[] payloadMismatch = {false};

        cache.compute(scopedKey, (k, existing) -> {
            if (existing == null || !existing.expiresAt.isAfter(now)) {
                acquired[0] = true;
                return myInFlight;
            }
            if (payloadHash != null && existing.payloadHash != null && !Objects.equals(existing.payloadHash, payloadHash)) {
                payloadMismatch[0] = true;
                return existing;
            }
            if (existing.inFlight) {
                conflictInFlight[0] = true;
                return existing;
            }
            existingResult[0] = existing;
            return existing;
        });

        if (payloadMismatch[0]) {
            throw new BusinessException(
                    "تم استخدام مفتاح الطلب (Idempotency-Key) مسبقاً مع بيانات طلب مختلفة",
                    HttpStatus.CONFLICT
            );
        }

        if (conflictInFlight[0]) {
            throw new BusinessException("طلبك قيد المعالجة حالياً، يرجى الانتظار", HttpStatus.CONFLICT);
        }

        if (!acquired[0] && existingResult[0] != null) {
            log.info("Returning cached order response for duplicate Idempotency-Key (scoped)");
            return existingResult[0].response;
        }

        boolean completed = false;
        try {
            OrderResponseDto result = action.get();
            CacheEntry completedEntry = new CacheEntry(result, Instant.now().plusMillis(TTL_MILLIS), payloadHash);
            // Replace only our own in-flight marker
            cache.replace(scopedKey, myInFlight, completedEntry);
            completed = true;
            return result;
        } finally {
            if (!completed) {
                // Conditional removal guarantees we never clobber a newer entry created after expiry
                cache.remove(scopedKey, myInFlight);
            }
        }
    }

    private String computePayloadHash(Object payload) {
        if (payload == null) {
            return null;
        }
        try {
            byte[] jsonBytes = canonicalMapper.writeValueAsBytes(payload);
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(jsonBytes));
        } catch (JsonProcessingException | NoSuchAlgorithmException e) {
            return Integer.toHexString(payload.hashCode());
        }
    }

    @Scheduled(fixedRate = 300_000)
    public void cleanExpired() {
        Instant now = Instant.now();
        cache.entrySet().removeIf(entry -> !entry.getValue().expiresAt.isAfter(now));
    }
}
