# Technical Investigation Report: OrderService & Test Suite (R5 & R1-R4 Support)

**Author:** `teamwork_explorer_r1_3`  
**Working Directory:** `/home/mohamed-saad/Desktop/BRAND/.agents/teamwork/teamwork_explorer_r1_3`  
**Date:** 2026-11-06T20:41:00Z  
**Status:** Complete (Read-Only)

---

## 1. Observation

### 1.1 Baseline Test Suite Execution
- **Command:**
  ```bash
  cd /home/mohamed-saad/Desktop/BRAND/backend && \
  SPRING_DATASOURCE_PASSWORD=test \
  JWT_SECRET=dGVzdC1zZWNyZXQta2V5LW11c3QtYmUtYXQtbGVhc3QtMjU2LWJpdHMtbG9uZw== \
  mvn test
  ```
- **Execution Result:**
  - Total Tests Run: **113**
  - Failures: **0**
  - Errors: **0**
  - Skipped: **0**
  - Total Time: **20.829 s**
  - Result: `BUILD SUCCESS`
- **Component Test Counts:**
  - `AdminOrderControllerTest`: 5 tests run, 0 failures, 0 errors (0.328 s).
  - `OrderServiceTest`: 21 tests run, 0 failures, 0 errors (0.232 s).

### 1.2 Current Implementation of `updateOrderStatus` in `OrderService.java`
- **File:** `/home/mohamed-saad/Desktop/BRAND/backend/src/main/java/com/varellion/store/order/service/OrderService.java` (lines 394–419):
  ```java
  @Transactional
  public OrderResponseDto updateOrderStatus(String orderNumber, OrderStatus newStatus, String reason) {
      Order order = orderRepository.findByOrderNumberWithDetails(orderNumber.trim().toUpperCase())
              .orElseThrow(() -> new ResourceNotFoundException("لم نتمكن من العثور على الطلب رقم " + orderNumber));

      OrderStatus previousStatus = order.getOrderStatus();
      order.setOrderStatus(newStatus);

      OrderStatusHistory history = OrderStatusHistory.builder()
              .order(order)
              .previousStatus(previousStatus != null ? previousStatus.name() : null)
              .newStatus(newStatus.name())
              .reason(reason != null ? reason : "Status changed to " + newStatus.name())
              .createdAt(OffsetDateTime.now())
              .build();

      if (order.getStatusHistory() == null) {
          order.setStatusHistory(new ArrayList<>());
      }
      order.getStatusHistory().add(history);
      Order savedOrder = orderRepository.save(order);
      return mapToDto(savedOrder);
  }
  ```
- **Direct Observations:**
  1. No check for current status vs new status (`order.getOrderStatus() == newStatus`). Calling this method with the same status unconditionally appends a new `OrderStatusHistory` record and calls `orderRepository.save(order)`.
  2. No check for valid transition logic. `previousStatus` is read, but `canTransitionTo` is never checked.
  3. `history` is constructed without `actorId` (field remains `null`).
  4. Only one method signature exists: `(String orderNumber, OrderStatus newStatus, String reason)`.

### 1.3 `OrderStatusHistory` Entity Structure
- **File:** `/home/mohamed-saad/Desktop/BRAND/backend/src/main/java/com/varellion/store/order/entity/OrderStatusHistory.java` (lines 41–42, 51–60):
  ```java
  @Column(name = "actor_id")
  private UUID actorId;
  ```
  The builder constructor accepts `UUID actorId`. The column and field type is explicitly `java.util.UUID`.
- **File:** `/home/mohamed-saad/Desktop/BRAND/backend/src/main/java/com/varellion/store/order/dto/OrderStatusHistoryDto.java`:
  Does NOT contain `actorId`. Per R1 guardrails: "Do NOT add, remove, or rename fields in any Request or Response DTOs". The API contract remains untouched; `actorId` is solely an entity/audit database persistence concern.

### 1.4 Domain Exceptions and Global Exception Handling
- **File:** `/home/mohamed-saad/Desktop/BRAND/backend/src/main/java/com/varellion/store/common/exception/BusinessException.java` (lines 8–25):
  ```java
  public class BusinessException extends RuntimeException {
      private final HttpStatus status;

      public BusinessException(String message) {
          super(message);
          this.status = HttpStatus.BAD_REQUEST;
      }
      public HttpStatus getStatus() { return status; }
  }
  ```
- **File:** `/home/mohamed-saad/Desktop/BRAND/backend/src/main/java/com/varellion/store/common/exception/GlobalExceptionHandler.java` (lines 25–36):
  ```java
  @ExceptionHandler(BusinessException.class)
  public ResponseEntity<ErrorResponse> handleBusinessException(BusinessException ex, HttpServletRequest request) {
      log.warn("Business exception on path {}: {}", request.getRequestURI(), ex.getMessage());
      ErrorResponse error = ErrorResponse.builder()
              .timestamp(LocalDateTime.now())
              .status(ex.getStatus().value())
              .error(ex.getStatus().getReasonPhrase())
              .message(ex.getMessage())
              .path(request.getRequestURI())
              .build();
      return ResponseEntity.status(ex.getStatus()).body(error);
  }
  ```
  `BusinessException` is the project's canonical domain exception mapped to `400 Bad Request`.
- In `GlobalExceptionHandler.java`:
  `jakarta.validation.ConstraintViolationException` is currently **NOT** handled. Any uncaught `ConstraintViolationException` defaults to `handleGeneralException` (HTTP 500).

### 1.5 Current `AdminOrderControllerTest.java` Setup
- **File:** `/home/mohamed-saad/Desktop/BRAND/backend/src/test/java/com/varellion/store/admin/order/controller/AdminOrderControllerTest.java` (lines 47–51, 153–170):
  ```java
  @BeforeEach
  void setUp() {
      mockMvc = MockMvcBuilders.standaloneSetup(adminOrderController)
              .setControllerAdvice(new GlobalExceptionHandler())
              .build();
      ...
  }
  ```
- **Observations on Existing Controller Tests:**
  1. Uses `MockMvcBuilders.standaloneSetup`. This runs without the Spring Security filter chain and without Spring AOP `MethodValidationPostProcessor`. Therefore:
     - `@PreAuthorize("hasRole('ADMIN')")` is ignored.
     - `@Pattern` validation on `@PathVariable String orderNumber` (which requires `@Validated` + `MethodValidationPostProcessor`) is not executed in pure `standaloneSetup`.
     - Security scenarios (401 anonymous, 403 non-admin) cannot be verified in pure `standaloneSetup` without Spring context or mock security filters.
  2. Test `updateOrderStatus_NotFound_WhenOrderDoesNotExist` (line 163):
     ```java
     mockMvc.perform(put("/api/admin/orders/VAR-NONEXISTENT/status")...)
     ```
     Notice `"VAR-NONEXISTENT"` does NOT match `^VAR-\\d{8}-\\d{4}$`. When path validation is added, this test will fail with `400 Bad Request` instead of `404 Not Found` unless the order number is updated to a validly formatted non-existent number (such as `"VAR-99999999-9999"`).

---

## 2. Logic Chain

### 2.1 Backward-Compatible Overload Design in `OrderService`
- **Premise 1:** R1 requires backward compatibility: existing callers must not break (`updateOrderStatus(orderNumber, newStatus, reason)` must remain functional).
- **Premise 2:** R2 requires `actorId` (UUID) to be recorded in `OrderStatusHistory`.
- **Deduction:**
  1. Add overloaded method `updateOrderStatus(String orderNumber, OrderStatus newStatus, String reason, UUID actorId)`.
  2. Implement the 3-argument method as a direct delegation:
     ```java
     @Transactional
     public OrderResponseDto updateOrderStatus(String orderNumber, OrderStatus newStatus, String reason) {
         return updateOrderStatus(orderNumber, newStatus, reason, (UUID) null);
     }
     ```
  3. Inside the 4-argument method, map `actorId` directly to `OrderStatusHistory.builder().actorId(actorId)...`.
  4. If an actor identifier is supplied as a String (e.g. from Spring Security's `authentication.getName()`), a helper or deterministic derivation (similar to `CustomerService.deriveCustomerUUID`: `UUID.nameUUIDFromBytes(actorString.getBytes(StandardCharsets.UTF_8))` or `UUID.fromString(...)`) can be utilized.

### 2.2 Idempotency (Short-Circuit) Sequencing
- **Premise 1:** R3 dictates: if `order.getOrderStatus() == newStatus`, immediately return mapped `OrderResponseDto` without saving a duplicate history record.
- **Premise 2:** An order that is already in a terminal state (e.g. `DELIVERED`) could receive another `DELIVERED` update (e.g., from an automated retry or redundant webhook).
- **Deduction:**
  1. The idempotency check must precede the state transition check:
     ```java
     OrderStatus currentStatus = order.getOrderStatus();
     if (currentStatus == newStatus) {
         log.info("[OrderService] Order {} is already in status {}. Idempotent no-op.", orderNumber, newStatus);
         return mapToDto(order);
     }
     ```
  2. Because `mapToDto(order)` is called and the method returns immediately:
     - `order.setOrderStatus(newStatus)` is bypassed.
     - `order.getStatusHistory().add(...)` is bypassed.
     - `orderRepository.save(order)` is never invoked.
     - No database write or dirty-check SQL is issued.

### 2.3 State Machine Validation & Error Mapping
- **Premise 1:** R3 states: if `!currentStatus.canTransitionTo(newStatus)`, throw the project's existing 400 Bad Request exception with a clear message.
- **Premise 2:** `BusinessException` extends `RuntimeException`, has `HttpStatus.BAD_REQUEST`, and is already wired in `GlobalExceptionHandler` returning `ErrorResponse` with HTTP 400.
- **Deduction:**
  1. In `OrderStatus.java`, declare:
     ```java
     public boolean canTransitionTo(OrderStatus nextStatus) {
         if (nextStatus == null || nextStatus == this) {
             return false;
         }
         return switch (this) {
             case PENDING_CUSTOMER_CONFIRMATION -> nextStatus == CONFIRMED || nextStatus == CANCELLED || nextStatus == EXPIRED;
             case CONFIRMED -> nextStatus == PREPARING || nextStatus == CANCELLED;
             case PREPARING -> nextStatus == SHIPPED || nextStatus == CANCELLED;
             case SHIPPED -> nextStatus == DELIVERED || nextStatus == DELIVERY_FAILED || nextStatus == CANCELLED;
             case DELIVERY_FAILED -> nextStatus == SHIPPED || nextStatus == RETURNED || nextStatus == CANCELLED;
             case DELIVERED, CANCELLED, EXPIRED, RETURNED, EXCHANGED -> false;
         };
     }
     ```
  2. In `OrderService.java`, after the idempotency check:
     ```java
     if (currentStatus != null && !currentStatus.canTransitionTo(newStatus)) {
         throw new BusinessException("لا يمكن تغيير حالة الطلب من " + getStatusDisplayAr(currentStatus) + " إلى " + getStatusDisplayAr(newStatus));
     }
     ```
  3. When an invalid transition occurs, `GlobalExceptionHandler.handleBusinessException` catches `BusinessException` and produces a standard `400 Bad Request` response with `status: 400` and the Arabic explanation.

### 2.4 Test Strategy for Security and Validation (R5)
- **Premise 1:** R5 requires testing:
  - 401 Unauthorized for anonymous requests.
  - 403 Forbidden for `ROLE_USER`.
  - 200 OK for `ROLE_ADMIN`.
  - 400 Bad Request for invalid `orderNumber` pattern (`^VAR-\\d{8}-\\d{4}$`).
- **Premise 2:** `AdminOrderController` has `@PreAuthorize("hasRole('ADMIN')")`, and `/api/admin/**` is protected by `SecurityConfig.java:70` (`.hasRole("ADMIN")`).
- **Premise 3:** `AdminOrderControllerTest.java` is in the allowed target files list (R1).
- **Deduction:**
  1. `AdminOrderControllerTest` should be configured with Spring's test framework to load security and validation filters. The most maintainable and idiomatic approach is:
     ```java
     @SpringBootTest
     @AutoConfigureMockMvc
     @TestPropertySource(locations = "classpath:application-test.properties")
     class AdminOrderControllerTest {
         @Autowired private MockMvc mockMvc;
         @MockBean private OrderService orderService;
         ...
     ```
     This activates:
     - The real `SecurityFilterChain` (`JwtAuthenticationEntryPoint` returning 401, `JwtAccessDeniedHandler` returning 403).
     - Method validation (`MethodValidationPostProcessor`) for `@Pattern` on `@PathVariable`.
     - `GlobalExceptionHandler` including `ConstraintViolationException`.
  2. Alternatively, if keeping standalone / sliced tests, `@WebMvcTest(AdminOrderController.class)` can be used with `@Import(SecurityConfig.class)` and `@MockBean`s for the security dependencies. However, `@SpringBootTest` + `@AutoConfigureMockMvc` is already supported by `application-test.properties` and H2, eliminating manual security mock wiring.

---

## 3. Caveats

1. **Existing Test `"VAR-NONEXISTENT"`:**
   In `AdminOrderControllerTest.java:163`, the path `/api/admin/orders/VAR-NONEXISTENT/status` will trigger `@Pattern` validation failure and return HTTP 400 rather than reaching `orderService` to return HTTP 404. The implementer must update the test order number to a valid pattern (e.g., `"VAR-99999999-9999"`) so that the 404 behavior is tested correctly.
2. **`GlobalExceptionHandler` for `ConstraintViolationException`:**
   Currently, `ConstraintViolationException` is not handled in `GlobalExceptionHandler.java`. Without adding an `@ExceptionHandler(ConstraintViolationException.class)` that formats the violation into `ErrorResponse` (HTTP 400), regex validation failures on `@PathVariable` would trigger `handleGeneralException` (HTTP 500).
3. **Actor UUID Resolution:**
   `OrderStatusHistory.actorId` is a `UUID`. In Spring Security, the authenticated principal may be a `CustomUserDetails` (where `id` is a `Long`), or a standard `UserDetails`/`Authentication` where `getName()` is a `String` (email/username). The controller or service must deterministically convert the identifier to `UUID` (e.g. `UUID.nameUUIDFromBytes(actorString.getBytes(StandardCharsets.UTF_8))` or similar) to prevent runtime `ClassCastException` or `IllegalArgumentException`.

---

## 4. Conclusion & Concrete Recommendations

### 4.1 Recommended Changes in `OrderService.java`
Replace `updateOrderStatus` with the overloaded structure:

```java
/**
 * Backward-compatible overload delegating to actor-aware transition method.
 */
@Transactional
public OrderResponseDto updateOrderStatus(String orderNumber, OrderStatus newStatus, String reason) {
    return updateOrderStatus(orderNumber, newStatus, reason, (UUID) null);
}

/**
 * Updates order lifecycle status with audit actor tracking, idempotency, and state machine validation.
 */
@Transactional
public OrderResponseDto updateOrderStatus(String orderNumber, OrderStatus newStatus, String reason, UUID actorId) {
    Order order = orderRepository.findByOrderNumberWithDetails(orderNumber.trim().toUpperCase())
            .orElseThrow(() -> new ResourceNotFoundException("لم نتمكن من العثور على الطلب رقم " + orderNumber));

    OrderStatus currentStatus = order.getOrderStatus();

    // 1. Idempotency Check: immediate return without saving duplicate history
    if (currentStatus == newStatus) {
        log.info("[OrderService] Order {} is already in status {}. Idempotent no-op.", orderNumber, newStatus);
        return mapToDto(order);
    }

    // 2. State Machine Validation: prevent invalid and illogical backward transitions
    if (currentStatus != null && !currentStatus.canTransitionTo(newStatus)) {
        throw new BusinessException("لا يمكن تغيير حالة الطلب من " + getStatusDisplayAr(currentStatus) + " إلى " + getStatusDisplayAr(newStatus));
    }

    // 3. Apply state transition
    order.setOrderStatus(newStatus);

    OrderStatusHistory history = OrderStatusHistory.builder()
            .order(order)
            .previousStatus(currentStatus != null ? currentStatus.name() : null)
            .newStatus(newStatus.name())
            .reason(reason != null ? reason : "Status changed to " + newStatus.name())
            .actorId(actorId)
            .createdAt(OffsetDateTime.now())
            .build();

    if (order.getStatusHistory() == null) {
        order.setStatusHistory(new ArrayList<>());
    }
    order.getStatusHistory().add(history);
    Order savedOrder = orderRepository.save(order);
    return mapToDto(savedOrder);
}
```

### 4.2 Recommended Changes in `OrderStatus.java`
Add the helper method without altering existing enum constants:

```java
public boolean canTransitionTo(OrderStatus nextStatus) {
    if (nextStatus == null || nextStatus == this) {
        return false;
    }
    return switch (this) {
        case PENDING_CUSTOMER_CONFIRMATION -> nextStatus == CONFIRMED || nextStatus == CANCELLED || nextStatus == EXPIRED;
        case CONFIRMED -> nextStatus == PREPARING || nextStatus == CANCELLED;
        case PREPARING -> nextStatus == SHIPPED || nextStatus == CANCELLED;
        case SHIPPED -> nextStatus == DELIVERED || nextStatus == DELIVERY_FAILED || nextStatus == CANCELLED;
        case DELIVERY_FAILED -> nextStatus == SHIPPED || nextStatus == RETURNED || nextStatus == CANCELLED;
        case DELIVERED, CANCELLED, EXPIRED, RETURNED, EXCHANGED -> false;
    };
}
```

### 4.3 Recommended Additions to `GlobalExceptionHandler.java`
Add handling for `ConstraintViolationException`:

```java
@ExceptionHandler(jakarta.validation.ConstraintViolationException.class)
public ResponseEntity<ErrorResponse> handleConstraintViolation(jakarta.validation.ConstraintViolationException ex, HttpServletRequest request) {
    Map<String, String> errors = new HashMap<>();
    for (jakarta.validation.ConstraintViolation<?> violation : ex.getConstraintViolations()) {
        String propertyPath = violation.getPropertyPath().toString();
        String fieldName = propertyPath.contains(".")
                ? propertyPath.substring(propertyPath.lastIndexOf('.') + 1)
                : propertyPath;
        errors.put(fieldName, violation.getMessage());
    }

    ErrorResponse error = ErrorResponse.builder()
            .timestamp(LocalDateTime.now())
            .status(HttpStatus.BAD_REQUEST.value())
            .error("Validation Failed")
            .message("One or more fields failed validation")
            .path(request.getRequestURI())
            .validationErrors(errors)
            .build();
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
}
```

### 4.4 Recommended Test Additions in `OrderServiceTest.java`

| Test Method | Objective | Assertions / Verification |
|---|---|---|
| `updateOrderStatus_SavesActorIdInHistory` | Verify `actorId` (UUID) is properly saved on `OrderStatusHistory`. | `assertThat(savedOrder.getStatusHistory().get(...).getActorId()).isEqualTo(testActorId);` |
| `updateOrderStatus_ThreeArgOverload_DelegatesWithNullActorId` | Verify backward compatibility: 3-arg overload populates `actorId == null`. | `assertThat(savedOrder.getStatusHistory().get(...).getActorId()).isNull();` |
| `updateOrderStatus_Idempotent_WhenSameStatus` | Verify no duplicate history record and no repository save when updating to current status. | `verify(orderRepository, never()).save(any());` and returned DTO matches current order. |
| `updateOrderStatus_ThrowsBusinessException_WhenTerminalState` | Verify updating from `DELIVERED` throws `BusinessException` (400 Bad Request). | `assertThatThrownBy(...) .isInstanceOf(BusinessException.class);` and `verify(orderRepository, never()).save(any());` |
| `updateOrderStatus_ThrowsBusinessException_WhenIllogicalBackwardTransition` | Verify updating from `CONFIRMED` to `PENDING_CUSTOMER_CONFIRMATION` throws `BusinessException`. | `assertThatThrownBy(...) .isInstanceOf(BusinessException.class);` |

### 4.5 Recommended Test Additions in `AdminOrderControllerTest.java`

| Test Method | Objective | Setup & Request | Expected HTTP Response |
|---|---|---|---|
| `updateOrderStatus_Unauthorized_WhenAnonymous` | Enforce 401 Unauthorized for unauthenticated requests. | No authentication post-processor. PUT `/api/admin/orders/VAR-20261028-0001/status`. | `status().isUnauthorized()` (401) |
| `updateOrderStatus_Forbidden_WhenRoleUser` | Enforce 403 Forbidden for non-admin (`ROLE_USER`). | `.with(user("user").roles("USER"))`. PUT `/api/admin/orders/VAR-20261028-0001/status`. | `status().isForbidden()` (403) |
| `updateOrderStatus_Success_WhenRoleAdmin` | Enforce 200 OK and audit log when authorized admin calls. | `.with(user("admin").roles("ADMIN"))`. PUT `/api/admin/orders/VAR-20261028-0001/status`. | `status().isOk()` (200), `jsonPath("$.success").value(true)` |
| `updateOrderStatus_ValidationError_WhenInvalidOrderNumberPattern` | Enforce 400 Bad Request when path variable violates `^VAR-\\d{8}-\\d{4}$`. | `.with(user("admin").roles("ADMIN"))`. PUT `/api/admin/orders/VAR-INVALID-123/status`. | `status().isBadRequest()` (400), `jsonPath("$.validationErrors.orderNumber").value("صيغة رقم الطلب غير صحيحة")` |

---

## 5. Verification Method

To independently verify all findings and test proposals:

1. **Baseline Verification Command:**
   ```bash
   cd /home/mohamed-saad/Desktop/BRAND/backend && \
   SPRING_DATASOURCE_PASSWORD=test \
   JWT_SECRET=dGVzdC1zZWNyZXQta2V5LW11c3QtYmUtYXQtbGVhc3QtMjU2LWJpdHMtbG9uZw== \
   mvn test
   ```
   *Expected outcome:* 113 tests pass, 0 failures, 0 errors.

2. **File Inspection:**
   - Verify `OrderStatusHistory.java:41–42`: confirm `UUID actorId` exists.
   - Verify `OrderService.java:394–419`: confirm single 3-arg `updateOrderStatus` method without idempotency or transition checks.
   - Verify `AdminOrderControllerTest.java:47–51`: confirm standalone setup and `"VAR-NONEXISTENT"` in line 163.
   - Verify `BusinessException.java:14–15`: confirm `HttpStatus.BAD_REQUEST` is default.

3. **Invalidation Conditions:**
   - If database migrations or entities are changed, R1 is violated.
   - If DTO contracts are modified, R1 is violated.
   - If `VAR-NONEXISTENT` is left unchanged in `AdminOrderControllerTest` after adding `@Pattern`, the test suite will fail.
