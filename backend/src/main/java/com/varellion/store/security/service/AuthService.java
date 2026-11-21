package com.varellion.store.security.service;

import com.varellion.store.customer.service.CustomerService;
import com.varellion.store.security.dto.AuthResponse;
import com.varellion.store.security.dto.AuthResult;
import com.varellion.store.security.dto.GoogleIdentity;
import com.varellion.store.security.dto.GoogleLoginRequest;
import com.varellion.store.security.dto.LoginRequest;
import com.varellion.store.security.dto.RegisterRequest;
import com.varellion.store.security.entity.User;
import com.varellion.store.security.jwt.JwtService;
import com.varellion.store.security.repository.UserRepository;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int LOCKOUT_MINUTES = 15;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final CustomUserDetailsService customUserDetailsService;
    private final GoogleTokenVerifier googleTokenVerifier;
    private final CustomerService customerService;
    private final RefreshTokenRegistry refreshTokenRegistry;

    @Value("${ADMIN_EMAILS:}")
    private String adminEmails;

    @Transactional(noRollbackFor = {BadCredentialsException.class, LockedException.class})
    public AuthResult login(LoginRequest request) {
        String identifier = request.getIdentifier().trim();
        User user = resolveUserByIdentifier(identifier)
                .orElseThrow(() -> new BadCredentialsException("Invalid username or password"));

        // Check if account is currently locked
        if (user.getLockoutTime() != null) {
            if (user.getLockoutTime().isAfter(LocalDateTime.now())) {
                throw new LockedException("Account is temporarily locked due to multiple failed login attempts. Please try again after 15 minutes.");
            } else {
                // Lockout expired, reset lockout state
                user.setLockoutTime(null);
                user.setFailedAttempts(0);
                userRepository.save(user);
            }
        }

        // Validate password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            int attempts = (user.getFailedAttempts() != null ? user.getFailedAttempts() : 0) + 1;
            user.setFailedAttempts(attempts);

            if (attempts >= MAX_FAILED_ATTEMPTS) {
                user.setLockoutTime(LocalDateTime.now().plusMinutes(LOCKOUT_MINUTES));
                userRepository.save(user);
                log.warn("Account locked for user: {} due to {} failed attempts", user.getEmail(), attempts);
                throw new LockedException("Account has been locked for 15 minutes due to 5 consecutive failed login attempts.");
            }

            userRepository.save(user);
            // SECURITY FIX (F6): Uniform error message prevents account enumeration.
            // Do NOT reveal remaining attempts count to the client.
            throw new BadCredentialsException("Invalid username or password");
        }

        if (!user.isEnabled()) {
            throw new BadCredentialsException("Account is disabled. Please contact support.");
        }

        // Reset failed attempts on successful login
        user.setFailedAttempts(0);
        user.setLockoutTime(null);
        userRepository.save(user);

        // Auto-provision Customer profile upon successful login for non-admin accounts
        if (!"ADMIN".equalsIgnoreCase(user.getRole())) {
            customerService.getOrCreateCustomerForUser(user.getUsername());
        }

        UserDetails userDetails = customUserDetailsService.loadUserByUsername(user.getEmail());
        String accessToken = jwtService.generateToken(userDetails);
        String refreshToken = issueAndRegisterRefreshToken(userDetails, null);

        AuthResponse response = AuthResponse.builder()
                .accessToken(accessToken)
                .email(user.getEmail())
                .username(user.getUsername())
                .role(user.getRole())
                .message("Login successful")
                .build();

        return new AuthResult(response, refreshToken);
    }

    @Transactional
    public AuthResult register(RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        String username = request.getUsername().trim();

        if (username.contains("@")) {
            throw new IllegalArgumentException("Username cannot contain '@' character");
        }
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email is already registered: " + email);
        }
        if (userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("Username is already taken: " + username);
        }

        // SECURITY: Public registration always assigns USER role only.
        // Admin accounts must be created through a protected channel (seed migration or Google OAuth).
        String role = "USER";

        User newUser = User.builder()
                .email(email)
                .username(username)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .enabled(true)
                .emailVerified(false)
                .failedAttempts(0)
                .build();

        User savedUser = userRepository.save(newUser);

        // Auto-provision Customer profile immediately upon registration
        customerService.getOrCreateCustomerForUser(savedUser.getUsername());

        UserDetails userDetails = customUserDetailsService.loadUserByUsername(savedUser.getEmail());
        String accessToken = jwtService.generateToken(userDetails);
        String refreshToken = issueAndRegisterRefreshToken(userDetails, null);

        AuthResponse response = AuthResponse.builder()
                .accessToken(accessToken)
                .email(savedUser.getEmail())
                .username(savedUser.getUsername())
                .role(savedUser.getRole())
                .message("Registration successful")
                .build();

        return new AuthResult(response, refreshToken);
    }

    @Transactional
    public AuthResult googleLogin(GoogleLoginRequest request) {
        GoogleIdentity identity = googleTokenVerifier.verify(request.getIdToken());

        if (identity.email() == null || identity.email().isBlank()) {
            throw new IllegalArgumentException("Google identity does not contain an email address");
        }

        String email = identity.email().trim().toLowerCase();

        Optional<User> existingOpt = userRepository.findByEmail(email);
        User user;
        if (existingOpt.isPresent()) {
            user = existingOpt.get();
            if (!user.isEnabled()) {
                throw new BadCredentialsException("Account is disabled. Please contact support.");
            }
            // AUD-004: Prevent pre-registration account takeover.
            // If an unverified local account existed for this email, invalidate its local password,
            // mark email as Google-verified, clear any lockout, and apply ADMIN_EMAILS allowlist.
            if (!user.isEmailVerified()) {
                user.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
                user.setEmailVerified(true);
                user.setFailedAttempts(0);
                user.setLockoutTime(null);
                if (isAdminEmail(email)) {
                    user.setRole("ADMIN");
                }
                user = userRepository.save(user);
            }
        } else {
            String role = isAdminEmail(email) ? "ADMIN" : "USER";
            String baseUsername = (identity.name() != null && !identity.name().isBlank())
                    ? identity.name().replaceAll("[^a-zA-Z0-9_]", "_").toLowerCase()
                    : email.split("@")[0].replaceAll("[^a-zA-Z0-9_]", "_");
            String username = baseUsername + "_" + (int) (Math.random() * 10000);

            User newUser = User.builder()
                    .username(username)
                    .email(email)
                    .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .role(role)
                    .enabled(true)
                    .emailVerified(true)
                    .failedAttempts(0)
                    .build();
            user = userRepository.save(newUser);
        }

        // Auto-provision Customer profile upon Google Login for customer accounts
        if (!"ADMIN".equalsIgnoreCase(user.getRole())) {
            customerService.getOrCreateCustomerForUser(user.getUsername(), identity.name());
        }

        UserDetails details = customUserDetailsService.loadUserByUsername(user.getEmail());
        String accessToken = jwtService.generateToken(details);
        String refreshToken = issueAndRegisterRefreshToken(details, null);

        AuthResponse response = AuthResponse.builder()
                .accessToken(accessToken)
                .email(user.getEmail())
                .username(user.getUsername())
                .role(user.getRole())
                .message("Google login successful")
                .build();

        return new AuthResult(response, refreshToken);
    }

    public AuthResult refreshToken(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new IllegalArgumentException("Refresh token is required");
        }

        final String username;
        try {
            username = jwtService.extractUsername(refreshToken);
        } catch (JwtException ex) {
            throw new BadCredentialsException("Expired or invalid refresh token");
        }

        if (username == null) {
            throw new BadCredentialsException("Invalid refresh token");
        }

        UserDetails userDetails = customUserDetailsService.loadUserByUsername(username);

        if (!userDetails.isEnabled()) {
            throw new BadCredentialsException("Account is disabled. Please contact support.");
        }

        if (!userDetails.isAccountNonLocked()) {
            throw new LockedException("Account is locked. Please contact support.");
        }

        final boolean valid;
        try {
            valid = jwtService.isRefreshTokenValid(refreshToken, userDetails);
        } catch (JwtException ex) {
            throw new BadCredentialsException("Expired or invalid refresh token");
        }

        if (!valid) {
            throw new BadCredentialsException("Expired or invalid refresh token");
        }

        // AUD-011: Enforce server-side revocation & single-use rotation with reuse detection
        String tokenId = safeExtractTokenId(refreshToken);
        String familyId = safeExtractTokenFamily(refreshToken, tokenId);
        Instant expiresAt = safeExtractExpiration(refreshToken);
        if (refreshTokenRegistry != null) {
            refreshTokenRegistry.consumeForRotation(tokenId, familyId, expiresAt);
        }

        String newAccessToken = jwtService.generateToken(userDetails);
        String newRefreshToken = issueAndRegisterRefreshToken(userDetails, familyId);

        User user = resolveUserByIdentifier(username).orElse(null);

        String email = user != null ? user.getEmail() : userDetails.getUsername();
        String uname = user != null ? user.getUsername() : username;
        String role = user != null ? user.getRole() : "USER";

        AuthResponse authResponse = AuthResponse.builder()
                .accessToken(newAccessToken)
                .email(email)
                .username(uname)
                .role(role)
                .message("Token refreshed successfully")
                .build();

        return new AuthResult(authResponse, newRefreshToken);
    }

    /**
     * AUD-011: Server-side logout revokes the presented refresh token and its session family.
     */
    public void logout(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank() || refreshTokenRegistry == null) {
            return;
        }
        String tokenId = safeExtractTokenId(refreshToken);
        String familyId = safeExtractTokenFamily(refreshToken, tokenId);
        Instant expiresAt = safeExtractExpiration(refreshToken);
        refreshTokenRegistry.revoke(tokenId, familyId, expiresAt);
    }

    private String issueAndRegisterRefreshToken(UserDetails userDetails, String familyId) {
        String token = (familyId != null)
                ? jwtService.generateRefreshToken(userDetails, familyId)
                : jwtService.generateRefreshToken(userDetails);
        if (refreshTokenRegistry != null && token != null && !token.isBlank()) {
            String tokenId = safeExtractTokenId(token);
            String resolvedFamily = safeExtractTokenFamily(token, tokenId);
            Instant expiresAt = safeExtractExpiration(token);
            refreshTokenRegistry.register(tokenId, resolvedFamily, expiresAt);
        }
        return token;
    }

    private String safeExtractTokenId(String token) {
        try {
            String jti = jwtService.extractTokenId(token);
            if (jti != null && !jti.isBlank()) {
                return jti;
            }
        } catch (Exception ignored) {
            // Fall back to SHA-256 fingerprint for malformed/legacy/mocked tokens
        }
        return RefreshTokenRegistry.fingerprint(token);
    }

    private String safeExtractTokenFamily(String token, String fallbackId) {
        try {
            String family = jwtService.extractTokenFamily(token);
            if (family != null && !family.isBlank()) {
                return family;
            }
        } catch (Exception ignored) {
            // Fall back to tokenId
        }
        return fallbackId;
    }

    private Instant safeExtractExpiration(String token) {
        try {
            return jwtService.extractExpirationInstant(token);
        } catch (Exception ignored) {
            return null;
        }
    }

    /**
     * AUD-004: Resolve email-shaped identifiers by email first to prevent username/email
     * namespace collisions.
     */
    private Optional<User> resolveUserByIdentifier(String identifier) {
        if (identifier.contains("@")) {
            String normalizedEmail = identifier.toLowerCase();
            return userRepository.findByEmail(normalizedEmail)
                    .or(() -> userRepository.findByUsername(identifier));
        }
        return userRepository.findByUsername(identifier)
                .or(() -> userRepository.findByEmail(identifier));
    }

    private boolean isAdminEmail(String email) {
        if (adminEmails == null || adminEmails.isBlank()) {
            return false;
        }
        return Arrays.stream(adminEmails.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .anyMatch(admin -> admin.equalsIgnoreCase(email));
    }
}
