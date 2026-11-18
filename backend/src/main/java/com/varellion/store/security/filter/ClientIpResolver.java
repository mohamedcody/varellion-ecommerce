package com.varellion.store.security.filter;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.web.util.matcher.IpAddressMatcher;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Enumeration;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Resolves the authentic client IP address for rate limiting and security auditing.
 * <p>
 * SEC-04 Architecture & Trust Boundary:
 * When Spring Boot operates behind a reverse proxy (e.g., Nginx),
 * {@link HttpServletRequest#getRemoteAddr()} returns the proxy's IP.
 * Blindly relying on remoteAddr causes all external clients to share a single rate-limit bucket (DoS).
 * Conversely, blindly trusting X-Forwarded-For or X-Real-IP from untrusted direct connections
 * or unverified private network containers allows IP spoofing and rate-limit evasion.
 * <p>
 * This resolver enforces strict, fail-secure trust-boundary validation:
 * 1. Checks if {@code request.getRemoteAddr()} matches an explicitly configured trusted proxy IP/CIDR.
 * 2. Defaults strictly to loopback (127.0.0.1, ::1) if no custom proxies are configured.
 * 3. Rejects broad private networks (RFC 1918 / RFC 4193) by default.
 * 4. Fails application startup on invalid CIDR or IP configuration (fail-secure).
 * 5. If untrusted, immediately returns {@code request.getRemoteAddr()}, discarding all forwarded headers.
 * 6. If trusted, reads ALL {@code X-Forwarded-For} header lines using {@link HttpServletRequest#getHeaders(String)},
 *    normalizes them into an ordered list, and traverses right-to-left to find the first untrusted client IP.
 * 7. Falls back to {@code X-Real-IP} (if set by a trusted proxy like Nginx) or {@code getRemoteAddr()}.
 * 8. Sanitizes and validates all candidate IPs (stripping ports/brackets, preventing hostnames/DNS resolution).
 */
@Component
@Slf4j
public class ClientIpResolver {

    private static final Pattern IPV4_WITH_PORT = Pattern.compile("^([0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}):[0-9]+$");
    private static final Pattern IPV6_BRACKETED = Pattern.compile("^\\[([0-9a-fA-F:]+)\\](?::[0-9]+)?$");

    // Safe minimal default: only loopback is trusted when no proxies are configured
    private static final List<String> SAFE_DEFAULT_TRUSTED_PROXIES = List.of(
            "127.0.0.1",
            "::1"
    );

    private final List<IpAddressMatcher> trustedMatchers;

    public ClientIpResolver(
            @Value("${app.security.rate-limit.trusted-proxies:}") String customProxies
    ) {
        List<IpAddressMatcher> matchers = new ArrayList<>();
        List<String> proxyConfigList = new ArrayList<>();

        if (customProxies != null) {
            String trimmedConfig = customProxies.trim();
            if (trimmedConfig.equalsIgnoreCase("none") || trimmedConfig.equalsIgnoreCase("empty")) {
                // Explicitly disable all trusted proxies (fail-secure, remoteAddr only)
                proxyConfigList.clear();
            } else if (!trimmedConfig.isBlank()) {
                proxyConfigList.addAll(Arrays.stream(trimmedConfig.split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .toList());
            } else {
                // If unset or blank, use safe loopback-only default
                proxyConfigList.addAll(SAFE_DEFAULT_TRUSTED_PROXIES);
            }
        } else {
            proxyConfigList.addAll(SAFE_DEFAULT_TRUSTED_PROXIES);
        }

        for (String proxyCidr : proxyConfigList) {
            try {
                matchers.add(new IpAddressMatcher(proxyCidr));
            } catch (Exception e) {
                String errorMsg = String.format("FATAL: Invalid trusted proxy CIDR or IP configured: '%s' (%s). " +
                        "Aborting startup to prevent insecure trusted proxy configuration.", proxyCidr, e.getMessage());
                log.error(errorMsg);
                throw new IllegalStateException(errorMsg, e);
            }
        }

        this.trustedMatchers = Collections.unmodifiableList(matchers);
        log.info("ClientIpResolver initialized with {} trusted proxy matcher(s)", this.trustedMatchers.size());
    }

    /**
     * Resolves the verified client IP from the request.
     *
     * @param request the incoming HTTP servlet request
     * @return the authentic client IP, or remoteAddr if untrusted or headers absent
     */
    public String resolveClientIp(HttpServletRequest request) {
        String remoteAddr = sanitizeIp(request.getRemoteAddr());
        if (remoteAddr == null || remoteAddr.isBlank()) {
            return "0.0.0.0";
        }

        // Rule 1 & 6: If the immediate TCP peer is NOT a trusted proxy, use remoteAddr directly.
        // All X-Forwarded-For and X-Real-IP headers are ignored to prevent IP spoofing.
        if (!isTrustedProxy(remoteAddr)) {
            return remoteAddr;
        }

        // Rule 2: Remote peer is a trusted proxy. Inspect ALL X-Forwarded-For header values
        // using right-to-left traversal across duplicate headers.
        List<String> allHops = extractAllXffHops(request);
        if (!allHops.isEmpty()) {
            String clientIpFromXff = resolveFromHops(allHops);
            if (clientIpFromXff != null) {
                return clientIpFromXff;
            }
        }

        // Fallback to X-Real-IP if present (set/overwritten by Nginx)
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isBlank()) {
            String sanitizedRealIp = sanitizeIp(xRealIp.trim());
            if (isValidIp(sanitizedRealIp)) {
                return sanitizedRealIp;
            }
        }

        // Default fallback if headers were empty or malformed
        return remoteAddr;
    }

    /**
     * Reads all X-Forwarded-For header fields (supporting duplicate header lines)
     * and normalizes them into a single ordered list from left to right.
     */
    private List<String> extractAllXffHops(HttpServletRequest request) {
        List<String> hops = new ArrayList<>();
        Enumeration<String> headers = request.getHeaders("X-Forwarded-For");
        if (headers != null) {
            while (headers.hasMoreElements()) {
                String headerVal = headers.nextElement();
                if (headerVal != null && !headerVal.isBlank()) {
                    String[] parts = headerVal.split(",");
                    for (String part : parts) {
                        String trimmed = part.trim();
                        if (!trimmed.isEmpty()) {
                            hops.add(trimmed);
                        }
                    }
                }
            }
        }
        return hops;
    }

    /**
     * Walks X-Forwarded-For hops from right to left.
     * The first entry from the right that is NOT a trusted proxy is the authentic client.
     */
    private String resolveFromHops(List<String> hops) {
        String candidate = null;

        for (int i = hops.size() - 1; i >= 0; i--) {
            String rawIp = hops.get(i);
            String cleanIp = sanitizeIp(rawIp);

            if (!isValidIp(cleanIp)) {
                continue; // Skip malformed tokens
            }

            candidate = cleanIp;

            // If this hop is NOT a trusted proxy, it is the authentic client!
            if (!isTrustedProxy(cleanIp)) {
                return cleanIp;
            }
        }

        // If every valid hop in XFF was itself a trusted proxy, return the leftmost valid hop
        return candidate;
    }

    /**
     * Checks if the given IP matches any configured trusted proxy or CIDR range.
     */
    public boolean isTrustedProxy(String ip) {
        if (ip == null || ip.isBlank() || trustedMatchers.isEmpty()) {
            return false;
        }
        for (IpAddressMatcher matcher : trustedMatchers) {
            try {
                if (matcher.matches(ip)) {
                    return true;
                }
            } catch (Exception ignored) {
            }
        }
        return false;
    }

    /**
     * Sanitizes an IP string by stripping ports and brackets.
     */
    public String sanitizeIp(String ip) {
        if (ip == null) {
            return null;
        }
        String trimmed = ip.trim();
        if (trimmed.isEmpty()) {
            return null;
        }

        // Check bracketed IPv6: [2001:db8::1] or [2001:db8::1]:8080
        var mIpv6 = IPV6_BRACKETED.matcher(trimmed);
        if (mIpv6.matches()) {
            return mIpv6.group(1);
        }

        // Check IPv4 with port: 192.0.2.1:8080
        var mIpv4 = IPV4_WITH_PORT.matcher(trimmed);
        if (mIpv4.matches()) {
            return mIpv4.group(1);
        }

        return trimmed;
    }

    /**
     * Validates that an IP string is a valid IPv4 or IPv6 address literal without DNS lookup.
     */
    public boolean isValidIp(String ip) {
        if (ip == null || ip.isBlank()) {
            return false;
        }
        try {
            return new IpAddressMatcher(ip).matches(ip);
        } catch (Exception e) {
            return false;
        }
    }
}
