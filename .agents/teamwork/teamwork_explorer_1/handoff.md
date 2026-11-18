# Investigation Report: SEC-INV-01 Inventory Consistency Defect Code Audit

**Milestone**: R1 - Independent Code Audit & Repository-Wide Inventory Mutation Search  
**Investigator**: Explorer 1  
**Target Repository**: VARELLION E-Commerce Platform  
**Investigation Date**: 2026-11-17  
**Integrity Mode**: Read-Only (Zero Code/Database/Git Modifications)

---

## Executive Summary

An exhaustive, read-only code audit and repository-wide search was conducted across the backend Spring Boot services, repositories, controllers, database migrations, frontend Next.js application, and test suites to verify the reported **SEC-INV-01 inventory consistency defect**.

### Core Verdict
1. **SEC-INV-01 Defect is CONFIRMED**: The defect is real and demonstrable in static code. In `OrderService.updateOrderStatus()`, physical stock (`product.stockQuantity`) is decremented when an order transitions to `SHIPPED`. However, when an order transitions from `SHIPPED` or `DELIVERY_FAILED` to `CANCELLED` or `RETURNED`, the inventory reconciliation logic is completely bypassed (`OrderService.java:500-503`). Consequently, physical inventory is permanently deducted from the database, creating a cumulative inventory leak where physical warehouse items are missing from catalog availability.
2. **Zero Alternative Restoration Mechanisms Exist**: A complete repository-wide audit confirms that **NO** background scheduler, message queue, event listener, database trigger, or supplementary service restores inventory upon cancellation, return, or delivery failure.
3. **Post-Delivery Return Path is Blocked**: Transition from `DELIVERED` to `RETURNED` is strictly forbidden by `OrderStatus.canTransitionTo()` (`OrderStatus.java:50`) and rejected with a 400 `BusinessException`, leaving customer returns after delivery impossible to process in the domain state machine, despite the store's public 14-day return policy.
4. **Naive Remediation is Defective**: The previously suggested quick patch (`product.setStockQuantity(stock + totalQty)`) is fundamentally unsafe because it conflates uninspected, potentially damaged, or courier-in-transit returned items directly with sellable available stock, lacks an inspection/quarantine workflow, and bypasses dedicated inventory movement audit trails.

---

## 1. Observation

### 1.1 Complete Implementation of Core Domain Components

#### 1.1.1 `OrderStatus.java` and `canTransitionTo()`
- **File**: `backend/src/main/java/com/varellion/store/order/entity/OrderStatus.java`
- **Verified Lines**: 6–53
- **Verbatim Code Excerpt**:
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
    EXCHANGED;

    /**
     * Determines whether transitioning from this status to the given target status is valid.
     * Prevents transitions from terminal states (DELIVERED, CANCELLED, EXPIRED, RETURNED, EXCHANGED),
     * self-transitions (handled via idempotency), and illogical backward transitions.
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
**Key Observations**:
- Allowed transitions from `SHIPPED`: `DELIVERED`, `DELIVERY_FAILED`, `RETURNED`, `CANCELLED`.
- Allowed transitions from `DELIVERY_FAILED`: `SHIPPED`, `DELIVERED`, `RETURNED`, `CANCELLED`.
- `DELIVERED` is classified as a terminal state (`case DELIVERED, CANCELLED, EXPIRED, RETURNED, EXCHANGED -> false;`). Therefore, `DELIVERED -> RETURNED` returns `false`.

---

#### 1.1.2 `Product` Entity Inventory Fields & Concurrency Annotations
- **File**: `backend/src/main/java/com/varellion/store/catalog/entity/Product.java`
- **Verified Lines**: 21–73
- **Verbatim Code Excerpt**:
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

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(name = "name_ar", nullable = false)
    private String nameAr;

    @Column(name = "name_en", nullable = false)
    private String nameEn;

    @Column(name = "description_ar")
    private String descriptionAr;

    @Column(name = "description_en")
    private String descriptionEn;

    @Column(name = "price", nullable = false, precision = 10, scale = 2)
    private BigDecimal price = BigDecimal.ZERO;

    @Column(name = "cost_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal costPrice = BigDecimal.ZERO;

    @Column(name = "stock_quantity", nullable = false)
    private Integer stockQuantity = 0;

    @Column(name = "reserved_quantity", nullable = false)
    private Integer reservedQuantity = 0;

    @Column(name = "sku", length = 100)
    private String sku;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
```
**Key Observations**:
- `Product` has exactly two inventory fields: `stockQuantity` (Integer) and `reservedQuantity` (Integer).
- **CRITICAL**: `Product` does **NOT** declare a `@Version` field. There is no optimistic locking annotation on `Product`.
- Database table constraint in `V3__create_product_inventory_and_movements.sql:23`:
  `ALTER TABLE public.products ADD CONSTRAINT chk_stock_available CHECK (reserved_quantity <= stock_quantity);`
  with column constraints `CHECK (stock_quantity >= 0)` and `CHECK (reserved_quantity >= 0)`.

---

#### 1.1.3 `ProductRepository.findByIdForUpdate()`
- **File**: `backend/src/main/java/com/varellion/store/catalog/repository/ProductRepository.java`
- **Verified Lines**: 25–27, 107–108
- **Verbatim Code Excerpt**:
```java
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.productId = :productId")
    Optional<Product> findByIdForUpdate(@Param("productId") UUID productId);
...
    @Query("SELECT COUNT(p) FROM Product p WHERE (p.stockQuantity - p.reservedQuantity) <= :threshold AND p.isActive = true")
    long countLowStockProducts(@Param("threshold") int threshold);
```
**Key Observations**:
- Pessimistic write locking (`LockModeType.PESSIMISTIC_WRITE`) executes `SELECT ... FOR UPDATE` in PostgreSQL to serialize concurrent access to product rows.
- Line 107 defines available stock formula: `p.stockQuantity - p.reservedQuantity`.

---

#### 1.1.4 `OrderItem` Entity
- **File**: `backend/src/main/java/com/varellion/store/order/entity/OrderItem.java`
- **Verified Lines**: 27–66
- **Verbatim Code Excerpt**:
```java
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "order_item_id", nullable = false, updatable = false)
    private UUID orderItemId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    @Column(name = "product_name_ar", nullable = false)
    private String productNameAr;

    @Column(name = "product_name_en", nullable = false)
    private String productNameEn;

    @Column(name = "sku", nullable = false, length = 100)
    private String sku;

    @Column(name = "unit_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "unit_cost", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitCost = BigDecimal.ZERO;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "line_total", nullable = false, precision = 10, scale = 2)
    private BigDecimal lineTotal;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
```
**Key Observations**:
- `OrderItem` maintains an immutable snapshot of `quantity`, `unit_price`, and `unit_cost`, alongside a foreign key reference to `product_id`.

---

#### 1.1.5 `Order` Entity Concurrency & Status Tracking
- **File**: `backend/src/main/java/com/varellion/store/order/entity/Order.java`
- **Verified Lines**: 33–36, 74–77
- **Verbatim Code Excerpt**:
```java
    @Version
    @Column(name = "version", nullable = false)
    private Long version;
...
    @Enumerated(EnumType.STRING)
    @Column(name = "order_status", nullable = false, length = 50)
    private OrderStatus orderStatus = OrderStatus.PENDING_CUSTOMER_CONFIRMATION;
```
**Key Observations**:
- `Order` HAS optimistic locking (`@Version Long version`).
- `OrderRepository.findByOrderNumberWithDetailsForUpdate` exists (`OrderRepository.java:28`), but `OrderService.updateOrderStatus` calls the non-locking query `findByOrderNumberWithDetails` (`OrderService.java:475`), relying on `@Version` on `Order`.

---

#### 1.1.6 `OrderService.updateOrderStatus()`
- **File**: `backend/src/main/java/com/varellion/store/order/service/OrderService.java`
- **Verified Lines**: 464–560
- **Verbatim Code Excerpt**:
```java
    @Transactional
    public OrderResponseDto updateOrderStatus(String orderNumber, OrderStatus newStatus, String reason, Long actorId) {
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

        // 4. Apply state transition
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

---

### 1.2 Repository-Wide Inventory Mutation Search

An audit across the entire repository for every method modifying or inspecting stock revealed:

| File Path & Line | Method / Scope | Exact Code Excerpt | Inventory Effect |
|---|---|---|---|
| `OrderService.java:187` | `createOrder()` | `product.setReservedQuantity((product.getReservedQuantity() != null ? product.getReservedQuantity() : 0) + itemReq.getQuantity());` | **Increment Reservation**: When order placed, increments `reservedQuantity`. `stockQuantity` untouched. |
| `OrderService.java:529` | `updateOrderStatus()` | `product.setReservedQuantity(Math.max(0, reserved - totalQty));` | **Release / Decrement Reservation**: Releases reserved stock if `CANCELLED` / `EXPIRED`, or clears reservation if `SHIPPED`. |
| `OrderService.java:533` | `updateOrderStatus()` | `product.setStockQuantity(Math.max(0, stock - totalQty));` | **Deduct Physical Stock**: Decrements physical stock ONLY when `isDeductingPhysical` is true (`SHIPPED` / `DELIVERED`). |
| `AdminProductService.java:142-143` | `createProduct()` | `.stockQuantity(request.getStockQuantity())` <br> `.reservedQuantity(0)` | **Initial Stock Setup**: Admin manual catalog creation. |
| `AdminProductService.java:210` | `updateProduct()` | `product.setStockQuantity(request.getStockQuantity());` | **Admin Manual Override**: Direct catalog stock correction by admin. |
| `ProductService.java:117` | `toDto()` | `int available = Math.max(0, stock - reserved);` | **Read-Only**: Catalog available stock calculation. |
| `CartService.java:205` | `calculateAvailableStock()` | `return Math.max(0, stock - reserved);` | **Read-Only**: Cart available stock validation. |
| `ProductRepository.java:107` | `countLowStockProducts()` | `WHERE (p.stockQuantity - p.reservedQuantity) <= :threshold` | **Read-Only**: Admin dashboard low-stock count query. |

**Zero Stock Restoration Calls Found**: Outside of manual admin catalog editing in `AdminProductService.java:210`, there is **NOT A SINGLE LINE OF CODE** in the entire codebase that calls `setStockQuantity()` to increment stock or restore returned items.

---

### 1.3 Audit of Existing Tests

#### 1.3.1 `OrderServiceTest.java`
- Lines 348–367: `updateOrderStatus_ReleasesReservedStock_WhenTransitioningToCancelled` verifies that transitioning from `CONFIRMED` to `CANCELLED` sets `reservedQuantity` to 0. (Physical stock was never deducted, so it doesn't test restoration).
- Lines 392–412: `updateOrderStatus_DeductsPhysicalAndReservedStock_WhenTransitioningToShipped` verifies that transitioning from `CONFIRMED` to `SHIPPED` deducts `stockQuantity` (10 to 8) and `reservedQuantity` (2 to 0).
- Lines 415–431: `updateOrderStatus_DoesNotDoubleDeduct_WhenTransitioningFromShippedToDelivered` verifies that transitioning from `SHIPPED` to `DELIVERED` does not re-deduct physical stock.
- Lines 454–470: `updateOrderStatus_ThrowsBusinessException_WhenTerminalState` verifies that transitioning out of `DELIVERED` throws `BusinessException`.
- **TEST GAPS**: There are **ZERO** tests in `OrderServiceTest.java` or anywhere else that test or assert stock behavior when transitioning:
  - `SHIPPED -> CANCELLED`
  - `SHIPPED -> RETURNED`
  - `DELIVERY_FAILED -> CANCELLED`
  - `DELIVERY_FAILED -> RETURNED`

#### 1.3.2 Concurrency & Integration Tests
- `OrderConcurrencyDeadlockIntegrationTest.java:48–221`: Tests concurrent status transitions of two orders to `SHIPPED` using `ExecutorService`. Verifies deadlock avoidance via sorted `TreeMap` locks and verifies physical deduction (100 -> 90). Does not test cancellation or return concurrency.

---

## 2. Logic Chain

### 2.1 Trace of Inventory Across the Order Lifecycle

Let $S$ = Physical Stock (`stock_quantity`), $R$ = Reserved Stock (`reserved_quantity`), and $A = S - R$ = Available Sellable Stock.

```
Initial State: S = 10, R = 0, A = 10
  │
  ├─> [Order Placement (CreateOrderRequest for 2 units)]
  │   - OrderService.java:187: product.setReservedQuantity(0 + 2) = 2
  │   - S = 10, R = 2, A = 8
  │
  ├─> [Order Confirmed / Preparing]
  │   - OrderService.java:497-503: isReleasingReserved=false, isDeductingPhysical=false
  │   - Guard bypassed. S = 10, R = 2, A = 8
  │
  ├─> [Order Shipped (SHIPPED)]
  │   - OrderService.java:498: isDeductingPhysical = true
  │   - OrderService.java:500-503: currentStatus == PREPARING (not SHIPPED/DELIVERY_FAILED/DELIVERED) -> Guard PASSES
  │   - OrderService.java:529: product.setReservedQuantity(max(0, 2 - 2)) = 0
  │   - OrderService.java:533: product.setStockQuantity(max(0, 10 - 2)) = 8
  │   - S = 8, R = 0, A = 8
  │
  ├─> Branch 1: [Delivery Succeeded (DELIVERED)]
  │   - OrderService.java:501: currentStatus == SHIPPED -> Guard FAILS
  │   - S = 8, R = 0, A = 8 (Correct, customer has received the 2 units)
  │
  ├─> Branch 2: [Delivery Failed (DELIVERY_FAILED)]
  │   - OrderService.java:497-498: isReleasingReserved=false, isDeductingPhysical=false
  │   - Guard FAILS. Inventory unchanged.
  │   - S = 8, R = 0, A = 8 (Items physically on courier van)
  │
  ├─> Branch 3: [Cancellation After Shipment (SHIPPED -> CANCELLED)]
  │   - OrderStatus.java:43: SHIPPED -> CANCELLED is legally permitted by state machine
  │   - OrderService.java:497: isReleasingReserved = true
  │   - OrderService.java:501: currentStatus != OrderStatus.SHIPPED evaluates to FALSE!
  │   - Entire inventory reconciliation block (lines 500-540) is SKIPPED!
  │   - S = 8, R = 0, A = 8
  │   - **DEFECT MANIFESTATION**: The order is CANCELLED, but physical stock remains 8 instead of returning to 10.
  │
  ├─> Branch 4: [Return After Shipment (SHIPPED -> RETURNED)]
  │   - OrderStatus.java:43: SHIPPED -> RETURNED is legally permitted
  │   - OrderService.java:497-498: isReleasingReserved=false, isDeductingPhysical=false
  │   - Guard (isReleasingReserved || isDeductingPhysical) evaluates to FALSE!
  │   - Reconciliation block is SKIPPED!
  │   - S = 8, R = 0, A = 8
  │   - **DEFECT MANIFESTATION**: The package is RETURNED to merchant, but stock remains 8 instead of 10.
  │
  └─> Branch 5: [Delivery Failed then Cancelled / Returned (DELIVERY_FAILED -> CANCELLED / RETURNED)]
      - OrderStatus.java:47: DELIVERY_FAILED -> CANCELLED and DELIVERY_FAILED -> RETURNED are legally permitted
      - OrderService.java:502: currentStatus != OrderStatus.DELIVERY_FAILED evaluates to FALSE!
      - Or for RETURNED: neither flag is true.
      - Reconciliation block is SKIPPED!
      - S = 8, R = 0, A = 8
      - **DEFECT MANIFESTATION**: Permanent, irrecoverable stock discrepancy.
```

### 2.2 Numerical Transition Matrix (Operations A through J)

Assume hypothetical product initial inventory: Physical ($S$) = 10, Reserved ($R$) = 0, Available ($A$) = 10. Order quantity = 2 units.

| Op | Operation Name | Transition | Current Code Execution | Current End Stock (S, R, A) | Expected Business Accounting | Discrepancy / Defect Reason |
|---|---|---|---|---|---|---|
| **A** | Order Placement | `(none) -> PENDING` | `OrderService:187` ($R+2$) | $S=10, R=2, A=8$ | $S=10, R=2, A=8$ | **None**: Correct reservation. |
| **B** | Order Confirmation | `PENDING -> CONFIRMED` | Guard false, skipped | $S=10, R=2, A=8$ | $S=10, R=2, A=8$ | **None**: Reservation maintained. |
| **C** | Order Preparation | `CONFIRMED -> PREPARING` | Guard false, skipped | $S=10, R=2, A=8$ | $S=10, R=2, A=8$ | **None**: Reservation maintained. |
| **D** | Shipment | `PREPARING -> SHIPPED` | `OrderService:529,533` ($R-2, S-2$) | $S=8, R=0, A=8$ | $S=8, R=0, A=8$ | **None**: Physical goods leave warehouse. |
| **E** | Delivery | `SHIPPED -> DELIVERED` | Guard false (`currentStatus == SHIPPED`) | $S=8, R=0, A=8$ | $S=8, R=0, A=8$ | **None**: Customer keeps goods. |
| **F** | Delivery Failure | `SHIPPED -> DELIVERY_FAILED` | Guard false, skipped | $S=8, R=0, A=8$ | $S=8, R=0, A=8$ | **None**: Items held by courier in transit. |
| **G** | Cancellation before Shipment | `PENDING/CONFIRMED/PREPARING -> CANCELLED` | `OrderService:529` ($R-2$) | $S=10, R=0, A=10$ | $S=10, R=0, A=10$ | **None**: Reservation released correctly. |
| **H** | Cancellation after Shipment | `SHIPPED -> CANCELLED` | Guard false (`currentStatus == SHIPPED`) | $S=8, R=0, A=8$ | $S=10, R=0, A=10$ (upon warehouse restock) | **DEFECT CONFIRMED**: 2 physical units lost from DB inventory. |
| **I** | Return after Shipment | `SHIPPED -> RETURNED` | Guard false (`newStatus == RETURNED`) | $S=8, R=0, A=8$ | $S=10, R=0, A=10$ (post-inspection) | **DEFECT CONFIRMED**: 2 physical units lost from DB inventory. |
| **J** | Return after Delivery | `DELIVERED -> RETURNED` | Throws `BusinessException` (illegal transition) | N/A (Blocked) | $S=8 \to 10$ (after customer return & inspection) | **DEFECT CONFIRMED**: State machine rejects transition from terminal `DELIVERED`. |

---

## 3. Caveats & Assumptions

1. **No External ERP / WMS in Repository**: The repository represents a lean, single-database architecture where PostgreSQL `products.stock_quantity` is the sole source of inventory truth. If an external warehouse management system (WMS) exists in production outside this git repository, it has no integration points, webhooks, or scheduled synchronization tasks in this codebase.
2. **Post-Delivery Return Business Logic Undefined**: While the customer-facing website policy (`ReturnsPolicyPage.tsx:59`) offers a 14-day return guarantee under Egyptian Consumer Protection Law, the domain model defines `DELIVERED` as terminal. It is not currently specified in code whether returns require a separate `ReturnRequest` entity, a dedicated inspection step, or an admin override transition.
3. **No Database Test Executed**: In accordance with the strict read-only constraint, no tests were executed against a live database. All findings are derived from static source code analysis, database DDL constraints, and mock unit tests.

---

## 4. Conclusion & Active Red-Team Evaluation

### 4.1 Evaluation of the Naive Remediation (`product.setStockQuantity(stock + totalQty);`)

The previously suggested patch proposing to simply add `totalQty` back to `stockQuantity` whenever an order transitions to `CANCELLED` or `RETURNED` was rigorously challenged against 8 critical engineering dimensions:

1. **Courier-Rejected Shipment vs. Customer Return After Delivery**:
   - A shipment rejected by courier at the door is unopened and sealed.
   - A return after delivery may be opened, unsealed, or damaged.
   - Adding both blindly to `stockQuantity` treats unverified goods as immediately available for sale.
2. **Inspection Requirements & Quarantine Workflow**:
   - Repository-wide search confirmed: **NOT FOUND**. There is no quarantine status, no `returned_quantity` column, and no inspection table.
   - Blindly setting `stockQuantity = stock + totalQty` immediately exposes returned items on the storefront catalog (`ProductService.java:117`: `available = max(0, stock - reserved)`).
3. **Damaged Goods Risk**:
   - If an item was damaged during transit or abused by a customer, blindly adding it to `stockQuantity` causes phantom inventory where damaged items are re-sold to subsequent customers.
4. **Potential Double Restoration Under Concurrency**:
   - While `Order` has `@Version` optimistic locking, `Product` has NO `@Version` annotation and relies solely on `findByIdForUpdate` pessimistic write locks.
   - If a restoration path is invoked twice without verifying that the order's previous status actually deducted stock, or if an admin retries a failed request that already committed stock restoration, stock would be inflated.
5. **Preserving `reserved_quantity` Invariants**:
   - In `V3__create_product_inventory_and_movements.sql:23`, PostgreSQL enforces `chk_stock_available CHECK (reserved_quantity <= stock_quantity)`.
   - In post-shipment cancellations, `reserved_quantity` is already 0. Attempting to deduct reservation again or improperly adjusting reservations could violate DB check constraints.
6. **Dedicated Inventory Movement Records**:
   - The database does NOT contain an `inventory_movements` table. Modifying `stockQuantity` directly leaves no audit trail of who restored the stock, which order it belonged to, or why it was restored.
7. **Deterministic Locking & Atomicity**:
   - Any restoration logic must preserve the canonical UUID ascending order (`TreeMap<UUID, Integer>`) established in `OrderService.java:506` to prevent deadlocks across concurrent orders.
8. **Active Red-Team Disproof Attempt**:
   - *Hypothesis*: Could SEC-INV-01 be a non-issue because post-shipment orders are never cancelled?
   - *Disproof*: `OrderStatus.java:41-48` explicitly permits `SHIPPED -> CANCELLED`, `SHIPPED -> RETURNED`, `DELIVERY_FAILED -> CANCELLED`, and `DELIVERY_FAILED -> RETURNED`. Admin UI (`PERMITTED_STATUS_TRANSITIONS` in `adminOrders.ts:29-30`) renders these exact transition buttons. When clicked, inventory is permanently lost. The defect is real.

---

### 4.2 Categorization of Findings

#### Category 1: Confirmed Technical Defects
1. **Inventory Leak on Post-Shipment Cancellation & Return**:
   - **Locations**: `backend/src/main/java/com/varellion/store/order/service/OrderService.java:500-503`
   - **Root Cause**: Condition `currentStatus != OrderStatus.SHIPPED && currentStatus != OrderStatus.DELIVERY_FAILED` causes the inventory reconciliation block to be skipped when cancelling or returning an order after shipment.
2. **Omission of `RETURNED` in Status Reconciliation Flags**:
   - **Locations**: `OrderService.java:497-498`
   - **Root Cause**: `isReleasingReserved` and `isDeductingPhysical` only check `CANCELLED`, `EXPIRED`, `SHIPPED`, and `DELIVERED`. Neither flag checks `RETURNED`.
3. **Absence of Unit Tests for Post-Shipment Lifecycle**:
   - **Locations**: `backend/src/test/java/com/varellion/store/order/service/OrderServiceTest.java`
   - **Root Cause**: Test suite only covers pre-shipment cancellations from `CONFIRMED` and `PENDING_CUSTOMER_CONFIRMATION`.

#### Category 2: Business Rule Decisions Required
1. **Restocking Policy for Luxury Goods**: Does VARELLION allow automatic catalog re-listing of courier-refused shipments, or must all returned luxury watches and leather goods undergo manual physical inspection before being re-added to sellable inventory?
2. **Post-Delivery Return Handling**: Should `OrderStatus.canTransitionTo` be updated to allow `DELIVERED -> RETURNED`, or should a formal RMA / Return Request domain entity be introduced?

#### Category 3: Architectural Improvements
1. **Optimistic Locking on `Product` Entity**: Add `@Version private Long version;` to `Product.java` to protect against concurrent catalog overwrites during manual catalog editing.
2. **Inventory Movement Ledger**: Introduce an `inventory_movements` table (tracking movement type, quantity delta, reference order ID, and responsible admin actor) instead of mutating `stock_quantity` in place without an audit trail.
3. **Quarantine / Returned Stock Bucket**: Add a `quarantine_quantity` or `returned_quantity` column to separate physical returned items from sellable available items.

#### Category 4: Unverified Assumptions
- **None**. All claims are verified against exact source code lines.

---

## 5. Verification Method

To independently reproduce and verify this investigation without executing tests or modifying any workspace files:

### Step 1: Inspect Status Machine Logic
Run:
```bash
sed -n '26,53p' backend/src/main/java/com/varellion/store/order/entity/OrderStatus.java
```
*Expected Output*: Observe that `SHIPPED` and `DELIVERY_FAILED` permit transitions to `CANCELLED` and `RETURNED`, while `DELIVERED` permits no transitions (`case DELIVERED ... -> false`).

### Step 2: Inspect Inventory Reconciliation Guard in `OrderService`
Run:
```bash
sed -n '496,540p' backend/src/main/java/com/varellion/store/order/service/OrderService.java
```
*Expected Output*:
Observe lines 497–503:
- `isReleasingReserved` is only `CANCELLED` or `EXPIRED`.
- `isDeductingPhysical` is only `SHIPPED` or `DELIVERED`.
- The condition `currentStatus != OrderStatus.SHIPPED && currentStatus != OrderStatus.DELIVERY_FAILED && currentStatus != OrderStatus.DELIVERED` guarantees that if `currentStatus` is `SHIPPED` or `DELIVERY_FAILED`, the entire block is skipped.
- If `newStatus == OrderStatus.RETURNED`, both boolean flags are false, and the block is skipped.

### Step 3: Verify Absence of Other Inventory Mutations
Run:
```bash
git grep -n "setStockQuantity" backend/src/main/
```
*Expected Output*: Only two occurrences in main source:
1. `AdminProductService.java:210` (manual catalog update)
2. `OrderService.java:533` (physical stock deduction)

---
*Report compiled and verified by Explorer 1 under Teamwork Handoff Protocol.*
