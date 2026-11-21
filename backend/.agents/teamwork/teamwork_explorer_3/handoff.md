# SEC-INV-01 Investigation Report: Concurrency, Double Restoration Protection Audit & Remediation Challenge Evaluation

**Auditor:** Explorer 3 (Teamwork)  
**Investigation Scope:** R3 — Concurrency & Double Restoration Protection Audit & R4 — Remediation Challenge Evaluation  
**Target Repository:** `/home/mohamed-saad/Desktop/BRAND`  
**Date of Audit:** 2026-11-17  
**Status:** Completed (Read-Only Analysis)  

---

## 1. Observation

Direct observations from static analysis of backend source code, entity mappings, database migration DDL, repository interfaces, controllers, and tests.

### 1.1 Entity Locking & Versioning Inspection
* **`Order` Entity:**
  * **File:** `backend/src/main/java/com/varellion/store/order/entity/Order.java`
  * **Lines 33–35:**
    ```java
    @Version
    @Column(name = "version", nullable = false)
    private Long version;
    ```
  * **Finding:** The `Order` entity explicitly implements JPA optimistic locking via the `@Version` annotation on a non-null `Long version` column.
* **`Product` Entity:**
  * **File:** `backend/src/main/java/com/varellion/store/catalog/entity/Product.java`
  * **Lines 21–78:**
    ```java
    @Entity
    @Table(name = "products", schema = "public")
    @Getter
    @Setter
    public class Product {
        @Id
        @GeneratedValue(strategy = GenerationType.UUID)
        @Column(name = "product_id", nullable = false, updatable = false)
        private UUID productId;
        ...
        @Column(name = "stock_quantity", nullable = false)
        private Integer stockQuantity = 0;

        @Column(name = "reserved_quantity", nullable = false)
        private Integer reservedQuantity = 0;
        ...
        @CreationTimestamp
        @Column(name = "created_at", nullable = false, updatable = false)
        private OffsetDateTime createdAt;

        @UpdateTimestamp
        @Column(name = "updated_at", nullable = false)
        private OffsetDateTime updatedAt;
    ```
  * **Finding:** The `Product` entity **DOES NOT** have a `@Version` field or annotation. Concurrency control on `Product` relies entirely on database locks or explicit application locking.
* **Related Entities (`OrderItem`, `OrderStatusHistory`, `Category`):**
  * `OrderItem` (`backend/src/main/java/com/varellion/store/order/entity/OrderItem.java`, lines 19–66): **NO `@Version` field**.
  * `OrderStatusHistory` (`backend/src/main/java/com/varellion/store/order/entity/OrderStatusHistory.java`, lines 17–47): **NO `@Version` field**.
  * `Category` (`backend/src/main/java/com/varellion/store/catalog/entity/Category.java`, lines 20–55): **NO `@Version` field**.

### 1.2 Pessimistic Lock Declarations & Usages
* **`ProductRepository.findByIdForUpdate()`:**
  * **File:** `backend/src/main/java/com/varellion/store/catalog/repository/ProductRepository.java`
  * **Lines 25–27:**
    ```java
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.productId = :productId")
    Optional<Product> findByIdForUpdate(@Param("productId") UUID productId);
    ```
  * **Usages in `OrderService`:**
    1. `OrderService.createOrder()` (`backend/src/main/java/com/varellion/store/order/service/OrderService.java`, line 172):
       ```java
       Product product = productRepository.findByIdForUpdate(itemReq.getProductId())
               .orElseThrow(() -> new ResourceNotFoundException("المنتج المطلوب غير موجود: " + itemReq.getProductId()));
       ```
    2. `OrderService.updateOrderStatus()` (`backend/src/main/java/com/varellion/store/order/service/OrderService.java`, line 524):
       ```java
       Product product = productRepository.findByIdForUpdate(prodId)
               .orElse(fallbackProducts.get(prodId));
       ```
* **`OrderRepository.findByOrderNumberWithDetailsForUpdate()` vs `findByOrderNumberWithDetails()`:**
  * **File:** `backend/src/main/java/com/varellion/store/order/repository/OrderRepository.java`
  * **Lines 23–28:**
    ```java
    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.items WHERE LOWER(o.orderNumber) = LOWER(:orderNumber)")
    Optional<Order> findByOrderNumberWithDetails(@Param("orderNumber") String orderNumber);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.items WHERE LOWER(o.orderNumber) = LOWER(:orderNumber)")
    Optional<Order> findByOrderNumberWithDetailsForUpdate(@Param("orderNumber") String orderNumber);
    ```
  * **Usage in `OrderService.updateOrderStatus()`:**
    * **File:** `backend/src/main/java/com/varellion/store/order/service/OrderService.java`
    * **Line 475:**
      ```java
      Order order = orderRepository.findByOrderNumberWithDetails(orderNumber.trim().toUpperCase())
              .orElseThrow(() -> new ResourceNotFoundException("لم نتمكن من العثور على الطلب رقم " + orderNumber));
      ```
    * **Finding:** In `OrderService.updateOrderStatus()`, the `Order` entity is queried using `findByOrderNumberWithDetails` (non-locking `SELECT`), **NOT** `findByOrderNumberWithDetailsForUpdate`! Therefore, **no pessimistic lock is acquired on the `Order` record** during status transitions; concurrency protection on `Order` is solely governed by optimistic locking (`@Version`).

### 1.3 Transaction Boundaries, Propagation, and Isolation
* **`OrderService.createOrder()`:**
  * **File:** `backend/src/main/java/com/varellion/store/order/service/OrderService.java`, line 145:
    ```java
    @Transactional
    public OrderResponseDto createOrder(String userEmail, CreateOrderRequest request) {
    ```
* **`OrderService.updateOrderStatus()`:**
  * **File:** `backend/src/main/java/com/varellion/store/order/service/OrderService.java`, lines 459 and 473:
    ```java
    @Transactional
    public OrderResponseDto updateOrderStatus(String orderNumber, OrderStatus newStatus, String reason) {
        return updateOrderStatus(orderNumber, newStatus, reason, (Long) null);
    }

    @Transactional
    public OrderResponseDto updateOrderStatus(String orderNumber, OrderStatus newStatus, String reason, Long actorId) {
    ```
* **Configuration & Defaults:**
  * No explicit propagation, isolation level, or rollback attributes are specified in `@Transactional`.
  * Under standard Spring Boot / Hibernate semantics:
    * `propagation`: `Propagation.REQUIRED` (default).
    * `isolation`: `Isolation.DEFAULT` (PostgreSQL default: `READ COMMITTED`).
    * `readOnly`: `false` (default).
    * `rollbackFor`: Default triggers rollback on unhandled `RuntimeException` and `Error`. Checked exceptions do not trigger rollback unless declared.

### 1.4 State Machine & Idempotency Guards
* **`OrderStatus.canTransitionTo()` Implementation:**
  * **File:** `backend/src/main/java/com/varellion/store/order/entity/OrderStatus.java`
  * **Lines 26–52:**
    ```java
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
    ```
* **Validation & Idempotency Handling in `updateOrderStatus()`:**
  * **File:** `backend/src/main/java/com/varellion/store/order/service/OrderService.java`
  * **Lines 480–493:**
    ```java
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
    ```
* **Idempotency Token / Request Deduplication Support:**
  * In `OrderController.createOrder` (`backend/.../OrderController.java`, lines 31–44): Uses `IdempotencyService.execute(idempotencyKey, ...)` backed by an in-memory `ConcurrentHashMap` with a 15-minute TTL.
  * In `AdminOrderController.updateOrderStatus` (`backend/.../AdminOrderController.java`, lines 88–108):
    ```java
    @PutMapping("/{orderNumber}/status")
    public ResponseEntity<ApiResponse<OrderResponseDto>> updateOrderStatus(
            @PathVariable
            @Pattern(regexp = "^VAR-\\d{8}-\\d{4}$", message = "صيغة رقم الطلب غير صحيحة")
            String orderNumber,
            @Valid @RequestBody UpdateOrderStatusRequest request,
            @AuthenticationPrincipal UserDetails adminUser
    )
    ```
    **Finding:** `AdminOrderController.updateOrderStatus` **DOES NOT** accept an `Idempotency-Key` header, has no token deduplication filter, and has no unique constraints on status transitions in table `order_status_history`. Idempotency is purely dependent on the in-memory check `if (currentStatus == newStatus)` against the fetched entity.

### 1.5 Inventory Mutation Code in `OrderService.updateOrderStatus()`
* **File:** `backend/src/main/java/com/varellion/store/order/service/OrderService.java`
* **Lines 495–540:**
  ```java
  // 3. Reconcile Inventory Stock & Reservations with Canonical Lock Ordering (Deadlock Prevention)
  if (order.getItems() != null && !order.getItems().isEmpty()) {
      boolean isReleasingReserved = (newStatus == OrderStatus.CANCELLED || newStatus == OrderStatus.EXPIRED);
      boolean isDeductingPhysical = (newStatus == OrderStatus.SHIPPED || newStatus == OrderStatus.DELIVERED);

      if ((isReleasingReserved || isDeductingPhysical)
              && currentStatus != OrderStatus.SHIPPED
              && currentStatus != OrderStatus.DELIVERY_FAILED
              && currentStatus != OrderStatus.DELIVERED) {

          // Aggregate quantities by productId and sort in natural ascending order (Deadlock Prevention)
          Map<UUID, Integer> productQuantities = new TreeMap<>();
          Map<UUID, Product> fallbackProducts = new HashMap<>();

          for (OrderItem item : order.getItems()) {
              if (item.getProduct() != null && item.getProduct().getProductId() != null) {
                  UUID prodId = item.getProduct().getProductId();
                  int qty = item.getQuantity() != null ? item.getQuantity() : 0;
                  if (qty > 0) {
                      productQuantities.merge(prodId, qty, Integer::sum);
                      fallbackProducts.putIfAbsent(prodId, item.getProduct());
                  }
              }
          }

          for (Map.Entry<UUID, Integer> entry : productQuantities.entrySet()) {
              UUID prodId = entry.getKey();
              int totalQty = entry.getValue();

              Product product = productRepository.findByIdForUpdate(prodId)
                      .orElse(fallbackProducts.get(prodId));

              if (product != null) {
                  int reserved = product.getReservedQuantity() != null ? product.getReservedQuantity() : 0;
                  product.setReservedQuantity(Math.max(0, reserved - totalQty));

                  if (isDeductingPhysical) {
                      int stock = product.getStockQuantity() != null ? product.getStockQuantity() : 0;
                      product.setStockQuantity(Math.max(0, stock - totalQty));
                  }

                  productRepository.save(product);
              }
          }
      }
  }
  ```
* **Key Observations on Inventory Reconcile Logic:**
  1. `isReleasingReserved` is `true` **ONLY** for `CANCELLED` or `EXPIRED`.
  2. `isDeductingPhysical` is `true` **ONLY** for `SHIPPED` or `DELIVERED`.
  3. Condition `(isReleasingReserved || isDeductingPhysical)` evaluates to **FALSE** when `newStatus == OrderStatus.RETURNED`.
  4. Condition `currentStatus != OrderStatus.SHIPPED && currentStatus != OrderStatus.DELIVERY_FAILED && currentStatus != OrderStatus.DELIVERED` ensures that if an order has already transitioned to `SHIPPED`, `DELIVERY_FAILED`, or `DELIVERED`, **no inventory block runs** upon subsequent transitions to `CANCELLED` or `RETURNED`.
  5. **Verdict on SEC-INV-01 existence:** When an order is shipped, physical stock is decremented via `stockQuantity - totalQty`. If the shipment later fails (`DELIVERY_FAILED`) or is returned (`RETURNED`), or cancelled after shipment (`SHIPPED -> CANCELLED`), **the code performs ZERO stock restoration**. `stockQuantity` remains permanently deducted.

### 1.6 Exception Handling & Rollback
* **File:** `backend/src/main/java/com/varellion/store/common/exception/GlobalExceptionHandler.java`
* **Lines 194–205:**
  ```java
  @ExceptionHandler({ObjectOptimisticLockingFailureException.class, OptimisticLockException.class})
  public ResponseEntity<ErrorResponse> handleOptimisticLockConflict(Exception ex, HttpServletRequest request) {
      log.warn("Optimistic lock conflict on path {}: {}", request.getRequestURI(), ex.getMessage());
      ErrorResponse error = ErrorResponse.builder()
              .timestamp(LocalDateTime.now())
              .status(HttpStatus.CONFLICT.value())
              .error("Conflict")
              .message("تم تعديل الطلب بواسطة جلسة أخرى، يرجى تحديث الصفحة والمحاولة مرة أخرى")
              .path(request.getRequestURI())
              .build();
      return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
  }
  ```

---

## 2. Logic Chain

### 2.1 Concurrency & Double Restoration Protection Audit

#### Step 1: Concurrency Protection on `Order` vs `Product`
* **Observation:** `Order.java:33-35` has `@Version private Long version;`. `Product.java:21-78` has **no `@Version`**.
* **Observation:** `OrderService.updateOrderStatus()` lines 475 calls `orderRepository.findByOrderNumberWithDetails(orderNumber)` (plain `SELECT`, no lock). In contrast, line 524 calls `productRepository.findByIdForUpdate(prodId)` (`PESSIMISTIC_WRITE`).
* **Deduction:**
  1. The `Order` row is **never locked pessimistically** in PostgreSQL during status transitions. Two concurrent requests can both read the exact same `Order` row with `version = N`.
  2. The `Product` row **is locked pessimistically** (`SELECT ... FOR UPDATE`) in ascending order of `productId`.
  3. If Request 1 and Request 2 both read `Order` with `version = N`, Request 1 acquires the row lock on `Product`, modifies the `Product`, updates `Order` (`version` increments from $N$ to $N+1$), and commits.
  4. When Request 2 unblocks from the `Product` row lock and attempts to flush changes to `Order`, Hibernate generates:
     ```sql
     UPDATE public.orders SET order_status = ?, version = N + 1, ... WHERE order_id = ? AND version = N;
     ```
     Because the row in PostgreSQL now has `version = N + 1`, the statement updates 0 rows.
  5. Hibernate immediately detects this and throws `jakarta.persistence.OptimisticLockException` (wrapped in Spring's `ObjectOptimisticLockingFailureException`).
  6. The exception triggers an immediate transaction rollback for Request 2. All uncommitted updates to `Product` performed in Request 2 are rolled back by PostgreSQL.
  7. `GlobalExceptionHandler` intercepts the exception and returns HTTP 409 Conflict.

#### Step 2: Analysis of Status Validation & Sequential Transitions
* **Observation:** `OrderStatus.canTransitionTo()` defines strict directed transitions. Terminal states (`DELIVERED`, `CANCELLED`, `EXPIRED`, `RETURNED`, `EXCHANGED`) return `false` for all target states (`OrderStatus.java:50`).
* **Observation:** In `updateOrderStatus()` (lines 481–484), if `currentStatus == newStatus`, it logs an idempotent no-op and returns immediately without invoking inventory reconciliation.
* **Observation:** If `currentStatus` is `CANCELLED` and a request attempts to transition to `RETURNED`, line 487 evaluates `currentStatus.canTransitionTo(newStatus)`: `CANCELLED.canTransitionTo(RETURNED)` is `false`. A `BusinessException` is thrown, returning HTTP 400 Bad Request.
* **Deduction:** Under sequential execution, double cancellation or double return calls are strictly neutralized:
  * Repeated identical calls (`CANCELLED -> CANCELLED` or `RETURNED -> RETURNED`) are caught by the idempotency check and return immediately (0 inventory changes).
  * Attempting to transition between terminal states (`CANCELLED -> RETURNED` or `RETURNED -> CANCELLED`) is rejected by `canTransitionTo()` (0 inventory changes).

#### Step 3: Race Condition Simulation: Two Concurrent Cancellation Requests
Consider Order `VAR-20261117-0001` in status `CONFIRMED` (`version = 0`), containing 1 item with Product `P1` (`productId = UUID_1`, `stockQuantity = 10`, `reservedQuantity = 2`, order quantity = 2).
Two administrative requests arrive simultaneously:
* **Request 1:** `PUT /api/admin/orders/VAR-20261117-0001/status` with `newStatus = CANCELLED`.
* **Request 2:** `PUT /api/admin/orders/VAR-20261117-0001/status` with `newStatus = CANCELLED`.

**Execution Interleaving Timeline:**
1. **$T_1$ (Req 1 & Req 2 Start):** Both initiate `@Transactional` contexts (TX1 and TX2) in PostgreSQL with `READ COMMITTED` isolation.
2. **$T_2$ (Order Fetch):**
   * TX1 executes `SELECT ... FROM orders o LEFT JOIN order_items ... WHERE LOWER(o.order_number) = ...;`. Reads `orderStatus = CONFIRMED`, `version = 0`.
   * TX2 executes same `SELECT`. Reads `orderStatus = CONFIRMED`, `version = 0`.
3. **$T_3$ (In-Memory Validation):**
   * TX1: `currentStatus` (`CONFIRMED`) $\neq$ `newStatus` (`CANCELLED`). `canTransitionTo(CANCELLED)` is `true`. `isReleasingReserved = true`.
   * TX2: `currentStatus` (`CONFIRMED`) $\neq$ `newStatus` (`CANCELLED`). `canTransitionTo(CANCELLED)` is `true`. `isReleasingReserved = true`.
4. **$T_4$ (Product Lock Acquisition):**
   * TX1 executes `SELECT ... FROM products WHERE product_id = UUID_1 FOR UPDATE;`.
   * PostgreSQL grants the exclusive row lock on `UUID_1` to TX1.
   * TX1 reads `reservedQuantity = 2`. Computes `Math.max(0, 2 - 2) = 0`. Sets `product.reservedQuantity = 0`.
   * TX2 reaches line 524 and executes `SELECT ... FROM products WHERE product_id = UUID_1 FOR UPDATE;`.
   * **PostgreSQL blocks TX2** because TX1 holds the lock on `UUID_1`. TX2 enters lock wait state.
5. **$T_5$ (TX1 Commit):**
   * TX1 mutates `order.setOrderStatus(CANCELLED)`.
   * TX1 appends `OrderStatusHistory` entry.
   * TX1 completes method execution. Spring transaction interceptor flushes and commits TX1:
     ```sql
     UPDATE public.products SET reserved_quantity = 0 WHERE product_id = 'UUID_1';
     INSERT INTO public.order_status_history (history_id, order_id, previous_status, new_status, ...) VALUES (...);
     UPDATE public.orders SET order_status = 'CANCELLED', version = 1, updated_at = NOW() WHERE order_id = '...' AND version = 0;
     COMMIT;
     ```
   * TX1 releases the row lock on `UUID_1`.
6. **$T_6$ (TX2 Resumes):**
   * TX2 unblocks and completes its `SELECT ... FOR UPDATE`.
   * Under PostgreSQL `READ COMMITTED`, the query re-reads the committed row version: `reservedQuantity = 0`.
   * TX2 computes `Math.max(0, 0 - 2) = 0`.
   * TX2 mutates `order.setOrderStatus(CANCELLED)`.
   * TX2 appends history entry.
7. **$T_7$ (TX2 Flush & Optimistic Locking Collision):**
   * TX2 completes method execution and attempts to commit:
     ```sql
     UPDATE public.products SET reserved_quantity = 0 WHERE product_id = 'UUID_1';
     INSERT INTO public.order_status_history ...;
     UPDATE public.orders SET order_status = 'CANCELLED', version = 1, updated_at = NOW() WHERE order_id = '...' AND version = 0;
     ```
   * **Collision:** In `public.orders`, `version` is already `1`. The `UPDATE` statement matches 0 rows (`rows affected = 0`).
   * Hibernate immediately throws `jakarta.persistence.OptimisticLockException` (wrapped in `ObjectOptimisticLockingFailureException`).
8. **$T_8$ (TX2 Rollback):**
   * PostgreSQL executes `ROLLBACK` for TX2.
   * All mutations from TX2 (including the product update and history insertion) are completely aborted and discarded.
   * `GlobalExceptionHandler` handles `ObjectOptimisticLockingFailureException` and responds to Request 2 with `HTTP 409 Conflict`.
9. **Final Result:**
   * Inventory `reservedQuantity` is decremented **exactly once** (from 2 to 0).
   * Double restoration / double release is **prevented by JPA `@Version` on `Order`**.

---

### 2.2 Remediation Challenge Evaluation

We critically evaluate the previously suggested naive remediation:
```java
product.setStockQuantity(stock + totalQty);
```
evaluated against the 8 architectural challenge points:

#### Challenge Point a: Courier-Rejected Shipment (Transit Return vs Lost/Damaged in Transit)
* **Context:** In Egyptian e-commerce, when a package cannot be delivered (customer refused delivery, phone unreachable after 3 attempts, invalid address), the shipment transitions to `DELIVERY_FAILED` or is initiated as a return.
* **Analysis:**
  * When an order was marked `SHIPPED`, physical goods departed the warehouse.
  * A courier return takes 3 to 14 days to physically travel back through the logistics carrier's hub network (e.g., Bosta, Aramex, Mylerz).
  * During transit, packages face material operational hazards: theft, courier loss, vehicle accidents, crushed packaging, or water damage.
  * **Evaluation of Naive Fix:** Adding `product.setStockQuantity(stock + totalQty);` immediately upon setting the order status to `DELIVERY_FAILED` or `RETURNED` makes that quantity immediately visible and purchasable on the storefront (`availableStock = stockQuantity - reservedQuantity`). If a second customer buys that stock, but the courier subsequently reports the package lost or damaged in transit, Varellion cannot fulfill the order, resulting in customer dissatisfaction, chargebacks, and commercial breach.

#### Challenge Point b: Customer Return After Delivery (Opened/Damaged/Used vs Resellable)
* **Context:** A customer receives luxury goods (`DELIVERED`) and subsequently exercises their statutory return rights within 14 days (Egyptian Consumer Protection Law No. 181/2018).
* **Analysis:**
  * The customer has unboxed the item. The product could be opened, handled, used, or modified.
  * Luxury accessories (watches, jewelry, premium sunglasses, leather goods) require pristine, factory-sealed presentation. If tags, protective plastic films, warranty booklets, or velvet packaging are missing or scratched, the item **cannot be resold as new**.
  * **Evaluation of Naive Fix:** Naively executing `product.setStockQuantity(stock + totalQty);` directly from the status update endpoint automatically puts opened/used luxury items back into brand-new sellable stock without verifying item condition.

#### Challenge Point c: Inspection Requirements (Need for Physical Verification Before Restock)
* **Context:** Restocking is a physical warehouse operation, whereas order status transitions are administrative/logistical status milestones.
* **Analysis:**
  * Restocking requires a dedicated Receiving & Quality Assurance (QA) workflow:
    1. Courier delivers returned package to the warehouse intake dock.
    2. Warehouse staff scans the tracking number / order number.
    3. Item is unboxed and inspected against an authenticity and condition rubric.
    4. Inspector issues a verdict: `PASS_RESELLABLE`, `FAIL_DAMAGED`, `FAIL_INCOMPLETE`, or `REFURBISH`.
    5. Only upon `PASS_RESELLABLE` does the warehouse management system (WMS) issue an inventory adjustment to `stockQuantity`.
  * **Evaluation of Naive Fix:** Tying inventory restoration directly to `updateOrderStatus()` completely bypasses physical verification. Our repository-wide search confirms that **no inspection or QA entities or workflows exist** in the codebase. Injecting an automatic restock into `updateOrderStatus` couples administrative status to digital inventory inflation before physical receipt.

#### Challenge Point d: Damaged Goods (Accounting for Unsellable Returns Without Inflating Sellable Stock)
* **Context:** Damaged or defective returns must be quarantined, repaired, returned to the supplier (vendor RMA), or written off as inventory shrinkage.
* **Analysis:**
  * `Product` has only two quantity columns: `stockQuantity` (which directly dictates storefront sellable inventory) and `reservedQuantity`.
  * The database contains **no quarantine stock column**, **no damaged stock bucket**, and **no scrap/write-off table**.
  * If a damaged product is returned and `setStockQuantity(stock + totalQty)` is called, the damaged units are added directly into `stockQuantity`.
  * When another customer orders the product, warehouse pickers will either ship the damaged item (triggering a second return) or find it unfulfillable (creating an inventory discrepancy).
  * Furthermore, company financial accounting is distorted: cost of goods sold (COGS) and inventory asset valuations on the balance sheet will reflect damaged goods as pristine assets.

#### Challenge Point e: Potential Double Restoration (Replay Attacks, Repeated API Calls, Race Conditions)
* **Context:** Administrative status updates could be invoked repeatedly via network retries, browser reloads, automated webhooks, or multi-tab admin operations.
* **Analysis:**
  * `AdminOrderController.updateOrderStatus()` accepts no `Idempotency-Key` and has no deduplication tokens.
  * In `OrderStatus.java`:
    * `SHIPPED -> DELIVERY_FAILED` is valid.
    * `DELIVERY_FAILED -> SHIPPED` is valid (retry delivery).
    * `SHIPPED -> DELIVERY_FAILED` is valid again.
    * `DELIVERY_FAILED -> RETURNED` is valid.
  * If status-based stock restoration is added naively without strict transition guards:
    * Cycle 1: `SHIPPED -> DELIVERY_FAILED` $\rightarrow$ stock restored ($+Q$).
    * Cycle 2: `DELIVERY_FAILED -> SHIPPED` $\rightarrow$ stock deducted ($-Q$).
    * Cycle 3: `SHIPPED -> DELIVERY_FAILED` $\rightarrow$ stock restored again ($+Q$).
    * If any transition guard has a slight gap (e.g., if re-delivery does not deduct because `currentStatus == DELIVERY_FAILED` is excluded by line 502), stock will be restored multiple times for a single order!
  * In the existing code, line 501:
    ```java
    && currentStatus != OrderStatus.SHIPPED
    && currentStatus != OrderStatus.DELIVERY_FAILED
    && currentStatus != OrderStatus.DELIVERED
    ```
    This explicit check was originally placed to prevent double deduction, but it demonstrates how intricate and error-prone boolean state guards become when attempting to manage physical inventory transitions through simple status flags.

#### Challenge Point f: Preserving `reserved_quantity` Invariants
* **Context:** The database schema enforces strict relational check constraints (`chk_stock_available`):
  ```sql
  CONSTRAINT chk_stock_available CHECK (reserved_quantity <= stock_quantity)
  CHECK (stock_quantity >= 0)
  CHECK (reserved_quantity >= 0)
  ```
* **Analysis:**
  * In Varellion's inventory model:
    $$\text{Available Stock} = \text{stockQuantity} - \text{reservedQuantity}$$
  * Operations prior to shipping:
    * Order placed: `reservedQuantity += Q`, `stockQuantity` unchanged.
    * Pre-shipment cancellation (`CONFIRMED -> CANCELLED`): `reservedQuantity -= Q`. `stockQuantity` was never deducted, so it must **NOT** be touched!
  * If the naive remediation `product.setStockQuantity(stock + totalQty)` were applied indiscriminately to cancellation:
    * When an unfulfilled order is cancelled, `reservedQuantity` is released, and `stockQuantity` would be incremented by $Q$!
    * Result: The store miraculously gains $Q$ phantom units of stock out of thin air every time an unfulfilled order is cancelled!
  * Conversely, for post-shipment returns (`SHIPPED -> RETURNED`):
    * At shipment, `reservedQuantity` was already decremented to 0, and `stockQuantity` was decremented by $Q$.
    * If an uncoordinated restoration attempts to adjust both quantities without checking shipment state, it risks violating `reserved_quantity <= stock_quantity` or causing negative reservation values.

#### Challenge Point g: Dedicated Inventory Movement Records
* **Context:** Professional inventory systems operate as double-entry accounting ledgers.
* **Analysis:**
  * Mutating a raw counter in `products.stock_quantity` without an immutable ledger entry violates basic accounting auditability.
  * If a store administrator or auditor investigates why a product has 8 units instead of 10, a naked update statement provides zero forensic history:
    * Was it a return restock?
    * Was it an administrative manual correction?
    * Was it an uncancelled ghost order?
    * Who authorized the stock increase?
  * Migration `V14__admin_system_expansion.sql` (documented in `docs/admin/07-DATABASE-IMPACT-ANALYSIS.md`) explicitly identified the need for an `inventory_movements` table (`movement_id`, `product_id`, `order_id`, `movement_type`, `quantity_delta`, `actor_id`, `created_at`). However, this migration is **PLANNING ONLY** and does not exist in the active database.
  * Adding `product.setStockQuantity(stock + totalQty);` perpetuates naked, untraced stock mutations.

#### Challenge Point h: Deterministic Locking and Transactional Atomicity
* **Context:** Multi-item orders and concurrent inventory adjustments can cause database deadlocks if locking order is not deterministic.
* **Analysis:**
  * When an order with multiple items is cancelled or returned, multiple product rows must be locked and updated.
  * If Transaction 1 processes Order 1 (Item A, Item B) and Transaction 2 processes Order 2 (Item B, Item A):
    * If locking is unordered, TX1 locks A and waits for B, while TX2 locks B and waits for A, causing a PostgreSQL database deadlock (`DeadlockLoserDataAccessException`).
  * In `OrderService.java` (lines 506 and 520), the author correctly introduced a `TreeMap<UUID, Integer>` to sort product UUIDs in ascending natural order prior to acquiring `productRepository.findByIdForUpdate(prodId)`.
  * Any restock remediation **must strictly adhere** to this ascending `TreeMap` lock ordering.
  * Furthermore, atomicity dictates that if restock fails for Product B (e.g., constraint violation or DB failure), the status transition and Product A's restock must roll back completely. Placing arbitrary stock setters outside this sorted lock block or in uncoordinated helper methods would break deadlock safety and transactional atomicity.

---

## 3. Caveats

1. **Read-Only Scope:** No unit or integration tests were executed against a live database during this audit, adhering strictly to the non-destructive exploration constraints. All findings are derived from static source code inspection, Flyway DDL specifications, and existing test suite documentation (`TEST_REPORT.md`).
2. **Current Database Schema:** Flyway migrations up to `V7` are active in the database. Architectural documents (`docs/admin/07-DATABASE-IMPACT-ANALYSIS.md`) mention proposed migrations `V12` and `V14`, but verification of the filesystem confirms that `V14` is strictly a design proposal and is not present in `backend/src/main/resources/db/migration/`.
3. **Absence of Courier Integration:** The repository does not currently contain automated webhooks or REST integrations with third-party Egyptian shipping carriers (Bosta, Aramex). All delivery and failure transitions are currently triggered manually by administrators via `PUT /api/admin/orders/{orderNumber}/status`.

---

## 4. Conclusion

1. **Defect SEC-INV-01 Verification:**
   * **Confirmed:** The defect is **REAL** in the current codebase. When an order transitions to `SHIPPED`, physical stock is deducted (`OrderService.java:533`). If that shipment subsequently fails (`DELIVERY_FAILED`), is returned (`RETURNED`), or is cancelled after dispatch (`SHIPPED -> CANCELLED`), the current code performs **no stock restoration whatsoever**. Physical inventory remains permanently deducted.
2. **Concurrency & Double Restoration Protection Findings:**
   * Double restoration under concurrent requests for the same order transition is **fully prevented** by JPA `@Version` optimistic locking on `Order.java:33-35`.
   * When two concurrent transactions attempt the same transition, both acquire `PESSIMISTIC_WRITE` locks on products in deterministic ascending order (`TreeMap`). The first transaction to commit increments `Order.version`. The second transaction unblocks, executes, but fails at flush/commit time with `OptimisticLockException`, which triggers a complete transaction rollback and returns HTTP 409 Conflict.
   * However, `AdminOrderController` lacks request-level idempotency (`Idempotency-Key`), leaving administrative operations reliant solely on in-memory entity status checks.
3. **Evaluation of the Naive Remediation (`product.setStockQuantity(stock + totalQty);`):**
   * The naive remediation is **REJECTED AS ARCHITECTURALLY UNSOUND AND DANGEROUS**.
   * It fails across all 8 challenge dimensions:
     * Risks phantom stock on courier returns lost or delayed in transit.
     * Restocks used/opened customer returns as new, harming luxury brand reputation.
     * Completely bypasses physical warehouse QA and inspection.
     * Conflates damaged goods with sellable inventory, corrupting inventory valuation.
     * Inflates sellable stock on pre-shipment cancellations (where physical stock was never deducted).
     * Violates basic inventory accounting principles by lacking immutable movement ledger records.
4. **Minimal Safe Remediation Strategy (Architectural Recommendation):**
   * **Do NOT** automatically add returned goods to `products.stock_quantity` in `OrderService.updateOrderStatus()`.
   * **Phase 1 (Immediate Administrative Workflow):**
     * Keep `OrderService.updateOrderStatus()` focused strictly on order lifecycle states (`SHIPPED -> DELIVERY_FAILED -> RETURNED`).
     * Require warehouse personnel to perform physical intake and manual stock reconciliation via the existing `AdminProductService.updateProduct()` endpoint after goods are physically inspected and certified as pristine.
   * **Phase 2 (Target Architecture):**
     * Implement `inventory_movements` ledger table (per proposed migration `V14`).
     * Introduce a dedicated restocking endpoint (e.g., `POST /api/admin/orders/{orderNumber}/restock`) that accepts inspection results (`condition: RESELLABLE | DAMAGED | SCRAP`), records the actor and movement ledger entry, and deterministically locks and updates `stockQuantity` with sorted pessimistic locking.

---

## 5. Verification Method

Independent verification of the claims in this report can be conducted through the following steps without running destructive database operations:

1. **Verify Entity `@Version` Annotations:**
   * Inspect `backend/src/main/java/com/varellion/store/order/entity/Order.java`, lines 33–35: Confirm `@Version` annotation on `version` field.
   * Inspect `backend/src/main/java/com/varellion/store/catalog/entity/Product.java`, lines 21–78: Confirm absence of `@Version` annotation.
2. **Verify Pessimistic Lock Declarations & Usages:**
   * Inspect `backend/src/main/java/com/varellion/store/catalog/repository/ProductRepository.java`, lines 25–27: Confirm `findByIdForUpdate` has `@Lock(LockModeType.PESSIMISTIC_WRITE)`.
   * Inspect `backend/src/main/java/com/varellion/store/order/repository/OrderRepository.java`, lines 23–28: Confirm `findByOrderNumberWithDetailsForUpdate` exists with `@Lock(LockModeType.PESSIMISTIC_WRITE)`, but line 475 of `OrderService.java` calls `findByOrderNumberWithDetails` (non-locking).
3. **Verify Absence of Restock in `updateOrderStatus`:**
   * Inspect `backend/src/main/java/com/varellion/store/order/service/OrderService.java`, lines 496–540: Confirm that `isReleasingReserved` and `isDeductingPhysical` are false for `OrderStatus.RETURNED` and `OrderStatus.DELIVERY_FAILED`, proving that zero inventory mutation code executes for returns.
4. **Verify Deadlock Prevention & Canonical Sort Order:**
   * Inspect `backend/src/main/java/com/varellion/store/order/service/OrderService.java`, lines 506 and 520: Confirm that `TreeMap<UUID, Integer>` sorts product IDs in ascending natural order before calling `productRepository.findByIdForUpdate`.
5. **Verify Optimistic Lock Conflict Handling:**
   * Inspect `backend/src/main/java/com/varellion/store/common/exception/GlobalExceptionHandler.java`, lines 194–205: Confirm that `ObjectOptimisticLockingFailureException` and `OptimisticLockException` are handled and mapped to `HttpStatus.CONFLICT` (409).
6. **Verify Non-Existence of Quarantine / Inspection Tables:**
   * Inspect `backend/src/main/resources/db/migration/` and `docs/database/DATABASE_SCHEMA.md`: Confirm that no tables or entities exist for `quarantine`, `inspections`, `damaged_goods`, or `inventory_movements`.
