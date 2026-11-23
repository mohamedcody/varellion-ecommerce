# VARELLION — Administrative REST API Contract Specification

> **Base URL:** `http://localhost:8080/api/admin`
> **Protocol:** HTTPS / HTTP 1.1
> **Security:** Bearer JWT Token (`Authorization: Bearer <TOKEN>`)
> **Required Authority:** `ROLE_ADMIN`
> **Content-Type:** `application/json` (UTF-8)

---

## 1. Global Response & Error Envelopes

### 1.1 Success Envelope: `ApiResponse<T>`

```json
{
  "timestamp": "2026-11-16T15:30:00.123456",
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### 1.2 Error Envelope: `ErrorResponse`

```json
{
  "timestamp": "2026-11-16T15:30:00.123456",
  "status": 400,
  "error": "Validation Failed",
  "message": "One or more fields failed validation",
  "path": "/api/admin/products",
  "validationErrors": {
    "nameAr": "اسم المنتج باللغة العربية مطلوب",
    "price": "السعر يجب أن يكون 0 أو أكثر"
  }
}
```

---

## 2. Order Management Contracts

### 2.1 `GET /api/admin/orders`

- **Purpose:** Paginated list of store orders.
- **Query Parameters:**
  - `page` (`int`, optional, default: `0`).
  - `limit` (`int`, optional, default: `10`).
  - `status` (`OrderStatus`, optional).
  - `search` (`String`, optional): Substring match on `orderNumber`, `customerPhone`, or `customerName`.
  - `sortBy` (`String`, optional, default: `createdAt`, allowed: `createdAt`, `totalAmount`, `orderStatus`).
  - `sortDirection` (`String`, optional, default: `DESC`, allowed: `ASC`, `DESC`).
- **Response (200 OK):**
  ```json
  {
    "timestamp": "2026-11-16T15:30:00",
    "success": true,
    "message": "Operation successful",
    "data": {
      "orders": [
        {
          "orderId": "uuid",
          "orderNumber": "VAR-20261028-0001",
          "customerName": "محمد أحمد علي",
          "customerPhone": "01012345678",
          "shippingGovernorate": "القاهرة",
          "shippingCityArea": "المعادي",
          "shippingDetailedAddress": "شارع 9",
          "currency": "EGP",
          "subtotal": 1850.0,
          "discountTotal": 0.0,
          "shippingFee": 50.0,
          "totalAmount": 1900.0,
          "orderStatus": "SHIPPED",
          "statusDisplayAr": "مع مندوب التوصيل",
          "statusDisplayEn": "Out for Delivery",
          "shippingFeeStatus": "PENDING",
          "estimatedDeliveryAr": "2-3 أيام عمل",
          "confirmationDeadline": "2026-10-29T14:00:00Z",
          "customerNotes": "يرجى الاتصال قبل الوصول",
          "paymentMethod": "CASH_ON_DELIVERY",
          "createdAt": "2026-10-28T14:00:00Z",
          "updatedAt": "2026-10-28T14:30:00Z"
        }
      ],
      "totalElements": 42,
      "totalPages": 5,
      "currentPage": 0,
      "pageSize": 10
    }
  }
  ```

---

### 2.2 `GET /api/admin/orders/{orderNumber}`

- **Purpose:** Full detail view of a single order.
- **Path Variable:** `orderNumber` (`String`, pattern: `^VAR-\d{8}-\d{4}$`).
- **Response (200 OK):** Contains full `items` array and complete `statusHistory` array.

---

### 2.3 `PUT /api/admin/orders/{orderNumber}/status`

- **Purpose:** Transition order lifecycle status and reconcile inventory.
- **Path Variable:** `orderNumber` (`String`).
- **Request Body:**
  ```json
  {
    "newStatus": "SHIPPED",
    "reason": "تم تسليم الشحنة لمندوب التوصيل"
  }
  ```
- **Business Behavior:**
  - Transition to `CANCELLED` / `EXPIRED`: Decrements `reservedQuantity` on products.
  - Transition to `SHIPPED` / `DELIVERED`: Decrements `stockQuantity` and decrements `reservedQuantity`.
- **Response Codes:**
  - `200 OK`: Transition successful.
  - `400 Bad Request`: Illegal state transition or validation failure.
  - `404 Not Found`: Order number does not exist.
  - `409 Conflict`: Concurrent update detected (optimistic lock).

---

### 2.4 `PATCH /api/admin/orders/{orderNumber}/notes`

- **Purpose:** Update administrator internal notes without changing lifecycle status.
- **Request Body:**
  ```json
  {
    "adminNotes": "تم الاتصال بالعميل وأكد موعد الاستلام غداً بعد الظهر."
  }
  ```
- **Validation:** `@Size(max = 2000)`.
- **Response (200 OK):** `ApiResponse<OrderResponseDto>`.

---

### 2.5 `PATCH /api/admin/orders/{orderNumber}/delivery-address`

- **Purpose:** Update recipient phone or delivery address prior to shipment.
- **Request Body:**
  ```json
  {
    "customerPhone": "01098765432",
    "shippingGovernorate": "الجيزة",
    "shippingCityArea": "الدقي",
    "shippingDetailedAddress": "14 شارع مصدق"
  }
  ```
- **Business Rules:** Permitted only if status is `PENDING_CUSTOMER_CONFIRMATION` or `CONFIRMED`. Recalculates shipping fee if governorate changes.
- **Response (200 OK):** `ApiResponse<OrderResponseDto>`.

---

### 2.6 `GET /api/admin/orders/statistics`

- **Purpose:** Fast counter of orders by status for table badge tabs.
- **Response (200 OK):**
  ```json
  {
    "timestamp": "2026-11-16T15:30:00",
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

---

## 3. Catalog & Products Contracts

### 3.1 `GET /api/admin/products`

- **Query Parameters:**
  - `category` (`String`, optional): Category slug.
  - `search` (`String`, optional): Match against nameAr, nameEn, sku.
  - `isActive` (`Boolean`, optional).
  - `page` (`int`, optional, default: `0`).
  - `limit` (`int`, optional, default: `20`).
  - `sortBy` (`String`, optional, default: `createdAt`, allowed: `createdAt`, `price`, `stockQuantity`, `nameAr`).
  - `sortDirection` (`String`, optional, default: `DESC`, allowed: `ASC`, `DESC`).
- **Response (200 OK):** `ApiResponse<PagedAdminProductsResponse>`.

---

### 3.2 `GET /api/admin/products/{productId}`

- **Path Variable:** `productId` (`UUID`).
- **Response (200 OK):** `ApiResponse<AdminProductDto>`.

---

### 3.3 `POST /api/admin/products`

- **Request Body:**
  ```json
  {
    "nameAr": "ساعة كرونوغراف إميرالد",
    "nameEn": "Varellion Emerald Chronograph",
    "categoryId": "11111111-1111-1111-1111-111111111111",
    "descriptionAr": "ساعة يد فاخرة بمينا أخضر زمردي.",
    "descriptionEn": "Luxury timepiece with emerald green dial.",
    "price": 4850.0,
    "costPrice": 2200.0,
    "stockQuantity": 15,
    "sku": "VAR-WAT-EMR-01",
    "isActive": true,
    "images": [
      {
        "imageUrl": "https://images.unsplash.com/photo-1522335789203",
        "isMain": true,
        "displayOrder": 1
      }
    ]
  }
  ```
- **Validation Rules:**
  - `price > 0.00` if `isActive == true` (enforced at service layer).
  - `sku` matches `^[A-Za-z0-9-_]+$`.
- **Response (201 Created):** `ApiResponse<AdminProductDto>`.

---

### 3.4 `PUT /api/admin/products/{productId}`

- **Path Variable:** `productId` (`UUID`).
- **Request Body:** Identical to `POST /api/admin/products`.
- **Special Rule:** If `images` is omitted (`null`), existing images are preserved rather than deleted.
- **Constraint Check:** Rejects with 400 Bad Request if `stockQuantity < reservedQuantity`.
- **Response (200 OK):** `ApiResponse<AdminProductDto>`.

---

### 3.5 `PATCH /api/admin/products/{productId}/stock`

- **Purpose:** Quick inventory balance adjustment without updating entire product metadata.
- **Request Body:**
  ```json
  {
    "stockAdjustment": 10,
    "adjustmentType": "RESTOCK",
    "reason": "استلام توريد جديد"
  }
  ```
- **Response (200 OK):** `ApiResponse<AdminProductDto>`.

---

### 3.6 `PATCH /api/admin/products/{productId}/status`

- **Request Body:** `{"isActive": true}`.
- **Validation:** If `isActive == true` and `price <= 0`, rejects with `400 Bad Request`.
- **Response (200 OK):** `ApiResponse<AdminProductDto>`.

---

### 3.7 `DELETE /api/admin/products/{productId}`

- **Response (200 OK):**
  ```json
  {
    "timestamp": "2026-11-16T15:30:00",
    "success": true,
    "message": "تمت معالجة الطلب بنجاح",
    "data": {
      "productId": "a0000000-0000-0000-0000-000000000001",
      "status": "ARCHIVED",
      "detail": "تم أرشفة المنتج بنجاح للحفاظ على سلامة سجلات الطلبات السابقة"
    }
  }
  ```

---

## 4. Categories Management Contracts

### 4.1 `GET /api/admin/categories`

- **Purpose:** Retrieve all categories (active & inactive) with product counts.
- **Response (200 OK):**
  ```json
  {
    "timestamp": "2026-11-16T15:30:00",
    "success": true,
    "message": "Operation successful",
    "data": [
      {
        "categoryId": "11111111-1111-1111-1111-111111111111",
        "nameAr": "ساعات يد فاخرة",
        "nameEn": "Luxury Watches",
        "slug": "watches",
        "descriptionAr": "مجموعة الساعات السويسرية والميكانيكية",
        "descriptionEn": "Swiss and mechanical luxury timepieces",
        "isActive": true,
        "productCount": 12,
        "createdAt": "2026-10-01T10:00:00Z",
        "updatedAt": "2026-10-15T12:00:00Z"
      }
    ]
  }
  ```

---

### 4.2 `POST /api/admin/categories`

- **Request Body:**
  ```json
  {
    "nameAr": "أقلام حبر ملكية",
    "nameEn": "Royal Fountain Pens",
    "slug": "fountain-pens",
    "descriptionAr": "أقلام فاخرة مصنوعة من الروديوم",
    "descriptionEn": "Exquisite luxury fountain pens",
    "isActive": true
  }
  ```
- **Validation:** `slug` matches `^[a-z0-9]+(-[a-z0-9]+)*$`.
- **Response (201 Created):** `ApiResponse<AdminCategoryDto>`.

---

### 4.3 `DELETE /api/admin/categories/{categoryId}`

- **Business Behavior:**
  - If category has products assigned: Returns `409 Conflict`: `"لا يمكن حذف هذا القسم لأنه يحتوي على منتجات مرتبطة"`.
  - If category has no products: Deletes permanently and returns `200 OK`.

---

## 5. Executive Dashboard Contracts

### 5.1 `GET /api/admin/dashboard/summary`

- **Response (200 OK):**
  ```json
  {
    "timestamp": "2026-11-16T15:30:00",
    "success": true,
    "message": "Operation successful",
    "data": {
      "totalRevenue": 248950.0,
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

---

### 5.2 `GET /api/admin/dashboard/order-status-stats`

- **Response (200 OK):** Returns key-value object of counts mapped by `OrderStatus`.

---

### 5.3 `GET /api/admin/dashboard/sales-analytics`

- **Query Parameters:** `interval` (`DAILY`, `WEEKLY`, `MONTHLY`), `limit` (`int`).
- **Response (200 OK):** Array of `{ "date": "2026-11-15", "revenue": 18450.00, "orderCount": 8 }`.

---

## 6. Customers Management Contracts

### 6.1 `GET /api/admin/customers`

- **Query Parameters:** `page`, `limit`, `search`, `isActive`.
- **Response (200 OK):** Paginated directory of customers with `totalSpent` and `totalOrders`.

### 6.2 `GET /api/admin/customers/{customerId}`

- **Response (200 OK):** Detailed profile with saved address and commercial lifetime statistics.

### 6.3 `PATCH /api/admin/customers/{customerId}/status`

- **Request Body:** `{"isActive": false, "reason": "طلب وهمي متكرر"}`.
- **Response (200 OK):** `ApiResponse<AdminCustomerDetailDto>`.
