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
}
