# VARELLION — Admin API Frontend Handover Specification

> **Auditor Role:** Senior Backend Engineer & API Architect  
> **Audience:** Frontend Engineering Team (Next.js 15, TypeScript, Tailwind CSS, Shadcn UI)  
> **Backend Stack:** Spring Boot 3.3.4, Java 21, Spring Security 6.3, PostgreSQL 15+ / Supabase  
> **Handover Date:** November 2026  
> **Readiness Verdict:** **CONDITIONALLY BLOCKED — ACTION REQUIRED BEFORE PRODUCTION HANDOVER**

---

## 1. Executive Handover Verdict

The backend has implemented the foundational authentication, security filters, and initial CRUD endpoints for orders and catalog products. However, **the Admin Backend is not yet ready for unassisted production handover to the Next.js frontend team**.

### Why Handover is Currently Blocked:
1. **Critical Inventory Bug in Order Fulfillment:** Cancelling or fulfilling orders does not reconcile inventory stock in the database, leading to progressive data corruption.
2. **Missing Essential Admin Domains:** The frontend cannot build the Admin Dashboard landing page (`/admin`), Customer Management (`/admin/customers`), Categories Management (`/admin/categories`), or Staff Management (`/admin/users`) because zero endpoints exist for these domains.
3. **Severe Performance Bottlenecks (N+1 Queries):** Listing orders and products triggers dozens of queries per page due to lazy loading.
4. **Unhandled Database Constraint Crashes:** Submitting a product with price `0.00` and `isActive = true` crashes PostgreSQL and emits an unhelpful HTTP 500.

---

## 2. Authentication & Authorization Contract

### 2.1 Identity & Session Architecture
- The administrative interface communicates with the backend via **stateless Bearer JWT tokens**.
- All administrative requests must send the access token in the standard HTTP header:
  ```http
  Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
  ```
- **Required Role:** The authenticated user must hold the `ROLE_ADMIN` authority. Any token without this role will receive HTTP `403 Forbidden`.

### 2.2 Token Lifecycle & Endpoints
| Action | HTTP Route | Payload / Headers | Response |
| :--- | :--- | :--- | :--- |
| **Admin Login** | `POST /api/auth/login` | `{"emailOrUsername": "admin@varellion.com", "password": "..."}` | Sets HttpOnly `refreshToken` cookie; returns `accessToken` in body. |
| **Google Admin Login** | `POST /api/auth/google` | `{"idToken": "google_jwt_token"}` | Verifies email against `ADMIN_EMAILS`. Returns tokens. |
| **Refresh Access Token** | `POST /api/auth/refresh` | Cookie: `refreshToken=<token>` | Emits new `accessToken` (15-min validity). |
| **Admin Logout** | `POST /api/auth/logout` | Cookie: `refreshToken=<token>` | Clears HttpOnly cookie; revokes session. |

### 2.3 CORS & Cookie Configuration
- Backend has enabled CORS with credentials:
  ```
  Access-Control-Allow-Origin: http://localhost:3000 (configured via FRONTEND_URL)
  Access-Control-Allow-Credentials: true
  Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
  ```
- **Frontend Requirement:** In Next.js / `fetch` / `axios`, all requests must specify `credentials: 'include'` to allow refresh token cookies to pass across origins.

---

## 3. Existing Endpoints: Readiness Status

```
+---------------------------------------------------------------------------------------------------------------+
|                                      EXISTING ADMIN ENDPOINTS STATUS                                          |
+---+--------+---------------------------------------+---------------------+------------------------------------+
| # | Method | Endpoint                              | Frontend Readiness  | Required Fix Before Release        |
+---+--------+---------------------------------------+---------------------+------------------------------------+
| 1 | GET    | /api/admin/orders                     | READY WITH WARNINGS | Avoid over-fetching; add sorting.  |
| 2 | GET    | /api/admin/orders/{orderNumber}       | FRONTEND-READY      | None; fully functional.            |
| 3 | PUT    | /api/admin/orders/{orderNumber}/status| BLOCKED             | Fix stock deduction/release leak.  |
| 4 | GET    | /api/admin/products                   | READY WITH WARNINGS | N+1 image query; hardcoded sort.   |
| 5 | GET    | /api/admin/products/{productId}       | FRONTEND-READY      | Handle bad UUID format gracefully. |
| 6 | POST   | /api/admin/products                   | REQUIRES CHANGES    | Validate price > 0 when active.    |
| 7 | PUT    | /api/admin/products/{productId}       | REQUIRES CHANGES    | Prevent image clearing if omitted. |
| 8 | PATCH  | /api/admin/products/{productId}/status| FRONTEND-READY      | Pre-check price > 0.               |
| 9 | DELETE | /api/admin/products/{productId}       | READY WITH WARNINGS | Standardize string response to DTO.|
+---+--------+---------------------------------------+---------------------+------------------------------------+
```

---

## 4. Frontend Contracts for Ready & Semi-Ready Endpoints

### 4.1 Order Detail: `GET /api/admin/orders/{orderNumber}`
- **Ready for Frontend:** Yes.
- **Request:**
  ```http
  GET /api/admin/orders/VAR-20261028-0001 HTTP/1.1
  Authorization: Bearer <ADMIN_JWT>
  ```
- **Response Structure:**
  ```json
  {
    "timestamp": "2026-11-16T14:30:00",
    "success": true,
    "message": "Operation successful",
    "data": {
      "orderId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "orderNumber": "VAR-20261028-0001",
      "customerName": "محمد أحمد علي",
      "customerPhone": "01012345678",
      "shippingGovernorate": "القاهرة",
      "shippingCityArea": "المعادي",
      "shippingDetailedAddress": "شارع 9، مبنى 14",
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
      "createdAt": "2026-10-28T14:00:00Z",
      "updatedAt": "2026-10-28T14:30:00Z",
      "items": [
        {
          "orderItemId": "uuid",
          "productId": "uuid",
          "productNameAr": "ساعة فارليون الملكية",
          "productNameEn": "VARELLION Royal Watch",
          "productSku": "VAR-W-GLD-01",
          "unitPrice": 1850.00,
          "quantity": 1,
          "lineTotal": 1850.00,
          "imageUrl": "https://images.unsplash.com/photo-1522335789203"
        }
      ],
      "statusHistory": [
        {
          "historyId": "uuid",
          "previousStatus": "CONFIRMED",
          "newStatus": "SHIPPED",
          "statusDisplayAr": "مع مندوب التوصيل",
          "statusDisplayEn": "Out for Delivery",
          "reason": "تم تسليم الشحنة لشركة الشحن",
          "createdAt": "2026-10-28T14:30:00Z"
        }
      ]
    }
  }
  ```

---

### 4.2 Update Order Status: `PUT /api/admin/orders/{orderNumber}/status`
- **Notice to Frontend:** UI must enforce legal transitions from `PERMITTED_STATUS_TRANSITIONS` table before submitting.
- **Permitted Transitions State Machine:**
  - `PENDING_CUSTOMER_CONFIRMATION` -> `CONFIRMED`, `CANCELLED`, `EXPIRED`
  - `CONFIRMED` -> `PREPARING`, `SHIPPED`, `CANCELLED`
  - `PREPARING` -> `SHIPPED`, `CANCELLED`
  - `SHIPPED` -> `DELIVERED`, `DELIVERY_FAILED`, `RETURNED`, `CANCELLED`
  - `DELIVERY_FAILED` -> `SHIPPED`, `DELIVERED`, `RETURNED`, `CANCELLED`
  - Terminal states (`DELIVERED`, `CANCELLED`, `EXPIRED`, `RETURNED`, `EXCHANGED`) -> Cannot transition to any status.
- **Request:**
  ```http
  PUT /api/admin/orders/VAR-20261028-0001/status HTTP/1.1
  Authorization: Bearer <ADMIN_JWT>
  Content-Type: application/json

  {
    "newStatus": "SHIPPED",
    "reason": "تم تسليم الطلب إلى مندوب شركة بوسطة للشحن"
  }
  ```
- **Conflict Handling (409):** If another administrator modified the order concurrently, the backend returns HTTP 409:
  ```json
  {
    "timestamp": "2026-11-16T14:30:00",
    "status": 409,
    "error": "Conflict",
    "message": "تم تعديل الطلب بواسطة جلسة أخرى، يرجى تحديث الصفحة والمحاولة مرة أخرى",
    "path": "/api/admin/orders/VAR-20261028-0001/status"
  }
  ```
  **Frontend Action:** Catch 409, display a notification to the user, and automatically re-fetch the latest order data.

---

### 4.3 Product Detail: `GET /api/admin/products/{productId}`
- **Ready for Frontend:** Yes.
- **Request:**
  ```http
  GET /api/admin/products/a0000000-0000-0000-0000-000000000001 HTTP/1.1
  Authorization: Bearer <ADMIN_JWT>
  ```
- **Response Structure:**
  ```json
  {
    "timestamp": "2026-11-16T14:30:00",
    "success": true,
    "message": "Operation successful",
    "data": {
      "productId": "a0000000-0000-0000-0000-000000000001",
      "categoryId": "11111111-1111-1111-1111-111111111111",
      "categorySlug": "watches",
      "categoryNameAr": "ساعات يد فاخرة",
      "categoryNameEn": "Luxury Watches",
      "sku": "VAR-W-GLD-01",
      "nameAr": "ساعة فارليون الملكية الذهبية",
      "nameEn": "VARELLION Royal Gold Chronograph Watch",
      "descriptionAr": "ساعة فاخرة مصنوعة من الفولاذ المقاوم للصدأ ومطلية بالذهب عيار 18.",
      "descriptionEn": "A luxury timepiece crafted from 316L stainless steel with 18k gold plating.",
      "price": 1850.00,
      "costPrice": 950.00,
      "stockQuantity": 10,
      "reservedQuantity": 2,
      "availableStock": 8,
      "isActive": true,
      "images": [
        {
          "imageId": "b0000000-0000-0000-0000-000000000001",
          "imageUrl": "https://images.unsplash.com/photo-1522335789203",
          "isMain": true,
          "displayOrder": 1
        }
      ],
      "createdAt": "2026-11-01T10:00:00Z",
      "updatedAt": "2026-11-01T10:00:00Z"
    }
  }
  ```

---

### 4.4 Create Product: `POST /api/admin/products`
- **Frontend Pre-Validation Requirement:** Do not submit `price <= 0.00` if `isActive == true` (will fail database check constraint).
- **Request:**
  ```http
  POST /api/admin/products HTTP/1.1
  Authorization: Bearer <ADMIN_JWT>
  Content-Type: application/json

  {
    "nameAr": "محفظة جلد طبيعي كونياك",
    "nameEn": "Cognac Full-Grain Leather Wallet",
    "categoryId": "22222222-2222-2222-2222-222222222222",
    "descriptionAr": "محفظة كلاسيكية من جلد البقر الطبيعي مع حماية RFID.",
    "descriptionEn": "Hand-stitched bifold wallet in vegetable-tanned full-grain leather.",
    "price": 890.00,
    "costPrice": 420.00,
    "stockQuantity": 25,
    "sku": "VAR-L-COB-01",
    "isActive": true,
    "images": [
      {
        "imageUrl": "https://images.unsplash.com/photo-1627123424574-724758594e93",
        "isMain": true,
        "displayOrder": 1
      }
    ]
  }
  ```
- **Duplicate SKU Conflict (409):** Catch 409 and show inline validation on SKU field: `"رمز المنتج (SKU) مسجل بالفعل لمنتج آخر"`.

---

### 4.5 Update Product: `PUT /api/admin/products/{productId}`
- **CRITICAL FRONTEND WARNING ON IMAGES:** If you omit or send an empty `images` array (`[]`), **all existing images will be deleted from the database**. The frontend edit form MUST always send back the existing images array unless the user explicitly deleted them.
- **Stock Constraint Warning:** `stockQuantity` cannot be set lower than the current `reservedQuantity`.

---

### 4.6 Delete Product: `DELETE /api/admin/products/{productId}`
- **Response Handling:**
  The response currently returns a plain string in `data`:
  - If soft-archived (due to past orders): `data: "تم أرشفة المنتج بنجاح وإلغاء تفعيله للحفاظ على سلامة سجلات الطلبات التاريخية"`
  - If permanently deleted: `data: "تم حذف المنتج نهائياً بنجاح"`
- **Frontend Action:** Check if the message contains `"أرشفة"` to display an archive badge or `"حذف"` to remove the row from the table.

---

## 5. Standard Error Envelopes & HTTP Status Codes

The frontend API client (`api.ts` / `requestApi`) must handle the following standard JSON error envelope:

```json
{
  "timestamp": "2026-11-16T14:30:00.123456",
  "status": 400,
  "error": "Validation Failed",
  "message": "One or more fields failed validation",
  "path": "/api/admin/products",
  "validationErrors": {
    "nameAr": "اسم المنتج باللغة العربية مطلوب",
    "price": "السعر يجب أن يكون 0 أو أكثر",
    "sku": "صيغة SKU يجب أن تحتوي على أحرف وأرقام وشرطات فقط"
  }
}
```

### HTTP Status Code Reference
| Code | Reason | Cause | Frontend Action |
| :---: | :--- | :--- | :--- |
| **200** | OK | Successful fetch, update, or soft-delete. | Update UI state or refetch data. |
| **201** | Created | Resource successfully created (`POST`). | Redirect to list or show success banner. |
| **400** | Bad Request | Validation error or illegal state transition. | Map `validationErrors` to form inputs. |
| **401** | Unauthorized | Token missing, invalid, or expired. | Trigger `/api/auth/refresh`; redirect to `/login` if refresh fails. |
| **403** | Forbidden | User lacks `ROLE_ADMIN`. | Render "Access Denied" error page. |
| **404** | Not Found | Resource ID or order number not found. | Display 404 alert card. |
| **409** | Conflict | Duplicate SKU or concurrent update conflict. | Highlight conflicting field or prompt reload. |
| **429** | Too Many Requests | Rate limit exceeded. | Display cooldown message with retry timer. |
| **500** | Server Error | Unhandled server or database exception. | Display generic error dialog; log to monitoring. |

---

## 6. Complete List of Questions the Frontend Developer Must Ask the Backend Team

When integrating, the Next.js developer must submit the following questions to backend engineering:

1. **Order Inventory Reconciliation:**
   > *"When will the fix for order cancellation and order fulfillment be deployed so that cancelling an order releases reserved stock and shipping an order deducts physical stock?"*
2. **Dashboard Landing Page APIs:**
   > *"The `/admin` landing page needs KPI metrics (revenue, orders, low stock). Are the endpoints `GET /api/admin/dashboard/summary` and `GET /api/admin/dashboard/order-status-stats` ready to be implemented?"*
3. **Category Management in Catalog:**
   > *"The product creation form requires a `categoryId`. Where can the admin create or view categories? When will `GET /api/admin/categories` and `POST /api/admin/categories` be available?"*
4. **Order Notes & Address Corrections:**
   > *"If a customer calls with a corrected address or phone number, which endpoint should we call to update the order without altering its status?"*
5. **Product Update Image Behavior:**
   > *"On `PUT /api/admin/products/{productId}`, omitting the `images` property deletes all product images. Can the backend preserve existing images when the property is null/omitted, or must the frontend always pass back the complete image list?"*
6. **Customer Directory:**
   > *"We need to build the Customers screen (`/admin/customers`). What is the timeline for `GET /api/admin/customers` and `GET /api/admin/customers/{customerId}`?"*
7. **Sorting Parameters:**
   > *"When can we expect sorting parameters (`sortBy`, `sortDirection`) on `/api/admin/orders` and `/api/admin/products` so users can sort by price, stock, and total amount?"*
8. **Delete Product Return Type:**
   > *"Can `DELETE /api/admin/products/{productId}` return a structured JSON object (`{ "productId": "...", "status": "ARCHIVED" | "DELETED" }`) instead of localized Arabic text in `data`?"*
