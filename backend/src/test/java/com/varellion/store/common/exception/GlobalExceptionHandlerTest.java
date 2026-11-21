package com.varellion.store.common.exception;

import com.varellion.store.common.response.ErrorResponse;
import jakarta.persistence.OptimisticLockException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.orm.ObjectOptimisticLockingFailureException;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler exceptionHandler;
    private MockHttpServletRequest request;

    @BeforeEach
    void setUp() {
        exceptionHandler = new GlobalExceptionHandler();
        request = new MockHttpServletRequest();
        request.setRequestURI("/api/orders/VAR-20261109-0001/status");
    }

    @Test
    @DisplayName("Should return HTTP 409 Conflict when ObjectOptimisticLockingFailureException is thrown")
    void shouldHandleObjectOptimisticLockingFailureException() {
        ObjectOptimisticLockingFailureException exception =
                new ObjectOptimisticLockingFailureException("Order", "VAR-20261109-0001");

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleOptimisticLockConflict(exception, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getStatus()).isEqualTo(409);
        assertThat(response.getBody().getError()).isEqualTo("Conflict");
        assertThat(response.getBody().getMessage())
                .isEqualTo("تم تعديل الطلب بواسطة جلسة أخرى، يرجى تحديث الصفحة والمحاولة مرة أخرى");
        assertThat(response.getBody().getPath()).isEqualTo("/api/orders/VAR-20261109-0001/status");
    }

    @Test
    @DisplayName("Should return HTTP 400 Bad Request when MethodArgumentTypeMismatchException is thrown")
    void shouldHandleMethodArgumentTypeMismatchException() {
        org.springframework.web.method.annotation.MethodArgumentTypeMismatchException exception =
                new org.springframework.web.method.annotation.MethodArgumentTypeMismatchException(
                        "INVALID_STATUS",
                        com.varellion.store.order.entity.OrderStatus.class,
                        "status",
                        null,
                        null
                );

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleTypeMismatch(exception, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getStatus()).isEqualTo(400);
        assertThat(response.getBody().getError()).isEqualTo("Bad Request");
        assertThat(response.getBody().getMessage()).contains("status");
    }

    @Test
    @DisplayName("Should return HTTP 400 Bad Request when DataIntegrityViolationException is thrown")
    void shouldHandleDataIntegrityViolationException() {
        org.springframework.dao.DataIntegrityViolationException exception =
                new org.springframework.dao.DataIntegrityViolationException("chk_active_product_price constraint failed");

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleDataIntegrityViolation(exception, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getStatus()).isEqualTo(400);
        assertThat(response.getBody().getError()).isEqualTo("Bad Request");
        assertThat(response.getBody().getMessage()).contains("لا يمكن تفعيل منتج بسعر صفر");
    }

    @Test
    @DisplayName("Should return HTTP 409 Conflict when OptimisticLockException is thrown")
    void shouldHandleOptimisticLockException() {
        OptimisticLockException exception =
                new OptimisticLockException("Row was updated or deleted by another transaction");

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleOptimisticLockConflict(exception, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getStatus()).isEqualTo(409);
        assertThat(response.getBody().getError()).isEqualTo("Conflict");
        assertThat(response.getBody().getMessage())
                .isEqualTo("تم تعديل الطلب بواسطة جلسة أخرى، يرجى تحديث الصفحة والمحاولة مرة أخرى");
        assertThat(response.getBody().getPath()).isEqualTo("/api/orders/VAR-20261109-0001/status");
    }

    @Test
    @DisplayName("AUD-005: Should return HTTP 403 Forbidden for AccessDeniedException instead of 500")
    void shouldHandleAccessDeniedException() {
        org.springframework.security.access.AccessDeniedException exception =
                new org.springframework.security.access.AccessDeniedException("Forbidden");

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleAccessDenied(exception, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getStatus()).isEqualTo(403);
    }

    @Test
    @DisplayName("AUD-005: Should return HTTP 401 Unauthorized for JwtException and UsernameNotFoundException")
    void shouldHandleJwtAndAuthExceptions() {
        io.jsonwebtoken.MalformedJwtException jwtEx = new io.jsonwebtoken.MalformedJwtException("bad jwt");
        ResponseEntity<ErrorResponse> jwtRes = exceptionHandler.handleAuthenticationOrJwtFailure(jwtEx, request);
        assertThat(jwtRes.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);

        org.springframework.security.core.userdetails.UsernameNotFoundException userEx =
                new org.springframework.security.core.userdetails.UsernameNotFoundException("missing");
        ResponseEntity<ErrorResponse> userRes = exceptionHandler.handleAuthenticationOrJwtFailure(userEx, request);
        assertThat(userRes.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }
}
