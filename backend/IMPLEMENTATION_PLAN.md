# VARELLION — Production-Ready Backend API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:test-driven-development` and `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.  
> **CRITICAL EXECUTION GATE:** Implementation will NOT begin until this plan has been presented to and formally approved by the user.

**Goal:** Transform the VARELLION administrative backend from its current incomplete, bug-prone state into a production-grade, deployment-ready system by fixing critical inventory reconciliation and exception bugs, eliminating N+1 query storms, and delivering the essential MVP administrative domains (Dashboard, Categories, Operational Orders, and Customers).

**Architecture:** Layered Spring Boot 3 architecture adhering strictly to REST standards, stateless JWT security, PostgreSQL transactional integrity with pessimistic locking for inventory reconciliation, optimistic locking for order transitions, and standardized `ApiResponse<T>` / `ErrorResponse` envelopes.

**Tech Stack:** Java 21, Spring Boot 3.3.4, Spring Security 6.3, Spring Data JPA / Hibernate 6.5, PostgreSQL 15+ (Supabase), Flyway, JUnit 5, Mockito, MockMvc, AssertJ.

**Spec Reference:** [ENGINEERING_AUDIT.md](file:///home/mohamed-saad/Desktop/BRAND/ENGINEERING_AUDIT.md) and [ADMIN_API_AUDIT.md](file:///home/mohamed-saad/Desktop/BRAND/docs/admin/ADMIN_API_AUDIT.md).

## Global Constraints
- Strict role enforcement: All administrative endpoints under `/api/admin/**` require `ROLE_ADMIN`.
- Every transition and mutation affecting inventory must be strictly transactional and concurrency-safe.
- No client-provided prices, totals, or inventory quantities are trusted without server-side validation.
- All JSON responses must follow the standardized `ApiResponse<T>` or `ErrorResponse` envelope.
- Zero regression on existing 151 passing test cases.

## Review Focus
1. **Inventory Leakage:** Cancelling an order releases reserved stock; fulfilling an order (`SHIPPED`/`DELIVERED`) deducts physical stock.
2. **Type Mismatch Errors:** Sending invalid enum strings or bad UUIDs in query parameters or path variables must return `400 Bad Request`, never `500 Internal Server Error`.
3. **Database Check Constraints:** Submitting `price = 0.00` on active products or reducing stock below reserved quantity must be rejected gracefully at the service layer with `400 Bad Request`.
4. **Accidental Media Wiping:** Updating product metadata with omitted `images` field must preserve existing gallery images.
5. **N+1 Elimination:** Admin order and product listings must execute in bounded SQL queries (<= 2 queries per page).

---

## Task Decomposition

### Phase 1: Critical Bug Remediation & Stability Hardening

#### Task 1: Order Stock Reconciliation on Status Transitions (`OrderService.updateOrderStatus`)
**Files:**
- Modify: `backend/src/main/java/com/varellion/store/order/service/OrderService.java`
- Modify: `backend/src/test/java/com/varellion/store/order/service/OrderServiceTest.java`

- [ ] **Step 1: Write failing unit tests in `OrderServiceTest`**
  - Test 1: `updateOrderStatus_ReleasesReservedStock_WhenTransitioningToCancelled` (asserts `reservedQuantity` decrements by item quantity).
  - Test 2: `updateOrderStatus_ReleasesReservedStock_WhenTransitioningToExpired` (asserts `reservedQuantity` decrements).
  - Test 3: `updateOrderStatus_DeductsPhysicalAndReservedStock_WhenTransitioningToShipped` (asserts `stockQuantity` and `reservedQuantity` decrement).
  - Test 4: `updateOrderStatus_DoesNotDoubleDeduct_WhenTransitioningFromShippedToDelivered` (asserts physical stock already deducted in shipped status is not decremented twice).
- [ ] **Step 2: Run tests to verify they fail**
  - Command: `cd backend && mvn test -Dtest=OrderServiceTest#updateOrderStatus_ReleasesReservedStock_WhenTransitioningToCancelled`
  - Confirm Red status.
- [ ] **Step 3: Implement inventory reconciliation logic in `OrderService`**
  - In `updateOrderStatus`, inspect transition state:
    - If `newStatus == OrderStatus.CANCELLED || newStatus == OrderStatus.EXPIRED`:
      - Iterate over `order.getItems()`, acquire pessimistic write lock via `productRepository.findByIdForUpdate(item.getProduct().getProductId())`.
      - Decrement `product.reservedQuantity` by `item.getQuantity()` (bounded to `Math.max(0, ...)`).
      - Save product.
    - If `(newStatus == OrderStatus.SHIPPED || newStatus == OrderStatus.DELIVERED) && currentStatus != OrderStatus.SHIPPED`:
      - Iterate over `order.getItems()`, acquire pessimistic lock via `productRepository.findByIdForUpdate(...)`.
      - Decrement `product.stockQuantity` by `item.getQuantity()`.
      - Decrement `product.reservedQuantity` by `item.getQuantity()`.
      - Save product.
- [ ] **Step 4: Run tests to verify they pass**
  - Command: `cd backend && mvn test -Dtest=OrderServiceTest`
  - Confirm Green status.

---

#### Task 2: Global Exception Handling & Check Constraint Pre-Validation
**Files:**
- Modify: `backend/src/main/java/com/varellion/store/common/exception/GlobalExceptionHandler.java`
- Modify: `backend/src/main/java/com/varellion/store/admin/catalog/service/AdminProductService.java`
- Modify: `backend/src/main/java/com/varellion/store/security/jwt/JwtAuthenticationEntryPoint.java`
- Modify: `backend/src/main/java/com/varellion/store/security/jwt/JwtAccessDeniedHandler.java`
- Modify: `backend/src/test/java/com/varellion/store/common/exception/GlobalExceptionHandlerTest.java`
- Modify: `backend/src/test/java/com/varellion/store/admin/catalog/controller/AdminProductControllerTest.java`

- [ ] **Step 1: Write failing tests in `GlobalExceptionHandlerTest` & `AdminProductControllerTest`**
  - Test `MethodArgumentTypeMismatchException` produces HTTP 400 with parameter name.
  - Test `DataIntegrityViolationException` produces HTTP 400 with user-friendly message.
  - Test creating product with `price = 0.00` and `isActive = true` produces HTTP 400: `"لا يمكن تفعيل منتج بسعر صفر"`.
  - Test updating product with `stockQuantity < reservedQuantity` produces HTTP 400: `"لا يمكن تقليل كمية المخزون عن الكمية المحجوزة للطلبات الحالية"`.
- [ ] **Step 2: Run tests to verify failure**
  - Command: `cd backend && mvn test -Dtest=GlobalExceptionHandlerTest`
- [ ] **Step 3: Implement handlers and pre-validations**
  - Add `@ExceptionHandler(MethodArgumentTypeMismatchException.class)` in `GlobalExceptionHandler`.
  - Add `@ExceptionHandler(DataIntegrityViolationException.class)` in `GlobalExceptionHandler`.
  - In `AdminProductService.createProduct` and `updateProduct`: validate `if (Boolean.TRUE.equals(request.getIsActive()) && request.getPrice().compareTo(BigDecimal.ZERO) <= 0) throw new BusinessException(...)`.
  - In `AdminProductService.updateProduct`: validate `if (request.getStockQuantity() < product.getReservedQuantity()) throw new BusinessException(...)`.
  - In `AdminProductService.toggleProductStatus`: validate `if (isActive && product.getPrice().compareTo(BigDecimal.ZERO) <= 0) throw new BusinessException(...)`.
  - Fix image wiping in `AdminProductService.updateProduct`: Only clear images if `request.getImages() != null` (preserve existing if `null`).
  - Add `timestamp: LocalDateTime.now()` to `JwtAuthenticationEntryPoint` and `JwtAccessDeniedHandler`.
- [ ] **Step 4: Run tests to verify they pass**
  - Command: `cd backend && mvn test -Dtest=GlobalExceptionHandlerTest,AdminProductControllerTest`

---

#### Task 3: Eliminate N+1 Queries & Add Sorting to Admin Listings
**Files:**
- Modify: `backend/src/main/java/com/varellion/store/order/repository/OrderRepository.java`
- Modify: `backend/src/main/java/com/varellion/store/order/service/OrderService.java`
- Modify: `backend/src/main/java/com/varellion/store/admin/order/controller/AdminOrderController.java`
- Modify: `backend/src/main/java/com/varellion/store/catalog/repository/ProductRepository.java`
- Modify: `backend/src/main/java/com/varellion/store/admin/catalog/service/AdminProductService.java`
- Modify: `backend/src/main/java/com/varellion/store/admin/catalog/controller/AdminProductController.java`

- [ ] **Step 1: Write failing controller tests for sorting**
  - Test `/api/admin/orders?sortBy=totalAmount&sortDirection=ASC` accepts params and returns 200 OK.
  - Test `/api/admin/products?sortBy=price&sortDirection=DESC` accepts params and returns 200 OK.
- [ ] **Step 2: Implement query optimizations and dynamic sorting**
  - In `AdminOrderController` & `AdminProductController`: add `@RequestParam(defaultValue = "createdAt") String sortBy` and `@RequestParam(defaultValue = "DESC") String sortDirection`.
  - In `OrderService`: sanitize sort column (allow only `createdAt`, `totalAmount`, `orderStatus`), create `Sort` object, pass to repository.
  - In `AdminProductService`: sanitize sort column (allow only `createdAt`, `price`, `stockQuantity`, `nameAr`), pass to repository.
  - In `ProductRepository.findAdminProducts`: add `@BatchSize(size = 25)` or secondary batch fetch on `Product.images` to eliminate N+1 query storm.
- [ ] **Step 3: Run tests to verify they pass**
  - Command: `cd backend && mvn test -Dtest=AdminOrderControllerTest,AdminProductControllerTest`

---

#### Task 4: Complete Admin Catalog Service Unit Test Suite
**Files:**
- Create: `backend/src/test/java/com/varellion/store/admin/catalog/service/AdminProductServiceTest.java`
- Modify: `backend/src/test/java/com/varellion/store/admin/catalog/controller/AdminProductControllerTest.java`

- [ ] **Step 1: Write `AdminProductServiceTest` covering all service methods**
  - `getAdminProducts`: filtering by category, search, active status, and custom sorting.
  - `getAdminProductById`: success and not found.
  - `createProduct`: success with images, duplicate SKU conflict, category not found, active zero price validation.
  - `updateProduct`: success, category change, SKU change conflict, stock lower than reserved validation, image preservation.
  - `toggleProductStatus`: success and zero price guard.
  - `deleteProduct`: hard delete branch when `orderItemRepository.existsByProductId == false`, soft delete branch (`isActive = false`) when `existsByProductId == true`.
- [ ] **Step 2: Add missing test for `PUT /api/admin/products/{productId}` in `AdminProductControllerTest`**
  - Test `updateProduct_ValidPayload_Returns200`.
  - Test `updateProduct_StockLowerThanReserved_Returns400`.
- [ ] **Step 3: Run full catalog test suite**
  - Command: `cd backend && mvn test -Dtest=AdminProductServiceTest,AdminProductControllerTest`
  - Confirm 100% pass rate.

---

### Phase 2: High-Priority Missing Admin Domains (MVP Handover)

#### Task 5: Executive Dashboard & Analytics Service (`/api/admin/dashboard/**`)
**Files:**
- Create: `backend/src/main/java/com/varellion/store/admin/dashboard/controller/AdminDashboardController.java`
- Create: `backend/src/main/java/com/varellion/store/admin/dashboard/service/AdminDashboardService.java`
- Create: `backend/src/main/java/com/varellion/store/admin/dashboard/dto/DashboardSummaryDto.java`
- Create: `backend/src/main/java/com/varellion/store/admin/dashboard/dto/SalesAnalyticsDto.java`
- Create: `backend/src/test/java/com/varellion/store/admin/dashboard/AdminDashboardControllerTest.java`
- Create: `backend/src/test/java/com/varellion/store/admin/dashboard/AdminDashboardServiceTest.java`

- [ ] **Step 1: Write failing tests in `AdminDashboardControllerTest` & `AdminDashboardServiceTest`**
  - Test `GET /api/admin/dashboard/summary` returns KPI summary (revenue, total orders, pending orders, low stock count).
  - Test `GET /api/admin/dashboard/order-status-stats` returns map of order counts by status.
  - Test `GET /api/admin/dashboard/sales-analytics` returns daily timeline data.
  - Test non-admin receives 403 Forbidden.
- [ ] **Step 2: Run tests to verify failure**
- [ ] **Step 3: Implement DTOs, Service, and Controller**
  - Implement aggregation queries in `OrderRepository`, `ProductRepository`, `CustomerRepository`.
  - Calculate `totalRevenue` from non-cancelled/non-expired orders.
  - Expose secured endpoints under `@PreAuthorize("hasRole('ADMIN')")`.
- [ ] **Step 4: Run tests to verify they pass**
  - Command: `cd backend && mvn test -Dtest=AdminDashboard*`

---

#### Task 6: Admin Categories Management CRUD (`/api/admin/categories/**`)
**Files:**
- Create: `backend/src/main/java/com/varellion/store/admin/catalog/controller/AdminCategoryController.java`
- Create: `backend/src/main/java/com/varellion/store/admin/catalog/service/AdminCategoryService.java`
- Create: `backend/src/main/java/com/varellion/store/admin/catalog/dto/CreateCategoryRequest.java`
- Create: `backend/src/main/java/com/varellion/store/admin/catalog/dto/UpdateCategoryRequest.java`
- Create: `backend/src/main/java/com/varellion/store/admin/catalog/dto/AdminCategoryDto.java`
- Create: `backend/src/test/java/com/varellion/store/admin/catalog/controller/AdminCategoryControllerTest.java`
- Create: `backend/src/test/java/com/varellion/store/admin/catalog/service/AdminCategoryServiceTest.java`

- [ ] **Step 1: Write failing tests**
  - Test `GET /api/admin/categories` returns all categories with `productCount`.
  - Test `POST /api/admin/categories` creates category with slug regex validation.
  - Test duplicate slug returns 409 Conflict.
  - Test `DELETE /api/admin/categories/{id}` rejects with 409 Conflict if category contains products.
  - Test `DELETE /api/admin/categories/{id}` succeeds if category has no products.
- [ ] **Step 2: Implement Admin Category Service & Controller**
  - Add guarded relational check before deleting.
  - Provide complete CRUD: List, Get, Create, Update, Toggle Status, Delete.
- [ ] **Step 3: Run tests to verify they pass**
  - Command: `cd backend && mvn test -Dtest=AdminCategory*`

---

#### Task 7: Operational Orders Endpoints (Notes, Address Corrections & Counters)
**Files:**
- Modify: `backend/src/main/java/com/varellion/store/admin/order/controller/AdminOrderController.java`
- Modify: `backend/src/main/java/com/varellion/store/order/service/OrderService.java`
- Create: `backend/src/main/java/com/varellion/store/admin/order/dto/UpdateAdminNotesRequest.java`
- Create: `backend/src/main/java/com/varellion/store/admin/order/dto/UpdateDeliveryAddressRequest.java`
- Create: `backend/src/main/java/com/varellion/store/admin/order/dto/OrderStatusCountDto.java`
- Modify: `backend/src/test/java/com/varellion/store/admin/order/controller/AdminOrderControllerTest.java`
- Modify: `backend/src/test/java/com/varellion/store/order/service/OrderServiceTest.java`

- [ ] **Step 1: Write failing tests**
  - Test `PATCH /api/admin/orders/{orderNumber}/notes` updates `admin_notes` without changing status.
  - Test `PATCH /api/admin/orders/{orderNumber}/delivery-address` updates address on pending/confirmed order.
  - Test updating address on `SHIPPED` order throws `BusinessException` (400 Bad Request).
  - Test `GET /api/admin/orders/statistics` returns count breakdown for table badges.
- [ ] **Step 2: Implement service methods & endpoints**
  - Add `updateAdminNotes(orderNumber, notes)` in `OrderService`.
  - Add `updateOrderDeliveryAddress(orderNumber, addressReq)` in `OrderService` (recalculates shipping fee if governorate changes).
  - Add `getOrderStatusStatistics()` in `OrderService`.
- [ ] **Step 3: Run tests to verify they pass**
  - Command: `cd backend && mvn test -Dtest=AdminOrderControllerTest,OrderServiceTest`

---

#### Task 8: Admin Customer Management (`/api/admin/customers/**`)
**Files:**
- Create: `backend/src/main/java/com/varellion/store/admin/customer/controller/AdminCustomerController.java`
- Create: `backend/src/main/java/com/varellion/store/admin/customer/service/AdminCustomerService.java`
- Create: `backend/src/main/java/com/varellion/store/admin/customer/dto/AdminCustomerSummaryDto.java`
- Create: `backend/src/main/java/com/varellion/store/admin/customer/dto/AdminCustomerDetailDto.java`
- Create: `backend/src/test/java/com/varellion/store/admin/customer/AdminCustomerControllerTest.java`
- Create: `backend/src/test/java/com/varellion/store/admin/customer/AdminCustomerServiceTest.java`

- [ ] **Step 1: Write failing tests**
  - Test `GET /api/admin/customers` returns paginated customers with `totalSpent` and `totalOrders`.
  - Test `GET /api/admin/customers/{id}` returns customer detail with saved address.
  - Test `GET /api/admin/customers/{id}/orders` returns customer's orders.
  - Test `PATCH /api/admin/customers/{id}/status` toggles `customers.is_active`.
- [ ] **Step 2: Implement Customer Admin Service & Controller**
  - Query joins across `customers`, `users`, and `orders`.
- [ ] **Step 3: Run tests to verify they pass**
  - Command: `cd backend && mvn test -Dtest=AdminCustomer*`

---

## 4. Risks & Dependencies

| Risk | Severity | Mitigation Strategy |
| :--- | :---: | :--- |
| **Concurrent inventory modification during status update** | High | Pessimistic write locking (`findByIdForUpdate`) applied in sorted product ID order. |
| **Optimistic lock collisions during order updates** | Medium | Handled via `@Version` column and caught by `GlobalExceptionHandler` returning HTTP 409. |
| **Database check constraint drift** | Medium | Server-side validation mirrored exactly to PostgreSQL constraints before executing SQL. |
| **Regression in existing checkout/customer APIs** | High | Full test suite execution after every task commit. |

---

## 5. Acceptance Criteria

1. Order cancellation and expiration releases reserved stock back to available inventory.
2. Order fulfillment (`SHIPPED`/`DELIVERED`) decrements physical stock and clears reserved inventory.
3. Zero client requests trigger an unhandled HTTP 500 error; all validation and type mismatches return structured HTTP 400.
4. Product updates do not delete existing images if the image field is omitted.
5. All 32 missing endpoints identified in the audit are documented with complete API contracts.
6. Phase 1 and Phase 2 tasks are delivered with >90% test coverage and 0 test failures.
7. Existing 151 backend tests continue to pass with 0 failures or errors.

---

## 6. Rollback Considerations

- All database queries leverage backward-compatible schemas (`V1` through `V13`).
- No destructive DDL is required for Phase 1 or Phase 2.
- If an unexpected regression occurs in `OrderService#updateOrderStatus`, it can be rolled back to the previous Git commit without requiring database schema recovery.
