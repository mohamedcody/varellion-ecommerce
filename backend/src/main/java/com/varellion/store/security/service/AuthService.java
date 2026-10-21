package com.varellion.store.security.service;

import com.varellion.store.security.dto.AuthResponse;
import com.varellion.store.security.dto.GoogleIdentity;
import com.varellion.store.security.dto.GoogleLoginRequest;
import com.varellion.store.security.dto.LoginRequest;
import com.varellion.store.security.dto.RegisterRequest;
import com.varellion.store.security.entity.User;
import com.varellion.store.security.jwt.JwtService;
import com.varellion.store.security.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
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

    @Value("${ADMIN_EMAILS:admin@varellion.com}")
    private String adminEmails;

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String identifier = request.getIdentifier().trim();
        User user = userRepository.findByUsername(identifier)
                .or(() -> userRepository.findByEmail(identifier))
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
            int remainingAttempts = MAX_FAILED_ATTEMPTS - attempts;
            throw new BadCredentialsException("Invalid username or password. Remaining attempts before lockout: " + remainingAttempts);
        }

        if (!user.isEnabled()) {
            throw new BadCredentialsException("Account is disabled. Please contact support.");
        }

        // Reset failed attempts on successful login
        user.setFailedAttempts(0);
        user.setLockoutTime(null);
        userRepository.save(user);

        UserDetails userDetails = customUserDetailsService.loadUserByUsername(user.getEmail());
        String accessToken = jwtService.generateToken(userDetails);
        String refreshToken = jwtService.generateRefreshToken(userDetails);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .email(user.getEmail())
                .username(user.getUsername())
                .role(user.getRole())
                .message("Login successful")
                .build();
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        String username = request.getUsername().trim();

        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email is already registered: " + email);
        }
        if (userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("Username is already taken: " + username);
        }

        // Assign ADMIN role if email matches pre-configured admin list, otherwise USER
        String role = isAdminEmail(email) ? "ADMIN" : "USER";

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

        UserDetails userDetails = customUserDetailsService.loadUserByUsername(savedUser.getEmail());
        String accessToken = jwtService.generateToken(userDetails);
        String refreshToken = jwtService.generateRefreshToken(userDetails);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .email(savedUser.getEmail())
                .username(savedUser.getUsername())
                .role(savedUser.getRole())
                .message("Registration successful")
                .build();
    }

    @Transactional
    public AuthResponse googleLogin(GoogleLoginRequest request) {
        GoogleIdentity identity = googleTokenVerifier.verify(request.getIdToken());

        if (identity.email() == null || identity.email().isBlank()) {
            throw new IllegalArgumentException("Google identity does not contain an email address");
        }

        String email = identity.email().trim().toLowerCase();

        User user = userRepository.findByEmail(email)
                .orElseGet(() -> {
                    String role = isAdminEmail(email) ? "ADMIN" : "USER";
                    String baseUsername = (identity.name() != null && !identity.name().isBlank())
                            ? identity.name().replaceAll("[^a-zA-Z0-9_]", "_").toLowerCase()
                            : email.split("@")[0];
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
                    return userRepository.save(newUser);
                });

        if (!user.isEnabled()) {
            throw new BadCredentialsException("Account is disabled. Please contact support.");
        }

        UserDetails details = customUserDetailsService.loadUserByUsername(user.getEmail());
        String accessToken = jwtService.generateToken(details);
        String refreshToken = jwtService.generateRefreshToken(details);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .email(user.getEmail())
                .username(user.getUsername())
                .role(user.getRole())
                .message("Google login successful")
                .build();
    }

    public AuthResponse refreshToken(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new IllegalArgumentException("Refresh token is required");
        }

        String username = jwtService.extractUsername(refreshToken);
        if (username == null) {
            throw new BadCredentialsException("Invalid refresh token");
        }

        UserDetails userDetails = customUserDetailsService.loadUserByUsername(username);

        if (!jwtService.isRefreshTokenValid(refreshToken, userDetails)) {
            throw new BadCredentialsException("Expired or invalid refresh token");
        }

        String newAccessToken = jwtService.generateToken(userDetails);
        String newRefreshToken = jwtService.generateRefreshToken(userDetails);

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .email(userDetails.getUsername())
                .message("Token refreshed successfully")
                .build();
    }

    private boolean isAdminEmail(String email) {
        if (adminEmails == null || adminEmails.isBlank()) {
            return false;
        }
        return Arrays.stream(adminEmails.split(","))
                .map(String::trim)
                .anyMatch(admin -> admin.equalsIgnoreCase(email));
    }
}
