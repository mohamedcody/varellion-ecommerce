# Final Verification & Independent Audit Report: SEC-INV-01 Inventory Consistency Defect

- **Investigation Target**: VARELLION E-Commerce Platform
- **Working Directory**: `/home/mohamed-saad/Desktop/BRAND`
- **Integrity Mode**: Strictly Read-Only (Zero Code / Database / Git Modifications)
- **Investigation Date**: 2026-11-17
- **Orchestrator**: Teamwork Dispatch-Only Orchestrator
- **Subagents Dispatched**:
  - Explorer 1 (`teamwork_explorer_1`): Code Audit & Repository-Wide Inventory Mutation Search
  - Explorer 2 (`teamwork_explorer_2`): Stock Accounting Reconstruction (Operations A–J) & Workflow Search
  - Explorer 3 (`teamwork_explorer_3`): Concurrency & Remediation Challenge Evaluation (8 Points)
  - Red-Team Critic (`teamwork_critic_1`): Adversarial Cross-Examination & Active Disproof Pass

---

## Executive Summary

Following a zero-assumption policy, an independent multi-agent investigation was executed to prove or disprove the reported **SEC-INV-01 inventory consistency defect** across order status transitions in the VARELLION store.

### Key Conclusions:
1. **Defect SEC-INV-01 is CONFIRMED REAL**: Physical inventory (`Product.stockQuantity`) is decremented when an order transitions to `SHIPPED` (`OrderService.java:533`). However, when transitioning from `SHIPPED` or `DELIVERY_FAILED` to `CANCELLED` or `RETURNED`, the inventory reconciliation guard (`OrderService.java:500–503`) evaluates to `false`, completely bypassing stock restoration. A repository-wide audit confirmed that zero alternative mechanisms (scheduled tasks, event listeners, triggers, or secondary services) restore inventory. This results in a permanent, cumulative physical stock leak in the catalog.
2. **Post-Delivery Return Path is HARD-BLOCKED in the Domain Model**: `OrderStatus.canTransitionTo` (`OrderStatus.java:50`) hardcodes `DELIVERED` as an immutable terminal state. Any attempt to record a customer return after delivery throws an HTTP 400 `BusinessException`, completely preventing the execution of Egyptian statutory 14-day consumer return rights in software.
3. **Concurrency & Double Restoration**: Double restoration under concurrent requests for the same order transition is prevented by JPA optimistic locking (`@Version`) on `Order.java:33–35`. However, **a new high-severity Lost Update Anomaly was discovered on `Product`**: `Product` lacks `@Version`, and `AdminProductService.updateProduct` uses non-locking queries, allowing admin catalog edits to silently overwrite order stock deductions.
4. **Naive Remediation (`product.setStockQuantity(stock + totalQty);`) is REJECTED AS DANGEROUS**: The naive patch creates catastrophic phantom stock on pre-shipment cancellations, oversells in-transit courier shipments (which take 3–7 days to return in Egypt), conflates damaged goods with sellable inventory, and risks delivering uninspected/opened luxury items to paying customers.

---

## 1. Observation (Verified Code Evidence & Architecture Mapping)

### 1.1 Complete Implementation of Core Domain Components

#### 1. `OrderStatus.java` & `canTransitionTo()`
- **File**: `backend/src/main/java/com/varellion/store/order/entity/OrderStatus.java`
- **Verified Lines**: 6–53
- **Verbatim Excerpt**:
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
- **Facts**:
  - `SHIPPED` and `DELIVERY_FAILED` permit transitions to `RETURNED` and `CANCELLED`.
  - `DELIVERED` is classified as terminal (`case DELIVERED, ... -> false;`). `DELIVERED -> RETURNED` returns `false`.

#### 2. `Product` Entity Inventory Fields & Concurrency Mapping
- **File**: `backend/src/main/java/com/varellion/store/catalog/entity/Product.java`
- **Verified Lines**: 21–78
- **Verbatim Excerpt**:
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
```
- **Facts**:
  - Database table `public.products` contains exactly two inventory fields: `stock_quantity` and `reserved_quantity`.
  - Relational check constraint (`V3__create_product_inventory_and_movements.sql:24`): `CONSTRAINT chk_stock_available CHECK (reserved_quantity <= stock_quantity)`.
  - **`Product` HAS NO `@Version` annotation**.

#### 3. `Order` Entity Concurrency Mapping
- **File**: `backend/src/main/java/com/varellion/store/order/entity/Order.java`
- **Verified Lines**: 33–35, 74–76
```java
    @Version
    @Column(name = "version", nullable = false)
    private Long version;
...
    @Enumerated(EnumType.STRING)
    @Column(name = "order_status", nullable = false, length = 50)
    private OrderStatus orderStatus = OrderStatus.PENDING_CUSTOMER_CONFIRMATION;
```
- **Facts**: `Order` explicitly implements JPA optimistic locking via `@Version` (added via migration `V12__add_version_to_orders.sql`).

#### 4. `ProductRepository.findByIdForUpdate()`
- **File**: `backend/src/main/java/com/varellion/store/catalog/repository/ProductRepository.java`
- **Verified Lines**: 25–27
```java
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.productId = :productId")
    Optional<Product> findByIdForUpdate(@Param("productId") UUID productId);
```
- **Facts**: Uses PostgreSQL `SELECT ... FOR UPDATE` to lock product rows.

#### 5. `OrderService.updateOrderStatus()` (The Defective Method)
- **File**: `backend/src/main/java/com/varellion/store/order/service/OrderService.java`
- **Verified Lines**: 473–540
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
...
```

### 1.2 Repository-Wide Inventory Mutation Search
An exhaustive search across all files in `backend/` and `frontend/` established the following complete inventory mutation profile:

| Method / Location | File Path & Lines | Trigger | Stock Mutation Behavior |
|---|---|---|---|
| `createOrder()` | `OrderService.java:187` | Customer checkout | Increments `reservedQuantity` by order quantity. `stockQuantity` untouched. |
| `updateOrderStatus()` | `OrderService.java:529` | Status update to `CANCELLED`/`EXPIRED` (pre-shipment) | Decrements `reservedQuantity` by order quantity. `stockQuantity` untouched. |
| `updateOrderStatus()` | `OrderService.java:533` | Status update to `SHIPPED`/`DELIVERED` | Decrements `stockQuantity` by order quantity AND releases `reservedQuantity`. |
| `updateProduct()` | `AdminProductService.java:210` | Admin manual catalog edit | Sets `stockQuantity` directly from request DTO without locking or version check. |
| `createProduct()` | `AdminProductService.java:142` | Admin product creation | Initializes `stockQuantity` from request, `reservedQuantity` to 0. |

**Zero Alternative Restoration Mechanisms**:
- Event Listeners (`@EventListener`, `ApplicationEventPublisher`): **0 matches**.
- Scheduled Tasks (`@Scheduled`): Only 1 exists (`RateLimitFilter.cleanupExpiredEntries:128`), which cleans in-memory IP rate-limit buckets.
- Database Triggers: Triggers exist up to `V13`, but none mutate stock or reservation columns (`V13` dropped the order history trigger).
- External Services/Webhooks: **0 matches**.

---

## 2. Logic Chain

### 2.1 Distinction of the Five Stock Concepts

| Stock Concept | Persistence in Schema | Formula / Mechanism | Meaning in Varellion Operations |
|---|---|---|---|
| **1. Physical Stock ($P$)** | Column `stock_quantity` in `products` | Persisted integer | Units physically inside the central warehouse. Decremented only when goods physically depart (`SHIPPED`). |
| **2. Reserved Stock ($R$)** | Column `reserved_quantity` in `products` | Persisted integer | Units committed to placed orders that have not yet physically departed the warehouse. |
| **3. Available Stock ($A$)** | **Logical only** (no DB column) | $A = P - R = \text{stock\_quantity} - \text{reserved\_quantity}$ | Units available to promise to new customer checkouts. |
| **4. Returned Stock ($Ret$)** | **MISSING** (no DB column or table) | Untracked | Units returned from courier transit or customer hands, awaiting dock intake and inspection. |
| **5. Sellable Stock ($S$)** | **Logical only** (conflated with $A$) | Conflated with $A$ | Units inspected and certified in pristine factory-sealed condition. Currently conflated with raw available stock. |

Repository search for inspection, quarantine, damage, restock, and RMA workflows returned **NOT FOUND** (exit code 1 across backend and frontend). The codebase lacks any quarantine or return inspection models.

---

### 2.2 Numerical Accounting Reconstruction (Operations A through J)

Baseline Setup: Product Initial State: Physical ($P$) = 100, Reserved ($R$) = 0, Available ($A$) = 100. Order Quantity $Q = 10$.

| Op | Operation Name | Transition | Current Code Execution | Current Stock ($P, R, A$) | Expected Business Accounting | Discrepancy / Root Cause |
|:---:|:---|:---|:---|:---:|:---:|:---|
| **A** | Order Placement | `(new) -> PENDING` | `OrderService:187` ($R+10$) | $P=100, R=10, A=90$ | $P=100, R=10, A=90$ | **MATCH**: Correct reservation. |
| **B** | Confirmation | `PENDING -> CONFIRMED` | Guard false, bypassed | $P=100, R=10, A=90$ | $P=100, R=10, A=90$ | **MATCH**: Reservation maintained. |
| **C** | Preparation | `CONFIRMED -> PREPARING` | Guard false, bypassed | $P=100, R=10, A=90$ | $P=100, R=10, A=90$ | **MATCH**: Reservation maintained. |
| **D** | Shipment | `PREPARING -> SHIPPED` | `OrderService:529,533` ($R-10, P-10$) | $P=90, R=0, A=90$ | $P=90, R=0, A=90$ | **MATCH**: Goods depart warehouse. |
| **E** | Delivery | `SHIPPED -> DELIVERED` | Guard false (`currentStatus == SHIPPED`) | $P=90, R=0, A=90$ | $P=90, R=0, A=90$ | **MATCH**: Customer receives goods. |
| **F** | Delivery Failure | `SHIPPED -> DELIVERY_FAILED` | Guard false, bypassed | $P=90, R=0, A=90$ | $P=90, R=0, A=90$ (10 in transit) | **MATCH on-hand**: Missing transit tracking. |
| **G** | Pre-Shipment Cancellation | `PREPARING -> CANCELLED` | `OrderService:529` ($R-10$) | $P=100, R=0, A=100$ | $P=100, R=0, A=100$ | **MATCH**: Reservation released. |
| **H** | Post-Shipment Cancellation | `SHIPPED -> CANCELLED` | Line 501 guard evaluates to `false`; **SKIPPED** | **$P=90, R=0, A=90$** | $P=100, R=0, A=100$ (upon intake) | **CONFIRMED DEFECT**: 10 physical units permanently lost from database! |
| **I** | Return After Shipment | `SHIPPED -> RETURNED` | Lines 497–498 omit `RETURNED`; **SKIPPED** | **$P=90, R=0, A=90$** | $P=100, R=0, A=90$ (pre-insp) / $A=100$ (post) | **CONFIRMED DEFECT**: 10 returned units permanently lost from database! |
| **J** | Return After Delivery | `DELIVERED -> RETURNED` | `OrderStatus.java:50` returns `false` | **BLOCKED (HTTP 400)** | $P=100, Ret=10, S=100$ (post-insp) | **CONFIRMED DEFECT**: State machine forbids return after delivery. |

---

### 2.3 Concurrency & Double Restoration Protection Audit

1. **JPA `@Version` on `Order` (Lines 33–35)**:
   - When Request 1 and Request 2 attempt to cancel the same order concurrently, both read `Order.version = N`.
   - Both attempt to lock products in canonical ascending UUID order (`TreeMap<UUID, Integer>`, lines 506 and 520).
   - TX1 acquires the product lock, updates the order, increments `Order.version` to $N+1$, and commits.
   - When TX2 resumes, it attempts to flush `Order` with `version = N`. The statement matches 0 rows.
   - Hibernate throws `OptimisticLockException` (wrapped in `ObjectOptimisticLockingFailureException`).
   - TX2 is completely rolled back by PostgreSQL. `GlobalExceptionHandler:194–205` responds with HTTP 409 Conflict.
   - **Double restoration under concurrent execution is fully prevented by `@Version` on `Order`**.

2. **Sequential Requests & Multi-Hop Loops**:
   - For sequential duplicate requests (e.g., admin clicks Cancel twice 5 seconds apart), `@Version` does NOT prevent re-execution (version would simply increment again). Protection is achieved by the application idempotency check:
     `if (currentStatus == newStatus) return mapToDto(order);` (`OrderService.java:481`).
   - If an order executes a multi-hop loop (`SHIPPED -> DELIVERY_FAILED -> SHIPPED -> RETURNED`), each step is a distinct valid state transition with its own committed transaction. Naive status-based stock restoration would execute multiple times across these hops.

3. **Vulnerability Discovery: Lost Update Anomaly on `Product`**:
   - `Order` has `@Version`; `Product` **DOES NOT**.
   - `OrderService.updateOrderStatus` locks products with `PESSIMISTIC_WRITE` (`findByIdForUpdate`).
   - In contrast, `AdminProductService.updateProduct()` (`AdminProductService.java:174–210`) uses non-locking `findByIdWithDetailsAdmin()`.
   - If an admin edits a product catalog page while orders for that product are being shipped, the admin's catalog save will overwrite `stock_quantity` without detecting the shipment deduction, causing a silent **Lost Update**.

---

### 2.4 Active Red-Team Evaluation of the Naive Patch (`product.setStockQuantity(stock + totalQty);`)

The proposed quick patch (`product.setStockQuantity(stock + totalQty);`) was challenged across all 8 dimensions:

1. **Courier-Rejected Shipment**: In Egypt, courier returns take 3–7 business days to physically return. Auto-restoring stock while parcels are in transit exposes stock on the website that cannot be picked, triggering overselling, pick failures, and customer cancellations.
2. **Customer Return After Delivery**: Luxury watches and leather goods are handled by customers. Under Egyptian law ("معاينة وفحص قبل الاستلام"), packages are unboxed. Putting opened, handled, or scratched luxury items back into brand-new sellable catalog inventory destroys brand equity.
3. **Inspection Requirements**: Restocking is a physical dock intake operation, not an administrative status click. Auto-restocking couples digital inventory to status changes before physical inspection occurs.
4. **Damaged Goods**: Damaged or courier-crushed goods must be written off or quarantined, never added directly to sellable stock.
5. **Double Restoration & Pre-Shipment Cancellation (FATAL FLAW)**:
   - On pre-shipment cancellation (`PENDING` or `CONFIRMED -> CANCELLED`), physical stock was never decremented.
   - Calling `product.setStockQuantity(stock + totalQty)` on pre-shipment cancellations **creates phantom inventory out of thin air**, inflating the store catalog on every normal cancellation!
6. **Preserving `reserved_quantity` Invariants**: At shipment, `reserved_quantity` is already 0. Conflating stock and reservation restorations risks violating database check constraint `chk_stock_available CHECK (reserved_quantity <= stock_quantity)`.
7. **Dedicated Inventory Movement Records**: Directly mutating `stock_quantity` without an immutable ledger violates double-entry accounting. (Note: partially mitigated by existing architecture lacking a ledger, but still an essential improvement).
8. **Deterministic Locking**: Any stock restoration must maintain ascending `TreeMap` lock ordering to prevent PostgreSQL deadlocks.

**Red-Team Verdict**: The naive patch is **categorically rejected as architecturally unsound and operationally dangerous**.

---

## 3. Caveats & Assumptions

1. **Strictly Read-Only Analysis**: No code was edited, no database connections were altered, and no live database tests were executed. All conclusions are derived from static source code tracing, database migrations, and existing surefire test reports.
2. **Single Database Source of Truth**: The codebase represents a single monolithic PostgreSQL database without external ERP or WMS integrations.
3. **Migration History**: Committed migrations in the repository extend from `V1` to `V13`. `V12` introduced `version` to `orders`. Migration `V14` (inventory movements) exists only as an architectural design proposal in documentation.

---

## 4. Conclusion & Final Categorized Deliverable (R5)

### Category 1: Confirmed Technical Defects

| Defect ID | Severity | File Path & Lines | Root Cause | Business Impact |
|---|---|---|---|---|
| **DEF-01** | High | `backend/src/main/java/com/varellion/store/order/service/OrderService.java:500–503` | Condition `currentStatus != SHIPPED && currentStatus != DELIVERY_FAILED` bypasses the inventory block on post-shipment cancellations and returns. | Permanent physical stock leak. Shipped items cancelled or returned never return to the catalog. |
| **DEF-02** | High | `backend/src/main/java/com/varellion/store/order/service/OrderService.java:497–498` | Boolean flags `isReleasingReserved` and `isDeductingPhysical` omit `OrderStatus.RETURNED`. | Order status changes to `RETURNED` execute zero inventory logic. |
| **DEF-03** | High | `backend/src/main/java/com/varellion/store/order/entity/OrderStatus.java:50` | `DELIVERED` is an immutable terminal state (`canTransitionTo` returns `false`). | Post-delivery customer returns cannot be processed in software (HTTP 400), violating 14-day statutory return rights. |
| **DEF-04** | Medium | `backend/src/main/java/com/varellion/store/catalog/entity/Product.java:21–78` & `AdminProductService.java:174–210` | `Product` lacks `@Version`, and catalog update uses non-locking queries. | Lost Update Anomaly: Admin catalog edits silently overwrite order stock deductions. |

### Category 2: Business Rule Decisions Required

1. **Separation of Commercial Order Status from Physical Warehouse Restocking**:
   - *Decision*: Does VARELLION require returned goods to undergo physical warehouse intake and inspection before restocking, or should sealed courier returns be auto-restocked?
   - *Recommendation*: Enforce physical warehouse intake. Auto-restocking in-transit packages causes stockouts and pick failures in Egyptian logistics.
2. **Customer Return Grading Policy**:
   - *Decision*: Define an inspection rubric for returned luxury goods (`RESELLABLE`, `OPEN_BOX_DISCOUNT`, `DAMAGED_WRITE_OFF`).

### Category 3: Architectural Improvements

1. **Add Optimistic Locking (`@Version`) to `Product` Entity**:
   - Introduce `@Version private Long version;` to `Product.java` and a corresponding column via Flyway migration `V14`.
2. **Introduce Dedicated Restocking Endpoint**:
   - Instead of overloading `PUT /api/admin/orders/{orderNumber}/status`, create `POST /api/admin/orders/{orderNumber}/restock` that accepts verified quantities, condition grading, and admin actor credentials.
3. **Implement Immutable Inventory Movement Ledger**:
   - Create table `inventory_movements` (tracking `movement_type`, `quantity_delta`, `order_id`, `product_id`, `actor_id`, `created_at`) to replace raw in-place updates.
4. **Permit `DELIVERED -> RETURNED` in Domain Model**:
   - Update `OrderStatus.canTransitionTo` to allow `DELIVERED -> RETURNED` and update `adminOrders.ts` to enable the action in the admin dashboard.

### Category 4: Unverified Assumptions (All Addressed)

- **Assumption 1**: *"Another service or DB trigger might restore inventory."* -> **DISPROVED**: Exhaustive repository search confirmed 0 triggers, 0 listeners, and 0 scheduled tasks.
- **Assumption 2**: *"An alternative return endpoint might exist."* -> **DISPROVED**: Audited all 12 controllers; no alternate return path exists.
- **Assumption 3**: *"Migrations stopped at V7."* -> **REFUTED**: Repository contains committed migrations up to `V13`.

---

## 5. Minimal Safe Remediation Strategy (Zero Code Modifications)

Without making code modifications in this read-only phase, the minimal safe engineering plan is:

1. **Phase 1: State Machine & Admin UI Alignment**:
   - Update `OrderStatus.java` line 50 to permit `case DELIVERED -> nextStatus == RETURNED;`.
   - Update `frontend/src/services/adminOrders.ts` line 31 to include `RETURNED` in permitted transitions from `DELIVERED`.
2. **Phase 2: Administrative Operational Procedure (No Code Change Required Today)**:
   - Allow admins to transition orders to `DELIVERY_FAILED`, `CANCELLED`, or `RETURNED`.
   - Instruct warehouse staff to physically inspect returned packages upon courier delivery and manually update catalog stock via `AdminProductService.updateProduct` (or the catalog UI) only for certified pristine items.
3. **Phase 3: Automated Restock & Ledger Architecture**:
   - Implement migration `V14` adding `@Version` to `Product` and creating the `inventory_movements` ledger table.
   - Implement a dedicated `POST /api/admin/orders/{orderNumber}/restock` endpoint utilizing sorted `TreeMap` pessimistic locks.

---

## 6. Verification Method (Reproducible Read-Only Commands)

The findings in this report can be verified independently using the following read-only commands:

```bash
# 1. Verify Defective Inventory Guard in OrderService
sed -n '495,540p' backend/src/main/java/com/varellion/store/order/service/OrderService.java

# 2. Verify Blocked Post-Delivery Return in OrderStatus
sed -n '26,53p' backend/src/main/java/com/varellion/store/order/entity/OrderStatus.java

# 3. Verify Product Lacks @Version while Order has @Version
grep -n "@Version" backend/src/main/java/com/varellion/store/catalog/entity/Product.java || echo "No @Version on Product"
grep -n "@Version" backend/src/main/java/com/varellion/store/order/entity/Order.java

# 4. Verify Zero Alternative Inventory Restorations
git grep -i -E "@EventListener|TransactionalEventListener|ApplicationEventPublisher" backend/src/main/
git grep -n "setStockQuantity" backend/src/main/

# 5. Verify Absence of Restock / Quarantine Workflows
git grep -i "quarantine" backend/ frontend/ || echo "NOT FOUND"
git grep -i "restock" backend/ frontend/ || echo "NOT FOUND"
```

---
*Report synthesized and verified by Teamwork Dispatch-Only Orchestrator under Zero-Assumption and Read-Only Protocols.*
