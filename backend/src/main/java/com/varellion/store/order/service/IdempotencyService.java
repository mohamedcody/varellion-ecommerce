package com.varellion.store.order.service;

import com.varellion.store.common.exception.BusinessException;
import com.varellion.store.order.dto.OrderResponseDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Supplier;

/**
 * Service managing in-memory idempotency cache for order submissions.
 * Prevents replay attacks, duplicate orders, and double stock reservation.
 * TTL: 15 minutes.
 */
@Service
@Slf4j
public class IdempotencyService {

    private static final long TTL_MILLIS = 15 * 60 * 1000L; // 15 minutes

    private static class CacheEntry {
        final OrderResponseDto response;
        final Instant expiresAt;
        final boolean inFlight;

        CacheEntry(OrderResponseDto response, Instant expiresAt) {
            this.response = response;
            this.expiresAt = expiresAt;
            this.inFlight = false;
        }

        CacheEntry(Instant expiresAt) {
            this.response = null;
            this.expiresAt = expiresAt;
            this.inFlight = true;
        }
    }

    private final ConcurrentHashMap<String, CacheEntry> cache = new ConcurrentHashMap<>();

    /**
     * Executes the order creation supplier idempotently.
     *
     * @param key    The client-supplied Idempotency-Key
     * @param action The authoritative order creation logic
     * @return OrderResponseDto (either fresh or cached)
     */
    public OrderResponseDto execute(String key, Supplier<OrderResponseDto> action) {
        if (key == null || key.isBlank()) {
            return action.get();
        }

        cleanExpired();

        Instant now = Instant.now();
        Instant inFlightExpiry = now.plusSeconds(30); // 30s max for in-flight requests

        CacheEntry existing = cache.putIfAbsent(key, new CacheEntry(inFlightExpiry));
        if (existing != null) {
            if (existing.inFlight && existing.expiresAt.isAfter(now)) {
                throw new BusinessException("طلبك قيد المعالجة حالياً، يرجى الانتظار", HttpStatus.CONFLICT);
            }
            if (!existing.inFlight && existing.expiresAt.isAfter(now)) {
                log.info("Returning cached order response for duplicate Idempotency-Key: {}", key);
                return existing.response;
            }
            // If expired, overwrite with new in-flight entry
            cache.put(key, new CacheEntry(inFlightExpiry));
        }

        try {
            OrderResponseDto result = action.get();
            cache.put(key, new CacheEntry(result, now.plusMillis(TTL_MILLIS)));
            return result;
        } catch (RuntimeException e) {
            cache.remove(key);
            throw e;
        }
    }

    private void cleanExpired() {
        Instant now = Instant.now();
        cache.entrySet().removeIf(entry -> entry.getValue().expiresAt.isBefore(now));
    }
}
