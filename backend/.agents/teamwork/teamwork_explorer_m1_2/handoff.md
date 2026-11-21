# Investigation Report: Package B Order Status History & Audit Architecture

**Author**: `teamwork_explorer_m1_2`  
**Working Directory**: `/home/mohamed-saad/Desktop/BRAND/.agents/teamwork/teamwork_explorer_m1_2/`  
**Target Module**: Backend Order Status History & Trigger Resolution  
**Date**: 2026-11-09  

---

## 1. Observation

### 1.1 JPA Entity `OrderStatusHistory` and Related Entities
Direct inspection of entity classes reveals:

1. **`OrderStatusHistory.java`** (`backend/src/main/java/com/varellion/store/order/entity/OrderStatusHistory.java`):
   - Lines 23–26:
     ```java
     @Id
     @GeneratedValue(strategy = GenerationType.UUID)
     @Column(name = "history_id", nullable = false, updatable = false)
     private UUID historyId;
     ```
   - Lines 28–30:
     ```java
     @ManyToOne(fetch = FetchType.LAZY, optional = false)
     @JoinColumn(name = "order_id", nullable = false)
     private Order order;
     ```
   - Lines 41–42:
     ```java
     @Column(name = "actor_id")
     private UUID actorId;
     ```
   - Lines 51–60:
     ```java
     @Builder
     public OrderStatusHistory(UUID historyId, Order order, String previousStatus, String newStatus, String reason, UUID actorId, OffsetDateTime createdAt) {
         this.historyId = historyId;
         this.order = order;
         this.previousStatus = previousStatus;
         this.newStatus = newStatus;
         this.reason = reason;
         this.actorId = actorId;
         this.createdAt = createdAt;
     }
     ```
   - `actorId` is currently defined as `java.util.UUID`.

2. **`Order.java`** (`backend/src/main/java/com/varellion/store/order/entity/Order.java`):
   - Lines 33–35:
     ```java
     @Version
     @Column(name = "version", nullable = false)
     private Long version;
     ```
   - Lines 74–76:
     ```java
     @Enumerated(EnumType.STRING)
     @Column(name = "order_status", nullable = false, length = 50)
     private OrderStatus orderStatus = OrderStatus.PENDING_CUSTOMER_CONFIRMATION;
     ```
   - Lines 103–106:
     ```java
     @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
     @OrderBy("createdAt ASC")
     @org.hibernate.annotations.BatchSize(size = 25)
     private List<OrderStatusHistory> statusHistory = new ArrayList<>();
     ```
   - `statusHistory` is managed via bidirectional `@OneToMany` with `cascade = CascadeType.ALL` and `orphanRemoval = true`. Saving the `Order` entity automatically cascades persistence to new `OrderStatusHistory` entries.

3. **`User.java`** (`backend/src/main/java/com/varellion/store/security/entity/User.java`):
   - Lines 19–21:
     ```java
     @Id
     @GeneratedValue(strategy = GenerationType.IDENTITY)
     private Long id;
     ```
   - Corresponds to `public.users.id BIGSERIAL PRIMARY KEY` (PostgreSQL `BIGINT`).

4. **`CustomUserDetails.java`** (`backend/src/main/java/com/varellion/store/security/service/CustomUserDetails.java`):
   - Lines 10, 27–29:
     ```java
     private final Long id;
     ...
     public Long getId() {
         return id;
     }
     ```
   - `CustomUserDetails` already stores and exposes the authentic `Long id` of the user.

5. **`OrderStatus.java`** (`backend/src/main/java/com/varellion/store/order/entity/OrderStatus.java`):
   - Lines 26–53 implement state machine validation `canTransitionTo(OrderStatus nextStatus)`:
     - Disallows self-transitions (`nextStatus == this -> false`).
     - Disallows transitions from terminal states (`DELIVERED`, `CANCELLED`, `EXPIRED`, `RETURNED`, `EXCHANGED -> false`).
     - Permits specific valid forward/failure transitions (e.g. `PENDING_CUSTOMER_CONFIRMATION -> CONFIRMED | CANCELLED | EXPIRED`).

---

### 1.2 Current Database Schema & Migration History for `order_status_history`
1. **`V5__create_orders_module.sql`** (`backend/src/main/resources/db/migration/V5__create_orders_module.sql`):
   - Lines 142–159:
     ```sql
     CREATE TABLE IF NOT EXISTS public.order_status_history (
         history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
         order_id UUID NOT NULL REFERENCES public.orders(order_id) ON DELETE CASCADE,
         previous_status VARCHAR(50) NULL,
         new_status VARCHAR(50) NOT NULL,
         reason TEXT NULL,
         actor_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
         created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
     );
     ```
2. **`V10__cleanup_legacy_auth_and_indexes.sql`** (`backend/src/main/resources/db/migration/V10__cleanup_legacy_auth_and_indexes.sql`):
   - Lines 11–12:
     ```sql
     ALTER TABLE public.order_status_history
         DROP CONSTRAINT IF EXISTS order_status_history_actor_id_fkey;
     ```
   - Dropped the legacy foreign key pointing to Supabase `auth.users(id)`, leaving `actor_id` as an unconstrained `UUID NULL` column.
3. **`V11__add_order_status_history_trigger.sql`** (`backend/src/main/resources/db/migration/V11__add_order_status_history_trigger.sql`):
   - Lines 7–47:
     ```sql
     CREATE OR REPLACE FUNCTION public.log_order_status_transition()
     RETURNS TRIGGER SECURITY DEFINER SET search_path = public AS $$
     BEGIN
         IF (TG_OP = 'UPDATE' AND OLD.order_status IS DISTINCT FROM NEW.order_status) THEN
             IF NOT EXISTS (
                 SELECT 1 FROM public.order_status_history
                 WHERE order_id = NEW.order_id
                   AND new_status = NEW.order_status
                   AND created_at >= NOW() - INTERVAL '2 seconds'
             ) THEN
                 INSERT INTO public.order_status_history (
                     order_id, previous_status, new_status, reason, actor_id, created_at
                 ) VALUES (
                     NEW.order_id, OLD.order_status, NEW.order_status,
                     'Status updated to ' || NEW.order_status, NULL, NOW()
                 );
             END IF;
         END IF;
         RETURN NEW;
     END;
     $$ LANGUAGE plpgsql;

     CREATE TRIGGER trg_orders_status_history
     AFTER UPDATE OF order_status ON public.orders
     FOR EACH ROW
     EXECUTE FUNCTION public.log_order_status_transition();
     ```
   - Note: Line 33 hardcodes `actor_id` as `NULL`.

---

### 1.3 `OrderService.java` History Creation and Status Transition
Inspecting `OrderService.java` (`backend/src/main/java/com/varellion/store/order/service/OrderService.java`):

1. **Order Placement (`createOrder`)** (lines 251–258):
   ```java
   OrderStatusHistory initialHistory = OrderStatusHistory.builder()
           .order(order)
           .newStatus(OrderStatus.PENDING_CUSTOMER_CONFIRMATION.name())
           .reason("تم تسجيل وتأكيد الطلب عبر المتجر")
           .build();
   order.getStatusHistory().add(initialHistory);

   Order savedOrder = orderRepository.save(order);
   ```
   - Directly creates an initial Java `OrderStatusHistory` entity with `actorId` defaulting to `null` (since customer/guest checkout is not an admin action).
   - In PostgreSQL, the V11 trigger only activates `AFTER UPDATE OF order_status`, so during initial `INSERT` in `createOrder`, the trigger does NOT fire.

2. **Status Update Overload (`updateOrderStatus`)** (lines 436–439):
   ```java
   @Transactional
   public OrderResponseDto updateOrderStatus(String orderNumber, OrderStatus newStatus, String reason) {
       return updateOrderStatus(orderNumber, newStatus, reason, (UUID) null);
   }
   ```
   - Casts to `(UUID) null`.

3. **Status Update Core (`updateOrderStatus`)** (lines 450–490):
   ```java
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
           throw new BusinessException(String.format(
                   "لا يمكن تحويل حالة الطلب من '%s' إلى '%s'",
                   getStatusDisplayAr(currentStatus),
                   getStatusDisplayAr(newStatus)
           ));
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
   - Receives `UUID actorId`.
   - Creates the `OrderStatusHistory` instance in Java and adds it to `order.getStatusHistory()`.
   - Calls `orderRepository.save(order)`.

4. **DTO Mapping Fallback (`mapToDto`)** (lines 387–401):
   - Checks if `historyDtos` contains an entry matching `order.getOrderStatus()`.
   - If not found, appends a synthesized in-memory `OrderStatusHistoryDto` to the returned list.
   - This fallback operates purely in memory for DTO serialization and does NOT write or persist any entity to the database.

---

### 1.4 `AdminOrderController.java` Actor Resolution
Inspecting `AdminOrderController.java` (`backend/src/main/java/com/varellion/store/admin/order/controller/AdminOrderController.java`):
- Lines 78–93:
  ```java
  @PutMapping("/{orderNumber}/status")
  public ResponseEntity<ApiResponse<OrderResponseDto>> updateOrderStatus(
          @PathVariable
          @Pattern(regexp = "^VAR-\\d{8}-\\d{4}$", message = "صيغة رقم الطلب غير صحيحة")
          String orderNumber,
          @Valid @RequestBody UpdateOrderStatusRequest request,
          @AuthenticationPrincipal UserDetails adminUser
  ) {
      String actorId = (adminUser != null) ? adminUser.getUsername() : "SYSTEM";
      log.info("Admin [{}] changed status of order [{}] to [{}] - Reason: {}",
              actorId, orderNumber, request.getNewStatus(), request.getReason());

      UUID actorUuid = resolveActorUuid(actorId);

      OrderResponseDto updated = orderService.updateOrderStatus(
              orderNumber,
              request.getNewStatus(),
              request.getReason(),
              actorUuid
      );
      return ResponseEntity.ok(ApiResponse.success("تم تحديث حالة الطلب بنجاح", updated));
  }
  ```
- Lines 95–104:
  ```java
  private UUID resolveActorUuid(String actorIdentifier) {
      if (actorIdentifier == null || actorIdentifier.isBlank() || "SYSTEM".equalsIgnoreCase(actorIdentifier)) {
          return null;
      }
      try {
          return UUID.fromString(actorIdentifier);
      } catch (IllegalArgumentException ex) {
          return UUID.nameUUIDFromBytes(actorIdentifier.getBytes(StandardCharsets.UTF_8));
      }
  }
  ```
  - It generates a synthetic MD5 UUID (`UUID.nameUUIDFromBytes(...)`) from the admin's username (e.g. email string) rather than extracting the real user ID.

---

### 1.5 Repository Usages and All Codebase References
1. **`OrderStatusHistoryRepository.java`** (`backend/src/main/java/com/varellion/store/order/repository/OrderStatusHistoryRepository.java`):
   ```java
   @Repository
   public interface OrderStatusHistoryRepository extends JpaRepository<OrderStatusHistory, UUID> {
       List<OrderStatusHistory> findByOrderOrderIdOrderByCreatedAtAsc(UUID orderId);
   }
   ```
   - Primary key of `OrderStatusHistory` remains `UUID historyId`.
   - `OrderStatusHistoryRepository` is NOT currently injected in `OrderService` because `Order.statusHistory` is managed via Hibernate cascade from `Order`.
2. **`OrderRepository.java`**:
   - `findByOrderNumberWithDetails` fetches `Order` with `items` (`LEFT JOIN FETCH o.items`).
   - When `order.getStatusHistory()` is called inside the `@Transactional` boundary of `updateOrderStatus`, Hibernate lazily loads the history list and cascades the new `OrderStatusHistory` entry on `save()`.
3. **`UserRepository.java`**:
   - Provides `findByUsername(String username)` and `findByEmail(String email)`.
4. **Test References**:
   - `OrderServiceTest.java`:
     - Line 307: `UUID actorId = UUID.randomUUID();`
     - Line 317: passes `actorId` to `orderService.updateOrderStatus`
     - Line 323: asserts `actorId.equals(h.getActorId())`
   - `JpaEntityMappingTest.java`:
     - Line 226: `.actorId(customer.getUserId())` (where `customer.getUserId()` is `UUID`)
   - `AdminOrderControllerTest.java`:
     - Line 100, 176, 244: Mockito stubbing `orderService.updateOrderStatus(..., any())`

---

## 2. Logic Chain

```
[Observation 1.2: V11 Trigger trg_orders_status_history]
      │
      ▼
  When OrderService.updateOrderStatus executes:
  Hibernate issues UPDATE public.orders SET order_status = ...
      │
      ▼
  PostgreSQL fires AFTER UPDATE trigger log_order_status_transition()
  Trigger checks: WHERE order_id = ... AND new_status = ... AND created_at >= NOW() - INTERVAL '2 seconds'
  At this instant, Hibernate has NOT yet flushed the INSERT INTO order_status_history
      │
      ▼
  Trigger check evaluates to NOT EXISTS -> Trigger inserts row with actor_id = NULL
      │
      ▼
  Hibernate then executes INSERT INTO order_status_history with actor_id = <UUID>
      │
      ▼
  RESULT: Duplicate history records created for the same transition:
          1. Trigger record (actor_id = NULL, generic reason)
          2. Application record (actor_id = <UUID>, custom reason)
```

1. **Why Duplicate Entries Occur**:
   - Hibernate flushes dirty entities in a defined order: dirty collection elements/entity updates vs inserts.
   - Even in the same transaction, when `UPDATE orders` executes, the database trigger fires immediately.
   - Because the Java-managed `OrderStatusHistory` has not yet been committed or flushed to PostgreSQL at the exact moment the trigger fires, the trigger's `NOT EXISTS` query fails to find it.
   - The trigger proceeds to insert an audit record with `actor_id = NULL`.
   - Then Hibernate flushes the cascaded `OrderStatusHistory` row with the user-provided `actor_id`.
   - Thus, two rows are created for every status transition.

2. **Why `actor_id` Must Be Converted from `UUID` to `BIGINT`**:
   - `public.users.id` in PostgreSQL is `BIGSERIAL PRIMARY KEY` (`BIGINT`), mapped in Java to `Long id` in `User.java` and `CustomUserDetails.java`.
   - In `V5`, `order_status_history.actor_id` was originally designed as `UUID NULL REFERENCES auth.users(id)` (legacy Supabase auth).
   - In `V8` and `V10`, user authentication was migrated to internal `public.users` with `BIGSERIAL` IDs, and the legacy foreign key was dropped.
   - However, `order_status_history.actor_id` remained a `UUID` column.
   - To re-establish relational integrity, `order_status_history.actor_id` must be altered to `BIGINT` and given a foreign key `REFERENCES public.users(id) ON DELETE SET NULL`.

3. **Handling Legacy Historical Data**:
   - Existing rows in `order_status_history` may contain UUID format strings (e.g., `'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'`) or NULL.
   - Directly casting `UUID` to `BIGINT` via `USING actor_id::text::BIGINT` in PostgreSQL will fail with: `ERROR: invalid input syntax for type bigint: "..."`.
   - Therefore, the migration MUST conditionally cast only numeric string representations (e.g. `actor_id::text ~ '^[0-9]+$'`) to `BIGINT`, and set all non-numeric UUIDs to `NULL`.

4. **Making `OrderService.updateOrderStatus` Authoritative**:
   - Dropping `trg_orders_status_history` and `log_order_status_transition()` in migration `V13` completely removes database-level trigger interference.
   - `OrderService.updateOrderStatus` already contains idempotency guards (`if (currentStatus == newStatus) return;`) and state transition validations (`currentStatus.canTransitionTo(newStatus)`).
   - By dropping the trigger, `OrderService` becomes the sole, authoritative creator of `OrderStatusHistory` rows, guaranteeing that exactly one record is persisted per valid transition with the authentic `Long actorId`.

5. **Resolving Admin Identity**:
   - In `AdminOrderController.updateOrderStatus`, `adminUser` is provided by Spring Security as `@AuthenticationPrincipal UserDetails adminUser`.
   - In real requests authenticated via `JwtAuthenticationFilter`, `adminUser` is an instance of `CustomUserDetails`.
   - `CustomUserDetails.getId()` directly provides the `Long` user ID.
   - For cases where `adminUser` is a mock or standard `UserDetails` (e.g., `@WithMockUser`), injecting `UserRepository` allows looking up the `User` by username/email to retrieve `user.getId()`.
   - This completely eliminates the need for MD5 UUID generation.

---

## 3. Caveats

1. **Test Environment (`application-test.properties`)**:
   - Backend tests use H2 in-memory database (`spring.datasource.url=jdbc:h2:mem:varellion_test;MODE=PostgreSQL...`) with `spring.jpa.hibernate.ddl-auto=create-drop` and `spring.flyway.enabled=false`.
   - H2 automatically maps Java `Long` to `BIGINT`.
   - The Flyway migration `V13` script executes in production / staging PostgreSQL environments, while H2 relies on Hibernate schema generation. Both must remain compatible.
2. **DTO Layer**:
   - `OrderStatusHistoryDto` does not currently expose `actorId` to frontend clients (it includes `historyId`, `previousStatus`, `newStatus`, `statusDisplayAr`, `statusDisplayEn`, `reason`, `createdAt`). This is intentional to prevent leaking internal administrative user IDs over public order timeline endpoints.
3. **No Other Callers of `setOrderStatus`**:
   - Inspection confirmed that `OrderService.java:473` is the only location in `src/main/java` where `order.setOrderStatus(...)` is invoked outside of initial order creation. There are no scheduled background jobs or other controllers that bypass `OrderService.updateOrderStatus`.

---

## 4. Conclusion & Concrete Implementation Blueprint

### 4.1 Required Changes Summary Table

| Component | Target File | Action Required |
|---|---|---|
| **Flyway Migration V13** | `backend/src/main/resources/db/migration/V13__fix_order_status_history_and_drop_trigger.sql` | 1. Drop trigger `trg_orders_status_history` and function `log_order_status_transition()`<br>2. Alter `actor_id` to `BIGINT` (converting non-numeric UUIDs to `NULL`)<br>3. Add foreign key `REFERENCES public.users(id) ON DELETE SET NULL`<br>4. Add index on `actor_id` |
| **JPA Entity** | `backend/src/main/java/com/varellion/store/order/entity/OrderStatusHistory.java` | Change `actorId` type from `UUID` to `Long` in field and `@Builder` constructor |
| **Service Layer** | `backend/src/main/java/com/varellion/store/order/service/OrderService.java` | 1. Change `updateOrderStatus(..., Long actorId)` parameter from `UUID` to `Long`<br>2. Change 3-arg overload to delegate with `(Long) null` |
| **Controller Layer** | `backend/src/main/java/com/varellion/store/admin/order/controller/AdminOrderController.java` | 1. Inject `UserRepository`<br>2. Replace `resolveActorUuid` with `resolveAdminActorId(UserDetails)` returning `Long`<br>3. Extract `customUserDetails.getId()` or lookup via `userRepository`<br>4. Pass `Long actorId` to `orderService.updateOrderStatus` |
| **Unit Tests** | `backend/src/test/java/com/varellion/store/order/service/OrderServiceTest.java` | Update `updateOrderStatus_SavesActorIdInHistory` test to use `Long actorId = 42L;` |
| **Integration Tests** | `backend/src/test/java/com/varellion/store/entity/JpaEntityMappingTest.java` | Change `.actorId(customer.getUserId())` at line 226 to `.actorId(1L)` |
| **Admin Controller Tests**| `backend/src/test/java/com/varellion/store/admin/order/controller/AdminOrderControllerTest.java` | Verify Mockito stubbing aligns with `Long` parameter |

---

### 4.2 Proposed Code Modifications

#### 1. Flyway Migration `V13__fix_order_status_history_and_drop_trigger.sql`
```sql
-- ============================================================================
-- VARELLION E-Commerce Database Migration
-- Migration: V13__fix_order_status_history_and_drop_trigger.sql
-- Description: Drop redundant order status history trigger and convert
--              actor_id from UUID to BIGINT with foreign key to public.users(id)
-- Database: PostgreSQL 15+ (Supabase)
-- ============================================================================

-- 1. Drop redundant trigger and trigger function on public.orders
DROP TRIGGER IF EXISTS trg_orders_status_history ON public.orders;
DROP FUNCTION IF EXISTS public.log_order_status_transition();

-- 2. Drop legacy foreign key constraint if it exists
ALTER TABLE public.order_status_history
    DROP CONSTRAINT IF EXISTS order_status_history_actor_id_fkey;

-- 3. Safely alter actor_id from UUID to BIGINT
-- Sets non-numeric legacy UUID values to NULL to prevent conversion errors
ALTER TABLE public.order_status_history
    ALTER COLUMN actor_id TYPE BIGINT
    USING (
        CASE
            WHEN actor_id IS NOT NULL AND actor_id::text ~ '^[0-9]+$' THEN actor_id::text::BIGINT
            ELSE NULL
        END
    );

-- 4. Add foreign key constraint referencing public.users(id) ON DELETE SET NULL
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_order_status_history_actor_id'
    ) THEN
        ALTER TABLE public.order_status_history
            ADD CONSTRAINT fk_order_status_history_actor_id
            FOREIGN KEY (actor_id) REFERENCES public.users(id)
            ON DELETE SET NULL;
    END IF;
END $$;

-- 5. Add index on actor_id for join and lookup performance
CREATE INDEX IF NOT EXISTS idx_order_status_history_actor_id
    ON public.order_status_history(actor_id);
```

#### 2. `OrderStatusHistory.java`
```java
// BEFORE (Lines 41-43, 52-60)
    @Column(name = "actor_id")
    private UUID actorId;

    @Builder
    public OrderStatusHistory(UUID historyId, Order order, String previousStatus, String newStatus, String reason, UUID actorId, OffsetDateTime createdAt) {
        ...
        this.actorId = actorId;
        ...
    }

// AFTER
    @Column(name = "actor_id")
    private Long actorId;

    @Builder
    public OrderStatusHistory(UUID historyId, Order order, String previousStatus, String newStatus, String reason, Long actorId, OffsetDateTime createdAt) {
        ...
        this.actorId = actorId;
        ...
    }
```

#### 3. `OrderService.java`
```java
// BEFORE (Lines 436-440, 451)
    @Transactional
    public OrderResponseDto updateOrderStatus(String orderNumber, OrderStatus newStatus, String reason) {
        return updateOrderStatus(orderNumber, newStatus, reason, (UUID) null);
    }

    @Transactional
    public OrderResponseDto updateOrderStatus(String orderNumber, OrderStatus newStatus, String reason, UUID actorId) {

// AFTER
    @Transactional
    public OrderResponseDto updateOrderStatus(String orderNumber, OrderStatus newStatus, String reason) {
        return updateOrderStatus(orderNumber, newStatus, reason, (Long) null);
    }

    @Transactional
    public OrderResponseDto updateOrderStatus(String orderNumber, OrderStatus newStatus, String reason, Long actorId) {
```

#### 4. `AdminOrderController.java`
```java
// Inject UserRepository:
    private final OrderService orderService;
    private final UserRepository userRepository;

// In updateOrderStatus:
    @PutMapping("/{orderNumber}/status")
    public ResponseEntity<ApiResponse<OrderResponseDto>> updateOrderStatus(
            @PathVariable
            @Pattern(regexp = "^VAR-\\d{8}-\\d{4}$", message = "صيغة رقم الطلب غير صحيحة")
            String orderNumber,
            @Valid @RequestBody UpdateOrderStatusRequest request,
            @AuthenticationPrincipal UserDetails adminUser
    ) {
        Long actorId = resolveAdminActorId(adminUser);
        log.info("Admin [{}] (ID: {}) changed status of order [{}] to [{}] - Reason: {}",
                adminUser != null ? adminUser.getUsername() : "SYSTEM",
                actorId, orderNumber, request.getNewStatus(), request.getReason());

        OrderResponseDto updated = orderService.updateOrderStatus(
                orderNumber,
                request.getNewStatus(),
                request.getReason(),
                actorId
        );
        return ResponseEntity.ok(ApiResponse.success("تم تحديث حالة الطلب بنجاح", updated));
    }

    private Long resolveAdminActorId(UserDetails adminUser) {
        if (adminUser == null) {
            return null;
        }
        if (adminUser instanceof CustomUserDetails customUserDetails) {
            return customUserDetails.getId();
        }
        return userRepository.findByUsername(adminUser.getUsername())
                .or(() -> userRepository.findByEmail(adminUser.getUsername()))
                .map(User::getId)
                .orElse(null);
    }
```

#### 5. `OrderServiceTest.java`
```java
// Line 307:
    @Test
    @DisplayName("updateOrderStatus: Saves actorId in OrderStatusHistory when provided")
    void updateOrderStatus_SavesActorIdInHistory() {
        Long actorId = 42L;
        when(orderRepository.findByOrderNumberWithDetails("VAR-20261028-0001"))
                .thenReturn(Optional.of(sampleOrder));
        when(orderRepository.save(any(Order.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        OrderResponseDto dto = orderService.updateOrderStatus(
                "VAR-20261028-0001",
                OrderStatus.DELIVERED,
                "Delivered by courier",
                actorId
        );

        assertThat(dto.getOrderStatus()).isEqualTo(OrderStatus.DELIVERED);
        verify(orderRepository).save(any(Order.class));
        assertThat(sampleOrder.getStatusHistory()).anyMatch(h ->
                "DELIVERED".equals(h.getNewStatus()) && actorId.equals(h.getActorId()));
    }
```

#### 6. `JpaEntityMappingTest.java`
```java
// Line 226:
    OrderStatusHistory history = OrderStatusHistory.builder()
            .order(persistedOrder)
            .previousStatus(null)
            .newStatus(OrderStatus.PENDING_CUSTOMER_CONFIRMATION.name())
            .reason("Order created by customer via checkout")
            .actorId(1L)
            .build();
```

---

## 5. Verification Method

### 5.1 Test Execution
Execute the full test suite to verify compilation, JPA mapping, service logic, and controller endpoints:
```bash
mvn -f backend/pom.xml clean test
```

### 5.2 Specific Test Targets to Validate
- `mvn -f backend/pom.xml test -Dtest=OrderServiceTest` (verifies `updateOrderStatus` with `Long actorId`, idempotency, and history creation).
- `mvn -f backend/pom.xml test -Dtest=AdminOrderControllerTest` (verifies admin controller endpoint with `resolveAdminActorId`).
- `mvn -f backend/pom.xml test -Dtest=JpaEntityMappingTest` (verifies JPA entity persistence and mapping of `OrderStatusHistory.actorId` as `Long`).

### 5.3 Invalidation Conditions
This analysis would be invalidated if:
1. `OrderStatusHistory.actorId` was intended to support non-registered actors or string IDs (disproved by requirement R1 & R2 specifying `BIGINT` foreign key to `public.users(id)`).
2. Existing migrations V1–V12 were permitted to be modified (disproved by requirement R1 explicitly mandating new migration V13 without altering V1–V12).
3. The database trigger was intended to be retained (disproved by requirement R1 explicitly mandating dropping trigger `trg_orders_status_history` and function `log_order_status_transition()`).
