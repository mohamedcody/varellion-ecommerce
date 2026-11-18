# Handoff Report: R2 - Reconstruct Numerical Accounting & Discrepancy Analysis (SEC-INV-01)

- **Agent**: Explorer 2 (`teamwork_explorer_2`)
- **Mission**: Reconstruct Numerical Accounting, Stock Concepts, and Discrepancy Analysis for defect hypothesis SEC-INV-01.
- **Date / Timestamp**: 2026-11-17T18:06:00Z
- **Working Directory**: `/home/mohamed-saad/Desktop/BRAND`
- **Integrity Mode**: Strictly read-only; zero code/DB modifications executed.

---

## 1. Observation

### 1.1 Database Entities & Inventory Column Mapping
Direct inspection of database entities and Flyway migrations reveals the concrete persistence layout of inventory:
- **`backend/src/main/resources/db/migration/V3__create_product_inventory_and_movements.sql`** (lines 10–25):
  ```sql
  ALTER TABLE public.products
      ADD COLUMN IF NOT EXISTS sku VARCHAR(100) NULL,
      ADD COLUMN IF NOT EXISTS cost_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (cost_price >= 0),
      ADD COLUMN IF NOT EXISTS stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
      ADD COLUMN IF NOT EXISTS reserved_quantity INTEGER NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0);

  ALTER TABLE public.products
      ADD CONSTRAINT chk_stock_available CHECK (reserved_quantity <= stock_quantity);
  ```
- **`backend/src/main/java/com/varellion/store/catalog/entity/Product.java`** (lines 54–58):
  ```java
  @Column(name = "stock_quantity", nullable = false)
  private Integer stockQuantity = 0;

  @Column(name = "reserved_quantity", nullable = false)
  private Integer reservedQuantity = 0;
  ```
- **`backend/src/main/java/com/varellion/store/order/service/OrderService.java`** (lines 179–180):
  ```java
  int availableStock = (product.getStockQuantity() != null ? product.getStockQuantity() : 0)
          - (product.getReservedQuantity() != null ? product.getReservedQuantity() : 0);
  ```
- **`frontend/src/types/index.ts`** (lines 96–98):
  ```typescript
  stockQuantity: number;
  reservedQuantity: number;
  availableStock: number; // calculated: stockQuantity - reservedQuantity
  ```
- **Entity Observation**:
  - `public.products` contains exactly two inventory-related columns: `stock_quantity` and `reserved_quantity`.
  - There is **no column** in the database for `available_stock`, `physical_stock`, `returned_stock`, `quarantine_stock`, or `sellable_stock`.
  - Despite the migration filename `V3__create_product_inventory_and_movements.sql`, **no inventory movements table** was created.

---

### 1.2 Inventory Modification Code Paths Across the Entire Repository
An exhaustive search across the entire Java codebase for inventory mutation methods revealed:
- `git grep -n "setStockQuantity"` returned only **one production line**:
  - `backend/src/main/java/com/varellion/store/order/service/OrderService.java:533`:
    ```java
    product.setStockQuantity(Math.max(0, stock - totalQty));
    ```
  - (In addition, administrative manual catalog update sets `stockQuantity` in `AdminProductService.java:210`: `product.setStockQuantity(request.getStockQuantity())`).
- `git grep -n "setReservedQuantity"` returned only **two production lines**:
  - `backend/src/main/java/com/varellion/store/order/service/OrderService.java:187`:
    ```java
    product.setReservedQuantity((product.getReservedQuantity() != null ? product.getReservedQuantity() : 0) + itemReq.getQuantity());
    ```
  - `backend/src/main/java/com/varellion/store/order/service/OrderService.java:529`:
    ```java
    product.setReservedQuantity(Math.max(0, reserved - totalQty));
    ```
- There are **zero** `@Modifying` queries or native SQL updates altering inventory columns outside these lines.

---

### 1.3 State Machine Transition Rules (`OrderStatus.java`)
In **`backend/src/main/java/com/varellion/store/order/entity/OrderStatus.java`** (lines 26–52):
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
Direct observation:
- `DELIVERED` is an immutable terminal state (`canTransitionTo` returns `false` unconditionally).
- `DELIVERED -> RETURNED` is **illegal** according to `OrderStatus.canTransitionTo`.

---

### 1.4 State Machine Execution & Inventory Guard (`OrderService.java`)
In **`backend/src/main/java/com/varellion/store/order/service/OrderService.java`** (lines 480–540):
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
```

Direct observations of the inventory reconciliation guard:
1. When `newStatus == OrderStatus.CANCELLED`:
   - `isReleasingReserved = true`
   - If `currentStatus` is `SHIPPED` or `DELIVERY_FAILED`:
     `currentStatus != OrderStatus.SHIPPED` evaluates to `false` (or `currentStatus != OrderStatus.DELIVERY_FAILED` evaluates to `false`).
     The condition `(isReleasingReserved || isDeductingPhysical) && currentStatus != OrderStatus.SHIPPED && currentStatus != OrderStatus.DELIVERY_FAILED && currentStatus != OrderStatus.DELIVERED` evaluates to **`FALSE`**.
     **The loop is skipped.** `stockQuantity` is not modified. `reservedQuantity` is not modified.
2. When `newStatus == OrderStatus.RETURNED`:
   - `isReleasingReserved` is `false` (only CANCELLED/EXPIRED).
   - `isDeductingPhysical` is `false` (only SHIPPED/DELIVERED).
   - `(isReleasingReserved || isDeductingPhysical)` evaluates to **`FALSE`**.
   - **The loop is skipped.** Neither `stockQuantity` nor `reservedQuantity` is modified.
3. When `currentStatus == OrderStatus.DELIVERED`:
   - Step 2 checks `currentStatus.canTransitionTo(newStatus)`.
   - For `newStatus == OrderStatus.RETURNED`: `DELIVERED.canTransitionTo(RETURNED)` is `false`.
   - Line 488 executes: throws `BusinessException("لا يمكن تحويل حالة الطلب من 'تم التسليم بنجاح' إلى 'تم إرجاع الطلب'")`.
   - The method crashes with HTTP 400 Bad Request before step 3 or 4 can execute.

---

### 1.5 Repository-Wide Search for Inspection / Quarantine / Damaged / Restocking / RMA Workflows
The following exhaustive searches were executed across the codebase:
- `git grep -i "quarantine" backend/ frontend/`:
  - **Result**: Exit code 1 (0 matches).
- `git grep -i "damage" backend/ frontend/`:
  - `git grep -i "damage" backend/`: Exit code 1 (0 matches).
  - `git grep -i "damage" frontend/`: Exit code 1 (0 matches).
- `git grep -i "restock" backend/ frontend/`:
  - **Result**: Exit code 1 (0 matches).
- `git grep -i -w "rma" backend/ frontend/`:
  - **Result**: Exit code 1 (0 matches).
- `git grep -i "defective" backend/ frontend/`:
  - **Result**: Exit code 1 (0 matches).
- `git grep -i "inspection" backend/ frontend/`:
  - Matches found only in two non-workflow contexts:
    1. Display string in `backend/src/main/java/com/varellion/store/order/service/OrderService.java:625`: `case PREPARING -> "Preparing & Inspection";`
    2. Customer marketing/policy guarantee in frontend (`frontend/public/llms.txt`, `frontend/src/app/policies/shipping/page.tsx`, `frontend/src/app/products/[slug]/ProductDetailClient.tsx`): "معاينة وفحص قبل الاستلام" (customer right to unbox and inspect parcel before handing cash to courier).
- **Entities & Tables Search**:
  - Only 11 JPA entities exist in the entire backend: `User`, `Customer`, `CustomerAddress`, `Category`, `Product`, `ProductImage`, `Cart`, `CartItem`, `Order`, `OrderItem`, `OrderStatusHistory`.
  - Zero warehouse inventory, quarantine, or return entities exist.

---

## 2. Logic Chain

### 2.1 Distinction of the Five Stock Concepts
Based on the observations in Section 1.1:

```
[public.products Table Schema]
       │
       ├── stock_quantity (INTEGER NOT NULL) ──────> Represents PHYSICAL WAREHOUSE STOCK (P)
       │                                             (Deducted upon physical departure via SHIPPED)
       │
       └── reserved_quantity (INTEGER NOT NULL) ────> Represents RESERVED STOCK (R)
                                                     (Units committed to unfulfilled orders)
```

1. **Physical Stock ($P$)**:
   - *Definition*: Actual units physically located on warehouse premises.
   - *Database Status*: Persisted as `stock_quantity` in `public.products` (`Product.stockQuantity`).
   - *Operational Meaning*: While an order is unfulfilled (`PENDING`, `CONFIRMED`, `PREPARING`), the items are physically in the warehouse, so `stockQuantity` is not decremented. When the order transitions to `SHIPPED`, the units physically leave the warehouse, and `stockQuantity` is decremented by $Q$ (`OrderService.java:533`).
2. **Reserved Stock ($R$)**:
   - *Definition*: Units committed to placed orders that have not yet physically departed the warehouse.
   - *Database Status*: Persisted as `reserved_quantity` in `public.products` (`Product.reservedQuantity`).
   - *Operational Meaning*: Incremented at checkout (`OrderService.java:187`), holding items against overselling; decremented upon dispatch (`SHIPPED`) or pre-shipment cancellation (`CANCELLED`/`EXPIRED`) (`OrderService.java:529`).
3. **Available Stock ($A$)**:
   - *Definition*: Units available to promise to new incoming customer orders (Available-to-Promise / ATP).
   - *Database Status*: **Logical Concept only** (No DB column).
   - *Formula*: $A = P - R = \text{stockQuantity} - \text{reservedQuantity}$.
   - *Operational Meaning*: Dynamically computed in `OrderService.java:179` and frontend `frontend/src/types/index.ts:98`.
4. **Returned Stock ($Ret$)**:
   - *Definition*: Units that have failed delivery or been returned by a customer and are either in return transit with the courier or have arrived at the warehouse intake dock awaiting disposition.
   - *Database Status*: **Logical Concept only — COMPLETELY MISSING from database and code**.
   - *Operational Meaning*: No table, column, or status exists to track returned physical items.
5. **Sellable Stock ($S$)**:
   - *Definition*: Units verified to be in pristine, factory-sealed condition, ready to be picked and sold.
   - *Database Status*: **Logical Concept only**.
   - *Operational Meaning*: Conflated directly with Available Stock in the current single-bucket inventory model. The system has no capacity to distinguish pristine sellable units from returned/uninspected/damaged units.

| Stock Concept | Database Column | Entity Class | Schema Existence | Domain Logic |
|---|---|---|---|---|
| **Physical Stock** | `stock_quantity` | `Product.java:55` | **Physical Column** | Units in warehouse |
| **Reserved Stock** | `reserved_quantity` | `Product.java:58` | **Physical Column** | Units committed to pending orders |
| **Available Stock** | None | Computed in DTO / Service | **Logical / Computed** | $P - R = \text{stockQuantity} - \text{reservedQuantity}$ |
| **Returned Stock** | None | None | **Missing** | Untracked anywhere |
| **Sellable Stock** | None | None | **Logical (Conflated)** | Presumed identical to Available Stock |

---

### 2.2 Numerical Accounting Reconstruction for Operations A through J

#### Standard Hypothetical Baseline Setup
- Product: Varellion Chronograph Watch (SKU: `VAR-CHRONO-01`)
- Initial Stock State:
  - Physical Stock ($P$) = 100 units
  - Reserved Stock ($R$) = 0 units
  - Available Stock ($A = P - R$) = 100 units
  - Returned Stock ($Ret$) = 0 units
  - Sellable Stock ($S$) = 100 units
- Incoming Order: Order #`VAR-20261117-0001` with Quantity $Q = 10$ units.

---

#### Operation A: Order Placement
- **Trigger**: `POST /api/orders` -> `OrderService.createOrder()`
- **Current Code Behavior** (`OrderService.java:179–188, 243`):
  - Checks: `availableStock (100) >= requested (10)`.
  - Increments reservation: `product.setReservedQuantity(0 + 10 = 10)`.
  - `stockQuantity` remains 100.
  - Order status initialized to `PENDING_CUSTOMER_CONFIRMATION`.
  - Numerical Values:
    - Current Code: $P = 100$, $R = 10$, $A = 90$.
- **Expected Business Accounting**:
  - $P = 100$, $R = 10$, $A = 90$, $Ret = 0$, $S = 90$.
- **Discrepancy**: **None**.

---

#### Operation B: Order Confirmation
- **Trigger**: `PUT /api/admin/orders/{orderNumber}/status` with `newStatus = CONFIRMED`
- **Current Code Behavior** (`OrderService.java:487, 497–498, 543`):
  - Transition valid: `PENDING_CUSTOMER_CONFIRMATION -> CONFIRMED`.
  - `isReleasingReserved = false`, `isDeductingPhysical = false`.
  - Inventory block bypassed.
  - Numerical Values:
    - Current Code: $P = 100$, $R = 10$, $A = 90$.
- **Expected Business Accounting**:
  - $P = 100$, $R = 10$, $A = 90$, $Ret = 0$, $S = 90$.
- **Discrepancy**: **None**.

---

#### Operation C: Order Preparation
- **Trigger**: `PUT /api/admin/orders/{orderNumber}/status` with `newStatus = PREPARING`
- **Current Code Behavior** (`OrderService.java:487, 497–498, 543`):
  - Transition valid: `CONFIRMED -> PREPARING`.
  - `isReleasingReserved = false`, `isDeductingPhysical = false`.
  - Inventory block bypassed.
  - Numerical Values:
    - Current Code: $P = 100$, $R = 10$, $A = 90$.
- **Expected Business Accounting**:
  - $P = 100$, $R = 10$, $A = 90$, $Ret = 0$, $S = 90$.
- **Discrepancy**: **None**.

---

#### Operation D: Shipment
- **Trigger**: `PUT /api/admin/orders/{orderNumber}/status` with `newStatus = SHIPPED`
- **Current Code Behavior** (`OrderService.java:498, 528–536`):
  - Transition valid: `PREPARING -> SHIPPED`.
  - `isDeductingPhysical = true`.
  - Guard passes: `currentStatus (PREPARING) != SHIPPED && != DELIVERY_FAILED && != DELIVERED`.
  - Deducts reservation: `product.setReservedQuantity(10 - 10 = 0)`.
  - Deducts physical: `product.setStockQuantity(100 - 10 = 90)`.
  - Numerical Values:
    - Current Code: $P = 90$, $R = 0$, $A = 90$.
- **Expected Business Accounting**:
  - Units physically leave the warehouse with courier: $P = 90$, $R = 0$, $A = 90$, In-transit = 10.
- **Discrepancy**: **None** for successful dispatch.

---

#### Operation E: Delivery
- **Trigger**: `PUT /api/admin/orders/{orderNumber}/status` with `newStatus = DELIVERED`
- **Current Code Behavior** (`OrderService.java:487, 500–503, 543`):
  - Transition valid: `SHIPPED -> DELIVERED`.
  - Guard: `currentStatus (SHIPPED) != OrderStatus.SHIPPED` evaluates to **`false`**.
  - Inventory reconciliation block is bypassed (preventing double deduction).
  - Numerical Values:
    - Current Code: $P = 90$, $R = 0$, $A = 90$.
- **Expected Business Accounting**:
  - Ownership transfers to customer: $P = 90$, $R = 0$, $A = 90$, $Ret = 0$, $S = 90$.
- **Discrepancy**: **None**.

---

#### Operation F: Delivery Failure
- **Trigger**: `PUT /api/admin/orders/{orderNumber}/status` with `newStatus = DELIVERY_FAILED`
- **Current Code Behavior** (`OrderService.java:487, 497–498, 543`):
  - Transition valid: `SHIPPED -> DELIVERY_FAILED`.
  - `isReleasingReserved = false`, `isDeductingPhysical = false`.
  - Inventory block bypassed.
  - Numerical Values:
    - Current Code: $P = 90$, $R = 0$, $A = 90$.
- **Expected Business Accounting**:
  - Physical parcel is in courier custody returning or awaiting second delivery attempt.
  - Warehouse Physical On-Hand: $P = 90$.
  - In-Transit Courier Receivable: 10 units.
  - Available: $A = 90$.
- **Discrepancy**:
  - Code correctly maintains $P = 90, R = 0$ while goods are on the road.
  - However, the system has **zero visibility into in-transit receivables**.

---

#### Operation G: Cancellation Before Shipment
- **Trigger**: `PUT /api/admin/orders/{orderNumber}/status` with `newStatus = CANCELLED` (while in `PENDING`, `CONFIRMED`, or `PREPARING`)
- **Current Code Behavior** (`OrderService.java:497, 528–530`):
  - Transition valid.
  - `isReleasingReserved = true`, `isDeductingPhysical = false`.
  - Guard passes.
  - Releases reservation: `product.setReservedQuantity(10 - 10 = 0)`.
  - `stockQuantity` remains 100.
  - Numerical Values:
    - Current Code: $P = 100$, $R = 0$, $A = 100$.
- **Expected Business Accounting**:
  - $P = 100$, $R = 0$, $A = 100$, $Ret = 0$, $S = 100$.
- **Discrepancy**: **None**.

---

#### Operation H: Cancellation After Shipment
- **Trigger**: `PUT /api/admin/orders/{orderNumber}/status` with `newStatus = CANCELLED` (while in `SHIPPED` or `DELIVERY_FAILED`)
- **Current Code Behavior** (`OrderService.java:487, 497, 500–503`):
  - Transition valid per `OrderStatus.java:43, 47`: `case SHIPPED -> ... || nextStatus == CANCELLED;` -> `true`.
  - Line 497: `isReleasingReserved = true`.
  - Line 501: `currentStatus != OrderStatus.SHIPPED && currentStatus != OrderStatus.DELIVERY_FAILED`.
  - Since `currentStatus == SHIPPED` (or `DELIVERY_FAILED`), this check evaluates to **`FALSE`**!
  - **The entire inventory block is skipped.**
  - Numerical Values:
    - Current Code: $P = 90$, $R = 0$, $A = 90$.
- **Expected Business Accounting**:
  - Units were deducted at shipment ($P = 90$). The order is cancelled.
  - When units return to warehouse intake:
    - If units are returned physically: $P$ must become 100.
    - If intact: $A = 100$.
- **CRITICAL DEFECT DETECTED**:
  - In current code, `stockQuantity` remains **90**. The 10 units that were deducted at shipment are **PERMANENTLY LOST** from the database inventory!
  - There is no inventory restoration anywhere in the cancellation path.

---

#### Operation I: Return After Shipment
- **Trigger**: Courier returns rejected parcel -> `PUT /api/admin/orders/{orderNumber}/status` with `newStatus = RETURNED` (from `SHIPPED` or `DELIVERY_FAILED`)
- **Current Code Behavior** (`OrderService.java:487, 497–503`):
  - Transition valid per `OrderStatus.java:43, 47`: `case SHIPPED -> ... || nextStatus == RETURNED;` -> `true`.
  - Line 497: `isReleasingReserved = false` (only CANCELLED / EXPIRED).
  - Line 498: `isDeductingPhysical = false` (only SHIPPED / DELIVERED).
  - Condition `(isReleasingReserved || isDeductingPhysical)` evaluates to **`FALSE`**!
  - **The entire inventory block is skipped.**
  - Numerical Values:
    - Current Code: $P = 90$, $R = 0$, $A = 90$.
- **Expected Business Accounting**:
  - Courier returns package to warehouse intake dock.
  - Phase 1 (Intake): Physical units on hand increases by 10 ($P = 100$).
  - Phase 2 (Quarantine / Pending Inspection): Returned Stock ($Ret$) = 10. Available/Sellable Stock remains $A = 90, S = 90$ until inspected.
  - Phase 3 (Post-Inspection):
    - If verified pristine: $S = 100, A = 100, Ret = 0$.
    - If damaged/opened: $P = 100, Damaged = 10, S = 90, A = 90$.
- **CRITICAL DEFECT DETECTED**:
  - In current code, `stockQuantity` remains **90**.
  - The 10 returned units evaporate from the ledger.
  - The system has **zero restoration logic** for `RETURNED` status.

---

#### Operation J: Return After Delivery
- **Trigger**: Customer initiates return within 14-day statutory return window -> admin attempts `PUT /api/admin/orders/{orderNumber}/status` with `newStatus = RETURNED`
- **Current Code Behavior** (`OrderStatus.java:50`, `OrderService.java:487–493`):
  - `currentStatus` = `DELIVERED`.
  - Line 487 calls `currentStatus.canTransitionTo(newStatus)`.
  - In `OrderStatus.java:50`: `case DELIVERED, CANCELLED, EXPIRED, RETURNED, EXCHANGED -> false;`
  - `canTransitionTo(RETURNED)` returns **`FALSE`**!
  - Line 488 throws:
    ```
    BusinessException: لا يمكن تحويل حالة الطلب من 'تم التسليم بنجاح' إلى 'تم إرجاع الطلب'
    ```
  - **The request fails immediately with HTTP 400 Bad Request!**
  - In frontend `services/adminOrders.ts:31`: `DELIVERED: []` (empty array; UI disables/omits all options).
  - Numerical Values:
    - Current Code: **Operation Blocked (HTTP 400)**. $P = 90$, $R = 0$, $A = 90$.
- **Expected Business Accounting**:
  - Customer returns delivered items within 14 days under Egyptian Consumer Protection Law.
  - Order must record return request.
  - Warehouse receives parcel: $P = 100, Ret = 10$.
  - Quality inspection grades the item.
  - Restocking or damage write-off performed.
- **CRITICAL DEFECT DETECTED**:
  - The state machine treats `DELIVERED` as an immutable dead-end.
  - A legitimate customer return cannot even be entered into the system.

---

### 2.3 Numerical Accounting Comparison Matrix (Operations A through J)

| Op | Operation | State Transition | Code Location | Current Code $P$ | Current Code $R$ | Current Code $A$ | Expected $P$ | Expected $R$ | Expected $A$ | Expected $Ret$ | Expected $S$ | Discrepancy Status |
|:---:|:---|:---|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---|
| **A** | Order Placement | `-> PENDING_CONFIRMATION` | `OrderService.java:187` | 100 | 10 | 90 | 100 | 10 | 90 | 0 | 90 | **Match** |
| **B** | Confirmation | `PENDING -> CONFIRMED` | `OrderService.java:487, 543` | 100 | 10 | 90 | 100 | 10 | 90 | 0 | 90 | **Match** |
| **C** | Preparation | `CONFIRMED -> PREPARING` | `OrderService.java:487, 543` | 100 | 10 | 90 | 100 | 10 | 90 | 0 | 90 | **Match** |
| **D** | Shipment | `PREPARING -> SHIPPED` | `OrderService.java:529, 533` | 90 | 0 | 90 | 90 | 0 | 90 | 0 | 90 | **Match** (for dispatch) |
| **E** | Delivery | `SHIPPED -> DELIVERED` | `OrderService.java:501, 543` | 90 | 0 | 90 | 90 | 0 | 90 | 0 | 90 | **Match** (delivery complete) |
| **F** | Delivery Failure | `SHIPPED -> DELIVERY_FAILED` | `OrderService.java:497-501` | 90 | 0 | 90 | 90 | 0 | 90 | 10 (transit) | 90 | **Match on-hand; Missing transit tracking** |
| **G** | Cancellation Pre-Shipment | `PREPARING -> CANCELLED` | `OrderService.java:497, 529` | 100 | 0 | 100 | 100 | 0 | 100 | 0 | 100 | **Match** |
| **H** | Cancellation Post-Shipment | `SHIPPED -> CANCELLED` | `OrderService.java:501` (skipped) | **90** | **0** | **90** | **100** (dock) | **0** | **100** (intact) | **0** | **100** | **DEFECT**: Permanent stock loss (-10 units) |
| **I** | Return After Shipment | `SHIPPED -> RETURNED` | `OrderService.java:497-503` (skipped) | **90** | **0** | **90** | **100** (dock) | **0** | **90** (pre-insp) | **10** (intake) | **100** (post) | **DEFECT**: Permanent stock loss (-10 units) |
| **J** | Return After Delivery | `DELIVERED -> RETURNED` | `OrderStatus.java:50` (`false`) | **BLOCKED (400)** | **0** | **90** | **100** (dock) | **0** | **90** (pre-insp) | **10** (intake) | **100** (post) | **DEFECT**: Transition blocked + stock loss |

---

### 2.4 Analysis of the Assumption Regarding Returned Items
The previous naive proposal suggested inserting:
```java
product.setStockQuantity(stock + totalQty);
```
upon any transition to `CANCELLED` or `RETURNED`.

Our analysis demonstrates that **directly adding returned items to sellable stock without physical inspection is fundamentally flawed and introduces severe operational, financial, and technical risks**:

1. **Physical Location Disconnect (In-Flight Courier Transit Lag)**:
   - When an order transitions to `CANCELLED` or `RETURNED` in the admin dashboard, the physical parcel is almost always **in transit with a courier** across Egypt (Cairo, Alexandria, Upper Egypt, Frontier Governorates).
   - Couriers in Egypt typically require **3 to 7 business days** to return rejected COD shipments to the central fulfillment hub.
   - If software immediately executes `product.setStockQuantity(stock + totalQty)`, that stock is immediately exposed as Available to Promise ($A = P - R$).
   - New customers will place orders for stock that is **not physically in the warehouse**. This triggers immediate stockouts, pick failures, fulfillment delays, and cancellation cascades.

2. **Unboxing Contamination & Quality Degradation ("معاينة وفحص قبل الاستلام")**:
   - Varellion explicitly promises customers the right to unbox, inspect, and examine luxury watches and leather goods in front of the courier before payment (`frontend/src/app/policies/returns/page.tsx:49–52`, `frontend/public/llms.txt`).
   - During customer unboxing:
     - Protective cling films may be peeled off sapphire crystal dials or stainless steel bracelet clasps.
     - Full-grain cowhide leather straps and cardholders can be creased, scuffed, or scratched.
     - Luxury display packaging, warranty cards, or certificates of authenticity may be damaged, bent, or soiled.
   - If these uninspected items are directly credited to `stockQuantity`, the warehouse will subsequently pick and dispatch an open-box or scratched item to a new luxury customer paying full price, causing devastating brand damage.

3. **Damaged Goods & Fraud / Item-Swapping Hazards**:
   - Return courier transit carries substantial risk of package crushing, water damage, or rough handling.
   - High-value luxury horology and leather goods carry significant courier and recipient fraud exposure (e.g. swapping an authentic 316L Varellion chronograph for a counterfeit or damaged watch before returning the box to the courier).
   - Items with broken balance wheels, scratched crystals, or missing components must be routed to a **Damaged Goods / Scrap / Refurbished** ledger, **NEVER** returned to `stockQuantity`.

4. **Double Restoration Hazard**:
   - In the absence of an idempotency or state-guarded intake workflow:
     - If an admin marks an order `CANCELLED` while in transit (blindly adding +10 to stock), and later when the parcel arrives at the warehouse another admin marks it `RETURNED` (blindly adding another +10), stock is double-restored (+20 instead of +10).
     - Similarly, retry attempts or concurrent admin actions without atomic idempotency tokens will corrupt `stockQuantity`.

---

## 3. Caveats

1. **Customer Self-Service Returns**:
   No customer self-service return endpoint exists in the customer-facing REST API (`/api/orders`). All return coordination is handled offline via WhatsApp customer service (as documented in `frontend/src/app/policies/returns/page.tsx:81`), and status updates are executed by administrators via `PUT /api/admin/orders/{orderNumber}/status`.
2. **Third-Party Logistics (3PL) / Courier Integration**:
   The repository currently contains no direct courier webhooks (e.g. Bosta, Aramex, Mylerz) that automatically update order statuses to `DELIVERY_FAILED` or `RETURNED`. All transitions are performed via the admin dashboard.
3. **Product Archival / Deactivation**:
   If a product is deactivated (`isActive = false`) while an order is in transit, any eventual return workflow must account for deactivated products when deciding whether stock should be re-enabled for sale.

---

## 4. Conclusion

1. **Defect Hypothesis SEC-INV-01 is CONFIRMED**:
   The defect is real and substantiated by exact code evidence:
   - For **Operation H** (`SHIPPED / DELIVERY_FAILED -> CANCELLED`), lines 500–503 of `OrderService.java` deliberately bypass the inventory block, causing physical stock deducted at shipment to be permanently lost from the system.
   - For **Operation I** (`SHIPPED / DELIVERY_FAILED -> RETURNED`), lines 497–498 of `OrderService.java` do not include `RETURNED`, causing returned physical stock to be permanently lost from the system.
   - For **Operation J** (`DELIVERED -> RETURNED`), line 50 of `OrderStatus.java` designates `DELIVERED` as an immutable terminal state, causing any post-delivery return attempt to throw an HTTP 400 `BusinessException`.

2. **The Naive Remediation (`setStockQuantity(stock + totalQty)`) is REJECTED**:
   Blindly incrementing `stockQuantity` upon `CANCELLED` or `RETURNED` status changes creates high-severity business failure modes: overselling in-transit goods, selling uninspected/damaged/open-box watches to luxury customers, failing to detect fraud, and risking double restoration.

3. **Required Architectural Solution**:
   - **Phase 1 (Immediate / Safe Backend Fix)**:
     Permit legal status transitions (`DELIVERED -> RETURNED` in `OrderStatus.canTransitionTo`).
   - **Phase 2 (Return Intake & Physical Warehouse Separation)**:
     Separate **Order Status** (commercial contract) from **Physical Warehouse Intake** (logistics).
     A status of `RETURNED` or `CANCELLED` after shipment must indicate *commercial cancellation*, while physical stock restoration must be triggered **only upon physical intake and quality inspection** by warehouse personnel via a dedicated intake/restock action.

---

## 5. Verification Method

To independently verify the observations and logic in this report:

1. **Verify Inventory Fields in Entity & Migration**:
   ```bash
   # Inspect product inventory columns in DB migration:
   cat backend/src/main/resources/db/migration/V3__create_product_inventory_and_movements.sql
   # Inspect product entity fields:
   sed -n '50,65p' backend/src/main/java/com/varellion/store/catalog/entity/Product.java
   ```

2. **Verify Inventory Reconciliation Guard in `OrderService`**:
   ```bash
   # Inspect lines 496 to 540 of OrderService.java:
   sed -n '495,542p' backend/src/main/java/com/varellion/store/order/service/OrderService.java
   ```
   *Verification criterion*: Confirm that for `newStatus == OrderStatus.RETURNED`, `(isReleasingReserved || isDeductingPhysical)` evaluates to `false`. Confirm that for `currentStatus == OrderStatus.SHIPPED` and `newStatus == OrderStatus.CANCELLED`, `currentStatus != OrderStatus.SHIPPED` evaluates to `false`.

3. **Verify Terminal State of DELIVERED in `OrderStatus`**:
   ```bash
   # Inspect canTransitionTo switch expression:
   sed -n '26,53p' backend/src/main/java/com/varellion/store/order/entity/OrderStatus.java
   ```
   *Verification criterion*: Confirm that `case DELIVERED -> false`.

4. **Verify Absence of Inspection / Quarantine / Restock Workflows**:
   ```bash
   git grep -i "quarantine" backend/ frontend/
   git grep -i "restock" backend/ frontend/
   git grep -i -w "rma" backend/ frontend/
   git grep -i "damage" backend/ frontend/
   ```
   *Verification criterion*: All four commands must return exit code 1 (zero matches).

5. **Invalidation Conditions**:
   This report would be invalidated if:
   - Another service, event listener, or DB trigger silently restored `stockQuantity` upon order status changes to `CANCELLED` or `RETURNED`. (Verified: no such listener or trigger exists).
   - `OrderStatus.canTransitionTo` permitted transitions from `DELIVERED` to `RETURNED`. (Verified: line 50 returns `false`).
