package com.varellion.store.order.service;

import com.varellion.store.common.exception.BusinessException;
import com.varellion.store.order.dto.OrderResponseDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class IdempotencyServiceTest {

    private IdempotencyService idempotencyService;

    @BeforeEach
    void setUp() {
        idempotencyService = new IdempotencyService();
    }

    @Test
    @DisplayName("Should execute action directly when Idempotency-Key is null or blank")
    void execute_WhenKeyIsNull_ShouldExecuteDirectly() {
        AtomicInteger invocationCount = new AtomicInteger(0);

        OrderResponseDto dto1 = idempotencyService.execute(null, () -> {
            invocationCount.incrementAndGet();
            return OrderResponseDto.builder().orderNumber("VAR-1").build();
        });

        OrderResponseDto dto2 = idempotencyService.execute("   ", () -> {
            invocationCount.incrementAndGet();
            return OrderResponseDto.builder().orderNumber("VAR-2").build();
        });

        assertThat(dto1.getOrderNumber()).isEqualTo("VAR-1");
        assertThat(dto2.getOrderNumber()).isEqualTo("VAR-2");
        assertThat(invocationCount.get()).isEqualTo(2);
    }

    @Test
    @DisplayName("Should cache successful result and return cached object on duplicate key without re-invoking action")
    void execute_WhenKeyIsReused_ShouldReturnCachedResponse() {
        AtomicInteger invocationCount = new AtomicInteger(0);
        String key = "test-idempotency-key-123";

        OrderResponseDto result1 = idempotencyService.execute(key, () -> {
            invocationCount.incrementAndGet();
            return OrderResponseDto.builder()
                    .orderNumber("VAR-20261104-1001")
                    .totalAmount(new BigDecimal("1500.00"))
                    .build();
        });

        OrderResponseDto result2 = idempotencyService.execute(key, () -> {
            invocationCount.incrementAndGet();
            return OrderResponseDto.builder()
                    .orderNumber("VAR-DIFFERENT")
                    .build();
        });

        assertThat(result1.getOrderNumber()).isEqualTo("VAR-20261104-1001");
        assertThat(result2.getOrderNumber()).isEqualTo("VAR-20261104-1001");
        assertThat(result2.getTotalAmount()).isEqualTo(new BigDecimal("1500.00"));
        assertThat(invocationCount.get()).isEqualTo(1); // Crucial: executed only ONCE!
    }

    @Test
    @DisplayName("Should clean up in-flight lock when action throws exception so subsequent retry can succeed")
    void execute_WhenActionThrows_ShouldAllowSubsequentAttempt() {
        AtomicInteger invocationCount = new AtomicInteger(0);
        String key = "test-fail-retry-key";

        assertThatThrownBy(() -> idempotencyService.execute(key, () -> {
            invocationCount.incrementAndGet();
            throw new IllegalArgumentException("Stock unavailable");
        })).isInstanceOf(IllegalArgumentException.class);

        // Next call with same key should NOT be blocked by 409
        OrderResponseDto result = idempotencyService.execute(key, () -> {
            invocationCount.incrementAndGet();
            return OrderResponseDto.builder().orderNumber("VAR-RETRY-SUCCESS").build();
        });

        assertThat(result.getOrderNumber()).isEqualTo("VAR-RETRY-SUCCESS");
        assertThat(invocationCount.get()).isEqualTo(2);
    }

    @Test
    @DisplayName("AUD-001: Same Idempotency-Key across two different users is strictly isolated (no cross-user PII leak)")
    void execute_SameKeyDifferentUsers_ShouldIsolateResponses() {
        String sharedKey = "predictable-key-001";

        OrderResponseDto orderA = idempotencyService.execute("alice@varellion.com", sharedKey, "payload-a",
                () -> OrderResponseDto.builder().orderNumber("VAR-ALICE").customerName("Alice").build());

        OrderResponseDto orderB = idempotencyService.execute("bob@varellion.com", sharedKey, "payload-b",
                () -> OrderResponseDto.builder().orderNumber("VAR-BOB").customerName("Bob").build());

        assertThat(orderA.getOrderNumber()).isEqualTo("VAR-ALICE");
        assertThat(orderB.getOrderNumber()).isEqualTo("VAR-BOB");
        assertThat(orderB.getCustomerName()).isEqualTo("Bob");
    }

    @Test
    @DisplayName("AUD-001: Reusing same Idempotency-Key for same user with different payload throws 409 Conflict")
    void execute_SameUserDifferentPayload_ShouldThrow409() {
        String key = "order-key-mismatch";

        idempotencyService.execute("alice@varellion.com", key, java.util.Map.of("qty", 1),
                () -> OrderResponseDto.builder().orderNumber("VAR-1").build());

        assertThatThrownBy(() -> idempotencyService.execute("alice@varellion.com", key, java.util.Map.of("qty", 2),
                () -> OrderResponseDto.builder().orderNumber("VAR-2").build()))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getStatus())
                .isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    @DisplayName("AUD-001: Overlong Idempotency-Key (>128 chars) is rejected with IllegalArgumentException")
    void execute_OverlongKey_ShouldThrowBadRequest() {
        String hugeKey = "k".repeat(129);
        assertThatThrownBy(() -> idempotencyService.execute("alice@varellion.com", hugeKey, null,
                () -> OrderResponseDto.builder().build()))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
