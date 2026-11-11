# Handoff Report: OrderStatus Transitions, OrderStatusHistory Actor Mapping, and Exception Handling

**Agent**: `teamwork_explorer_r1_1`  
**Working Directory**: `/home/mohamed-saad/Desktop/BRAND/.agents/teamwork/teamwork_explorer_r1_1`  
**Date**: 2026-11-06  
**Type**: Hard Handoff  

---

## 1. Observation

### 1.1 `OrderStatus.java`
- **File**: `/home/mohamed-saad/Desktop/BRAND/backend/src/main/java/com/varellion/store/order/entity/OrderStatus.java` (Lines 6-17)
```java
public enum OrderStatus {
    PENDING_CUSTOMER_CONFIRMATION,
    CONFIRMED,
    PREPARING,
    SHIPPED,
    DELIVERED,
    DELIVERY_FAILED,
    CANCELLED,
    EXPIRED,
    RETURNED,
    EXCHANGED
}
```
- Total 10 constants. No custom methods or properties currently exist on this enum.
- Display labels and localized strings are defined in `/home/mohamed-saad/Desktop/BRAND/backend/src/main/java/com/varellion/store/order/service/OrderService.java`:
  - `getStatusDisplayAr` (Lines 467-481):
    - `PENDING_CUSTOMER_CONFIRMATION` -> "تم استلام الطلب وبانتظار التأكيد"
    - `CONFIRMED` -> "تم تأكيد الطلب بنجاح"
    - `PREPARING` -> "قيد التجهيز الملكي والفحص"
    - `SHIPPED` -> "مع مندوب التوصيل"
    - `DELIVERED` -> "تم التسليم بنجاح"
    - `DELIVERY_FAILED` -> "تعذر التسليم (جاري إعادة المحاولة)"
    - `CANCELLED` -> "تم إلغاء الطلب"
    - `EXPIRED` -> "انتهت مهلة تأكيد الطلب"
    - `RETURNED` -> "تم استرجاع الطلب"
    - `EXCHANGED` -> "تم استبدال الطلب"
  - `getStatusDisplayEn` (Lines 483-497):
    - "Pending Confirmation", "Confirmed", "Preparing & Inspection", "Out for Delivery", "Delivered", "Delivery Failed", "Cancelled", "Expired", "Returned", "Exchanged".

### 1.2 `OrderStatusHistory.java` & DB Schema
- **File**: `/home/mohamed-saad/Desktop/BRAND/backend/src/main/java/com/varellion/store/order/entity/OrderStatusHistory.java` (Lines 21-60)
  - Primary key: `@Id @GeneratedValue(strategy = GenerationType.UUID) @Column(name = "history_id") private UUID historyId;` (Lines 23-26)
  - Relationship: `@ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "order_id", nullable = false) private Order order;` (Lines 28-30)
  - Status strings: `@Column(name = "previous_status", length = 50) private String previousStatus;`, `@Column(name = "new_status", nullable = false, length = 50) private String newStatus;` (Lines 32-36)
  - Actor field: `@Column(name = "actor_id") private UUID actorId;` (Lines 41-42)
  - Timestamp: `@CreationTimestamp @Column(name = "created_at", nullable = false, updatable = false) private OffsetDateTime createdAt;` (Lines 44-46)
  - Builder constructor: `public OrderStatusHistory(UUID historyId, Order order, String previousStatus, String newStatus, String reason, UUID actorId, OffsetDateTime createdAt)` (Lines 52-60)
- **Database Migrations on `actor_id`**:
  - `V5__create_orders_module.sql` (Lines 153-157):
    ```sql
    -- Actor ID references auth.users(id) for human admin, or NULL for background system jobs
    actor_id UUID NULL
        REFERENCES auth.users(id)
        ON DELETE SET NULL,
    ```
  - `V10__cleanup_legacy_auth_and_indexes.sql` (Lines 10-12):
    ```sql
    -- 1. Drop legacy auth.users foreign key constraint from order_status_history
    ALTER TABLE public.order_status_history
        DROP CONSTRAINT IF EXISTS order_status_history_actor_id_fkey;
    ```
  - Direct finding: In PostgreSQL, `order_status_history.actor_id` is a nullable column of type `UUID` with **no foreign key constraint**!
  - `V11__add_order_status_history_trigger.sql` (Lines 7-47):
    The database trigger `trg_orders_status_history` logs status changes with `actor_id = NULL` *only* if the application layer has not already logged an entry within 2 seconds (`WHERE created_at >= NOW() - INTERVAL '2 seconds'`). When the application explicitly records the history with `actorId`, this trigger acts as a deduplicated fallback.

### 1.3 User Identity & Spring Security Principal Structure
- **Entity**: `/home/mohamed-saad/Desktop/BRAND/backend/src/main/java/com/varellion/store/security/entity/User.java` (Lines 17-28)
  - Primary key: `@Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;`
  - Unique fields: `String email`, `String username`
  - There is **no UUID column** in `User.java` or `public.users` table (V6 migration: `id BIGSERIAL PRIMARY KEY`).
- **Security Principal**: `/home/mohamed-saad/Desktop/BRAND/backend/src/main/java/com/varellion/store/security/service/CustomUserDetails.java` (Lines 8-29)
  - Contains `private final Long id;` and `private final String username;`.
  - Getter: `public Long getId()` and `public String getUsername()`.
- **JWT Authentication Filter**: `/home/mohamed-saad/Desktop/BRAND/backend/src/main/java/com/varellion/store/security/jwt/JwtAuthenticationFilter.java` (Lines 68-75)
  - Sets `UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities())` into `SecurityContextHolder`.

### 1.4 Exception Handling Hierarchy
- **File**: `/home/mohamed-saad/Desktop/BRAND/backend/src/main/java/com/varellion/store/common/exception/BusinessException.java` (Lines 8-25)
  ```java
  public class BusinessException extends RuntimeException {
      private final HttpStatus status;

      public BusinessException(String message) {
          super(message);
          this.status = HttpStatus.BAD_REQUEST;
      }

      public BusinessException(String message, HttpStatus status) {
          super(message);
          this.status = status;
      }

      public HttpStatus getStatus() {
          return status;
      }
  }
  ```
- **Handler**: `/home/mohamed-saad/Desktop/BRAND/backend/src/main/java/com/varellion/store/common/exception/GlobalExceptionHandler.java` (Lines 25-36)
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
- When `new BusinessException("message")` is thrown:
  - `status` defaults to `HttpStatus.BAD_REQUEST` (HTTP 400).
  - Response body matches the standard `ErrorResponse`:
    `{ "timestamp": "...", "status": 400, "error": "Bad Request", "message": "...", "path": "..." }`.

---

## 2. Logic Chain

### 2.1 State Machine Logic Chain
1. *Observation 1.1*: `OrderStatus` contains 10 constants.
2. *Requirement R3 & Scope*: 
   - "Terminal states (`DELIVERED`, `CANCELLED`, etc.) cannot transition to any state."
   - "Prevent illogical backward transitions (e.g. `CONFIRMED` -> `PENDING_CUSTOMER_CONFIRMATION`)."
3. *Lifecycle Analysis*:
   - An order begins in `PENDING_CUSTOMER_CONFIRMATION` with a 24-hour reservation window. It may transition to `CONFIRMED` (customer/admin confirms), `CANCELLED` (abandoned/cancelled), or `EXPIRED` (reservation timeout).
   - From `CONFIRMED`, work begins in the atelier: `PREPARING` (or direct dispatch `SHIPPED` if streamlined), or `CANCELLED`. Moving back to `PENDING_CUSTOMER_CONFIRMATION` is an illogical backward transition.
   - From `PREPARING`, packaging completes and it is handed to logistics: `SHIPPED`, or `CANCELLED`. Backward moves to `PENDING_CUSTOMER_CONFIRMATION` or `CONFIRMED` are illogical.
   - From `SHIPPED`, the courier attempts delivery:
     - Success -> `DELIVERED` (Terminal).
     - Temporary delivery impediment -> `DELIVERY_FAILED` (courier re-attempt pending).
     - Customer refused package / delivery aborted -> `RETURNED`.
     - Order recalled / cancelled -> `CANCELLED`.
   - From `DELIVERY_FAILED` ("تعذر التسليم (جاري إعادة المحاولة)"):
     - Courier re-dispatches package -> `SHIPPED`.
     - Successful delivery on re-attempt -> `DELIVERED`.
     - Multiple failed attempts resulting in return -> `RETURNED`.
     - Order cancelled -> `CANCELLED`.
   - Terminal States:
     - `DELIVERED`: Terminal state explicitly defined in R3 ("Terminal states (`DELIVERED`, `CANCELLED`, etc.) cannot transition to any state").
     - `CANCELLED`: Terminal state.
     - `EXPIRED`: Terminal state.
     - `RETURNED`: Terminal state.
     - `EXCHANGED`: Terminal state.
4. *Self-Transition / Idempotency Rule*:
   - If `nextStatus == null` or `nextStatus == this`, `canTransitionTo(nextStatus)` must return `false`.
   - `OrderService.updateOrderStatus` checks `if (order.getOrderStatus() == newStatus)` first (idempotent no-op returning `OrderResponseDto`), so self-transition is not a valid state transition and should yield `false` in `canTransitionTo`.

### 2.2 Actor Mapping Logic Chain
1. *Observation 1.2 & 1.3*: `OrderStatusHistory.actorId` is a `UUID`. However, `User.id` in `public.users` and `CustomUserDetails.getId()` is a `Long`.
2. *Observation 1.2*: Database migration `V10` dropped the foreign key constraint on `order_status_history.actor_id`. Thus, PostgreSQL enforces column type `UUID`, but does NOT require a matching record in any specific table.
3. *Requirement R1*: Strict prohibition against modifying SQL migrations, schemas, or JPA entity classes (`OrderStatusHistory.java` must not be changed).
4. *Deduction*:
   - To store the admin actor in `OrderStatusHistory.actorId` without altering `OrderStatusHistory.java`, the `Long id` or `String username` of the admin must be mapped to a valid `UUID`.
   - **Recommended Approach (Type 3 Name-based RFC 4122 UUID or Bit-Packed UUID)**:
     - **Deterministic RFC 4122 v3**: `UUID.nameUUIDFromBytes(("admin:" + adminId).getBytes(StandardCharsets.UTF_8))` or `UUID.nameUUIDFromBytes(adminUsername.getBytes(StandardCharsets.UTF_8))`. This is deterministic, collision-free, and standard.
     - **Bit-Packed UUID (Least Significant Bits)**: `new UUID(0L, adminUserId)`. This directly stores the numeric ID in the lower 64 bits (e.g. User `1` becomes `00000000-0000-0000-0000-000000000001`), allowing lossless and trivial 1:1 decoding via `uuid.getLeastSignificantBits()`.
     - Both approaches work seamlessly with Hibernate, PostgreSQL `uuid`, and require zero schema changes.

### 2.3 Exception Selection Logic Chain
1. *Observation 1.4*: The project defines `BusinessException` extending `RuntimeException` where `this.status = HttpStatus.BAD_REQUEST;`.
2. *Observation 1.4*: `GlobalExceptionHandler` explicitly catches `BusinessException.class` and converts it to a standard `ErrorResponse` with status 400.
3. *Requirement R3*: "Transition Check: If `!currentStatus.canTransitionTo(newStatus)`, throw the project's existing 400 Bad Request exception with a clear message."
4. *Deduction*: `BusinessException` is the canonical project domain exception for business rule violations and must be used when throwing invalid order state transition errors.

---

## 3. Caveats

1. **Post-Delivery Return / Exchange Flow**:
   - In general e-commerce workflows, a delivered order might later be returned (`DELIVERED -> RETURNED`) or exchanged (`DELIVERED -> EXCHANGED`).
   - However, Requirement R3 and SCOPE.md explicitly state: *"Terminal states (`DELIVERED`, `CANCELLED`, etc.) cannot transition to any state."*
   - Therefore, `DELIVERED` is strictly configured with no outbound transitions (`canTransitionTo` returns `false`). If future business requirements introduce post-delivery RMA workflows, those transitions can be added without altering the enum constants.
2. **Nullable Actor ID in Background / Unauthenticated Scenarios**:
   - In automated background tasks (e.g. auto-cancellation of expired reservations) or standalone MockMvc tests that do not establish a security context, `actorId` will be `null`.
   - `OrderStatusHistory.actorId` is nullable (`@Column(name = "actor_id")`), and `order_status_history` in PostgreSQL allows `NULL`. Both the entity and database support `null` actor IDs safely.

---

## 4. Conclusion & Concrete Design Proposals

### 4.1 Proposed `OrderStatus.java` Implementation
In `/home/mohamed-saad/Desktop/BRAND/backend/src/main/java/com/varellion/store/order/entity/OrderStatus.java`, add the `canTransitionTo(OrderStatus nextStatus)` method:

```java
package com.varellion.store.order.entity;

/**
 * Valid order lifecycle statuses as enforced by the database check constraint on public.orders.
 */
public enum OrderStatus {
    PENDING_CUSTOMER_CONFIRMATION,
    CONFIRMED,
    PREPARING,
    SHIPPED,
    DELIVERED,
    DELIVERY_FAILED,
    CANCELLED,
    EXPIRED,
    RETURNED,
    EXCHANGED;

    /**
     * Determines whether transitioning from this status to the given target status is valid.
     * Prevents transitions from terminal states (DELIVERED, CANCELLED, EXPIRED, RETURNED, EXCHANGED),
     * self-transitions (which are handled idempotently), and illogical backward transitions.
     *
     * @param nextStatus The intended target status
     * @return true if the transition is logically permissible; false otherwise
     */
    public boolean canTransitionTo(OrderStatus nextStatus) {
        if (nextStatus == null || nextStatus == this) {
            return false;
        }

        return switch (this) {
            case PENDING_CUSTOMER_CONFIRMATION ->
                    nextStatus == CONFIRMED || nextStatus == CANCELLED || nextStatus == EXPIRED;

            case CONFIRMED ->
                    nextStatus == PREPARING || nextStatus == SHIPPED || nextStatus == CANCELLED;

            case PREPARING ->
                    nextStatus == SHIPPED || nextStatus == CANCELLED;

            case SHIPPED ->
                    nextStatus == DELIVERED || nextStatus == DELIVERY_FAILED
                            || nextStatus == RETURNED || nextStatus == CANCELLED;

            case DELIVERY_FAILED ->
                    nextStatus == SHIPPED || nextStatus == DELIVERED
                            || nextStatus == RETURNED || nextStatus == CANCELLED;

            // Terminal states cannot transition to any other status
            case DELIVERED, CANCELLED, EXPIRED, RETURNED, EXCHANGED -> false;
        };
    }
}
```

### 4.2 State Transition Matrix Summary

| Current Status (`this`) | Allowed `nextStatus` | Key Prevented Illogical & Backward Transitions |
|---|---|---|
| `PENDING_CUSTOMER_CONFIRMATION` | `CONFIRMED`, `CANCELLED`, `EXPIRED` | `SHIPPED`, `DELIVERED`, `DELIVERY_FAILED`, `RETURNED` |
| `CONFIRMED` | `PREPARING`, `SHIPPED`, `CANCELLED` | `PENDING_CUSTOMER_CONFIRMATION` (backward), `EXPIRED` |
| `PREPARING` | `SHIPPED`, `CANCELLED` | `CONFIRMED` (backward), `PENDING_CUSTOMER_CONFIRMATION` (backward) |
| `SHIPPED` | `DELIVERED`, `DELIVERY_FAILED`, `RETURNED`, `CANCELLED` | `PREPARING` (backward), `CONFIRMED` (backward), `PENDING_CUSTOMER_CONFIRMATION` (backward) |
| `DELIVERY_FAILED` | `SHIPPED` (retry), `DELIVERED`, `RETURNED`, `CANCELLED` | `PREPARING` (backward), `CONFIRMED` (backward), `PENDING_CUSTOMER_CONFIRMATION` (backward) |
| `DELIVERED` | *None* | All outbound transitions blocked (Terminal) |
| `CANCELLED` | *None* | All outbound transitions blocked (Terminal) |
| `EXPIRED` | *None* | All outbound transitions blocked (Terminal) |
| `RETURNED` | *None* | All outbound transitions blocked (Terminal) |
| `EXCHANGED` | *None* | All outbound transitions blocked (Terminal) |

### 4.3 Proposed Actor Mapping in `OrderService` and `AdminOrderController`
To safely bridge the admin's identity (`Long id` or `String username`) to `UUID actorId` in `OrderStatusHistory`:

1. **UUID Mapping Helper (to place in `OrderService` or controller helper)**:
```java
public static UUID toActorUuid(Long userId) {
    if (userId == null) {
        return null;
    }
    // Deterministic bit-packed UUID (0L high bits, userId low bits):
    // e.g. User 1 -> 00000000-0000-0000-0000-000000000001
    return new UUID(0L, userId);
}

public static UUID toActorUuid(String identifier) {
    if (identifier == null || identifier.isBlank()) {
        return null;
    }
    try {
        return UUID.fromString(identifier.trim());
    } catch (IllegalArgumentException ex) {
        // Deterministic name-based UUID (RFC 4122 Type 3)
        return UUID.nameUUIDFromBytes(identifier.trim().getBytes(StandardCharsets.UTF_8));
    }
}
```

2. **`OrderService.java` Method Overload**:
```java
// Retain existing 3-arg method for backward compatibility
@Transactional
public OrderResponseDto updateOrderStatus(String orderNumber, OrderStatus newStatus, String reason) {
    return updateOrderStatus(orderNumber, newStatus, reason, (UUID) null);
}

// Overloaded 4-arg method accepting UUID actorId
@Transactional
public OrderResponseDto updateOrderStatus(String orderNumber, OrderStatus newStatus, String reason, UUID actorId) {
    Order order = orderRepository.findByOrderNumberWithDetails(orderNumber.trim().toUpperCase())
            .orElseThrow(() -> new ResourceNotFoundException("لم نتمكن من العثور على الطلب رقم " + orderNumber));

    // R3: Idempotency (No-op)
    if (order.getOrderStatus() == newStatus) {
        return mapToDto(order);
    }

    // R3: Transition validation
    if (!order.getOrderStatus().canTransitionTo(newStatus)) {
        throw new BusinessException(String.format(
                "لا يمكن تحويل حالة الطلب من '%s' إلى '%s'",
                getStatusDisplayAr(order.getOrderStatus()),
                getStatusDisplayAr(newStatus)
        ));
    }

    OrderStatus previousStatus = order.getOrderStatus();
    order.setOrderStatus(newStatus);

    OrderStatusHistory history = OrderStatusHistory.builder()
            .order(order)
            .previousStatus(previousStatus != null ? previousStatus.name() : null)
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

### 4.4 Exception Class for Invalid Transitions
- **Class**: `com.varellion.store.common.exception.BusinessException`
- **HTTP Mapping**: Handled by `GlobalExceptionHandler.handleBusinessException`, automatically returning HTTP `400 Bad Request`.
- **Instantiation**:
  `throw new BusinessException("لا يمكن تحويل حالة الطلب من '" + getStatusDisplayAr(currentStatus) + "' إلى '" + getStatusDisplayAr(newStatus) + "'");`

---

## 5. Verification Method

### 5.1 Verification Commands
Run unit test suites from directory `/home/mohamed-saad/Desktop/BRAND/backend`:
```bash
SPRING_DATASOURCE_PASSWORD=test JWT_SECRET=dGVzdC1zZWNyZXQta2V5LW11c3QtYmUtYXQtbGVhc3QtMjU2LWJpdHMtbG9uZw== mvn test -Dtest=AdminOrderControllerTest,OrderServiceTest
```
Full build verification:
```bash
SPRING_DATASOURCE_PASSWORD=test JWT_SECRET=dGVzdC1zZWNyZXQta2V5LW11c3QtYmUtYXQtbGVhc3QtMjU2LWJpdHMtbG9uZw== mvn test
```

### 5.2 Files to Inspect
- `backend/src/main/java/com/varellion/store/order/entity/OrderStatus.java`
- `backend/src/main/java/com/varellion/store/order/entity/OrderStatusHistory.java`
- `backend/src/main/java/com/varellion/store/common/exception/BusinessException.java`
- `backend/src/main/java/com/varellion/store/common/exception/GlobalExceptionHandler.java`
- `backend/src/main/java/com/varellion/store/order/service/OrderService.java`

### 5.3 Invalidation Conditions
This investigation's findings would be invalidated if:
1. `OrderStatusHistory.java` was permitted to be altered (e.g. changing `actorId` type to `String` or `Long`). However, R1 strictly forbids modifying JPA entity definitions.
2. The requirement for terminal states in R3 is modified to permit transitioning from `DELIVERED` to `RETURNED`. If that occurs, `DELIVERED -> RETURNED, EXCHANGED` should be added to the switch case.
