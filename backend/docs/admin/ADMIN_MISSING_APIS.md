# VARELLION — Missing Admin APIs Discovery & Specification

> **Auditor Role:** Senior Backend Engineer, API Architect & Security Auditor  
> **Target System:** VARELLION Luxury E-Commerce Backend (Spring Boot 3.3.4, PostgreSQL 15+)  
> **Document Purpose:** Definitive blueprint of all administrative endpoints missing from the backend, classified by domain, business justification, priority, and complete request/response contracts.

---

## 1. Executive Summary & Gap Matrix

The current backend implementation provides only **9 basic administrative endpoints** (3 order endpoints and 6 product endpoints). Essential administrative domains required to operate a commercial luxury e-commerce dashboard are **completely unrepresented in code**.

```
+-----------------------------------------------------------------------------------------------------------------+
|                                    ADMIN DOMAIN COMPLETENESS MATRIX                                             |
+------------------------------+--------------------+--------------------+-------------------+--------------------+
| Administrative Domain        | Existing Endpoints | Missing Endpoints  | Implementation %  | Domain Health      |
+------------------------------+--------------------+--------------------+-------------------+--------------------+
| 1. Executive Dashboard       | 0                  | 3                  | 0%                | MISSING            |
| 2. Orders Management         | 3                  | 5                  | 37.5%             | PARTIAL (NEEDS FIX)|
| 3. Products Management       | 6                  | 3                  | 66.7%             | SUBSTANTIAL        |
| 4. Categories Management     | 0                  | 6                  | 0%                | MISSING            |
| 5. Customers Management      | 0                  | 4                  | 0%                | MISSING            |
| 6. User / Admin Management   | 0                  | 6                  | 0%                | MISSING            |
| 7. Shipping Management       | 0                  | 2                  | 0%                | MISSING            |
| 8. Audit & Activity Trail    | 0                  | 1                  | 0%                | MISSING            |
| 9. Customer Support          | 0                  | 2 (Optional)       | 0%                | OPTIONAL           |
+------------------------------+--------------------+--------------------+-------------------+--------------------+
| TOTALS                       | 9                  | 32                 | 22.0%             | DASHBOARD BLOCKED  |
+------------------------------+--------------------+--------------------+-------------------+--------------------+
```

### Priority Classification Rules
- **CRITICAL:** Mandatory to prevent data corruption, financial inaccuracies, or critical security vulnerabilities.
- **HIGH:** Mandatory for a viable, operational Next.js Admin Dashboard (MVP).
- **MEDIUM:** Important enhancements for operations, bulk actions, and exports.
- **OPTIONAL:** Future expansion domains not grounded in current entity schemas.

---

## 2. Domain 1: Executive Dashboard & Analytics (3 Endpoints)

Currently, the Next.js admin dashboard landing page (`/admin`) redirects to `/admin/orders` because no analytics or summary endpoints exist in the backend.

---

### API-D01: Executive KPI Summary Cards
- **Domain:** Dashboard & Analytics
- **Priority:** **HIGH**
- **HTTP Method:** `GET`
- **Proposed Endpoint:** `/api/admin/dashboard/summary`
- **Purpose:** Supplies high-level financial, order, and inventory KPIs for the top cards of the Admin Dashboard.
- **Required Authorization:** `ROLE_ADMIN`
- **Query Parameters:** None (or optional `period`: `TODAY`, `THIS_WEEK`, `THIS_MONTH`, `ALL_TIME`; default: `THIS_MONTH`).
- **Dependencies:** `OrderRepository`, `ProductRepository`, `CustomerRepository`.
- **Business Rules:**
  - `totalRevenue`: Calculated as `SUM(total_amount)` of non-cancelled and non-expired orders (`CONFIRMED`, `PREPARING`, `SHIPPED`, `DELIVERED`).
  - `pendingOrdersCount`: Count of orders with status `PENDING_CUSTOMER_CONFIRMATION`.
  - `activeOrdersCount`: Count of orders currently in fulfillment (`CONFIRMED`, `PREPARING`, `SHIPPED`).
  - `lowStockCount`: Count of active products where `(stock_quantity - reserved_quantity) <= 5`.
  - `totalCustomers`: Count of registered customers in `public.customers`.
- **Expected Status Codes:** `200 OK`, `401 Unauthorized`, `403 Forbidden`.
- **Expected Response Structure:**
  ```json
  {
    "timestamp": "2026-11-16T15:00:00",
    "success": true,
    "message": "Operation successful",
    "data": {
      "totalRevenue": 248950.00,
      "currency": "EGP",
      "totalOrders": 142,
      "pendingOrdersCount": 8,
      "activeOrdersCount": 19,
      "completedOrdersCount": 105,
      "cancelledOrdersCount": 10,
      "totalCustomers": 87,
      "newCustomersThisMonth": 14,
      "lowStockProductsCount": 3
    }
  }
  ```
- **Why Necessary:** Without this API, the admin landing page cannot render revenue stats, order status indicators, or urgent alert badges.

---

### API-D02: Order Status Distribution
- **Domain:** Dashboard & Analytics
- **Priority:** **HIGH**
- **HTTP Method:** `GET`
- **Proposed Endpoint:** `/api/admin/dashboard/order-status-stats`
- **Purpose:** Supplies counts per order lifecycle status for pie/donut charts and badge counters.
- **Required Authorization:** `ROLE_ADMIN`
- **Dependencies:** `OrderRepository` query `SELECT o.orderStatus, COUNT(o) FROM Order o GROUP BY o.orderStatus`.
- **Expected Response Structure:**
  ```json
  {
    "timestamp": "2026-11-16T15:00:00",
    "success": true,
    "message": "Operation successful",
    "data": {
      "PENDING_CUSTOMER_CONFIRMATION": 8,
      "CONFIRMED": 6,
      "PREPARING": 5,
      "SHIPPED": 8,
      "DELIVERED": 105,
      "DELIVERY_FAILED": 2,
      "CANCELLED": 7,
      "EXPIRED": 3,
      "RETURNED": 2,
      "EXCHANGED": 1
    }
  }
  ```
- **Why Necessary:** Powers status overview widgets and sidebar badge counts without requesting the heavy `/api/admin/orders` table query.

---

### API-D03: Sales & Revenue Timeline Analytics
- **Domain:** Dashboard & Analytics
- **Priority:** **HIGH**
- **HTTP Method:** `GET`
- **Proposed Endpoint:** `/api/admin/dashboard/sales-analytics`
- **Purpose:** Supplies time-series data for dashboard bar/area revenue charts.
- **Required Authorization:** `ROLE_ADMIN`
- **Query Parameters:**
  - `interval` (`String`, optional, default: `DAILY`, allowed: `DAILY`, `WEEKLY`, `MONTHLY`).
  - `limit` (`int`, optional, default: `30`).
- **Dependencies:** `OrderRepository` SQL aggregation grouping by `DATE_TRUNC(:interval, created_at)`.
- **Expected Response Structure:**
  ```json
  {
    "timestamp": "2026-11-16T15:00:00",
    "success": true,
    "message": "Operation successful",
    "data": [
      {
        "date": "2026-11-10",
        "revenue": 14500.00,
        "orderCount": 7
      },
      {
        "date": "2026-11-11",
        "revenue": 21800.00,
        "orderCount": 11
      }
    ]
  }
  ```
- **Why Necessary:** Enables executive visualization of sales trends, marketing campaign spikes, and daily turnover.

---

## 3. Domain 2: Orders Management (5 Missing Endpoints)

While basic order listing and status transitions exist, store operations require critical management capabilities that are currently missing.

---

### API-ORD01: Update Administrator Notes on Order
- **Domain:** Orders Management
- **Priority:** **HIGH**
- **HTTP Method:** `PATCH`
- **Proposed Endpoint:** `/api/admin/orders/{orderNumber}/notes`
- **Purpose:** Allows administrators to append or edit operational notes (`orders.admin_notes`) without triggering an order status transition.
- **Required Authorization:** `ROLE_ADMIN`
- **Path Variable:** `orderNumber` (`String`, pattern: `^VAR-\\d{8}-\\d{4}$`).
- **Request Body:**
  ```json
  {
    "adminNotes": "تم الاتصال بالعميل وأكد استلام الشحنة في تمام الساعة الخامسة مساءً عبر مكتب المعادي."
  }
  ```
- **Validation:** `@Size(max = 2000, message = "الملاحظات الإدارية لا تتجاوز 2000 حرف")`.
- **Expected Response Structure:** `ApiResponse<OrderResponseDto>`
- **Why Necessary:** The column `admin_notes` already exists in `public.orders`, but there is zero API to update it. Customer support and fulfillment teams need to record delivery instructions or verification logs.

---

### API-ORD02: Update Order Shipping Address / Customer Contact
- **Domain:** Orders Management
- **Priority:** **HIGH**
- **HTTP Method:** `PATCH`
- **Proposed Endpoint:** `/api/admin/orders/{orderNumber}/delivery-address`
- **Purpose:** Updates recipient phone or shipping address when a customer requests changes prior to shipment.
- **Required Authorization:** `ROLE_ADMIN`
- **Business Rules:**
  - Allowed **only** if order is in `PENDING_CUSTOMER_CONFIRMATION` or `CONFIRMED`.
  - Rejects with `400 Bad Request` if order is already `PREPARING`, `SHIPPED`, or terminal.
  - If governorate changes, recalculates authoritative shipping fee and adjusts `order.shippingFee` and `order.totalAmount`.
- **Request Body:**
  ```json
  {
    "customerPhone": "01099887766",
    "shippingGovernorate": "الجيزة",
    "shippingCityArea": "الدقي",
    "shippingDetailedAddress": "12 شارع مصدق، الدور الرابع، شقة 8"
  }
  ```
- **Expected Response Structure:** `ApiResponse<OrderResponseDto>`
- **Why Necessary:** Customers frequently call after placing an order to correct typographical errors in addresses or phone numbers.

---

### API-ORD03: Confirm / Adjust Order Shipping Fee
- **Domain:** Orders Management
- **Priority:** **MEDIUM**
- **HTTP Method:** `PATCH`
- **Proposed Endpoint:** `/api/admin/orders/{orderNumber}/shipping-fee`
- **Purpose:** Confirms or overrides the shipping fee for non-standard delivery areas, updating `shippingFeeStatus` from `PENDING` to `CONFIRMED`.
- **Required Authorization:** `ROLE_ADMIN`
- **Request Body:**
  ```json
  {
    "shippingFee": 75.00,
    "reason": "توصيل خاص إلى منطقة نائية خارج نطاق التسليم السريع"
  }
  ```
- **Business Rules:**
  - Updates `shipping_fee`, recomputes `total_amount = subtotal + shipping_fee - discount_total`, and sets `shipping_fee_status = 'CONFIRMED'`.
- **Expected Response Structure:** `ApiResponse<OrderResponseDto>`
- **Why Necessary:** The `shipping_fee_status` column in `public.orders` was designed specifically for this workflow, but lacks an administrative API to update it.

---

### API-ORD04: Quick Order Statistics for Table Badges
- **Domain:** Orders Management
- **Priority:** **HIGH**
- **HTTP Method:** `GET`
- **Proposed Endpoint:** `/api/admin/orders/statistics`
- **Purpose:** Lightweight counter of orders by status specifically designed to populate the filter tabs on the Orders table page.
- **Required Authorization:** `ROLE_ADMIN`
- **Expected Response Structure:**
  ```json
  {
    "timestamp": "2026-11-16T15:00:00",
    "success": true,
    "message": "Operation successful",
    "data": {
      "all": 142,
      "pending": 8,
      "confirmed": 6,
      "preparing": 5,
      "shipped": 8,
      "delivered": 105,
      "cancelled": 10
    }
  }
  ```
- **Why Necessary:** The existing `AdminOrdersPage.tsx` currently fetches orders page-by-page and cannot display count badges on status filter tabs without an aggregations endpoint.

---

### API-ORD05: Export Orders to CSV/Excel
- **Domain:** Orders Management
- **Priority:** **MEDIUM**
- **HTTP Method:** `GET`
- **Proposed Endpoint:** `/api/admin/orders/export`
- **Purpose:** Exports filtered orders (by date range, status, governorate) into a downloadable CSV for courier manifest printing and accounting.
- **Required Authorization:** `ROLE_ADMIN`
- **Query Parameters:** `status`, `startDate`, `endDate`, `governorate`.
- **Expected Response:** `Content-Type: text/csv`, attachment filename `varellion-orders-YYYYMMDD.csv`.
- **Why Necessary:** Operational dispatch to Egyptian courier companies (e.g. Bosta, Aramex, Mylerz) requires bulk manifest export.

---

## 4. Domain 3: Products & Inventory Management (3 Missing Endpoints)

---

### API-PRD01: Dedicated Stock Inventory Adjustment
- **Domain:** Products & Inventory
- **Priority:** **HIGH**
- **HTTP Method:** `PATCH`
- **Proposed Endpoint:** `/api/admin/products/{productId}/stock`
- **Purpose:** Adjusts product stock inventory balances (restock, physical inventory audit, warehouse damage) without submitting the full product metadata payload.
- **Required Authorization:** `ROLE_ADMIN`
- **Path Variable:** `productId` (`UUID`, required).
- **Request Body:**
  ```json
  {
    "stockAdjustment": 25,
    "reason": "استلام شحنة توريد جديدة من ورشة التصنيع",
    "adjustmentType": "RESTOCK"
  }
  ```
- **Business Rules:**
  - `adjustmentType` can be `RESTOCK` (adds to stock), `CORRECTION` (overwrites stock), or `DAMAGE` (subtracts from stock).
  - Validates that resulting `stock_quantity >= reserved_quantity` to avoid database check constraint crash.
- **Expected Response Structure:** `ApiResponse<AdminProductDto>`
- **Why Necessary:** Currently, an admin must submit the entire 15-field `UpdateProductRequest` (including all image URLs and English/Arabic names) just to increment stock by 5 units.

---

### API-PRD02: Low Stock & Out of Stock Inventory Alerts
- **Domain:** Products & Inventory
- **Priority:** **HIGH**
- **HTTP Method:** `GET`
- **Proposed Endpoint:** `/api/admin/products/low-stock`
- **Purpose:** Retrieves all active products whose available stock is at or below a reorder threshold.
- **Required Authorization:** `ROLE_ADMIN`
- **Query Parameters:** `threshold` (`int`, optional, default: `5`).
- **Dependencies:** `ProductRepository` query:
  `SELECT p FROM Product p WHERE p.isActive = true AND (p.stockQuantity - p.reservedQuantity) <= :threshold ORDER BY (p.stockQuantity - p.reservedQuantity) ASC`
- **Expected Response Structure:** `ApiResponse<List<AdminProductDto>>`
- **Why Necessary:** Essential for procurement and preventing lost sales on high-demand luxury items.

---

### API-PRD03: Bulk Toggle Product Visibility
- **Domain:** Products & Inventory
- **Priority:** **MEDIUM**
- **HTTP Method:** `POST`
- **Proposed Endpoint:** `/api/admin/products/bulk-status`
- **Purpose:** Activates or deactivates multiple products simultaneously (e.g. seasonal collection launch or temporary unpublishing).
- **Required Authorization:** `ROLE_ADMIN`
- **Request Body:**
  ```json
  {
    "productIds": [
      "a0000000-0000-0000-0000-000000000001",
      "a0000000-0000-0000-0000-000000000002"
    ],
    "isActive": true
  }
  ```
- **Expected Response Structure:** `ApiResponse<Map<String, Object>>` with count of updated items.
- **Why Necessary:** Greatly improves catalog management efficiency in the admin table.

---

## 5. Domain 4: Categories Management (6 Missing Endpoints)

**Current Status: 100% Missing.** The backend has public categories endpoints (`/api/categories`), but zero administrative endpoints to create, update, deactivate, or delete categories.

---

### API-CAT01: Administrative Categories Listing
- **Domain:** Categories Management
- **Priority:** **HIGH**
- **HTTP Method:** `GET`
- **Proposed Endpoint:** `/api/admin/categories`
- **Purpose:** Retrieves all categories (both active and inactive) with product count metrics.
- **Required Authorization:** `ROLE_ADMIN`
- **Expected Response Structure:**
  ```json
  {
    "timestamp": "2026-11-16T15:00:00",
    "success": true,
    "message": "Operation successful",
    "data": [
      {
        "categoryId": "11111111-1111-1111-1111-111111111111",
        "nameAr": "ساعات يد فاخرة",
        "nameEn": "Luxury Watches",
        "slug": "watches",
        "descriptionAr": "مجموعة الساعات الميكانيكية والكرونوغراف الفاخرة",
        "descriptionEn": "Exclusive mechanical and chronograph luxury timepieces",
        "isActive": true,
        "productCount": 12,
        "createdAt": "2026-10-01T10:00:00Z",
        "updatedAt": "2026-10-15T12:00:00Z"
      }
    ]
  }
  ```

---

### API-CAT02: Create New Category
- **Domain:** Categories Management
- **Priority:** **HIGH**
- **HTTP Method:** `POST`
- **Proposed Endpoint:** `/api/admin/categories`
- **Purpose:** Adds a new commercial category to the catalog.
- **Required Authorization:** `ROLE_ADMIN`
- **Request Body:**
  ```json
  {
    "nameAr": "أقلام حبر ملكية",
    "nameEn": "Royal Fountain Pens",
    "slug": "fountain-pens",
    "descriptionAr": "أقلام فاخرة مصنوعة من الروديوم والذهب عيار 18",
    "descriptionEn": "Exquisite luxury fountain pens crafted with rhodium and 18k gold",
    "isActive": true
  }
  ```
- **Validation Rules:**
  - `nameAr`: `@NotBlank`, `@Size(max = 100)`.
  - `nameEn`: `@NotBlank`, `@Size(max = 100)`.
  - `slug`: `@NotBlank`, `@Pattern(regexp = "^[a-z0-9]+(-[a-z0-9]+)*$", message = "صيغة الرابط اللطيف غير صالحة")`.
- **Expected Status Codes:** `201 Created`, `400 Bad Request`, `409 Conflict` (slug duplicate).

---

### API-CAT03: Retrieve Category Details
- **Domain:** Categories Management
- **Priority:** **HIGH**
- **HTTP Method:** `GET`
- **Proposed Endpoint:** `/api/admin/categories/{categoryId}`
- **Purpose:** Full administrative category inspection.
- **Required Authorization:** `ROLE_ADMIN`
- **Path Variable:** `categoryId` (`UUID`, required).
- **Expected Status Codes:** `200 OK`, `404 Not Found`.

---

### API-CAT04: Update Existing Category
- **Domain:** Categories Management
- **Priority:** **HIGH**
- **HTTP Method:** `PUT`
- **Proposed Endpoint:** `/api/admin/categories/{categoryId}`
- **Purpose:** Updates category metadata, names, slug, and descriptions.
- **Required Authorization:** `ROLE_ADMIN`
- **Request Body:** Same as `POST /api/admin/categories`.
- **Business Rules:** Slug uniqueness validation excluding current category ID.

---

### API-CAT05: Toggle Category Visibility
- **Domain:** Categories Management
- **Priority:** **HIGH**
- **HTTP Method:** `PATCH`
- **Proposed Endpoint:** `/api/admin/categories/{categoryId}/status`
- **Purpose:** Quickly activates or deactivates a category.
- **Required Authorization:** `ROLE_ADMIN`
- **Request Body:** `{"isActive": false}`.

---

### API-CAT06: Delete Category (Guarded Archival)
- **Domain:** Categories Management
- **Priority:** **HIGH**
- **HTTP Method:** `DELETE`
- **Proposed Endpoint:** `/api/admin/categories/{categoryId}`
- **Purpose:** Deletes or deactivates a category.
- **Required Authorization:** `ROLE_ADMIN`
- **Business Rules:**
  - Foreign key `fk_products_category` on `public.products` is `ON DELETE RESTRICT`.
  - If any products belong to this category, the API **must reject deletion with `409 Conflict`**: `"لا يمكن حذف هذا القسم لأنه يحتوي على منتجات مرتبطة. يرجى نقل المنتجات أولاً أو إلغاء تفعيل القسم"`.
  - If no products belong to the category, it can be permanently deleted.

---

## 6. Domain 5: Customers Management (4 Missing Endpoints)

**Current Status: 100% Missing.** The backend stores customers in `public.customers` and delivery addresses in `public.customer_addresses`, but provides no administrative access.

---

### API-CUST01: Paginated Customers Directory
- **Domain:** Customers Management
- **Priority:** **HIGH**
- **HTTP Method:** `GET`
- **Proposed Endpoint:** `/api/admin/customers`
- **Purpose:** Paginated list of registered customers with lifetime spend, total orders count, and contact information.
- **Required Authorization:** `ROLE_ADMIN`
- **Query Parameters:**
  - `page` (`int`, default: `0`).
  - `limit` (`int`, default: `20`).
  - `search` (`String`, optional): Search customer name, phone, or email.
  - `isActive` (`Boolean`, optional).
- **Dependencies:** `CustomerRepository` joined with `users` and aggregated with `orders`.
- **Expected Response Structure:**
  ```json
  {
    "timestamp": "2026-11-16T15:00:00",
    "success": true,
    "message": "Operation successful",
    "data": {
      "customers": [
        {
          "customerId": "8f1b621e-f3b1-47a3-b261-269bb3f721ea",
          "userAccountId": 12,
          "email": "customer@example.com",
          "fullName": "محمد أحمد علي",
          "phoneNumber": "01012345678",
          "governorate": "القاهرة",
          "totalOrders": 5,
          "totalSpent": 12850.00,
          "isActive": true,
          "registeredAt": "2026-10-15T09:30:00Z"
        }
      ],
      "totalElements": 87,
      "totalPages": 5,
      "currentPage": 0,
      "pageSize": 20
    }
  }
  ```

---

### API-CUST02: Customer Detailed Profile View
- **Domain:** Customers Management
- **Priority:** **HIGH**
- **HTTP Method:** `GET`
- **Proposed Endpoint:** `/api/admin/customers/{customerId}`
- **Purpose:** Complete customer record including saved delivery address, account details, and commercial summary.
- **Required Authorization:** `ROLE_ADMIN`
- **Path Variable:** `customerId` (`UUID`, required).
- **Expected Response Structure:**
  ```json
  {
    "timestamp": "2026-11-16T15:00:00",
    "success": true,
    "message": "Operation successful",
    "data": {
      "customerId": "8f1b621e-f3b1-47a3-b261-269bb3f721ea",
      "userAccountId": 12,
      "email": "customer@example.com",
      "fullName": "محمد أحمد علي",
      "phoneNumber": "01012345678",
      "isActive": true,
      "registeredAt": "2026-10-15T09:30:00Z",
      "address": {
        "addressId": "c4b9d031-15e3-4c99-a86d-318e88eef081",
        "governorate": "القاهرة",
        "cityArea": "المعادي",
        "detailedAddress": "شارع 9، مبنى 14، الدور الثالث"
      },
      "lifetimeMetrics": {
        "totalOrders": 5,
        "completedOrders": 4,
        "cancelledOrders": 1,
        "totalSpent": 12850.00,
        "lastOrderDate": "2026-11-12T18:20:00Z"
      }
    }
  }
  ```

---

### API-CUST03: Customer Specific Order History
- **Domain:** Customers Management
- **Priority:** **HIGH**
- **HTTP Method:** `GET`
- **Proposed Endpoint:** `/api/admin/customers/{customerId}/orders`
- **Purpose:** Paginated orders placed exclusively by this customer.
- **Required Authorization:** `ROLE_ADMIN`
- **Query Parameters:** `page`, `limit`.
- **Expected Response Structure:** `ApiResponse<PagedOrdersResponse>`

---

### API-CUST04: Toggle Customer Account Status (Suspend/Activate)
- **Domain:** Customers Management
- **Priority:** **HIGH**
- **HTTP Method:** `PATCH`
- **Proposed Endpoint:** `/api/admin/customers/{customerId}/status`
- **Purpose:** Suspends fraudulent or disruptive customer accounts (`customers.is_active` and optionally `users.enabled`).
- **Required Authorization:** `ROLE_ADMIN`
- **Request Body:** `{"isActive": false, "reason": "طلب متكرر وهمي ورفض الاستلام"}`.

---

## 7. Domain 6: User & Administrator Management (6 Missing Endpoints)

**Current Status: 100% Missing.** The backend has `public.users` storing administrative and customer logins, but admin accounts can only be provisioned via Google OAuth matching `ADMIN_EMAILS` or raw SQL seeds.

---

### API-USR01: Administrative Users & Staff Listing
- **Domain:** User Management
- **Priority:** **MEDIUM**
- **HTTP Method:** `GET`
- **Proposed Endpoint:** `/api/admin/users`
- **Purpose:** Lists administrative users, staff, and account lockout statuses.
- **Required Authorization:** `ROLE_ADMIN`
- **Query Parameters:** `role` (optional: `ADMIN`, `USER`), `page`, `limit`.
- **Expected Response Structure:**
  ```json
  {
    "timestamp": "2026-11-16T15:00:00",
    "success": true,
    "message": "Operation successful",
    "data": {
      "users": [
        {
          "id": 1,
          "email": "admin@varellion.com",
          "username": "superadmin",
          "role": "ADMIN",
          "enabled": true,
          "emailVerified": true,
          "failedAttempts": 0,
          "isLocked": false,
          "createdAt": "2026-10-01T08:00:00Z"
        }
      ],
      "totalElements": 3,
      "totalPages": 1,
      "currentPage": 0,
      "pageSize": 20
    }
  }
  ```

---

### API-USR02: Create New Administrator / Staff Account
- **Domain:** User Management
- **Priority:** **HIGH**
- **HTTP Method:** `POST`
- **Proposed Endpoint:** `/api/admin/users`
- **Purpose:** Provisions internal staff and manager accounts with `ROLE_ADMIN`.
- **Required Authorization:** `ROLE_ADMIN`
- **Request Body:**
  ```json
  {
    "email": "manager@varellion.com",
    "username": "store_manager",
    "password": "StrongPassword!2026",
    "role": "ADMIN"
  }
  ```
- **Validation:** Enforces strong password rules (min 8 chars, uppercase, lowercase, number, special char).

---

### API-USR03: Toggle User Enablement Status
- **Domain:** User Management
- **Priority:** **MEDIUM**
- **HTTP Method:** `PATCH`
- **Proposed Endpoint:** `/api/admin/users/{userId}/status`
- **Purpose:** Instantly disables or enables user/staff login access (`users.enabled`).
- **Required Authorization:** `ROLE_ADMIN`
- **Business Rule:** Prevents an administrator from disabling their own account.

---

### API-USR04: Unlock Locked User Account
- **Domain:** User Management
- **Priority:** **MEDIUM**
- **HTTP Method:** `POST`
- **Proposed Endpoint:** `/api/admin/users/{userId}/unlock`
- **Purpose:** Clears failed login counter (`failed_attempts = 0`) and removes `lockout_time` for accounts locked due to repeated bad password attempts.
- **Required Authorization:** `ROLE_ADMIN`
- **Why Necessary:** Currently, a locked admin or customer must wait out the lockout window or be manually unlocked via raw SQL in Supabase.

---

### API-USR05: Modify User Role (Privilege Management)
- **Domain:** User Management
- **Priority:** **HIGH**
- **HTTP Method:** `PATCH`
- **Proposed Endpoint:** `/api/admin/users/{userId}/role`
- **Purpose:** Promotes or demotes accounts between `USER` and `ADMIN`.
- **Required Authorization:** `ROLE_ADMIN`
- **Business Rule:** Prevents an administrator from stripping their own `ADMIN` role (suicide prevention guard).

---

### API-USR06: Administrative Password Reset
- **Domain:** User Management
- **Priority:** **MEDIUM**
- **HTTP Method:** `POST`
- **Proposed Endpoint:** `/api/admin/users/{userId}/reset-password`
- **Purpose:** Sets a temporary secure password for staff accounts locked out of email recovery.
- **Required Authorization:** `ROLE_ADMIN`

---

## 8. Domain 7: Shipping & Fulfillment Management (2 Missing Endpoints)

**Current Status: Hardcoded in Java code.** Shipping fees are currently embedded in `OrderService#calculateAuthoritativeShippingFee` and cannot be altered without rebuilding and redeploying the backend.

---

### API-SHIP01: Retrieve Shipping Governorate Fees & Thresholds
- **Domain:** Shipping Management
- **Priority:** **MEDIUM**
- **HTTP Method:** `GET`
- **Proposed Endpoint:** `/api/admin/shipping/rates`
- **Purpose:** Exposes current governorate shipping rates and the free shipping qualifying threshold.
- **Required Authorization:** `ROLE_ADMIN`
- **Expected Response Structure:**
  ```json
  {
    "timestamp": "2026-11-16T15:00:00",
    "success": true,
    "message": "Operation successful",
    "data": {
      "freeShippingThreshold": 2500.00,
      "currency": "EGP",
      "rates": [
        {
          "zone": "Greater Cairo",
          "governorates": ["القاهرة", "الجيزة", "القليوبية"],
          "shippingFee": 50.00,
          "estimatedDelivery": "24-48 ساعة"
        },
        {
          "zone": "Alexandria & Coastal",
          "governorates": ["الإسكندرية", "مطروح"],
          "shippingFee": 60.00,
          "estimatedDelivery": "2-3 أيام عمل"
        },
        {
          "zone": "Delta & Canal",
          "governorates": ["الدقهلية", "الغربية", "الشرقية", "المنوفية", "كفر الشيخ", "البحيرة", "دمياط", "بورسعيد", "الإسماعيلية", "السويس"],
          "shippingFee": 65.00,
          "estimatedDelivery": "2-4 أيام عمل"
        },
        {
          "zone": "Upper Egypt",
          "governorates": ["الفيوم", "بني سويف", "المنيا", "أسيوط", "سوهاج", "قنا", "الأقصر", "أسوان"],
          "shippingFee": 75.00,
          "estimatedDelivery": "3-5 أيام عمل"
        },
        {
          "zone": "Border Governorates",
          "governorates": ["البحر الأحمر", "الوادي الجديد", "شمال سيناء", "جنوب سيناء"],
          "shippingFee": 85.00,
          "estimatedDelivery": "4-6 أيام عمل"
        }
      ]
    }
  }
  ```

---

### API-SHIP02: Update Governorate Shipping Rates & Threshold
- **Domain:** Shipping Management
- **Priority:** **MEDIUM**
- **HTTP Method:** `PUT`
- **Proposed Endpoint:** `/api/admin/shipping/rates`
- **Purpose:** Dynamically adjusts delivery pricing and free shipping promotions.
- **Required Authorization:** `ROLE_ADMIN`

---

## 9. Domain 8: Administration & Audit Trail (1 Missing Endpoint)

---

### API-AUD01: System-Wide Audit Log Stream
- **Domain:** Administration & Audit
- **Priority:** **MEDIUM**
- **HTTP Method:** `GET`
- **Proposed Endpoint:** `/api/admin/audit-logs`
- **Purpose:** Consolidated administrative activity log combining order status transitions, catalog modifications, and staff actions.
- **Required Authorization:** `ROLE_ADMIN`
- **Query Parameters:** `page`, `limit`, `actorId`, `actionType`, `startDate`, `endDate`.
- **Expected Response Structure:**
  ```json
  {
    "timestamp": "2026-11-16T15:00:00",
    "success": true,
    "message": "Operation successful",
    "data": {
      "logs": [
        {
          "logId": "uuid",
          "actorUsername": "admin@varellion.com",
          "action": "ORDER_STATUS_TRANSITION",
          "resourceType": "ORDER",
          "resourceIdentifier": "VAR-20261028-0001",
          "details": "Changed status to SHIPPED - Reason: تسليم لمندوب الشحن",
          "ipAddress": "192.168.1.1",
          "timestamp": "2026-11-16T14:20:00Z"
        }
      ],
      "totalElements": 240,
      "totalPages": 12,
      "currentPage": 0,
      "pageSize": 20
    }
  }
  ```

---

## 10. Domain 9: Customer Support (2 Optional Endpoints)

*Note: Per audit guidelines, since no support or ticketing domain currently exists in the database, this domain is classified strictly as **OPTIONAL (Future Functionality)**.*

- **API-SUP01:** `GET /api/admin/support/inquiries` (List customer complaints and inquiries).
- **API-SUP02:** `POST /api/admin/support/inquiries/{ticketId}/reply` (Send administrative email reply and resolve ticket).

---

## 11. Complete Priority Summary Table

```
+-----------------------------------------------------------------------------------------------------------------+
|                                    MISSING ADMIN APIS BY PRIORITY                                               |
+----------+------------+--------+------------------------------------------+-------------------------------------+
| Priority | ID         | Method | Proposed Endpoint                        | Domain                              |
+----------+------------+--------+------------------------------------------+-------------------------------------+
| HIGH     | API-D01    | GET    | /api/admin/dashboard/summary             | Executive Dashboard                 |
| HIGH     | API-D02    | GET    | /api/admin/dashboard/order-status-stats  | Executive Dashboard                 |
| HIGH     | API-D03    | GET    | /api/admin/dashboard/sales-analytics     | Executive Dashboard                 |
| HIGH     | API-ORD01  | PATCH  | /api/admin/orders/{orderNumber}/notes    | Orders Management                   |
| HIGH     | API-ORD02  | PATCH  | /api/admin/orders/{orderNumber}/delivery | Orders Management                   |
| HIGH     | API-ORD04  | GET    | /api/admin/orders/statistics             | Orders Management                   |
| HIGH     | API-PRD01  | PATCH  | /api/admin/products/{productId}/stock    | Products & Inventory                |
| HIGH     | API-PRD02  | GET    | /api/admin/products/low-stock            | Products & Inventory                |
| HIGH     | API-CAT01  | GET    | /api/admin/categories                    | Categories Management               |
| HIGH     | API-CAT02  | POST   | /api/admin/categories                    | Categories Management               |
| HIGH     | API-CAT03  | GET    | /api/admin/categories/{categoryId}       | Categories Management               |
| HIGH     | API-CAT04  | PUT    | /api/admin/categories/{categoryId}       | Categories Management               |
| HIGH     | API-CAT05  | PATCH  | /api/admin/categories/{categoryId}/status| Categories Management               |
| HIGH     | API-CAT06  | DELETE | /api/admin/categories/{categoryId}       | Categories Management               |
| HIGH     | API-CUST01 | GET    | /api/admin/customers                     | Customers Management                |
| HIGH     | API-CUST02 | GET    | /api/admin/customers/{customerId}        | Customers Management                |
| HIGH     | API-CUST03 | GET    | /api/admin/customers/{customerId}/orders | Customers Management                |
| HIGH     | API-CUST04 | PATCH  | /api/admin/customers/{customerId}/status | Customers Management                |
| HIGH     | API-USR02  | POST   | /api/admin/users                         | User Management                     |
| HIGH     | API-USR05  | PATCH  | /api/admin/users/{userId}/role           | User Management                     |
| MEDIUM   | API-ORD03  | PATCH  | /api/admin/orders/{orderNumber}/fee      | Orders Management                   |
| MEDIUM   | API-ORD05  | GET    | /api/admin/orders/export                 | Orders Management                   |
| MEDIUM   | API-PRD03  | POST   | /api/admin/products/bulk-status          | Products & Inventory                |
| MEDIUM   | API-USR01  | GET    | /api/admin/users                         | User Management                     |
| MEDIUM   | API-USR03  | PATCH  | /api/admin/users/{userId}/status         | User Management                     |
| MEDIUM   | API-USR04  | POST   | /api/admin/users/{userId}/unlock         | User Management                     |
| MEDIUM   | API-USR06  | POST   | /api/admin/users/{userId}/reset-password | User Management                     |
| MEDIUM   | API-SHIP01 | GET    | /api/admin/shipping/rates                | Shipping Management                 |
| MEDIUM   | API-SHIP02 | PUT    | /api/admin/shipping/rates                | Shipping Management                 |
| MEDIUM   | API-AUD01  | GET    | /api/admin/audit-logs                    | Administration & Audit               |
| OPTIONAL | API-SUP01  | GET    | /api/admin/support/inquiries             | Customer Support                    |
| OPTIONAL | API-SUP02  | POST   | /api/admin/support/inquiries/{id}/reply  | Customer Support                    |
+----------+------------+--------+------------------------------------------+-------------------------------------+
```
