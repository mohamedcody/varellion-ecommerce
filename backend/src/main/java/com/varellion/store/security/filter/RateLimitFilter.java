package com.varellion.store.security.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

    private static final int AUTH_LIMIT_PER_MINUTE = 20;
    private static final int EXPENSIVE_LIMIT_PER_MINUTE = 5;
    private static final long WINDOW_MS = 60_000L;
    private static final int MAX_TRACKED_IPS = 50_000; // Prevent unbounded memory growth

    private final ConcurrentHashMap<String, RateLimitEntry> requestCounts = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();
        String bucketType = null;
        int limit = AUTH_LIMIT_PER_MINUTE;

        if (path.startsWith("/api/auth")) {
            bucketType = "AUTH";
            limit = AUTH_LIMIT_PER_MINUTE;
        } else if (path.startsWith("/api/upload") || path.startsWith("/api/ai")) {
            bucketType = "EXPENSIVE";
            limit = EXPENSIVE_LIMIT_PER_MINUTE;
        }

        // Bypass non-rate-limited paths and preflight CORS requests
        if (bucketType == null || "OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = getClientIp(request);
        String bucketKey = clientIp + ":" + bucketType;
        long now = System.currentTimeMillis();

        // SECURITY: If map is at capacity, reject new IPs to prevent memory exhaustion
        RateLimitEntry entry = requestCounts.compute(bucketKey, (key, existing) -> {
            if (existing == null || (now - existing.windowStart) > WINDOW_MS) {
                if (existing == null && requestCounts.size() >= MAX_TRACKED_IPS) {
                    return null; // Don't track new IPs when at capacity
                }
                return new RateLimitEntry(now, new AtomicInteger(1));
            }
            existing.count.incrementAndGet();
            return existing;
        });

        if (entry == null) {
            // At capacity — allow request but don't track (fail-open for legitimate users)
            filterChain.doFilter(request, response);
            return;
        }

        // If threshold exceeded: respond immediately with 429 Too Many Requests
        if (entry.count.get() > limit) {
            log.warn("Rate limit exceeded for IP: {} on path: {}", clientIp, path);
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);

            Map<String, Object> errorBody = Map.of(
                    "status", 429,
                    "error", "Too Many Requests",
                    "message", "You have exceeded the rate limit. Please try again after 1 minute.",
                    "path", path
            );

            objectMapper.writeValue(response.getOutputStream(), errorBody);
            return;
        }

        filterChain.doFilter(request, response);
    }

    /**
     * SECURITY FIX (F4): Use only request.getRemoteAddr() to prevent IP spoofing
     * via X-Forwarded-For header. If running behind a trusted reverse proxy (Nginx,
     * Cloudflare), configure server.forward-headers-strategy=native in Spring Boot
     * which will set remoteAddr correctly from the trusted proxy chain.
     */
    private String getClientIp(HttpServletRequest request) {
        return request.getRemoteAddr();
    }

    /**
     * SECURITY FIX (F5): Periodically clean up expired entries to prevent
     * unbounded memory growth. Runs every 2 minutes.
     */
    @Scheduled(fixedRate = 120_000)
    public void cleanupExpiredEntries() {
        long now = System.currentTimeMillis();
        int before = requestCounts.size();
        requestCounts.entrySet().removeIf(entry ->
                (now - entry.getValue().windowStart) > WINDOW_MS);
        int removed = before - requestCounts.size();
        if (removed > 0) {
            log.debug("Rate limiter cleanup: removed {} expired entries", removed);
        }
    }

    private static class RateLimitEntry {
        final long windowStart;
        final AtomicInteger count;

        RateLimitEntry(long windowStart, AtomicInteger count) {
            this.windowStart = windowStart;
            this.count = count;
        }
    }
}
