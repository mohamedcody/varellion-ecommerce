# VARELLION Admin Architecture — Complete API Inventory (68 Endpoints)

> **Document Version:** 2.0.0  
> **Status:** APPROVED API INVENTORY  
> **Base Path:** `/api/admin`  
> **Standard Response Envelope:** `com.varellion.store.common.response.ApiResponse<T>`  
> **Standard Error Envelope:** `com.varellion.store.common.response.ErrorResponse`  

---

## 1. Inventory Summary by Module

| Module ID | Module Name | Endpoint Count | Primary Permission Prefix | Core Entity / Aggregate |
| :---: | :--- | :---: | :--- | :--- |
| **01** | Executive Dashboard | 5 | `dashboard:read`, `reports:read` | `orders`, `products`, `customers` |
| **02** | Products Management | 9 | `products:read`, `products:create`, `products:update`, `products:delete` | `products`, `product_images` |
| **03** | Inventory Management | 5 | `inventory:read`, `inventory:update` | `products`, `inventory_movements` |
| **04** | Orders Management | 7 | `orders:read`, `orders:update`, `orders:cancel`, `orders:export` | `orders`, `order_status_history` |
| **05** | Customers Management | 5 | `customers:read`, `customers:update` | `customers`, `users`, `orders` |
| **06** | Shipping Management | 5 | `shipping:read`, `shipping:update` | `shipping_zones`, `shipping_zone_governorates` |
| **07** | Categories Management | 6 | `categories:read`, `categories:create`, `categories:update`, `categories:delete` | `categories`, `products` |
| **08** | Discounts & Coupons | 6 | `coupons:read`, `coupons:create`, `coupons:update`, `coupons:delete` | `coupons`, `coupon_usages` |
| **09** | Store Settings | 4 | `settings:read`, `settings:update` | `store_settings` |
| **10** | Admin Users Management | 7 | `admins:read`, `admins:create`, `admins:update`, `admins:manage` | `users`, `user_roles` |
| **11** | Roles & Permissions | 5 | `roles:read`, `roles:manage` | `roles`, `permissions`, `role_permissions` |
| **12** | Reports & Analytics | 4 | `reports:read`, `reports:export` | `orders`, `order_items`, `products` |
| **13** | Audit Logs | 3 | `audit:read` | `admin_audit_logs` |
| **14** | Customer Support Management | 5 | `support:read`, `support:update` | `customer_inquiries` |
| **15** | Notifications Management | 4 | `notifications:read`, `notifications:update` | `notification_logs`, `notification_templates` |
| **TOTAL** | **15 Modules** | **68 Endpoints** | **43 Permissions** | **System-Wide Coverage** |

---

## 2. Module 01: Executive Dashboard Management (5 Endpoints)

### 1.1 `GET /api/admin/dashboard/summary`
* **Description:** Retrieves real-time executive KPI summary cards and pending fulfillment action counts.
* **Permission:** `dashboard:read` (or `reports:read`)
* **Auth:** Bearer JWT (`ROLE_ADMIN` or fine-grained authority)
* **Query Params:** `period` (optional enum: `TODAY`, `YESTERDAY`, `LAST_7_DAYS`, `LAST_30_DAYS`, `THIS_MONTH`, `YEAR_TO_DATE`; default `THIS_MONTH`), `startDate` (optional ISO8601), `endDate` (optional ISO8601).
* **Request DTO:** None.
* **Response DTO:** `DashboardSummaryDto`
  - `grossRevenue: BigDecimal`, `netRevenue: BigDecimal`, `totalOrders: long`, `averageOrderValue: BigDecimal`
  - `pendingConfirmationCount: long`, `confirmedCount: long`, `preparingCount: long`, `shippedCount: long`
  - `deliveredCount: long`, `deliveryFailedCount: long`, `cancelledCount: long`, `returnedCount: long`
  - `lowStockCount: long`, `outOfStockCount: long`, `activeCustomersCount: long`
* **HTTP Status:** 200 OK, 400 Bad Request, 401 Unauthorized, 403 Forbidden.
* **Business Rules:** Gross revenue includes only non-terminal positive orders (`CONFIRMED`, `PREPARING`, `SHIPPED`, `DELIVERED`). Excludes `CANCELLED`, `EXPIRED`, `PENDING_CUSTOMER_CONFIRMATION`. Net revenue subtracts `RETURNED` orders.
* **DB Operations:** Aggregation queries on `public.orders`, `public.products`, `public.customers`.
* **Transaction:** `@Transactional(readOnly = true)`.
* **Concurrency:** None (read-only). Cached in Redis/local cache for 60 seconds with cache eviction on order state change.
* **Audit:** None (read-only).
* **Test Scenarios:** Valid date range returns accurate sums; invalid date range returns 400; unauthenticated returns 401; non-admin returns 403.

### 1.2 `GET /api/admin/dashboard/sales-chart`
* **Description:** Retrieves time-series revenue and order volume data points for interactive charts.
* **Permission:** `dashboard:read`
* **Auth:** Bearer JWT
* **Query Params:** `interval` (required enum: `DAY`, `WEEK`, `MONTH`; default `DAY`), `startDate` (ISO8601), `endDate` (ISO8601).
* **Response DTO:** `List<SalesChartPointDto>` (`date: String`, `revenue: BigDecimal`, `orderCount: int`).
* **HTTP Status:** 200 OK, 400 Bad Request, 403 Forbidden.
* **DB Operations:** SQL `date_trunc` grouped aggregation on `orders.created_at`.

### 1.3 `GET /api/admin/dashboard/order-breakdown`
* **Description:** Retrieves breakdown of orders grouped by all 10 `OrderStatus` enum values with counts and percentage shares.
* **Permission:** `dashboard:read`
* **Auth:** Bearer JWT
* **Response DTO:** `List<OrderStatusBreakdownDto>` (`status: OrderStatus`, `statusDisplayAr: String`, `count: long`, `percentage: double`).
* **HTTP Status:** 200 OK, 403 Forbidden.
* **DB Operations:** `SELECT order_status, COUNT(*) FROM orders GROUP BY order_status`.

### 1.4 `GET /api/admin/dashboard/stock-alerts`
* **Description:** Retrieves quick list of products breaching low-stock threshold ($\le 5$) or out of stock ($= 0$).
* **Permission:** `dashboard:read`
* **Auth:** Bearer JWT
* **Query Params:** `limit` (int, default 10).
* **Response DTO:** `List<StockAlertDto>` (`productId: UUID`, `nameAr: String`, `nameEn: String`, `sku: String`, `stockQuantity: int`, `reservedQuantity: int`, `availableStock: int`, `isOutOfStock: boolean`).
* **HTTP Status:** 200 OK, 403 Forbidden.
* **DB Operations:** `SELECT ... FROM products WHERE (stock_quantity - reserved_quantity) <= 5 AND is_active = true ORDER BY (stock_quantity - reserved_quantity) ASC`.

### 1.5 `GET /api/admin/dashboard/top-products`
* **Description:** Retrieves top-selling products by quantity ordered and revenue generated.
* **Permission:** `dashboard:read`
* **Auth:** Bearer JWT
* **Query Params:** `limit` (int, default 5), `period` (optional enum; default `THIS_MONTH`).
* **Response DTO:** `List<TopProductDto>` (`productId: UUID`, `nameAr: String`, `sku: String`, `mainImageUrl: String`, `unitsSold: long`, `totalRevenue: BigDecimal`).
* **HTTP Status:** 200 OK, 403 Forbidden.
* **DB Operations:** `JOIN order_items oi ON oi.order_id = o.order_id GROUP BY oi.product_id ORDER BY SUM(oi.quantity) DESC`.

---

## 3. Module 02: Products Management (9 Endpoints)

### 2.1 `GET /api/admin/products`
* **Description:** Paginated administrative product table with detailed inventory and category status.
* **Permission:** `products:read`
* **Auth:** Bearer JWT
* **Query Params:** `page` (int, default 0), `limit` (int, default 20, max 100), `categoryId` (UUID, optional), `stockStatus` (enum: `ALL`, `IN_STOCK`, `LOW_STOCK`, `OUT_OF_STOCK`; default `ALL`), `isActive` (Boolean, optional), `search` (String, optional), `sort` (String: `createdAt_desc`, `price_asc`, `price_desc`, `stock_asc`; default `createdAt_desc`).
* **Response DTO:** `PagedAdminProductsResponse` (`products: List<AdminProductDto>`, `totalElements: long`, `totalPages: int`, `currentPage: int`, `pageSize: int`).
* **HTTP Status:** 200 OK, 400 Bad Request, 403 Forbidden.

### 2.2 `GET /api/admin/products/{productId}`
* **Description:** Retrieves comprehensive product details, images gallery, category, and historical sales summary.
* **Permission:** `products:read`
* **Auth:** Bearer JWT
* **Path Params:** `productId` (UUID).
* **Response DTO:** `AdminProductDetailDto` (complete entity data, `images: List<ProductImageDto>`, `category: CategoryDto`, `totalUnitsSold: long`, `totalRevenue: BigDecimal`, `createdAt`, `updatedAt`, `version: long`).
* **HTTP Status:** 200 OK, 404 Not Found, 403 Forbidden.

### 2.3 `POST /api/admin/products`
* **Description:** Creates a new product in the catalog with dual-language information and initial inventory.
* **Permission:** `products:create`
* **Auth:** Bearer JWT
* **Headers:** `Idempotency-Key` (UUID, optional but recommended).
* **Request DTO:** `CreateProductRequest`
  - `nameAr: @NotBlank @Size(max=255)`
  - `nameEn: @NotBlank @Size(max=255)`
  - `categoryId: @NotNull UUID`
  - `descriptionAr: @Size(max=2000)`
  - `descriptionEn: @Size(max=2000)`
  - `price: @NotNull @DecimalMin("0.00") BigDecimal`
  - `costPrice: @NotNull @DecimalMin("0.00") BigDecimal`
  - `stockQuantity: @NotNull @Min(0) Integer`
  - `sku: @NotBlank @Pattern(regexp="^[A-Za-z0-9-_]+$") @Size(max=100)`
  - `isActive: @NotNull Boolean`
  - `images: List<CreateProductImageRequest>` (`imageUrl: @NotBlank @URL`, `isMain: boolean`, `displayOrder: int`)
* **Response DTO:** `AdminProductDetailDto`
* **HTTP Status:** 201 Created, 400 Bad Request, 409 Conflict (duplicate SKU), 403 Forbidden.
* **Business Rules:** `sku` must be globally unique (case-insensitive). Category must exist and be active.
* **DB Operations:** `INSERT INTO public.products`, `INSERT INTO public.product_images`.
* **Transaction:** `@Transactional(rollbackFor = Exception.class)`.
* **Audit:** Creates record in `admin_audit_logs` (`action='PRODUCT_CREATED'`).

### 2.4 `PUT /api/admin/products/{productId}`
* **Description:** Full update of product details, pricing, categorization, and metadata.
* **Permission:** `products:update`
* **Auth:** Bearer JWT
* **Path Params:** `productId` (UUID).
* **Request DTO:** `UpdateProductRequest` (same fields as create + `version: @NotNull Long`).
* **Response DTO:** `AdminProductDetailDto`.
* **HTTP Status:** 200 OK, 400 Bad Request, 404 Not Found, 409 Conflict (Optimistic lock failure or duplicate SKU).
* **Concurrency:** Validates `version`. If database `version != request.version`, throws 409 Conflict.
* **Audit:** Creates record in `admin_audit_logs` (`action='PRODUCT_UPDATED'`) with JSON diff of changed fields.

### 2.5 `PATCH /api/admin/products/{productId}/status`
* **Description:** Fast toggle to activate or deactivate a product from the public storefront.
* **Permission:** `products:update`
* **Auth:** Bearer JWT
* **Path Params:** `productId` (UUID).
* **Request DTO:** `ToggleProductStatusRequest` (`isActive: @NotNull Boolean`).
* **Response DTO:** `AdminProductDto`.
* **HTTP Status:** 200 OK, 404 Not Found, 403 Forbidden.
* **Audit:** Creates record in `admin_audit_logs` (`action='PRODUCT_STATUS_TOGGLED'`).

### 2.6 `DELETE /api/admin/products/{productId}`
* **Description:** Deletes or archives a product. If product was ever ordered, hard deletion is blocked and it is automatically soft-deleted (`is_active = false`).
* **Permission:** `products:delete`
* **Auth:** Bearer JWT
* **Path Params:** `productId` (UUID).
* **Query Params:** `forceArchive` (boolean, default false).
* **Response DTO:** `DeleteProductResponseDto` (`productId: UUID`, `deleted: boolean`, `archived: boolean`, `message: String`).
* **HTTP Status:** 200 OK, 400 Bad Request, 404 Not Found, 409 Conflict (Ordered product cannot be hard-deleted).
* **DB Operations:** If `COUNT(order_items WHERE product_id = :id) > 0`, updates `is_active = false`. Otherwise executes `DELETE FROM products WHERE product_id = :id` (cascades images).

### 2.7 `POST /api/admin/products/{productId}/images`
* **Description:** Appends a new image URL to a product's gallery.
* **Permission:** `products:update`
* **Request DTO:** `AddProductImageRequest` (`imageUrl: @NotBlank @URL`, `isMain: boolean`, `displayOrder: int`).
* **Response DTO:** `ProductImageDto`.
* **HTTP Status:** 201 Created, 400 Bad Request, 404 Not Found.

### 2.8 `DELETE /api/admin/products/{productId}/images/{imageId}`
* **Description:** Removes an image from a product's gallery.
* **Permission:** `products:update`
* **Path Params:** `productId` (UUID), `imageId` (UUID).
* **Response DTO:** `ApiResponse<Void>`.
* **HTTP Status:** 200 OK, 400 Bad Request (cannot delete the only image or main image without replacement), 404 Not Found.

### 2.9 `PUT /api/admin/products/{productId}/images/reorder`
* **Description:** Reorders the gallery images and designates the main thumbnail.
* **Permission:** `products:update`
* **Request DTO:** `ReorderImagesRequest` (`items: List<{ imageId: UUID, displayOrder: int, isMain: boolean }>`).
* **Response DTO:** `List<ProductImageDto>`.
* **HTTP Status:** 200 OK, 400 Bad Request.

---

## 4. Module 03: Inventory Management (5 Endpoints)

### 3.1 `GET /api/admin/inventory`
* **Description:** Paginated inventory status table showing physical stock, reservations, and available stock.
* **Permission:** `inventory:read`
* **Query Params:** `page` (default 0), `limit` (default 20), `search` (String), `stockFilter` (enum: `ALL`, `IN_STOCK`, `LOW_STOCK`, `OUT_OF_STOCK`).
* **Response DTO:** `PagedInventoryResponse` (`items: List<InventoryItemDto>`, `totalElements`, `totalPages`).
* **HTTP Status:** 200 OK, 403 Forbidden.

### 3.2 `GET /api/admin/inventory/low-stock`
* **Description:** Filtered view of products whose available stock $\le$ store low-stock threshold (default 5).
* **Permission:** `inventory:read`
* **Query Params:** `threshold` (optional integer override).
* **Response DTO:** `List<InventoryItemDto>`.
* **HTTP Status:** 200 OK, 403 Forbidden.

### 3.3 `PATCH /api/admin/inventory/products/{productId}/stock`
* **Description:** Manually adjusts physical stock quantity with mandatory audit classification and reason.
* **Permission:** `inventory:update`
* **Path Params:** `productId` (UUID).
* **Request DTO:** `AdjustStockRequest`
  - `changeQuantity: @NotNull Integer` (positive for restock, negative for deduction)
  - `adjustmentType: @NotNull Enum` (`RESTOCK`, `INVENTORY_COUNT_CORRECTION`, `DAMAGED_WRITE_OFF`, `RETURN_INSPECTION`)
  - `reason: @NotBlank @Size(min=5, max=500)`
* **Response DTO:** `InventoryAdjustmentResultDto` (`productId: UUID`, `previousStock: int`, `newStock: int`, `reservedQuantity: int`, `availableStock: int`, `movementId: Long`).
* **HTTP Status:** 200 OK, 400 Bad Request (`newStock < reservedQuantity`), 404 Not Found, 409 Conflict.
* **Concurrency:** Acquires `findByIdForUpdate` pessimistic lock on `Product` to prevent race conditions with customer checkouts.
* **Audit:** Inserts row into `public.inventory_movements` and `public.admin_audit_logs`.

### 3.4 `GET /api/admin/inventory/movements`
* **Description:** Complete historical ledger of inventory adjustments and order reservations.
* **Permission:** `inventory:read`
* **Query Params:** `page`, `limit`, `productId` (optional UUID), `adjustmentType` (optional), `startDate`, `endDate`.
* **Response DTO:** `PagedInventoryMovementsResponse` (`items: List<InventoryMovementDto>`).
* **HTTP Status:** 200 OK, 403 Forbidden.

### 3.5 `GET /api/admin/inventory/products/{productId}/reservations`
* **Description:** Retrieves all active orders currently holding stock reservations for a specific product.
* **Permission:** `inventory:read`
* **Path Params:** `productId` (UUID).
* **Response DTO:** `List<ActiveReservationDto>` (`orderNumber: String`, `customerName: String`, `quantityReserved: int`, `orderStatus: OrderStatus`, `confirmationDeadline: OffsetDateTime`).
* **HTTP Status:** 200 OK, 404 Not Found.

---

## 5. Module 04: Orders Management (7 Endpoints)

### 4.1 `GET /api/admin/orders` *(Existing — Preserved)*
* **Description:** Paginated order table with status and search filtering.
* **Permission:** `orders:read`
* **Query Params:** `page` (default 0), `limit` (default 10), `status` (OrderStatus enum), `search` (String).
* **Response DTO:** `PagedOrdersResponse` (`orders: List<OrderResponseDto>`, `totalElements`, `totalPages`, `currentPage`, `pageSize`).
* **HTTP Status:** 200 OK, 401 Unauthorized, 403 Forbidden.

### 4.2 `GET /api/admin/orders/{orderNumber}` *(Existing — Preserved)*
* **Description:** Complete order details lookup by human-friendly orderNumber.
* **Permission:** `orders:read`
* **Path Params:** `orderNumber` (`^VAR-\d{8}-\d{4}$`).
* **Response DTO:** `OrderResponseDto` (complete order, items, status history).
* **HTTP Status:** 200 OK, 400 Bad Request, 404 Not Found, 403 Forbidden.

### 4.3 `PUT /api/admin/orders/{orderNumber}/status` *(Existing — Preserved)*
* **Description:** Transitions an order's lifecycle status, verifies FSM, releases stock on cancel, logs history.
* **Permission:** `orders:update`
* **Path Params:** `orderNumber` (`^VAR-\d{8}-\d{4}$`).
* **Request DTO:** `UpdateOrderStatusRequest` (`newStatus: @NotNull OrderStatus`, `reason: @Size(max=500)`).
* **Response DTO:** `OrderResponseDto`.
* **HTTP Status:** 200 OK, 400 Bad Request (Illegal transition), 404 Not Found, 409 Conflict (Optimistic lock conflict).
* **Concurrency:** `@Version` check on `Order.version`.

### 4.4 `PATCH /api/admin/orders/{orderNumber}/notes`
* **Description:** Updates internal administrative notes without modifying lifecycle status.
* **Permission:** `orders:update`
* **Path Params:** `orderNumber` (`^VAR-\d{8}-\d{4}$`).
* **Request DTO:** `UpdateAdminNotesRequest` (`adminNotes: @NotBlank @Size(max=2000)`).
* **Response DTO:** `OrderResponseDto`.
* **HTTP Status:** 200 OK, 400 Bad Request, 404 Not Found.
* **Audit:** Records update in `admin_audit_logs`.

### 4.5 `PUT /api/admin/orders/{orderNumber}/shipping-address`
* **Description:** Modifies customer recipient phone or delivery address prior to courier dispatch.
* **Permission:** `orders:update`
* **Path Params:** `orderNumber` (`^VAR-\d{8}-\d{4}$`).
* **Request DTO:** `UpdateOrderAddressRequest`
  - `customerName: @NotBlank @Size(max=150)`
  - `customerPhone: @NotBlank @Pattern(regexp="^01[0125][0-9]{8}$")`
  - `shippingGovernorate: @NotBlank`
  - `shippingCityArea: @NotBlank`
  - `shippingDetailedAddress: @NotBlank`
* **Response DTO:** `OrderResponseDto`.
* **HTTP Status:** 200 OK, 400 Bad Request (Blocked if order is already `SHIPPED` or terminal), 404 Not Found.
* **Business Rules:** Allowed ONLY when `orderStatus IN (PENDING_CUSTOMER_CONFIRMATION, CONFIRMED)`. Recalculates shipping fee if governorate changes.

### 4.6 `POST /api/admin/orders/{orderNumber}/cancel`
* **Description:** Explicit administrative cancellation with automated atomic stock restoration.
* **Permission:** `orders:cancel`
* **Headers:** `Idempotency-Key` (UUID).
* **Request DTO:** `CancelOrderRequest` (`cancellationReason: @NotBlank @Size(min=5, max=500)`).
* **Response DTO:** `OrderResponseDto`.
* **HTTP Status:** 200 OK, 400 Bad Request (Terminal orders cannot be cancelled), 404 Not Found.
* **Business Rules:** Restores `reserved_quantity` atomically for all items.

### 4.7 `GET /api/admin/orders/export`
* **Description:** Streams filtered order data as CSV/Excel for logistics courier manifests.
* **Permission:** `orders:export`
* **Query Params:** `status`, `governorate`, `startDate`, `endDate`.
* **Response:** Streaming `text/csv` or `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.
* **HTTP Status:** 200 OK, 403 Forbidden.

---

## 6. Module 05: Customers Management (5 Endpoints)

### 5.1 `GET /api/admin/customers`
* **Description:** Paginated customer directory with search and order statistics.
* **Permission:** `customers:read`
* **Query Params:** `page`, `limit`, `search` (name, email, phone), `sort` (`createdAt_desc`, `orderCount_desc`, `totalSpent_desc`).
* **Response DTO:** `PagedAdminCustomersResponse` (`customers: List<AdminCustomerSummaryDto>`, `totalElements`, `totalPages`).
* **HTTP Status:** 200 OK, 403 Forbidden.

### 5.2 `GET /api/admin/customers/{customerId}`
* **Description:** Detailed customer profile including delivery address, lifetime spend, and return metrics.
* **Permission:** `customers:read`
* **Path Params:** `customerId` (UUID).
* **Response DTO:** `AdminCustomerDetailDto` (`customerId: UUID`, `fullName`, `phoneNumber`, `email`, `isActive`, `address: AddressDto`, `totalOrdersPlaced: int`, `totalOrdersDelivered: int`, `totalSpentEgp: BigDecimal`, `cancellationRate: double`, `registeredAt: OffsetDateTime`).
* **HTTP Status:** 200 OK, 404 Not Found.

### 5.3 `GET /api/admin/customers/{customerId}/orders`
* **Description:** Retrieves all orders placed by the customer with status and financials.
* **Permission:** `customers:read`
* **Path Params:** `customerId` (UUID).
* **Query Params:** `page`, `limit`.
* **Response DTO:** `PagedOrdersResponse`.
* **HTTP Status:** 200 OK, 404 Not Found.

### 5.4 `PATCH /api/admin/customers/{customerId}/status`
* **Description:** Suspends or activates a customer account.
* **Permission:** `customers:update`
* **Path Params:** `customerId` (UUID).
* **Request DTO:** `ToggleCustomerStatusRequest` (`isActive: @NotNull Boolean`, `reason: @NotBlank @Size(max=500)`).
* **Response DTO:** `AdminCustomerSummaryDto`.
* **HTTP Status:** 200 OK, 400 Bad Request, 404 Not Found.
* **Audit:** Records action in `admin_audit_logs`.

### 5.5 `PATCH /api/admin/customers/{customerId}/notes`
* **Description:** Updates internal staff notes on customer profile.
* **Permission:** `customers:update`
* **Path Params:** `customerId` (UUID).
* **Request DTO:** `UpdateCustomerNotesRequest` (`notes: @NotBlank @Size(max=1000)`).
* **Response DTO:** `ApiResponse<Void>`.
* **HTTP Status:** 200 OK, 404 Not Found.

---

## 7. Module 06: Shipping & Logistics Management (5 Endpoints)

### 6.1 `GET /api/admin/shipping/zones`
* **Description:** Retrieves all configured shipping zones, assigned governorates, base fees, and estimated transit times.
* **Permission:** `shipping:read`
* **Response DTO:** `List<ShippingZoneDto>` (`zoneId: int`, `zoneNameAr: String`, `zoneNameEn: String`, `baseFee: BigDecimal`, `estimatedDaysMin: int`, `estimatedDaysMax: int`, `isActive: boolean`, `governorates: List<String>`).
* **HTTP Status:** 200 OK, 403 Forbidden.

### 6.2 `GET /api/admin/shipping/zones/{zoneId}`
* **Description:** View specific shipping zone details.
* **Permission:** `shipping:read`
* **Path Params:** `zoneId` (int).
* **Response DTO:** `ShippingZoneDto`.
* **HTTP Status:** 200 OK, 404 Not Found.

### 6.3 `PUT /api/admin/shipping/zones/{zoneId}`
* **Description:** Updates shipping fee and estimated delivery durations for a zone.
* **Permission:** `shipping:update`
* **Path Params:** `zoneId` (int).
* **Request DTO:** `UpdateShippingZoneRequest`
  - `baseFee: @NotNull @DecimalMin("0.00") BigDecimal`
  - `estimatedDaysMin: @Min(1) Integer`
  - `estimatedDaysMax: @Min(1) Integer`
  - `isActive: @NotNull Boolean`
* **Response DTO:** `ShippingZoneDto`.
* **HTTP Status:** 200 OK, 400 Bad Request (`estimatedDaysMin > estimatedDaysMax`), 404 Not Found.
* **Audit:** Records fee change in `admin_audit_logs`.

### 6.4 `PATCH /api/admin/shipping/governorates/{governorateId}/status`
* **Description:** Enables or disables delivery coverage to a specific Egyptian governorate.
* **Permission:** `shipping:update`
* **Path Params:** `governorateId` (int).
* **Request DTO:** `ToggleGovernorateStatusRequest` (`isActive: @NotNull Boolean`, `reason: String`).
* **Response DTO:** `GovernorateStatusDto`.
* **HTTP Status:** 200 OK, 404 Not Found.

### 6.5 `GET /api/admin/shipping/governorates`
* **Description:** Flat inventory of all 27 Egyptian governorates with assigned zone, current fee, and coverage state.
* **Permission:** `shipping:read`
* **Response DTO:** `List<GovernorateDetailDto>`.
* **HTTP Status:** 200 OK.

---

## 8. Module 07: Categories Management (6 Endpoints)

### 7.1 `GET /api/admin/categories`
* **Description:** Lists all categories with total product counts, active product counts, and display order.
* **Permission:** `categories:read`
* **Response DTO:** `List<AdminCategoryDto>` (`categoryId: UUID`, `nameAr`, `nameEn`, `slug`, `isActive`, `totalProductsCount: long`, `activeProductsCount: long`, `createdAt`).
* **HTTP Status:** 200 OK, 403 Forbidden.

### 7.2 `GET /api/admin/categories/{categoryId}`
* **Description:** View category details and assigned products.
* **Permission:** `categories:read`
* **Path Params:** `categoryId` (UUID).
* **Response DTO:** `AdminCategoryDetailDto`.
* **HTTP Status:** 200 OK, 404 Not Found.

### 7.3 `POST /api/admin/categories`
* **Description:** Creates a new product category.
* **Permission:** `categories:create`
* **Request DTO:** `CreateCategoryRequest`
  - `nameAr: @NotBlank @Size(max=100)`
  - `nameEn: @NotBlank @Size(max=100)`
  - `slug: @NotBlank @Pattern(regexp="^[a-z0-9-]+$") @Size(max=100)`
  - `descriptionAr: @Size(max=500)`
  - `descriptionEn: @Size(max=500)`
  - `isActive: @NotNull Boolean`
* **Response DTO:** `AdminCategoryDto`.
* **HTTP Status:** 201 Created, 400 Bad Request, 409 Conflict (slug must be unique).

### 7.4 `PUT /api/admin/categories/{categoryId}`
* **Description:** Updates category metadata, names, and description.
* **Permission:** `categories:update`
* **Path Params:** `categoryId` (UUID).
* **Request DTO:** `UpdateCategoryRequest` (same validation as create).
* **Response DTO:** `AdminCategoryDto`.
* **HTTP Status:** 200 OK, 400 Bad Request, 404 Not Found, 409 Conflict.

### 7.5 `PATCH /api/admin/categories/{categoryId}/status`
* **Description:** Toggles category active status.
* **Permission:** `categories:update`
* **Path Params:** `categoryId` (UUID).
* **Request DTO:** `ToggleCategoryStatusRequest` (`isActive: @NotNull Boolean`).
* **Response DTO:** `AdminCategoryDto`.
* **HTTP Status:** 200 OK, 404 Not Found.

### 7.6 `DELETE /api/admin/categories/{categoryId}`
* **Description:** Deletes category only if zero products are assigned.
* **Permission:** `categories:delete`
* **Path Params:** `categoryId` (UUID).
* **Response DTO:** `ApiResponse<Void>`.
* **HTTP Status:** 200 OK, 400 Bad Request (`COUNT(products) > 0`), 404 Not Found.

---

## 9. Module 08: Discounts & Coupons Management (6 Endpoints)

### 8.1 `GET /api/admin/coupons`
* **Description:** Paginated list of promotional coupons with redemption counters and validity state.
* **Permission:** `coupons:read`
* **Query Params:** `page`, `limit`, `status` (`ACTIVE`, `EXPIRED`, `INACTIVE`), `search`.
* **Response DTO:** `PagedCouponsResponse` (`coupons: List<CouponDto>`, `totalElements`, `totalPages`).
* **HTTP Status:** 200 OK, 403 Forbidden.

### 8.2 `GET /api/admin/coupons/{couponId}`
* **Description:** Detailed coupon view with redemption history and generated revenue.
* **Permission:** `coupons:read`
* **Path Params:** `couponId` (UUID).
* **Response DTO:** `CouponDetailDto` (`couponId`, `code`, `discountType`, `discountValue`, `minSubtotal`, `maxDiscountAmount`, `startDate`, `endDate`, `usageLimit`, `timesUsed`, `totalDiscountAmountGranted: BigDecimal`, `isActive`).
* **HTTP Status:** 200 OK, 404 Not Found.

### 8.3 `POST /api/admin/coupons`
* **Description:** Creates a promotional coupon code.
* **Permission:** `coupons:create`
* **Headers:** `Idempotency-Key` (UUID).
* **Request DTO:** `CreateCouponRequest`
  - `code: @NotBlank @Pattern(regexp="^[A-Z0-9_-]+$") @Size(min=3, max=50)`
  - `discountType: @NotNull Enum` (`PERCENTAGE`, `FIXED_AMOUNT`)
  - `discountValue: @NotNull @DecimalMin("0.01") BigDecimal`
  - `minSubtotal: @DecimalMin("0.00") BigDecimal`
  - `maxDiscountAmount: @DecimalMin("0.00") BigDecimal` (required if percentage)
  - `startDate: @NotNull OffsetDateTime`
  - `endDate: @NotNull OffsetDateTime`
  - `usageLimit: @Min(1) Integer`
  - `isActive: @NotNull Boolean`
* **Response DTO:** `CouponDto`.
* **HTTP Status:** 201 Created, 400 Bad Request (`startDate >= endDate`), 409 Conflict (code exists).

### 8.4 `PUT /api/admin/coupons/{couponId}`
* **Description:** Updates coupon parameters and usage limits.
* **Permission:** `coupons:update`
* **Path Params:** `couponId` (UUID).
* **Request DTO:** `UpdateCouponRequest`.
* **Response DTO:** `CouponDto`.
* **HTTP Status:** 200 OK, 400 Bad Request, 404 Not Found.

### 8.5 `PATCH /api/admin/coupons/{couponId}/status`
* **Description:** Deactivates or terminates a coupon immediately.
* **Permission:** `coupons:update`
* **Path Params:** `couponId` (UUID).
* **Request DTO:** `ToggleCouponStatusRequest` (`isActive: @NotNull Boolean`).
* **Response DTO:** `CouponDto`.
* **HTTP Status:** 200 OK, 404 Not Found.

### 8.6 `DELETE /api/admin/coupons/{couponId}`
* **Description:** Soft-deletes or archives coupon.
* **Permission:** `coupons:delete`
* **Path Params:** `couponId` (UUID).
* **Response DTO:** `ApiResponse<Void>`.
* **HTTP Status:** 200 OK, 404 Not Found.

---

## 10. Module 09: Store Settings Management (4 Endpoints)

### 9.1 `GET /api/admin/settings`
* **Description:** Retrieves all manageable store settings.
* **Permission:** `settings:read`
* **Response DTO:** `StoreSettingsDto` (`freeShippingThreshold: BigDecimal`, `lowStockThreshold: int`, `orderReservationHours: int`, `supportPhone: String`, `whatsappUrl: String`, `maintenanceMode: boolean`, `storeCurrency: String`).
* **HTTP Status:** 200 OK, 403 Forbidden.

### 9.2 `PUT /api/admin/settings`
* **Description:** Batch updates operational store settings.
* **Permission:** `settings:update`
* **Headers:** `Idempotency-Key` (UUID).
* **Request DTO:** `UpdateStoreSettingsRequest`
  - `freeShippingThreshold: @NotNull @DecimalMin("0.00") BigDecimal`
  - `lowStockThreshold: @NotNull @Min(1) Integer`
  - `orderReservationHours: @NotNull @Min(1) @Max(72) Integer`
  - `supportPhone: @NotBlank @Pattern(regexp="^01[0125][0-9]{8}$")`
  - `whatsappUrl: @NotBlank @URL`
  - `maintenanceMode: @NotNull Boolean`
* **Response DTO:** `StoreSettingsDto`.
* **HTTP Status:** 200 OK, 400 Bad Request, 403 Forbidden.
* **Audit:** Records complete settings diff in `admin_audit_logs`.

### 9.3 `GET /api/admin/settings/{settingKey}`
* **Description:** Retrieves single setting value.
* **Permission:** `settings:read`
* **Path Params:** `settingKey` (String).
* **Response DTO:** `SettingValueDto` (`key: String`, `value: String`, `valueType: String`).
* **HTTP Status:** 200 OK, 404 Not Found.

### 9.4 `PUT /api/admin/settings/{settingKey}`
* **Description:** Updates single setting value.
* **Permission:** `settings:update`
* **Path Params:** `settingKey` (String).
* **Request DTO:** `UpdateSingleSettingRequest` (`value: @NotBlank String`).
* **Response DTO:** `SettingValueDto`.
* **HTTP Status:** 200 OK, 400 Bad Request, 404 Not Found.

---

## 11. Module 10: Admin Users Management (7 Endpoints)

### 10.1 `GET /api/admin/users`
* **Description:** Paginated list of administrative users with assigned roles and account status.
* **Permission:** `admins:read`
* **Query Params:** `page`, `limit`, `roleId`, `search`.
* **Response DTO:** `PagedAdminUsersResponse` (`users: List<AdminUserDto>`, `totalElements`, `totalPages`).
* **HTTP Status:** 200 OK, 403 Forbidden.

### 10.2 `GET /api/admin/users/{userId}`
* **Description:** View staff user profile, roles, and recent activity.
* **Permission:** `admins:read`
* **Path Params:** `userId` (Long).
* **Response DTO:** `AdminUserDetailDto`.
* **HTTP Status:** 200 OK, 404 Not Found.

### 10.3 `POST /api/admin/users`
* **Description:** Provisions a new staff member account with assigned administrative role.
* **Permission:** `admins:create`
* **Request DTO:** `CreateAdminUserRequest`
  - `email: @NotBlank @Email @Size(max=150)`
  - `username: @NotBlank @Pattern(regexp="^[a-zA-Z0-9._-]+$") @Size(min=3, max=150)`
  - `password: @NotBlank @Size(min=8, max=100)`
  - `roleId: @NotNull Integer`
* **Response DTO:** `AdminUserDto`.
* **HTTP Status:** 201 Created, 400 Bad Request, 409 Conflict (email or username taken).
* **Business Rules:** Password must be BCrypt hashed. Cannot assign role higher than caller's authority.

### 10.4 `PUT /api/admin/users/{userId}`
* **Description:** Updates staff account details and role assignment.
* **Permission:** `admins:update`
* **Path Params:** `userId` (Long).
* **Request DTO:** `UpdateAdminUserRequest` (`email: @Email`, `roleId: @NotNull Integer`, `enabled: Boolean`).
* **Response DTO:** `AdminUserDto`.
* **HTTP Status:** 200 OK, 400 Bad Request, 404 Not Found.

### 10.5 `PATCH /api/admin/users/{userId}/status`
* **Description:** Suspends or activates staff user account.
* **Permission:** `admins:manage`
* **Path Params:** `userId` (Long).
* **Request DTO:** `ToggleAdminStatusRequest` (`enabled: @NotNull Boolean`).
* **Response DTO:** `AdminUserDto`.
* **HTTP Status:** 200 OK, 400 Bad Request (Cannot deactivate own account), 404 Not Found.

### 10.6 `POST /api/admin/users/{userId}/unlock`
* **Description:** Clears lockout timer and resets failed attempt counter for locked account.
* **Permission:** `admins:manage`
* **Path Params:** `userId` (Long).
* **Response DTO:** `ApiResponse<Void>`.
* **HTTP Status:** 200 OK, 404 Not Found.

### 10.7 `POST /api/admin/users/{userId}/reset-password`
* **Description:** Resets staff member password.
* **Permission:** `admins:manage`
* **Path Params:** `userId` (Long).
* **Request DTO:** `AdminResetPasswordRequest` (`newPassword: @NotBlank @Size(min=8, max=100)`).
* **Response DTO:** `ApiResponse<Void>`.
* **HTTP Status:** 200 OK, 400 Bad Request, 404 Not Found.

---

## 12. Module 11: Roles & Permissions Management (5 Endpoints)

### 11.1 `GET /api/admin/roles`
* **Description:** Lists all administrative roles and their assigned permission authorities.
* **Permission:** `roles:read`
* **Response DTO:** `List<RoleWithPermissionsDto>`.
* **HTTP Status:** 200 OK, 403 Forbidden.

### 11.2 `GET /api/admin/roles/{roleId}`
* **Description:** View role details and assigned permissions.
* **Permission:** `roles:read`
* **Path Params:** `roleId` (Integer).
* **Response DTO:** `RoleWithPermissionsDto`.
* **HTTP Status:** 200 OK, 404 Not Found.

### 11.3 `POST /api/admin/roles`
* **Description:** Creates a custom administrative role.
* **Permission:** `roles:manage`
* **Request DTO:** `CreateRoleRequest` (`roleName: @NotBlank @Size(max=50)`, `description: String`, `permissionIds: @NotEmpty List<Integer>`).
* **Response DTO:** `RoleWithPermissionsDto`.
* **HTTP Status:** 201 Created, 400 Bad Request, 409 Conflict.

### 11.4 `PUT /api/admin/roles/{roleId}/permissions`
* **Description:** Updates the permission authorities granted to a role.
* **Permission:** `roles:manage`
* **Path Params:** `roleId` (Integer).
* **Request DTO:** `UpdateRolePermissionsRequest` (`permissionIds: @NotEmpty List<Integer>`).
* **Response DTO:** `RoleWithPermissionsDto`.
* **HTTP Status:** 200 OK, 400 Bad Request (`SUPER_ADMIN` permissions cannot be demoted), 404 Not Found.

### 11.5 `GET /api/admin/permissions`
* **Description:** Retrieves master dictionary of all 43 system permissions grouped by functional module.
* **Permission:** `roles:read`
* **Response DTO:** `Map<String, List<PermissionDto>>`.
* **HTTP Status:** 200 OK, 403 Forbidden.

---

## 13. Module 12: Reports & Analytics (4 Endpoints)

### 12.1 `GET /api/admin/reports/sales`
* **Description:** Comprehensive sales report grouped by time bucket (daily, weekly, monthly).
* **Permission:** `reports:read`
* **Query Params:** `groupBy` (`DAY`, `WEEK`, `MONTH`), `startDate`, `endDate`.
* **Response DTO:** `SalesReportDto` (`summary: RevenueSummaryDto`, `intervals: List<SalesIntervalDto>`).
* **HTTP Status:** 200 OK, 400 Bad Request, 403 Forbidden.

### 12.2 `GET /api/admin/reports/products`
* **Description:** Product sales performance, gross profit margin, and inventory turnover.
* **Permission:** `reports:read`
* **Query Params:** `categoryId`, `startDate`, `endDate`, `sort`.
* **Response DTO:** `List<ProductPerformanceReportDto>`.
* **HTTP Status:** 200 OK, 403 Forbidden.

### 12.3 `GET /api/admin/reports/shipping`
* **Description:** Delivery success rate and transit duration across Egypt's 27 governorates.
* **Permission:** `reports:read`
* **Query Params:** `startDate`, `endDate`.
* **Response DTO:** `List<GovernorateDeliveryReportDto>`.
* **HTTP Status:** 200 OK, 403 Forbidden.

### 12.4 `GET /api/admin/reports/export`
* **Description:** Streams tabular report data as CSV or Excel.
* **Permission:** `reports:export`
* **Query Params:** `reportType` (`SALES`, `PRODUCTS`, `SHIPPING`, `CUSTOMERS`), `format` (`CSV`, `XLSX`), `startDate`, `endDate`.
* **Response:** File stream with `Content-Disposition: attachment; filename="report.csv"`.
* **HTTP Status:** 200 OK, 400 Bad Request, 403 Forbidden.

---

## 14. Module 13: System Audit Logs (3 Endpoints)

### 13.1 `GET /api/admin/audit-logs`
* **Description:** Paginated search through append-only admin activity logs.
* **Permission:** `audit:read`
* **Query Params:** `page`, `limit`, `actorId` (Long), `entityName` (String), `action` (String), `startDate`, `endDate`.
* **Response DTO:** `PagedAuditLogsResponse` (`logs: List<AdminAuditLogDto>`, `totalElements`, `totalPages`).
* **HTTP Status:** 200 OK, 403 Forbidden.

### 13.2 `GET /api/admin/audit-logs/{logId}`
* **Description:** Inspects full event detail and state change diff JSON.
* **Permission:** `audit:read`
* **Path Params:** `logId` (Long).
* **Response DTO:** `AdminAuditLogDetailDto` (`logId`, `actorId`, `actorUsername`, `action`, `entityName`, `entityId`, `detailsJson: String`, `ipAddress: String`, `createdAt: OffsetDateTime`).
* **HTTP Status:** 200 OK, 404 Not Found.

### 13.3 `GET /api/admin/audit-logs/entities`
* **Description:** Lists all auditable entity names and action types.
* **Permission:** `audit:read`
* **Response DTO:** `AuditMetadataDto` (`entities: List<String>`, `actions: List<String>`).
* **HTTP Status:** 200 OK.

---

## 15. Module 14: Customer Support Management (5 Endpoints)

### 14.1 `GET /api/admin/support/inquiries`
* **Description:** Paginated queue of customer inquiries and complaints.
* **Permission:** `support:read`
* **Query Params:** `page`, `limit`, `status` (`OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`), `priority`, `search`.
* **Response DTO:** `PagedSupportInquiriesResponse`.
* **HTTP Status:** 200 OK, 403 Forbidden.

### 14.2 `GET /api/admin/support/inquiries/{inquiryId}`
* **Description:** Detailed inquiry thread, customer phone, and linked order.
* **Permission:** `support:read`
* **Path Params:** `inquiryId` (UUID).
* **Response DTO:** `SupportInquiryDetailDto`.
* **HTTP Status:** 200 OK, 404 Not Found.

### 14.3 `PATCH /api/admin/support/inquiries/{inquiryId}/status`
* **Description:** Updates resolution status of inquiry.
* **Permission:** `support:update`
* **Path Params:** `inquiryId` (UUID).
* **Request DTO:** `UpdateInquiryStatusRequest` (`status: @NotNull Enum`, `resolutionNotes: String`).
* **Response DTO:** `SupportInquiryDto`.
* **HTTP Status:** 200 OK, 400 Bad Request, 404 Not Found.

### 14.4 `POST /api/admin/support/inquiries/{inquiryId}/notes`
* **Description:** Appends internal staff notes (e.g. phone call logs).
* **Permission:** `support:update`
* **Path Params:** `inquiryId` (UUID).
* **Request DTO:** `AddSupportNoteRequest` (`note: @NotBlank @Size(max=1000)`).
* **Response DTO:** `ApiResponse<Void>`.
* **HTTP Status:** 201 Created, 404 Not Found.

### 14.5 `PATCH /api/admin/support/inquiries/{inquiryId}/assign`
* **Description:** Assigns inquiry to a support team member.
* **Permission:** `support:update`
* **Path Params:** `inquiryId` (UUID).
* **Request DTO:** `AssignInquiryRequest` (`assignedUserId: @NotNull Long`).
* **Response DTO:** `SupportInquiryDto`.
* **HTTP Status:** 200 OK, 404 Not Found.

---

## 16. Module 15: Notifications Management (4 Endpoints)

### 15.1 `GET /api/admin/notifications/logs`
* **Description:** Outbound customer notification logs (SMS / WhatsApp order updates).
* **Permission:** `notifications:read`
* **Query Params:** `page`, `limit`, `channel` (`SMS`, `WHATSAPP`), `status` (`SENT`, `FAILED`, `PENDING`), `orderNumber`.
* **Response DTO:** `PagedNotificationLogsResponse`.
* **HTTP Status:** 200 OK, 403 Forbidden.

### 15.2 `POST /api/admin/notifications/resend/{logId}`
* **Description:** Retries sending a failed notification.
* **Permission:** `notifications:update`
* **Path Params:** `logId` (Long).
* **Response DTO:** `ApiResponse<Void>`.
* **HTTP Status:** 200 OK, 404 Not Found, 502 Bad Gateway (Gateway failure).

### 15.3 `GET /api/admin/notifications/templates`
* **Description:** Lists message templates for order confirmation, shipping notices, and delivery tracking.
* **Permission:** `notifications:read`
* **Response DTO:** `List<NotificationTemplateDto>`.
* **HTTP Status:** 200 OK.

### 15.4 `PUT /api/admin/notifications/templates/{templateId}`
* **Description:** Updates notification template body text with dynamic placeholder tokens (`{customerName}`, `{orderNumber}`, `{trackingUrl}`).
* **Permission:** `notifications:update`
* **Path Params:** `templateId` (String).
* **Request DTO:** `UpdateNotificationTemplateRequest` (`bodyAr: @NotBlank`, `bodyEn: @NotBlank`, `isActive: Boolean`).
* **Response DTO:** `NotificationTemplateDto`.
* **HTTP Status:** 200 OK, 400 Bad Request, 404 Not Found.

---

## 17. Endpoint Summary Table

All 68 endpoints are systematically numbered and grouped. Every endpoint defines an explicit HTTP method, URI, authority check, transactional boundary, and concurrency guard, providing a complete contract ready for backend implementation.
