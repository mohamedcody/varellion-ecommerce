# VARELLION — Comprehensive Admin API Audit Report

> **Auditor Role:** Senior Backend Engineer, API Architect & Security Auditor  
> **Target System:** VARELLION Luxury E-Commerce Backend (Spring Boot 3.3.4, Java 21, Spring Security 6.3, PostgreSQL 15+ / Supabase, Hibernate 6.5)  
> **Audit Date:** November 2026  
> **Audit Scope:** Complete line-by-line verification of all administrative REST endpoints, database schemas, domain logic, authorization policies, and automated tests.

---

## 1. Executive Audit Overview

The VARELLION backend architecture isolates administrative functionality under the `/api/admin/**` URI prefix, guarded at the Spring Security filter chain layer by `hasRole('ADMIN')` and enforced on controller classes with method security `@PreAuthorize("hasRole('ADMIN')")`.

A rigorous static and dynamic analysis of the codebase confirms that **exactly nine (9) administrative endpoints** are currently implemented across two controller classes:
1. `AdminOrderController` (3 endpoints)
2. `AdminProductController` (6 endpoints)

All other administrative modules referenced in earlier architectural drafts (including Executive Dashboard, Admin Customer Management, User/Staff Management, Category Management, Inventory Movements, Shipping Management, and Audit Logs) **do not exist in the codebase**.

### Audit Verdict Summary

| Endpoint URL | HTTP Method | Controller Class | Service Method | Audit Status | Key Finding / Vulnerability |
| :--- | :---: | :--- | :--- | :---: | :--- |
| `/api/admin/orders` | `GET` | `AdminOrderController` | `OrderService.getAdminOrders` | **NEEDS FIX** | N+1 query storm on line items and history; over-fetching full entities in list view; no sorting; unhandled enum type mismatch yields HTTP 500. |
| `/api/admin/orders/{orderNumber}` | `GET` | `AdminOrderController` | `OrderService.getAdminOrderByNumber` | **PASS WITH WARNINGS** | Functionally sound; lazy-loads `statusHistory`; does not expose customer email/account ID. |
| `/api/admin/orders/{orderNumber}/status` | `PUT` | `AdminOrderController` | `OrderService.updateOrderStatus` | **NEEDS FIX** | **CRITICAL BUSINESS BUG:** Zero inventory adjustment. Cancelling does not release reserved stock; fulfillment does not deduct physical stock. Permanent inventory leak. |
| `/api/admin/products` | `GET` | `AdminProductController` | `AdminProductService.getAdminProducts` | **PASS WITH WARNINGS** | N+1 query on lazy product images; hardcoded sort (`createdAt DESC`); missing service-level unit tests. |
| `/api/admin/products/{productId}` | `GET` | `AdminProductController` | `AdminProductService.getAdminProductById` | **PASS WITH WARNINGS** | Accurate metrics; malformed UUID path variable throws unhandled exception yielding HTTP 500. |
| `/api/admin/products` | `POST` | `AdminProductController` | `AdminProductService.createProduct` | **NEEDS FIX** | Database check constraint crash (`chk_active_product_price`) on `price = 0.00` and `isActive = true` yields HTTP 500; no image URL format validation. |
| `/api/admin/products/{productId}` | `PUT` | `AdminProductController` | `AdminProductService.updateProduct` | **NEEDS FIX** | **Completely untested** in test suite; DB constraint crash if `stockQuantity < reservedQuantity`; clears all product images if image array is omitted. |
| `/api/admin/products/{productId}/status` | `PATCH` | `AdminProductController` | `AdminProductService.toggleProductStatus` | **PASS WITH WARNINGS** | Toggling active on a zero-price product triggers DB constraint crash (HTTP 500); lazy-loads category/images during DTO mapping. |
| `/api/admin/products/{productId}` | `DELETE` | `AdminProductController` | `AdminProductService.deleteProduct` | **PASS WITH WARNINGS** | Safe relational check prevents deleting products with orders; returns raw localized Arabic string instead of structured machine-readable DTO. |

---

## 2. In-Depth Engineering Audit of Discovered Admin APIs

```
+---------------------------------------------------------------------------------------------------------+
|                                    DISCOVERED ADMIN ENDPOINTS (9)                                       |
+---+--------+---------------------------------------+------------------------+---------------------------+
| # | Method | Endpoint                              | Controller             | Status                    |
+---+--------+---------------------------------------+------------------------+---------------------------+
| 1 | GET    | /api/admin/orders                     | AdminOrderController   | NEEDS FIX                 |
| 2 | GET    | /api/admin/orders/{orderNumber}       | AdminOrderController   | PASS WITH WARNINGS        |
| 3 | PUT    | /api/admin/orders/{orderNumber}/status| AdminOrderController   | NEEDS FIX (CRITICAL)      |
| 4 | GET    | /api/admin/products                   | AdminProductController | PASS WITH WARNINGS        |
| 5 | GET    | /api/admin/products/{productId}       | AdminProductController | PASS WITH WARNINGS        |
| 6 | POST   | /api/admin/products                   | AdminProductController | NEEDS FIX                 |
| 7 | PUT    | /api/admin/products/{productId}       | AdminProductController | NEEDS FIX                 |
| 8 | PATCH  | /api/admin/products/{productId}/status| AdminProductController | PASS WITH WARNINGS        |
| 9 | DELETE | /api/admin/products/{productId}       | AdminProductController | PASS WITH WARNINGS        |
+---+--------+---------------------------------------+------------------------+---------------------------+
```

---

### API 01: `GET /api/admin/orders`

#### A. API Information
- **HTTP Method:** `GET`
- **Full Endpoint URL:** `/api/admin/orders`
- **Controller Class:** `com.varellion.store.admin.order.controller.AdminOrderController#getAdminOrders`
- **Service Method:** `com.varellion.store.order.service.OrderService#getAdminOrders(int page, int limit, OrderStatus status, String search)`
- **Repository Method:** `com.varellion.store.order.repository.OrderRepository#findAdminOrders(OrderStatus status, String search, Pageable pageable)`
- **Purpose:** Paginated administrative listing of customer orders with optional status filter and customer/order search.
- **Required Role:** `ROLE_ADMIN` (`@PreAuthorize("hasRole('ADMIN')")` and `.requestMatchers("/api/admin/**").hasRole("ADMIN")`).

#### B. Request Contract
- **Query Parameters:**
  - `page` (`int`, optional, default: `0`): Zero-based page index. Sanitized via `Math.max(0, page)`.
  - `limit` (`int`, optional, default: `10`): Items per page. Sanitized via `Math.max(1, Math.min(100, limit))`.
  - `status` (`OrderStatus`, optional): Target lifecycle status.
  - `search` (`String`, optional): Substring matched case-insensitively against `orderNumber`, `customerPhone`, or `customerName`.
- **Invalid Request Scenarios:**
  - Sending non-numeric `page` or `limit` triggers Spring `MethodArgumentTypeMismatchException` -> yields HTTP 500 because the exception is unhandled in `GlobalExceptionHandler`.
  - Sending an invalid `status` string (e.g. `?status=COMPLETED` instead of `CONFIRMED`) triggers `MethodArgumentTypeMismatchException` -> yields HTTP 500 instead of 400 Bad Request.

#### C. Response Contract
- **HTTP Status Codes:** `200 OK`, `401 Unauthorized`, `403 Forbidden`, `500 Internal Server Error` (on bad param types).
- **Actual Response DTO:** `ApiResponse<PagedOrdersResponse>`
- **Response JSON Structure:**
  ```json
  {
    "timestamp": "2026-11-16T14:30:00.123456",
    "success": true,
    "message": "Operation successful",
    "data": {
      "orders": [
        {
          "orderId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "orderNumber": "VAR-20261028-0001",
          "customerName": "محمد أحمد",
          "customerPhone": "01012345678",
          "shippingGovernorate": "القاهرة",
          "shippingCityArea": "المعادي",
          "shippingDetailedAddress": "شارع 9",
          "currency": "EGP",
          "subtotal": 1850.00,
          "discountTotal": 0.00,
          "shippingFee": 50.00,
          "totalAmount": 1900.00,
          "orderStatus": "SHIPPED",
          "statusDisplayAr": "مع مندوب التوصيل",
          "statusDisplayEn": "Out for Delivery",
          "shippingFeeStatus": "PENDING",
          "estimatedDeliveryAr": "2-3 أيام عمل",
          "confirmationDeadline": "2026-10-29T14:00:00Z",
          "customerNotes": "يرجى الاتصال قبل الوصول",
          "paymentMethod": "CASH_ON_DELIVERY",
          "createdAt": "2026-10-28T14:00:00Z",
          "updatedAt": "2026-10-28T14:30:00Z",
          "items": [ ... ],
          "statusHistory": [ ... ]
        }
      ],
      "totalElements": 1,
      "totalPages": 1,
      "currentPage": 0,
      "pageSize": 10
    }
  }
  ```
- **Empty Results:** Returns `200 OK` with `orders: []`, `totalElements: 0`, `totalPages: 0`.

#### D. Business Logic & Performance Audit
1. **Severe N+1 Query Problem:** `OrderRepository.findAdminOrders` selects only root `Order` entities. When `orderService.mapToDto` processes the page, accessing `order.getItems()` and `order.getStatusHistory()` triggers lazy loading. In `mapItemToDto`, accessing `item.getProduct().getImages()` triggers lazy loading for `Product` and `ProductImage`. For a standard page of 20 orders with 3 items each, **over 80 queries are executed per request**.
2. **Over-fetching in List View:** Returning full items and historical audit arrays in a dashboard table view wastes network bandwidth and database I/O.
3. **No Sorting Support:** Sorting is hardcoded to `ORDER BY o.createdAt DESC` in JPQL. Admin users cannot sort by total amount, status, or customer name.
4. **No Date Range Filtering:** The API cannot filter by date ranges (`startDate`, `endDate`), preventing common reporting operations.

#### E. Security Audit
- Endpoint is protected by Spring Security filter and `@PreAuthorize("hasRole('ADMIN')")`.
- Unauthenticated requests receive 401; non-admin users receive 403.
- No sensitive credentials leaked.

#### F. Testing Audit
- `AdminOrderControllerTest#getAdminOrders_Success_WhenAdminRole`: Verifies 200 OK with mocked service.
- `AdminOrderControllerTest#getAdminOrders_Forbidden_WhenNotAdmin`: Verifies 403 Forbidden.
- **Defects:** No unit or integration test exists for `OrderService#getAdminOrders` in `OrderServiceTest`. No test checks parameter conversion failures or SQL performance.

**Final Status:** **NEEDS FIX**

---

### API 02: `GET /api/admin/orders/{orderNumber}`

#### A. API Information
- **HTTP Method:** `GET`
- **Full Endpoint URL:** `/api/admin/orders/{orderNumber}`
- **Controller Class:** `com.varellion.store.admin.order.controller.AdminOrderController#getAdminOrderByNumber`
- **Service Method:** `com.varellion.store.order.service.OrderService#getAdminOrderByNumber(String orderNumber)`
- **Repository Method:** `com.varellion.store.order.repository.OrderRepository#findByOrderNumberWithDetails(String orderNumber)`
- **Purpose:** Full administrative detail view of a single order.
- **Required Role:** `ROLE_ADMIN`

#### B. Request Contract
- **Path Variable:** `orderNumber` (`String`, required).
- **Validation:** `@Pattern(regexp = "^VAR-\\d{8}-\\d{4}$", message = "صيغة رقم الطلب غير صحيحة")`
- **Invalid Scenarios:**
  - Malformed order number (e.g. `VAR-123`) fails `@Pattern` validation, returning `400 Bad Request` with message: `"صيغة رقم الطلب غير صحيحة"`.

#### C. Response Contract
- **HTTP Status Codes:** `200 OK`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.
- **Response DTO:** `ApiResponse<OrderResponseDto>`
- **Error Response (404):**
  ```json
  {
    "timestamp": "2026-11-16T14:30:00.123456",
    "status": 404,
    "error": "Not Found",
    "message": "لم نتمكن من العثور على الطلب رقم VAR-20261028-9999",
    "path": "/api/admin/orders/VAR-20261028-9999"
  }
  ```

#### D. Business Logic & Performance Audit
1. `findByOrderNumberWithDetails` performs `LEFT JOIN FETCH o.items`, avoiding N+1 on items.
2. `order.getStatusHistory()` is loaded lazily upon accessing `order.getStatusHistory()`.
3. Customer entity reference is loaded lazily. Contact information is taken from the order snapshot columns (`customer_name`, `customer_phone`), which is architecturally correct. However, customer account email and account ID are not included in the response.

#### E. Security Audit
- Properly enforced at controller and security filter layers.
- Validated with regex against path manipulation.

#### F. Testing Audit
- Covered in `AdminOrderControllerTest` (200 OK, 403 Forbidden, 400 Bad Request).
- **Defect:** `OrderService#getAdminOrderByNumber` is not tested in `OrderServiceTest`.

**Final Status:** **PASS WITH WARNINGS**

---

### API 03: `PUT /api/admin/orders/{orderNumber}/status`

#### A. API Information
- **HTTP Method:** `PUT`
- **Full Endpoint URL:** `/api/admin/orders/{orderNumber}/status`
- **Controller Class:** `com.varellion.store.admin.order.controller.AdminOrderController#updateOrderStatus`
- **Service Method:** `com.varellion.store.order.service.OrderService#updateOrderStatus(String orderNumber, OrderStatus newStatus, String reason, Long actorId)`
- **Repository Methods:** `OrderRepository#findByOrderNumberWithDetails`, `OrderRepository#save`
- **Purpose:** Transition order lifecycle state and record transition in `order_status_history`.
- **Required Role:** `ROLE_ADMIN`

#### B. Request Contract
- **Path Variable:** `orderNumber` (`String`, required, pattern: `^VAR-\\d{8}-\\d{4}$`).
- **Request Body:** `UpdateOrderStatusRequest`:
  - `newStatus` (`OrderStatus`, required): `@NotNull(message = "حالة الطلب الجديدة مطلوبة")`.
  - `reason` (`String`, optional): `@Size(max = 500, message = "سبب تغيير الحالة لا يمكن أن يتجاوز 500 حرف")`.
- **Invalid Scenarios:**
  - Null `newStatus` -> `400 Bad Request` with field error.
  - Non-existent enum string -> `400 Bad Request` (handled by `HttpMessageNotReadableException`).
  - Reason > 500 chars -> `400 Bad Request`.
  - Unknown order -> `404 Not Found`.

#### C. Response Contract
- **HTTP Status Codes:** `200 OK`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`.
- **Response DTO:** `ApiResponse<OrderResponseDto>` with message `"تم تحديث حالة الطلب بنجاح"`.
- **Optimistic Lock Conflict (409):** If concurrent transactions attempt to update the same order, `ObjectOptimisticLockingFailureException` is caught and returns `409 Conflict`:
  ```json
  {
    "timestamp": "2026-11-16T14:30:00.123456",
    "status": 409,
    "error": "Conflict",
    "message": "تم تعديل الطلب بواسطة جلسة أخرى، يرجى تحديث الصفحة والمحاولة مرة أخرى",
    "path": "/api/admin/orders/VAR-20261028-0001/status"
  }
  ```

#### D. Business Logic Audit — CRITICAL FLAW IDENTIFIED
1. **Complete Absence of Inventory Reconciliation:**
   - When an order is created, `OrderService.createOrder` increments `product.reservedQuantity` for each item.
   - When an admin cancels an order (`newStatus = CANCELLED`) or marks it expired (`EXPIRED`), **the reserved stock is never released**. `reservedQuantity` remains elevated indefinitely, blocking future purchases.
   - When an admin transitions an order to `SHIPPED` or `DELIVERED`, **physical stock (`stockQuantity`) is never deducted**, and `reservedQuantity` is never decremented.
   - **Result:** The inventory balance corrupts progressively with every fulfilled or cancelled order.
2. **State Machine Integrity:**
   - Legal state transitions are enforced via `OrderStatus#canTransitionTo`. Terminal states (`DELIVERED`, `CANCELLED`, `EXPIRED`, `RETURNED`, `EXCHANGED`) strictly reject modifications.
3. **Audit Actor Integrity:**
   - Resolves `actorId` (BIGINT) from `CustomUserDetails` or `userRepository` fallback, and stores it in `order_status_history.actor_id` referencing `public.users(id)`.
4. **Idempotency:**
   - If `currentStatus == newStatus`, the method returns immediately without writing duplicate history.

#### E. Security Audit
- Protected by `ROLE_ADMIN`.
- Controller logs administrative action with actor username, order number, and target status.

#### F. Testing Audit
- Thoroughly tested in `AdminOrderControllerTest` (success, null status, malformed enum, long reason, not found, 401, 403, regex failure, business exception, actor ID resolution).
- Tested in `OrderServiceTest` (terminal states, backward transitions, actorId logging, idempotency).
- **Testing Blindspot:** No tests existed to assert stock deduction/release because the feature was never coded.

**Final Status:** **NEEDS FIX (CRITICAL)**

---

### API 04: `GET /api/admin/products`

#### A. API Information
- **HTTP Method:** `GET`
- **Full Endpoint URL:** `/api/admin/products`
- **Controller Class:** `com.varellion.store.admin.catalog.controller.AdminProductController#getAdminProducts`
- **Service Method:** `com.varellion.store.admin.catalog.service.AdminProductService#getAdminProducts`
- **Repository Method:** `com.varellion.store.catalog.repository.ProductRepository#findAdminProducts`
- **Purpose:** Paginated administrative catalog overview with category, active state, and search filters.
- **Required Role:** `ROLE_ADMIN`

#### B. Request Contract
- **Query Parameters:**
  - `category` (`String`, optional): Category slug (or `"all"`).
  - `search` (`String`, optional): Substring match on `nameAr`, `nameEn`, or `sku`.
  - `isActive` (`Boolean`, optional): Filter active (`true`) or inactive (`false`).
  - `page` (`int`, optional, default: `0`): Page index.
  - `limit` (`int`, optional, default: `20`): Page size (bounded between 1 and 100).
- **Invalid Scenarios:**
  - Passing non-boolean to `isActive` triggers `MethodArgumentTypeMismatchException` -> HTTP 500.

#### C. Response Contract
- **HTTP Status Codes:** `200 OK`, `401 Unauthorized`, `403 Forbidden`, `500 Internal Server Error`.
- **Response DTO:** `ApiResponse<PagedAdminProductsResponse>`
- **Response JSON Structure:**
  ```json
  {
    "timestamp": "2026-11-16T14:30:00.123456",
    "success": true,
    "message": "Operation successful",
    "data": {
      "products": [
        {
          "productId": "a0000000-0000-0000-0000-000000000001",
          "categoryId": "11111111-1111-1111-1111-111111111111",
          "categorySlug": "watches",
          "categoryNameAr": "ساعات يد فاخرة",
          "categoryNameEn": "Luxury Watches",
          "sku": "VAR-W-GLD-01",
          "nameAr": "ساعة فارليون الملكية الذهبية",
          "nameEn": "VARELLION Royal Gold Chronograph Watch",
          "descriptionAr": "...",
          "descriptionEn": "...",
          "price": 1850.00,
          "costPrice": 950.00,
          "stockQuantity": 10,
          "reservedQuantity": 0,
          "availableStock": 10,
          "isActive": true,
          "images": [
            {
              "imageId": "b0000000-0000-0000-0000-000000000001",
              "imageUrl": "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9",
              "isMain": true,
              "displayOrder": 1
            }
          ],
          "createdAt": "2026-11-01T10:00:00Z",
          "updatedAt": "2026-11-01T10:00:00Z"
        }
      ],
      "totalElements": 6,
      "totalPages": 1,
      "currentPage": 0,
      "pageSize": 20
    }
  }
  ```

#### D. Business Logic & Performance Audit
1. `ProductRepository.findAdminProducts` performs `JOIN FETCH p.category`, avoiding N+1 for categories.
2. `product.getImages()` is lazily loaded during `toAdminDto`, resulting in N separate queries for image collections.
3. Sorting is hardcoded to `createdAt DESC`. No sorting parameters are accepted.
4. Correctly computes `availableStock = Math.max(0, stock - reserved)`.

#### E. Security Audit
- Protected by `ROLE_ADMIN`.
- Appropriately exposes internal commercial fields (`costPrice`, `stockQuantity`, `reservedQuantity`) exclusively to administrators.

#### F. Testing Audit
- Covered in `AdminProductControllerTest` (200 OK, 401, 403).
- **Defect:** `AdminProductServiceTest` does not exist; no unit tests for filtering logic.

**Final Status:** **PASS WITH WARNINGS**

---

### API 05: `GET /api/admin/products/{productId}`

#### A. API Information
- **HTTP Method:** `GET`
- **Full Endpoint URL:** `/api/admin/products/{productId}`
- **Controller Class:** `com.varellion.store.admin.catalog.controller.AdminProductController#getAdminProductById`
- **Service Method:** `com.varellion.store.admin.catalog.service.AdminProductService#getAdminProductById`
- **Repository Method:** `com.varellion.store.catalog.repository.ProductRepository#findByIdWithDetailsAdmin`
- **Purpose:** Full administrative view of a specific product.
- **Required Role:** `ROLE_ADMIN`

#### B. Request Contract
- **Path Variable:** `productId` (`UUID`, required).
- **Invalid Scenarios:**
  - Malformed UUID string throws unhandled `MethodArgumentTypeMismatchException` -> HTTP 500.

#### C. Response Contract
- **HTTP Status Codes:** `200 OK`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.
- **Response DTO:** `ApiResponse<AdminProductDto>`

#### D. Business Logic & Performance Audit
- `findByIdWithDetailsAdmin` executes `LEFT JOIN FETCH p.category LEFT JOIN FETCH p.images`, loading all relationships in a single SQL query.
- Throws `ResourceNotFoundException` if product does not exist.

#### E. Security Audit
- Protected by `ROLE_ADMIN`.

#### F. Testing Audit
- Tested in `AdminProductControllerTest` (200 OK, 404 Not Found).
- Service method lacks dedicated unit test.

**Final Status:** **PASS WITH WARNINGS**

---

### API 06: `POST /api/admin/products`

#### A. API Information
- **HTTP Method:** `POST`
- **Full Endpoint URL:** `/api/admin/products`
- **Controller Class:** `com.varellion.store.admin.catalog.controller.AdminProductController#createProduct`
- **Service Method:** `com.varellion.store.admin.catalog.service.AdminProductService#createProduct`
- **Repository Methods:** `ProductRepository#existsBySkuIgnoreCase`, `CategoryRepository#findById`, `ProductRepository#save`
- **Purpose:** Create a new catalog product with inventory balances and media gallery.
- **Required Role:** `ROLE_ADMIN`

#### B. Request Contract
- **Request Body:** `CreateProductRequest` (`@Valid`):
  - `nameAr` (`String`, required): `@NotBlank`, `@Size(max = 255)`.
  - `nameEn` (`String`, required): `@NotBlank`, `@Size(max = 255)`.
  - `categoryId` (`UUID`, required): `@NotNull`.
  - `descriptionAr` (`String`, optional).
  - `descriptionEn` (`String`, optional).
  - `price` (`BigDecimal`, required): `@NotNull`, `@DecimalMin("0.00")`.
  - `costPrice` (`BigDecimal`, required): `@NotNull`, `@DecimalMin("0.00")`.
  - `stockQuantity` (`Integer`, required): `@NotNull`, `@Min(0)`.
  - `sku` (`String`, required): `@NotBlank`, `@Pattern(regexp = "^[A-Za-z0-9-_]+$")`, `@Size(max = 100)`.
  - `isActive` (`Boolean`, optional, default: `true`).
  - `images` (`List<ProductImageInputDto>`, optional):
    - `imageUrl` (`String`, required): `@NotBlank`.
    - `isMain` (`Boolean`, default: `false`).
    - `displayOrder` (`Integer`, default: `0`).

#### C. Response Contract
- **HTTP Status Codes:** `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`.
- **Response DTO:** `ApiResponse<AdminProductDto>` with message `"تم إنشاء المنتج بنجاح"`.
- **Duplicate SKU Response (409 Conflict):**
  ```json
  {
    "timestamp": "2026-11-16T14:30:00.123456",
    "status": 409,
    "error": "Conflict",
    "message": "رمز المنتج (SKU) 'VAR-W-GLD-01' مسجل بالفعل لمنتج آخر",
    "path": "/api/admin/products"
  }
  ```

#### D. Business Logic Audit & Vulnerabilities
1. **Database Check Constraint Collision (`chk_active_product_price`):**
   - In migration `V2`, the table has constraint: `CONSTRAINT chk_active_product_price CHECK (NOT is_active OR price > 0)`.
   - The DTO accepts `price = 0.00` with `isActive = true`.
   - Creating an active product with price `0.00` passes validation but crashes in PostgreSQL with `DataIntegrityViolationException`, returning an unhandled **HTTP 500 Internal Server Error**.
2. **Missing Image URL Validation:**
   - `imageUrl` is only validated for `@NotBlank`. It does not enforce a valid HTTP/HTTPS URL format.
3. **No Validation for Multiple Main Images:**
   - If multiple images specify `isMain: true`, all are persisted as main images.

#### E. Security Audit
- Protected by `ROLE_ADMIN`.
- SKU injection prevented via regex whitelist `^[A-Za-z0-9-_]+$`.

#### F. Testing Audit
- Tested in `AdminProductControllerTest` (201 Created, 409 Conflict on duplicate SKU).
- **Defects:** Category not found (404), validation errors (400), and check constraint failures are not tested. Service method has zero tests.

**Final Status:** **NEEDS FIX**

---

### API 07: `PUT /api/admin/products/{productId}`

#### A. API Information
- **HTTP Method:** `PUT`
- **Full Endpoint URL:** `/api/admin/products/{productId}`
- **Controller Class:** `com.varellion.store.admin.catalog.controller.AdminProductController#updateProduct`
- **Service Method:** `com.varellion.store.admin.catalog.service.AdminProductService#updateProduct`
- **Repository Methods:** `ProductRepository#findByIdWithDetailsAdmin`, `ProductRepository#existsBySkuIgnoreCase`, `CategoryRepository#findById`, `ProductRepository#save`
- **Purpose:** Update metadata, pricing, inventory balances, category, and image gallery.
- **Required Role:** `ROLE_ADMIN`

#### B. Request Contract
- **Path Variable:** `productId` (`UUID`, required).
- **Request Body:** `UpdateProductRequest` (`@Valid`): Fields identical to `CreateProductRequest`.

#### C. Response Contract
- **HTTP Status Codes:** `200 OK`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`.
- **Response DTO:** `ApiResponse<AdminProductDto>` with message `"تم تحديث بيانات المنتج بنجاح"`.

#### D. Business Logic Audit & Vulnerabilities
1. **Database Constraint Crash on Stock Reduction (`chk_stock_available`):**
   - PostgreSQL constraint: `CHECK (reserved_quantity <= stock_quantity)`.
   - If an admin updates `stockQuantity` to a value lower than the current `reservedQuantity` (e.g. Setting stock to 2 when 5 units are reserved by pending orders), the service attempts to save without pre-validation.
   - Throws `DataIntegrityViolationException` -> unhandled **HTTP 500 Internal Server Error**.
2. **Accidental Gallery Deletion:**
   - In `AdminProductService.java` line 173: `product.getImages().clear();`.
   - If the frontend sends an update payload without an `images` array, `images` defaults to an empty list, **silently deleting all existing product images**.
3. **No Optimistic Locking:**
   - `Product` has no `@Version` column. Simultaneous updates by two administrators result in silent data overwrites (Lost Update).

#### E. Security Audit
- Protected by `ROLE_ADMIN`.

#### F. Testing Audit
- **CRITICAL TESTING GAP: `PUT /api/admin/products/{productId}` is completely missing from `AdminProductControllerTest`.**
- Neither the controller nor the service has a single automated test for updating products.

**Final Status:** **NEEDS FIX**

---

### API 08: `PATCH /api/admin/products/{productId}/status`

#### A. API Information
- **HTTP Method:** `PATCH`
- **Full Endpoint URL:** `/api/admin/products/{productId}/status`
- **Controller Class:** `com.varellion.store.admin.catalog.controller.AdminProductController#toggleProductStatus`
- **Service Method:** `com.varellion.store.admin.catalog.service.AdminProductService#toggleProductStatus`
- **Repository Methods:** `ProductRepository#findById`, `ProductRepository#save`
- **Purpose:** Quick toggle of product storefront visibility (`isActive: true/false`).
- **Required Role:** `ROLE_ADMIN`

#### B. Request Contract
- **Path Variable:** `productId` (`UUID`, required).
- **Request Body:** `ToggleProductStatusRequest` (`@Valid`):
  - `isActive` (`Boolean`, required): `@NotNull(message = "حالة المنتج مطلوبة")`.

#### C. Response Contract
- **HTTP Status Codes:** `200 OK`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.
- **Response DTO:** `ApiResponse<AdminProductDto>` with message `"تم تحديث حالة المنتج بنجاح"`.

#### D. Business Logic Audit
1. Toggling a product with price `0.00` to `isActive = true` crashes PostgreSQL on `chk_active_product_price`, returning HTTP 500.
2. `productRepository.findById(productId)` does not fetch category or images, causing lazy loading during DTO mapping.

#### E. Security Audit
- Protected by `ROLE_ADMIN`.

#### F. Testing Audit
- Covered in `AdminProductControllerTest` (200 OK).
- Missing tests: 404 Not Found, 400 Bad Request on null `isActive`.

**Final Status:** **PASS WITH WARNINGS**

---

### API 09: `DELETE /api/admin/products/{productId}`

#### A. API Information
- **HTTP Method:** `DELETE`
- **Full Endpoint URL:** `/api/admin/products/{productId}`
- **Controller Class:** `com.varellion.store.admin.catalog.controller.AdminProductController#deleteProduct`
- **Service Method:** `com.varellion.store.admin.catalog.service.AdminProductService#deleteProduct`
- **Repository Methods:** `ProductRepository#findById`, `OrderItemRepository#existsByProductId`, `ProductRepository#save`, `ProductRepository#delete`
- **Purpose:** Safely delete or archive a catalog product.
- **Required Role:** `ROLE_ADMIN`

#### B. Request Contract
- **Path Variable:** `productId` (`UUID`, required).

#### C. Response Contract
- **HTTP Status Codes:** `200 OK`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.
- **Response DTO:** `ApiResponse<String>`
- **Response Payloads:**
  - Soft-deleted (has order history):
    ```json
    {
      "timestamp": "2026-11-16T14:30:00.123456",
      "success": true,
      "message": "تم أرشفة المنتج بنجاح وإلغاء تفعيله للحفاظ على سلامة سجلات الطلبات التاريخية",
      "data": "تم أرشفة المنتج بنجاح وإلغاء تفعيله للحفاظ على سلامة سجلات الطلبات التاريخية"
    }
    ```
  - Hard-deleted (no order history):
    ```json
    {
      "timestamp": "2026-11-16T14:30:00.123456",
      "success": true,
      "message": "تم حذف المنتج نهائياً بنجاح",
      "data": "تم حذف المنتج نهائياً بنجاح"
    }
    ```

#### D. Business Logic Audit
1. **Relational Integrity Preservation:** Correctly checks `orderItemRepository.existsByProductId(productId)`. If historical orders reference the product, it sets `isActive = false` instead of deleting, preventing foreign key constraint violations on `order_items`.
2. **Suboptimal Response Shape:** Returns a raw Arabic string in `data`. The frontend has to parse localized text to determine if the product was soft-archived or hard-deleted. A structured DTO `{ "productId": "...", "status": "ARCHIVED" | "DELETED" }` is required.

#### E. Security Audit
- Protected by `ROLE_ADMIN`.
- Destructive operation guarded against non-admin callers.

#### F. Testing Audit
- Tested in `AdminProductControllerTest` (200 OK with mock).
- **Defect:** Does not test whether the branching logic correctly executes hard delete vs soft delete.

**Final Status:** **PASS WITH WARNINGS**

---

## 3. Global Exception Handling & Error Envelope Audit

Inspection of `GlobalExceptionHandler.java`, `JwtAuthenticationEntryPoint.java`, and `JwtAccessDeniedHandler.java` reveals inconsistencies in error structures:

```
+------------------------------------+--------------------------+-------------------------------------------------------------+
| Originating Layer                  | HTTP Status              | JSON Fields Returned                                        |
+------------------------------------+--------------------------+-------------------------------------------------------------+
| GlobalExceptionHandler             | 400, 404, 409, 500       | timestamp, status, error, message, path, validationErrors   |
| JwtAuthenticationEntryPoint (Auth) | 401 Unauthorized         | status, error, message, path  (MISSING: timestamp)          |
| JwtAccessDeniedHandler (Security)  | 403 Forbidden            | status, error, message, path  (MISSING: timestamp)          |
+------------------------------------+--------------------------+-------------------------------------------------------------+
```

### Critical Exception Gaps in `GlobalExceptionHandler`
1. `org.springframework.web.method.annotation.MethodArgumentTypeMismatchException`:
   - Occurs when query parameters or path variables fail type conversion (e.g. Invalid enum, bad UUID, alphabetic page index).
   - Currently **unhandled**, causing Spring to route it to `handleGeneralException(Exception.class)`, emitting a misleading **500 Internal Server Error** instead of **400 Bad Request**.
2. `org.springframework.dao.DataIntegrityViolationException`:
   - Occurs when database check constraints fail (e.g. `chk_stock_available`, `chk_active_product_price`).
   - Currently **unhandled**, yielding **500 Internal Server Error** instead of an informative **400 Bad Request**.

---

## 4. Architecture Verification: User vs Customer

A crucial verification in this audit was determining whether `User` and `Customer` are distinct or unified:

```
+----------------------------------------------------+       1:1 Linked via        +----------------------------------------------------+
|                public.users                        |       user_account_id       |               public.customers                     |
|                                                    +---------------------------->+                                                    |
| - id: BIGSERIAL (Long) [PK]                        |                             | - user_id: UUID [PK]                               |
| - email: VARCHAR(150) UNIQUE                       |                             | - user_account_id: BIGINT UNIQUE (FK -> users.id)  |
| - username: VARCHAR(150) UNIQUE                    |                             | - full_name: TEXT                                  |
| - password: VARCHAR(255) (BCrypt)                  |                             | - phone_number: TEXT                               |
| - role: VARCHAR(20) ("USER" / "ADMIN")             |                             | - is_active: BOOLEAN                               |
| - enabled: BOOLEAN                                 |                             | - created_at, updated_at                           |
| - failed_attempts: INTEGER                         |                             +-------------------------+--------------------------+
| - lockout_time: TIMESTAMPTZ                        |                                                       | 1:1
+----------------------------------------------------+                                                       v
                                                                                           +----------------------------------------------------+
                                                                                           |           public.customer_addresses                |
                                                                                           | - address_id: UUID [PK]                            |
                                                                                           | - customer_id: UUID UNIQUE (FK -> customers)       |
                                                                                           | - governorate, city_area, detailed_address         |
                                                                                           +----------------------------------------------------+
```

- **Verdict:** `User` and `Customer` are **decoupled entities with a 1:1 relationship**.
  - `User` represents authentication credentials, security lockout state, and roles.
  - `Customer` represents the commercial e-commerce persona, delivery addresses, and order history.
  - Non-admin users are auto-provisioned a `Customer` profile upon first registration/login.
  - Administrative operations on accounts must therefore be cleanly split:
    - **User Management:** Focuses on staff credentials, roles, account lockout, and password resets (`public.users`).
    - **Customer Management:** Focuses on shopper profiles, order history, contact data, and commercial status (`public.customers`).

---

## 5. Audit Conclusions & Summary

1. **Total Discovered Admin Endpoints:** 9
2. **Correct Implementation (PASS):** 0
3. **Pass with Warnings (PASS WITH WARNINGS):** 4
4. **Requiring Fixes (NEEDS FIX):** 5
5. **Unverified Endpoints:** 0
6. **Critical Vulnerabilities:**
   - Inventory leak on order fulfillment and cancellation (P0).
   - Database constraint crashes yielding HTTP 500 on zero price and negative stock (P1).
   - N+1 query storm on admin order and product listings (P1).
   - Accidental image gallery wiping on partial product update (P1).
   - Missing exception handlers for type mismatch resulting in 500 errors (P2).
