package com.varellion.store.security;

import com.varellion.store.security.jwt.JwtAuthenticationFilter;
import com.varellion.store.security.jwt.JwtService;
import com.varellion.store.security.service.CustomUserDetails;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetailsService;

import java.io.IOException;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock
    private JwtService jwtService;

    @Mock
    private UserDetailsService userDetailsService;

    @Mock
    private FilterChain filterChain;

    @InjectMocks
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("P0 Fix: doFilterInternal MUST NOT authenticate disabled users even with valid JWT")
    void doFilterInternal_WhenUserDisabled_ShouldNotSetAuthentication() throws ServletException, IOException {
        String token = "valid-jwt-token";
        String email = "disabled@varellion.com";

        CustomUserDetails disabledUserDetails = new CustomUserDetails(
                1L,
                email,
                "password",
                false, // disabled
                true,  // accountNonLocked
                List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse response = new MockHttpServletResponse();

        when(jwtService.extractUsername(token)).thenReturn(email);
        when(userDetailsService.loadUserByUsername(email)).thenReturn(disabledUserDetails);
        // Demonstrates defense-in-depth: Even if token format is valid, filter must not authenticate disabled user
        when(jwtService.isTokenValid(token, disabledUserDetails)).thenReturn(true);

        jwtAuthenticationFilter.doFilter(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("P0 Fix: doFilterInternal MUST NOT authenticate locked users even with valid JWT")
    void doFilterInternal_WhenUserLocked_ShouldNotSetAuthentication() throws ServletException, IOException {
        String token = "valid-jwt-token";
        String email = "locked@varellion.com";

        CustomUserDetails lockedUserDetails = new CustomUserDetails(
                2L,
                email,
                "password",
                true,  // enabled
                false, // locked
                List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse response = new MockHttpServletResponse();

        when(jwtService.extractUsername(token)).thenReturn(email);
        when(userDetailsService.loadUserByUsername(email)).thenReturn(lockedUserDetails);
        when(jwtService.isTokenValid(token, lockedUserDetails)).thenReturn(true);

        jwtAuthenticationFilter.doFilter(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("doFilterInternal: Should authenticate enabled and unlocked users with valid JWT")
    void doFilterInternal_WhenUserEnabledAndUnlocked_ShouldSetAuthentication() throws ServletException, IOException {
        String token = "valid-jwt-token";
        String email = "active@varellion.com";

        CustomUserDetails activeUserDetails = new CustomUserDetails(
                3L,
                email,
                "password",
                true, // enabled
                true, // unlocked
                List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse response = new MockHttpServletResponse();

        when(jwtService.extractUsername(token)).thenReturn(email);
        when(userDetailsService.loadUserByUsername(email)).thenReturn(activeUserDetails);
        when(jwtService.isTokenValid(token, activeUserDetails)).thenReturn(true);

        jwtAuthenticationFilter.doFilter(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
        assertThat(SecurityContextHolder.getContext().getAuthentication().getName()).isEqualTo(email);
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("doFilterInternal: Should proceed without auth when Authorization header is missing")
    void doFilterInternal_WhenNoAuthHeader_ShouldProceed() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        jwtAuthenticationFilter.doFilter(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
        verifyNoInteractions(jwtService, userDetailsService);
    }

    @Test
    @DisplayName("doFilterInternal: Should not set authentication when token is invalid or expired")
    void doFilterInternal_WhenTokenInvalidOrExpired_ShouldNotSetAuthentication() throws ServletException, IOException {
        String token = "expired-or-invalid-jwt";
        String email = "active@varellion.com";

        CustomUserDetails activeUserDetails = new CustomUserDetails(
                3L, email, "password", true, true, List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse response = new MockHttpServletResponse();

        when(jwtService.extractUsername(token)).thenReturn(email);
        when(userDetailsService.loadUserByUsername(email)).thenReturn(activeUserDetails);
        when(jwtService.isTokenValid(token, activeUserDetails)).thenReturn(false);

        jwtAuthenticationFilter.doFilter(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("doFilterInternal: Should not set authentication when user is not found in database")
    void doFilterInternal_WhenUserNotFoundInDb_ShouldNotSetAuthentication() throws ServletException, IOException {
        String token = "ghost-user-token";
        String email = "ghost@varellion.com";

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse response = new MockHttpServletResponse();

        when(jwtService.extractUsername(token)).thenReturn(email);
        when(userDetailsService.loadUserByUsername(email)).thenThrow(new RuntimeException("User not found"));

        jwtAuthenticationFilter.doFilter(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("Lifecycle: Admin disables user -> rejected immediately; Admin reactivates -> authenticated")
    void doFilterInternal_AdminDisableAndReactivateLifecycle() throws ServletException, IOException {
        String token = "lifecycle-jwt-token";
        String email = "customer@varellion.com";

        // Step 1: User is initially enabled
        CustomUserDetails enabledUser = new CustomUserDetails(
                10L, email, "password", true, true, List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );
        when(jwtService.extractUsername(token)).thenReturn(email);
        when(userDetailsService.loadUserByUsername(email)).thenReturn(enabledUser);
        when(jwtService.isTokenValid(token, enabledUser)).thenReturn(true);

        MockHttpServletRequest req1 = new MockHttpServletRequest();
        req1.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse res1 = new MockHttpServletResponse();

        jwtAuthenticationFilter.doFilter(req1, res1, filterChain);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();

        // Step 2: Admin disables user in DB -> loadUserByUsername now returns disabled user
        SecurityContextHolder.clearContext();
        CustomUserDetails disabledUser = new CustomUserDetails(
                10L, email, "password", false, true, List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );
        when(userDetailsService.loadUserByUsername(email)).thenReturn(disabledUser);
        when(jwtService.isTokenValid(token, disabledUser)).thenReturn(false);

        MockHttpServletRequest req2 = new MockHttpServletRequest();
        req2.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse res2 = new MockHttpServletResponse();

        jwtAuthenticationFilter.doFilter(req2, res2, filterChain);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();

        // Step 3: Admin reactivates user in DB -> loadUserByUsername now returns enabled user again
        SecurityContextHolder.clearContext();
        when(userDetailsService.loadUserByUsername(email)).thenReturn(enabledUser);
        when(jwtService.isTokenValid(token, enabledUser)).thenReturn(true);

        MockHttpServletRequest req3 = new MockHttpServletRequest();
        req3.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse res3 = new MockHttpServletResponse();

        jwtAuthenticationFilter.doFilter(req3, res3, filterChain);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
    }
}
