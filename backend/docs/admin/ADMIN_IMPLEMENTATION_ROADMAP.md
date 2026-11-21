# VARELLION — Admin Implementation Roadmap

> **Author:** Senior Backend Engineer & System Architect  
> **Target Scope:** VARELLION Luxury E-Commerce Admin Backend  
> **Strategy:** Phased, test-driven delivery prioritizing critical bug fixes, MVP dashboard unblocking, and scalable architecture.

---

## 1. Roadmap Architecture & Execution Strategy

```
+-----------------------------------------------------------------------------------------------------------------------+
|                                           ADMIN IMPLEMENTATION TIMELINE                                               |
+-----------------------------------------------------------------------------------------------------------------------+
| PHASE 1: CRITICAL REMEDIATION         | PHASE 2: MVP DASHBOARD UNBLOCKING    | PHASE 3: STAFF & OPERATIONS            |
| (Bug Fixes, Inventory & Exceptions)   | (Dashboard, Categories, Customers)   | (Staff, Shipping & Exports)            |
|                                       |                                      |                                        |
| 1.1 Order Stock Reconciliation        | 2.1 Executive Dashboard APIs         | 3.1 Admin Staff & User Management      |
| 1.2 DB Check Constraint Hardening     | 2.2 Category Catalog CRUD            | 3.2 Inventory Quick Adjust & Low Stock |
| 1.3 N+1 Query & Sorting Fixes         | 2.3 Order Notes & Address Updates    | 3.3 Dynamic Shipping & Order Export    |
| 1.4 Admin Product Service Tests       | 2.4 Admin Customer Management        | 3.4 Consolidated Audit Trail           |
+-----------------------------------------------------------------------------------------------------------------------+
```

---

## 2. Phase 1: Critical Bug Remediation & Stability Hardening (P0 / Immediate)

*Goal: Eliminate data corruption risks, prevent unhandled HTTP 500 crashes, and resolve N+1 database performance bottlenecks.*

---

### Task 1.1: Order Stock Reconciliation on Status Transitions
- **What Needs to Be Implemented:**
  Reconcile product physical stock (`stock_quantity`) and reserved stock (`reserved_quantity`) inside `OrderService#updateOrderStatus`:
  1. **When transitioning to `CANCELLED` or `EXPIRED`:**
     - For each line item, decrement `product.reservedQuantity` by `item.getQuantity()`.
     - Releases inventory back to available stock.
  2. **When transitioning to `SHIPPED` or `DELIVERED` (from `CONFIRMED` or `PREPARING`):**
     - For each line item, decrement `product.stockQuantity` by `item.getQuantity()` and decrement `product.reservedQuantity` by `item.getQuantity()`.
     - Converts reserved inventory into completed physical fulfillment.
  3. **Concurrency:**
     - Acquire pessimistic write locks (`productRepository.findByIdForUpdate`) in deterministic product ID order to prevent race conditions and deadlocks.
- **Why Needed:** Currently, cancelling orders locks reserved stock forever, and shipping orders never reduces physical stock.
- **Packages Involved:**
  - `com.varellion.store.order.service`
  - `com.varellion.store.catalog.repository`
  - `com.varellion.store.catalog.entity`
- **Dependencies:** `ProductRepository#findByIdForUpdate`, `OrderItemRepository`.
- **Tests Required:**
  - Unit test in `OrderServiceTest`: Verify `reservedQuantity` decrements when transitioning from `PENDING_CUSTOMER_CONFIRMATION` to `CANCELLED`.
  - Unit test in `OrderServiceTest`: Verify `stockQuantity` and `reservedQuantity` decrement when transitioning from `CONFIRMED` to `SHIPPED`.
  - Edge case test: Verify idempotent no-op does not duplicate inventory deductions.
- **Definition of Done:** All order status transitions accurately adjust physical and reserved inventory, verified by passing automated unit and integration tests.

---

### Task 1.2: Global Exception Handling & Check Constraint Pre-Validation
- **What Needs to Be Implemented:**
  1. Add `@ExceptionHandler(MethodArgumentTypeMismatchException.class)` to `GlobalExceptionHandler` returning `400 Bad Request` with an informative message.
  2. Add `@ExceptionHandler(DataIntegrityViolationException.class)` to `GlobalExceptionHandler` returning `400 Bad Request` for database check constraint failures.
  3. Add pre-validation in `AdminProductService`:
     - Reject creating/updating an active product with `price <= 0.00` before saving.
     - Reject updating `stockQuantity` to a value lower than the current `reservedQuantity`.
  4. Ensure `JwtAuthenticationEntryPoint` and `JwtAccessDeniedHandler` include `timestamp` in their error JSON to match `ErrorResponse`.
- **Why Needed:** Eliminates misleading HTTP 500 crashes for invalid query parameters and database check constraint collisions.
- **Packages Involved:**
  - `com.varellion.store.common.exception`
  - `com.varellion.store.admin.catalog.service`
  - `com.varellion.store.security.jwt`
- **Tests Required:**
  - `GlobalExceptionHandlerTest`: Test that passing invalid enum to query param yields 400 Bad Request.
  - `AdminProductControllerTest`: Test creating product with price 0 and isActive=true yields 400 Bad Request.
  - `AdminProductControllerTest`: Test reducing stock below reserved quantity yields 400 Bad Request.
- **Definition of Done:** No client input or check constraint failure generates an HTTP 500 error.

---

### Task 1.3: Eliminate N+1 Queries & Add Sorting to Admin Listings
- **What Needs to Be Implemented:**
  1. In `ProductRepository.findAdminProducts`: Join fetch or batch-fetch `images` to prevent N queries during DTO mapping.
  2. In `OrderRepository.findAdminOrders`: Implement lightweight summary projection DTO (`AdminOrderSummaryDto`) for the table view to avoid loading full item trees and status history.
  3. Add optional `sortBy` and `sortDirection` parameters to `/api/admin/orders` (sort by `createdAt`, `totalAmount`, `orderStatus`) and `/api/admin/products` (sort by `createdAt`, `price`, `stockQuantity`, `nameAr`).
- **Why Needed:** Resolves query storms and enables essential UI table sorting for administrators.
- **Packages Involved:**
  - `com.varellion.store.catalog.repository`
  - `com.varellion.store.order.repository`
  - `com.varellion.store.admin.catalog.service`
  - `com.varellion.store.order.service`
- **Tests Required:**
  - Controller tests asserting that custom sort parameters (`?sortBy=price&sortDirection=ASC`) are accepted and passed to repository.
  - Repository tests verifying single SQL query execution without secondary N+1 fetches.
- **Definition of Done:** Page query executes in <= 2 SQL statements regardless of page size; sorting operates on all specified columns.

---

### Task 1.4: Admin Catalog Service Unit Test Suite
- **What Needs to Be Implemented:**
  Create `AdminProductServiceTest.java` with comprehensive test coverage for:
  - `createProduct`: success, duplicate SKU conflict, category not found.
  - `updateProduct`: success, SKU change, category change, image update, stock lower than reserved.
  - `toggleProductStatus`: success, zero-price active guard.
  - `deleteProduct`: hard delete when no order history, soft delete (`isActive = false`) when order history exists.
- **Why Needed:** `AdminProductService` currently has zero dedicated service-layer unit tests.
- **Packages Involved:**
  - `src/test/java/com/varellion/store/admin/catalog/service/AdminProductServiceTest.java`
- **Definition of Done:** `AdminProductServiceTest` reaches > 90% branch coverage and runs cleanly in CI.

---

## 3. Phase 2: High-Priority Missing Admin Domains (MVP Dashboard)

*Goal: Provide all backend APIs required to deliver a complete, operational Next.js Admin Dashboard.*

---

### Task 2.1: Executive Dashboard & Analytics Service
- **What Needs to Be Implemented:**
  Create package `com.varellion.store.admin.dashboard` containing:
  - `AdminDashboardController` with endpoints:
    - `GET /api/admin/dashboard/summary` (revenue, total orders, active orders, low stock count, customer count).
    - `GET /api/admin/dashboard/order-status-stats` (counts grouped by `OrderStatus`).
    - `GET /api/admin/dashboard/sales-analytics` (time-series daily/monthly revenue aggregation).
  - `AdminDashboardService` executing optimized aggregation queries on `orders`, `products`, and `customers`.
- **Why Needed:** Allows the frontend to build the main dashboard home page (`/admin`) with real-time business metrics.
- **Packages Involved:**
  - `com.varellion.store.admin.dashboard.controller`
  - `com.varellion.store.admin.dashboard.service`
  - `com.varellion.store.admin.dashboard.dto`
- **Dependencies:** `OrderRepository`, `ProductRepository`, `CustomerRepository`.
- **Tests Required:**
  - Unit tests verifying revenue summation excludes cancelled/expired orders.
  - Controller tests verifying `ROLE_ADMIN` protection and JSON schema.
- **Definition of Done:** Dashboard home page loads real-time KPIs in < 200ms without calculating metrics client-side.

---

### Task 2.2: Administrative Categories Management CRUD
- **What Needs to Be Implemented:**
  Create admin category endpoints under `/api/admin/categories`:
  - `GET /api/admin/categories`: List all categories (active & inactive) with `productCount`.
  - `POST /api/admin/categories`: Create category (validates slug regex and uniqueness).
  - `GET /api/admin/categories/{categoryId}`: Category detail.
  - `PUT /api/admin/categories/{categoryId}`: Update category.
  - `PATCH /api/admin/categories/{categoryId}/status`: Toggle active status.
  - `DELETE /api/admin/categories/{categoryId}`: Guarded deletion (rejects with 409 if products belong to category).
- **Why Needed:** Admins currently cannot create or manage catalog categories, blocking product categorization.
- **Packages Involved:**
  - `com.varellion.store.admin.catalog.controller.AdminCategoryController`
  - `com.varellion.store.admin.catalog.service.AdminCategoryService`
  - `com.varellion.store.catalog.repository.CategoryRepository`
- **Dependencies:** `CategoryRepository`, `ProductRepository`.
- **Tests Required:**
  - Test category creation with duplicate slug returns 409.
  - Test category deletion with attached products returns 409.
  - Test category deletion without products returns 200 and deletes record.
- **Definition of Done:** Full category lifecycle operable from Admin UI with complete relational safeguards.

---

### Task 2.3: Orders Operational Endpoints (Notes, Address Corrections & Counters)
- **What Needs to Be Implemented:**
  Add operational endpoints to `AdminOrderController`:
  - `PATCH /api/admin/orders/{orderNumber}/notes`: Update `admin_notes` without altering status.
  - `PATCH /api/admin/orders/{orderNumber}/delivery-address`: Update recipient phone and address prior to shipment; recalculates shipping fee if governorate changes.
  - `GET /api/admin/orders/statistics`: Status counts specifically structured for table tab badges.
- **Why Needed:** Fulfills daily customer service requests (address fixes, delivery notes) without manual database updates.
- **Packages Involved:**
  - `com.varellion.store.admin.order.controller.AdminOrderController`
  - `com.varellion.store.order.service.OrderService`
- **Tests Required:**
  - Test updating notes persists to DB and appears in response.
  - Test updating address on `SHIPPED` order is rejected with 400.
  - Test updating governorate recalculates shipping fee correctly.
- **Definition of Done:** Admin can modify notes and address on eligible orders; order list tabs display live counts.

---

### Task 2.4: Admin Customer Management
- **What Needs to Be Implemented:**
  Create package `com.varellion.store.admin.customer` containing:
  - `AdminCustomerController` with endpoints:
    - `GET /api/admin/customers`: Paginated customers directory with search and lifetime spend.
    - `GET /api/admin/customers/{customerId}`: Full customer profile, saved address, and lifetime stats.
    - `GET /api/admin/customers/{customerId}/orders`: Customer order history.
    - `PATCH /api/admin/customers/{customerId}/status`: Toggle active/suspended state.
  - `AdminCustomerService` joining `customers`, `users`, and `orders`.
- **Why Needed:** Powers the `/admin/customers` section of the dashboard.
- **Packages Involved:**
  - `com.varellion.store.admin.customer.controller`
  - `com.varellion.store.admin.customer.service`
  - `com.varellion.store.customer.repository`
- **Dependencies:** `CustomerRepository`, `UserRepository`, `OrderRepository`.
- **Tests Required:**
  - Controller tests verifying pagination, search, and 403 for non-admins.
  - Service tests asserting lifetime spend calculation accuracy.
- **Definition of Done:** Admin can browse customers, view their complete order history, and suspend abusive accounts.

---

## 4. Phase 3: Staff Security, Inventory Adjustments & Operations

*Goal: Provide staff user management, quick inventory adjustments, dynamic shipping pricing, and order exports.*

---

### Task 3.1: Administrator & Staff User Management
- **What Needs to Be Implemented:**
  Create package `com.varellion.store.admin.security` containing:
  - `AdminUserController` with endpoints:
    - `GET /api/admin/users`: List administrative staff with lockout status.
    - `POST /api/admin/users`: Create an admin/staff account with BCrypt password hashing.
    - `PATCH /api/admin/users/{userId}/status`: Enable or disable staff account.
    - `POST /api/admin/users/{userId}/unlock`: Unlock account locked by failed attempts.
    - `PATCH /api/admin/users/{userId}/role`: Promote/demote role with self-demotion protection guard.
- **Why Needed:** Removes dependency on raw SQL seeds or hardcoded `ADMIN_EMAILS` environment variables.
- **Packages Involved:**
  - `com.varellion.store.admin.security.controller`
  - `com.varellion.store.admin.security.service`
  - `com.varellion.store.security.repository.UserRepository`
- **Tests Required:**
  - Test admin self-demotion rejection (cannot demote yourself).
  - Test account unlocking resets `failedAttempts` to 0 and `lockoutTime` to null.
- **Definition of Done:** Staff accounts can be created, managed, and unlocked entirely through the Admin UI.

---

### Task 3.2: Dedicated Stock Adjustment & Low-Stock Alerts
- **What Needs to Be Implemented:**
  Add endpoints to `AdminProductController`:
  - `PATCH /api/admin/products/{productId}/stock`: Quick stock adjustment with reason.
  - `GET /api/admin/products/low-stock`: Retrieve products below threshold.
- **Why Needed:** Streamlines warehouse restocking without risking accidental changes to product metadata or wiping media galleries.
- **Packages Involved:**
  - `com.varellion.store.admin.catalog.controller.AdminProductController`
  - `com.varellion.store.admin.catalog.service.AdminProductService`
- **Definition of Done:** Restocking takes a single lightweight API call and immediately reflects in available stock.

---

### Task 3.3: Dynamic Shipping Rates & Orders Export
- **What Needs to Be Implemented:**
  1. Create Flyway migration `V14__create_shipping_rates_table.sql` storing governorates, shipping fees, delivery estimates, and free shipping threshold.
  2. Create `AdminShippingController` with `GET` and `PUT` endpoints under `/api/admin/shipping/rates`.
  3. Refactor `OrderService#calculateAuthoritativeShippingFee` to read from the shipping repository with fallback to existing rates.
  4. Create `GET /api/admin/orders/export` producing a CSV stream of filtered orders for courier dispatch.
- **Why Needed:** Eliminates hardcoded shipping rates in Java and enables batch courier dispatch.
- **Packages Involved:**
  - `com.varellion.store.shipping.*`
  - `com.varellion.store.order.service`
  - `com.varellion.store.admin.order.controller`
- **Definition of Done:** Shipping fees can be edited via Admin UI and immediately apply to new checkouts; orders export to valid CSV.

---

## 5. Summary Implementation Matrix & Traceability

```
+---------------------------------------------------------------------------------------------------------------------------------+
|                                                TASK TRACEABILITY MATRIX                                                         |
+------+-----------------------------+----------+--------------------------+-----------------------+------------------------------+
| Task | Title                       | Priority | Packages Involved        | Depends On            | Success Metric / DoD         |
+------+-----------------------------+----------+--------------------------+-----------------------+------------------------------+
| 1.1  | Order Stock Reconciliation  | CRITICAL | store.order.service      | ProductRepository     | Zero inventory leakage.      |
| 1.2  | Exception Handler Hardening | HIGH     | store.common.exception   | GlobalExceptionHandler| Zero HTTP 500 on bad input.  |
| 1.3  | N+1 & Sorting Elimination   | HIGH     | store.*.repository       | OrderRepository       | Single query, full sorting.  |
| 1.4  | Product Service Test Suite  | HIGH     | store.admin.catalog      | AdminProductService   | >90% test coverage.          |
| 2.1  | Dashboard & Analytics APIs  | HIGH     | store.admin.dashboard    | OrderRepository       | Dashboard loads in < 200ms.  |
| 2.2  | Admin Category Management   | HIGH     | store.admin.catalog      | CategoryRepository    | Full Category CRUD in UI.    |
| 2.3  | Operational Order Endpoints | HIGH     | store.admin.order        | OrderService          | Address/notes editable.      |
| 2.4  | Admin Customer Directory    | HIGH     | store.admin.customer     | CustomerRepository    | Customer history visible.    |
| 3.1  | Staff User Management       | HIGH     | store.admin.security     | UserRepository        | Staff created without SQL.   |
| 3.2  | Quick Stock Adjustment      | HIGH     | store.admin.catalog      | AdminProductService   | Restock in 1 call.           |
| 3.3  | Dynamic Shipping & Export   | MEDIUM   | store.shipping, order    | Flyway V14            | Courier CSV export ready.    |
+------+-----------------------------+----------+--------------------------+-----------------------+------------------------------+
```
