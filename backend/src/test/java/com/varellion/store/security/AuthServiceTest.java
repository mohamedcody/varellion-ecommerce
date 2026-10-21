package com.varellion.store.security;

import com.varellion.store.security.dto.AuthResponse;
import com.varellion.store.security.dto.LoginRequest;
import com.varellion.store.security.dto.RegisterRequest;
import com.varellion.store.security.entity.User;
import com.varellion.store.security.jwt.JwtService;
import com.varellion.store.security.repository.UserRepository;
import com.varellion.store.security.service.AuthService;
import com.varellion.store.security.service.CustomUserDetailsService;
import com.varellion.store.security.service.GoogleTokenVerifier;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private CustomUserDetailsService customUserDetailsService;

    @Mock
    private GoogleTokenVerifier googleTokenVerifier;

    @InjectMocks
    private AuthService authService;

    private User testUser;
    private UserDetails userDetails;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authService, "adminEmails", "admin@varellion.com");

        testUser = User.builder()
                .id(1L)
                .email("test@varellion.com")
                .username("testuser")
                .password("$2a$10$hashedpassword")
                .role("USER")
                .enabled(true)
                .emailVerified(true)
                .failedAttempts(0)
                .build();

        userDetails = new org.springframework.security.core.userdetails.User(
                "test@varellion.com",
                "$2a$10$hashedpassword",
                List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );
    }

    @Test
    @DisplayName("Should successfully authenticate and return tokens on valid credentials")
    void testSuccessfulLogin() {
        when(userRepository.findByUsername("test@varellion.com")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("test@varellion.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("correctPassword", testUser.getPassword())).thenReturn(true);
        when(customUserDetailsService.loadUserByUsername(testUser.getEmail())).thenReturn(userDetails);
        when(jwtService.generateToken(userDetails)).thenReturn("mock-access-token");
        when(jwtService.generateRefreshToken(userDetails)).thenReturn("mock-refresh-token");

        LoginRequest request = new LoginRequest("test@varellion.com", "correctPassword");
        AuthResponse response = authService.login(request);

        assertThat(response.getAccessToken()).isEqualTo("mock-access-token");
        assertThat(response.getRefreshToken()).isEqualTo("mock-refresh-token");
        assertThat(response.getEmail()).isEqualTo("test@varellion.com");
        assertThat(testUser.getFailedAttempts()).isEqualTo(0);
        verify(userRepository).save(testUser);
    }

    @Test
    @DisplayName("Should increment failedAttempts and throw BadCredentialsException on wrong password")
    void testFailedLoginAttempt() {
        when(userRepository.findByUsername("test@varellion.com")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("test@varellion.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("wrongPassword", testUser.getPassword())).thenReturn(false);

        LoginRequest request = new LoginRequest("test@varellion.com", "wrongPassword");

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessageContaining("Remaining attempts");

        assertThat(testUser.getFailedAttempts()).isEqualTo(1);
        verify(userRepository).save(testUser);
    }

    @Test
    @DisplayName("Should lock account for 15 minutes when reaching 5 failed attempts")
    void testAccountLockoutAfterFiveAttempts() {
        testUser.setFailedAttempts(4);
        when(userRepository.findByUsername("test@varellion.com")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("test@varellion.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("wrongPassword", testUser.getPassword())).thenReturn(false);

        LoginRequest request = new LoginRequest("test@varellion.com", "wrongPassword");

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(LockedException.class)
                .hasMessageContaining("Account has been locked for 15 minutes");

        assertThat(testUser.getFailedAttempts()).isEqualTo(5);
        assertThat(testUser.getLockoutTime()).isNotNull();
        assertThat(testUser.getLockoutTime()).isAfter(LocalDateTime.now());
        verify(userRepository).save(testUser);
    }

    @Test
    @DisplayName("Should block login if account is currently locked")
    void testBlockedLoginWhenLocked() {
        testUser.setLockoutTime(LocalDateTime.now().plusMinutes(10));
        when(userRepository.findByUsername("test@varellion.com")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("test@varellion.com")).thenReturn(Optional.of(testUser));

        LoginRequest request = new LoginRequest("test@varellion.com", "anyPassword");

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(LockedException.class)
                .hasMessageContaining("Account is temporarily locked");
    }

    @Test
    @DisplayName("Should successfully register a new user and hash password")
    void testRegisterUser() {
        RegisterRequest request = new RegisterRequest("newuser", "new@varellion.com", "password123");

        when(userRepository.existsByEmail("new@varellion.com")).thenReturn(false);
        when(userRepository.existsByUsername("newuser")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("$2a$10$encodedpassword");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(customUserDetailsService.loadUserByUsername("new@varellion.com")).thenReturn(userDetails);
        when(jwtService.generateToken(userDetails)).thenReturn("mock-access");
        when(jwtService.generateRefreshToken(userDetails)).thenReturn("mock-refresh");

        AuthResponse response = authService.register(request);

        assertThat(response.getAccessToken()).isEqualTo("mock-access");
        assertThat(response.getEmail()).isEqualTo("new@varellion.com");
    }

    @Test
    @DisplayName("Should successfully authenticate existing user via Google")
    void testGoogleLoginExistingUser() {
        com.varellion.store.security.dto.GoogleIdentity identity =
                new com.varellion.store.security.dto.GoogleIdentity("google-sub-123", "test@varellion.com", "Test User");

        when(googleTokenVerifier.verify("valid-token")).thenReturn(identity);
        when(userRepository.findByEmail("test@varellion.com")).thenReturn(Optional.of(testUser));
        when(customUserDetailsService.loadUserByUsername("test@varellion.com")).thenReturn(userDetails);
        when(jwtService.generateToken(userDetails)).thenReturn("google-access-token");
        when(jwtService.generateRefreshToken(userDetails)).thenReturn("google-refresh-token");

        com.varellion.store.security.dto.GoogleLoginRequest request =
                new com.varellion.store.security.dto.GoogleLoginRequest("valid-token");
        AuthResponse response = authService.googleLogin(request);

        assertThat(response.getAccessToken()).isEqualTo("google-access-token");
        assertThat(response.getRefreshToken()).isEqualTo("google-refresh-token");
        assertThat(response.getEmail()).isEqualTo("test@varellion.com");
        assertThat(response.getMessage()).isEqualTo("Google login successful");
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Should automatically register and authenticate new user via Google")
    void testGoogleLoginNewUser() {
        com.varellion.store.security.dto.GoogleIdentity identity =
                new com.varellion.store.security.dto.GoogleIdentity("google-sub-456", "newgoogle@varellion.com", "Google Guy");

        when(googleTokenVerifier.verify("valid-new-token")).thenReturn(identity);
        when(userRepository.findByEmail("newgoogle@varellion.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(any(String.class))).thenReturn("$2a$10$randompass");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UserDetails newUserDetails = new org.springframework.security.core.userdetails.User(
                "newgoogle@varellion.com",
                "$2a$10$randompass",
                List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );
        when(customUserDetailsService.loadUserByUsername("newgoogle@varellion.com")).thenReturn(newUserDetails);
        when(jwtService.generateToken(newUserDetails)).thenReturn("new-access-token");
        when(jwtService.generateRefreshToken(newUserDetails)).thenReturn("new-refresh-token");

        com.varellion.store.security.dto.GoogleLoginRequest request =
                new com.varellion.store.security.dto.GoogleLoginRequest("valid-new-token");
        AuthResponse response = authService.googleLogin(request);

        assertThat(response.getAccessToken()).isEqualTo("new-access-token");
        assertThat(response.getEmail()).isEqualTo("newgoogle@varellion.com");
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("Should throw exception if Google user account is disabled")
    void testGoogleLoginDisabledUser() {
        testUser.setEnabled(false);
        com.varellion.store.security.dto.GoogleIdentity identity =
                new com.varellion.store.security.dto.GoogleIdentity("google-sub-123", "test@varellion.com", "Test User");

        when(googleTokenVerifier.verify("valid-token")).thenReturn(identity);
        when(userRepository.findByEmail("test@varellion.com")).thenReturn(Optional.of(testUser));

        com.varellion.store.security.dto.GoogleLoginRequest request =
                new com.varellion.store.security.dto.GoogleLoginRequest("valid-token");

        assertThatThrownBy(() -> authService.googleLogin(request))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessageContaining("Account is disabled");
    }

    @Test
    @DisplayName("Should throw exception if Google identity lacks email")
    void testGoogleLoginMissingEmail() {
        com.varellion.store.security.dto.GoogleIdentity identity =
                new com.varellion.store.security.dto.GoogleIdentity("google-sub-123", "", "Test User");

        when(googleTokenVerifier.verify("token-no-email")).thenReturn(identity);

        com.varellion.store.security.dto.GoogleLoginRequest request =
                new com.varellion.store.security.dto.GoogleLoginRequest("token-no-email");

        assertThatThrownBy(() -> authService.googleLogin(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Google identity does not contain an email address");
    }
}
