# VARELLION Admin Architecture — API Contract Specifications

> **Document Version:** 2.0.0  
> **Status:** APPROVED API CONTRACTS  
> **Standard Success Envelope:** `com.varellion.store.common.response.ApiResponse<T>`  
> **Standard Error Envelope:** `com.varellion.store.common.response.ErrorResponse`  

---

## 1. Global Wire Protocol & Standards

All VARELLION administrative endpoints strictly comply with standardized wire formats. Every response—success or error—is encapsulated in the project's authoritative JSON envelope.

### 1.1 Standard Request Headers
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
Accept: application/json
Idempotency-Key: e4b2568a-6b45-4a11-b148-3a99e8d4a991   <-- [For state mutations]
```

### 1.2 Authoritative Success Envelope (`ApiResponse<T>`)
```json
{
  "timestamp": "2026-11-16T12:00:00",
  "success": true,
  "message": "تمت العملية بنجاح",
  "data": {}
}
```

### 1.3 Authoritative Error Envelope (`ErrorResponse`)
```json
{
  "timestamp": "2026-11-16T12:00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "One or more fields failed validation",
  "path": "/api/admin/products",
  "validationErrors": {
    "price": "السعر يجب أن يكون أكبر من أو يساوي 0.00",
    "sku": "رمز المنتج SKU مطلوب"
  }
}
```

---

## 2. Global Error Responses Catalog

### 2.1 HTTP 401 Unauthorized (Missing or Expired JWT)
```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "timestamp": "2026-11-16T12:00:00",
  "status": 401,
  "error": "Unauthorized",
  "message": "Full authentication is required to access this resource",
  "path": "/api/admin/orders"
}
```

### 2.2 HTTP 403 Forbidden (Insufficient Privileges)
```http
HTTP/1.1 403 Forbidden
Content-Type: application/json

{
  "timestamp": "2026-11-16T12:00:00",
  "status": 403,
  "error": "Forbidden",
  "message": "Access Denied: You do not possess the required permission [admins:manage]",
  "path": "/api/admin/users/5"
}
```

### 2.3 HTTP 404 Not Found (Resource Does Not Exist)
```http
HTTP/1.1 404 Not Found
Content-Type: application/json

{
  "timestamp": "2026-11-16T12:00:00",
  "status": 404,
  "error": "Not Found",
  "message": "الطلب برقم VAR-20261116-9999 غير موجود",
  "path": "/api/admin/orders/VAR-20261116-9999"
}
```

### 2.4 HTTP 409 Conflict (Optimistic Lock Failure)
```http
HTTP/1.1 409 Conflict
Content-Type: application/json

{
  "timestamp": "2026-11-16T12:00:00",
  "status": 409,
  "error": "Conflict",
  "message": "تم تعديل الطلب بواسطة جلسة أخرى، يرجى تحديث الصفحة والمحاولة مرة أخرى",
  "path": "/api/admin/orders/VAR-20261028-0001/status"
}
```

### 2.5 HTTP 423 Locked (Account Locked After 5 Failed Attempts)
```http
HTTP/1.1 423 Locked
Content-Type: application/json

{
  "timestamp": "2026-11-16T12:00:00",
  "status": 423,
  "error": "Locked",
  "message": "الحساب مقفل مؤقتاً بسبب تكرار المحاولات الخاطئة. يرجى المحاولة بعد 15 دقيقة أو التواصل مع الإدارة.",
  "path": "/api/auth/login"
}
```

### 2.6 HTTP 500 Internal Server Error (Unexpected Exception)
```http
HTTP/1.1 500 Internal Server Error
Content-Type: application/json

{
  "timestamp": "2026-11-16T12:00:00",
  "status": 500,
  "error": "Internal Server Error",
  "message": "An unexpected error occurred. Please try again later.",
  "path": "/api/admin/reports/sales"
}
```

---

## 3. Concrete API Contracts by Module

---

### Module 01: Executive Dashboard Management

#### Endpoint: `GET /api/admin/dashboard/summary`
* **Query Parameters:** `period=THIS_MONTH`

**Successful Response (200 OK):**
```json
{
  "timestamp": "2026-11-16T12:00:00",
  "success": true,
  "message": "تم استرجاع ملخص لوحة التحكم بنجاح",
  "data": {
    "grossRevenue": 348500.00,
    "netRevenue": 312000.00,
    "totalOrders": 142,
    "averageOrderValue": 2454.22,
    "currency": "EGP",
    "pendingConfirmationCount": 12,
    "confirmedCount": 18,
    "preparingCount": 24,
    "shippedCount": 35,
    "deliveredCount": 42,
    "deliveryFailedCount": 4,
    "cancelledCount": 5,
    "returnedCount": 2,
    "lowStockCount": 3,
    "outOfStockCount": 1,
    "activeCustomersCount": 389
  }
}
```

---

### Module 02: Products Management

#### Endpoint: `POST /api/admin/products`
* **Headers:** `Idempotency-Key: f82a93b4-82a1-423f-bf1e-128495038102`

**Request Payload:**
```json
{
  "nameAr": "ساعة كرونوغراف إميرالد الفاخرة",
  "nameEn": "Varellion Emerald Chronograph",
  "categoryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "descriptionAr": "ساعة فاخرة مصنوعة من الفولاذ المقاوم للصدأ 316L وزجاج الياقوت الأزرق المقاوم للخدش مع مينا باللون الأخضر الزمردي.",
  "descriptionEn": "Luxury chronograph crafted with 316L stainless steel, scratch-resistant sapphire crystal, and an emerald green sunray dial.",
  "price": 4850.00,
  "costPrice": 2200.00,
  "stockQuantity": 25,
  "sku": "VAR-WAT-EMR-01",
  "isActive": true,
  "images": [
    {
      "imageUrl": "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9",
      "isMain": true,
      "displayOrder": 1
    },
    {
      "imageUrl": "https://images.unsplash.com/photo-1524805444758-089113d48a6d",
      "isMain": false,
      "displayOrder": 2
    }
  ]
}
```

**Successful Response (201 Created):**
```json
{
  "timestamp": "2026-11-16T12:00:00",
  "success": true,
  "message": "تم إضافة المنتج بنجاح",
  "data": {
    "productId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "nameAr": "ساعة كرونوغراف إميرالد الفاخرة",
    "nameEn": "Varellion Emerald Chronograph",
    "sku": "VAR-WAT-EMR-01",
    "price": 4850.00,
    "costPrice": 2200.00,
    "stockQuantity": 25,
    "reservedQuantity": 0,
    "availableStock": 25,
    "isActive": true,
    "version": 0,
    "category": {
      "categoryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "nameAr": "ساعات يد رجالية فاخرة",
      "nameEn": "Luxury Watches",
      "slug": "luxury-watches"
    },
    "images": [
      {
        "imageId": "c1f7b3e2-8b4e-4f3a-9c2d-1e5f8a7b9c0d",
        "imageUrl": "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9",
        "isMain": true,
        "displayOrder": 1
      }
    ],
    "createdAt": "2026-11-16T12:00:00Z",
    "updatedAt": "2026-11-16T12:00:00Z"
  }
}
```

**Validation Error Response (400 Bad Request):**
```json
{
  "timestamp": "2026-11-16T12:00:00",
  "status": 400,
  "error": "Validation Failed",
  "message": "One or more fields failed validation",
  "path": "/api/admin/products",
  "validationErrors": {
    "price": "السعر يجب أن يكون أكبر من أو يساوي 0.00",
    "sku": "رمز SKU يجب أن يحتوي على أحرف وأرقام وشرطات فقط"
  }
}
```

**Duplicate SKU Conflict Response (409 Conflict):**
```json
{
  "timestamp": "2026-11-16T12:00:00",
  "status": 409,
  "error": "Conflict",
  "message": "رمز المنتج (SKU) 'VAR-WAT-EMR-01' مسجل بالفعل لمنتج آخر",
  "path": "/api/admin/products"
}
```

---

### Module 03: Inventory Management

#### Endpoint: `PATCH /api/admin/inventory/products/{productId}/stock`
* **Path Parameters:** `productId=9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d`

**Request Payload:**
```json
{
  "changeQuantity": 15,
  "adjustmentType": "RESTOCK",
  "reason": "استلام شحنة جديدة من المصنع رقم PO-2026-889"
}
```

**Successful Response (200 OK):**
```json
{
  "timestamp": "2026-11-16T12:00:00",
  "success": true,
  "message": "تم تحديث المخزون وتسجيل الحركة بنجاح",
  "data": {
    "productId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "movementId": 104,
    "previousStock": 25,
    "changeQuantity": 15,
    "newStock": 40,
    "reservedQuantity": 4,
    "availableStock": 36,
    "adjustmentType": "RESTOCK",
    "reason": "استلام شحنة جديدة من المصنع رقم PO-2026-889",
    "actorUsername": "admin@varellion.com",
    "createdAt": "2026-11-16T12:00:00Z"
  }
}
```

**Business Rule Violation (400 Bad Request — Deduction Exceeds Stock):**
```json
{
  "timestamp": "2026-11-16T12:00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "لا يمكن خصم الكمية: المخزون المتبقي (2) سيكون أقل من الكمية المحجوزة حالياً للطلبات (4)",
  "path": "/api/admin/inventory/products/9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d/stock"
}
```

---

### Module 04: Orders Management

#### Endpoint: `PUT /api/admin/orders/{orderNumber}/status`
* **Path Parameters:** `orderNumber=VAR-20261028-0001`

**Request Payload:**
```json
{
  "newStatus": "CONFIRMED",
  "reason": "تم التواصل هاتفياً مع العميل وتأكيد صحة العنوان ورغبة الشراء"
}
```

**Successful Response (200 OK):**
```json
{
  "timestamp": "2026-11-16T12:00:00",
  "success": true,
  "message": "تم تحديث حالة الطلب بنجاح",
  "data": {
    "orderId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "version": 1,
    "orderNumber": "VAR-20261028-0001",
    "customerName": "أحمد محمود",
    "customerPhone": "01012345678",
    "shippingGovernorate": "القاهرة",
    "shippingCityArea": "مدينة نصر",
    "shippingDetailedAddress": "15 شارع الطيران، الدور الرابع، شقة 12",
    "currency": "EGP",
    "subtotal": 4850.00,
    "discountTotal": 0.00,
    "shippingFee": 50.00,
    "totalAmount": 4900.00,
    "orderStatus": "CONFIRMED",
    "statusDisplayAr": "تم تأكيد الطلب",
    "statusDisplayEn": "Confirmed",
    "shippingFeeStatus": "CONFIRMED",
    "estimatedDeliveryAr": "1 - 2 يوم عمل (شحن سريع)",
    "confirmationDeadline": "2026-10-29T14:30:00Z",
    "customerNotes": "يرجى الاتصال قبل الوصول بنصف ساعة",
    "adminNotes": "تم التواصل هاتفياً وتأكيد رغبة الاستلام والمعاينة",
    "items": [
      {
        "orderItemId": "e4f5a6b7-c8d9-0e1f-2a3b-4c5d6e7f8a9b",
        "productId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        "productNameAr": "ساعة كرونوغراف إميرالد الفاخرة",
        "productNameEn": "Varellion Emerald Chronograph",
        "sku": "VAR-WAT-EMR-01",
        "unitPrice": 4850.00,
        "quantity": 1,
        "lineTotal": 4850.00
      }
    ],
    "statusHistory": [
      {
        "historyId": "f7a8b9c0-d1e2-3f4a-5b6c-7d8e9f0a1b2c",
        "previousStatus": "PENDING_CUSTOMER_CONFIRMATION",
        "newStatus": "CONFIRMED",
        "reason": "تم التواصل هاتفياً مع العميل وتأكيد صحة العنوان ورغبة الشراء",
        "actorId": 1,
        "createdAt": "2026-11-16T12:00:00Z"
      }
    ],
    "createdAt": "2026-10-28T14:30:00Z",
    "updatedAt": "2026-11-16T12:00:00Z"
  }
}
```

**Illegal Transition Error (400 Bad Request):**
```json
{
  "timestamp": "2026-11-16T12:00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "لا يمكن تغيير حالة الطلب من [DELIVERED] إلى [CANCELLED]؛ هذه الحالة نهائية ولا تقبل التعديل",
  "path": "/api/admin/orders/VAR-20261028-0001/status"
}
```

---

### Module 06: Shipping Management

#### Endpoint: `PUT /api/admin/shipping/zones/1`
* **Path Parameters:** `zoneId=1`

**Request Payload:**
```json
{
  "baseFee": 55.00,
  "estimatedDaysMin": 1,
  "estimatedDaysMax": 2,
  "isActive": true
}
```

**Successful Response (200 OK):**
```json
{
  "timestamp": "2026-11-16T12:00:00",
  "success": true,
  "message": "تم تحديث رسوم ومواعيد منطقة الشحن بنجاح",
  "data": {
    "zoneId": 1,
    "zoneNameAr": "إقليم القاهرة الكبرى",
    "zoneNameEn": "Greater Cairo",
    "baseFee": 55.00,
    "estimatedDaysMin": 1,
    "estimatedDaysMax": 2,
    "isActive": true,
    "governorates": ["القاهرة", "الجيزة", "القليوبية"]
  }
}
```

---

### Module 08: Discounts & Coupons Management

#### Endpoint: `POST /api/admin/coupons`
* **Headers:** `Idempotency-Key: a1728495-9382-4112-be91-928475910284`

**Request Payload:**
```json
{
  "code": "VARELLION-LUX-200",
  "discountType": "FIXED_AMOUNT",
  "discountValue": 200.00,
  "minSubtotal": 2000.00,
  "maxDiscountAmount": null,
  "startDate": "2026-11-16T00:00:00Z",
  "endDate": "2026-12-31T23:59:59Z",
  "usageLimit": 100,
  "isActive": true
}
```

**Successful Response (201 Created):**
```json
{
  "timestamp": "2026-11-16T12:00:00",
  "success": true,
  "message": "تم إنشاء قسيمة التخفيض بنجاح",
  "data": {
    "couponId": "5f3a9e21-4d8b-4a7c-9e12-3b4c5d6e7f8a",
    "code": "VARELLION-LUX-200",
    "discountType": "FIXED_AMOUNT",
    "discountValue": 200.00,
    "minSubtotal": 2000.00,
    "maxDiscountAmount": null,
    "startDate": "2026-11-16T00:00:00Z",
    "endDate": "2026-12-31T23:59:59Z",
    "usageLimit": 100,
    "timesUsed": 0,
    "isActive": true,
    "createdAt": "2026-11-16T12:00:00Z"
  }
}
```

---

### Module 10: Admin Users Management

#### Endpoint: `POST /api/admin/users`

**Request Payload:**
```json
{
  "email": "operations@varellion.com",
  "username": "tarek_orders",
  "password": "VarellionSecure2026!#",
  "roleId": 3
}
```

**Successful Response (201 Created):**
```json
{
  "timestamp": "2026-11-16T12:00:00",
  "success": true,
  "message": "تم إنشاء حساب المسؤول بنجاح",
  "data": {
    "userId": 4,
    "email": "operations@varellion.com",
    "username": "tarek_orders",
    "role": {
      "roleId": 3,
      "roleName": "ORDER_MANAGER",
      "description": "إدارة تجهيز وشحن ومتابعة الطلبات وخدمة العملاء"
    },
    "enabled": true,
    "emailVerified": true,
    "createdAt": "2026-11-16T12:00:00Z"
  }
}
```

---

### Module 13: System Audit Logs

#### Endpoint: `GET /api/admin/audit-logs/104`
* **Path Parameters:** `logId=104`

**Successful Response (200 OK):**
```json
{
  "timestamp": "2026-11-16T12:00:00",
  "success": true,
  "message": "تم استرجاع تفاصيل سجل التدقيق بنجاح",
  "data": {
    "logId": 104,
    "actorId": 1,
    "actorUsername": "admin@varellion.com",
    "action": "STOCK_ADJUSTMENT",
    "entityName": "PRODUCT",
    "entityId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "details": {
      "productId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "sku": "VAR-WAT-EMR-01",
      "previousStock": 25,
      "changeQuantity": 15,
      "newStock": 40,
      "adjustmentType": "RESTOCK",
      "reason": "استلام شحنة جديدة من المصنع رقم PO-2026-889"
    },
    "ipAddress": "197.38.45.12",
    "createdAt": "2026-11-16T12:00:00Z"
  }
}
```

---

## 4. Summary

These contracts establish an unambiguous, zero-drift specification. Next.js engineers can consume these mock contracts directly, while backend engineers have exact JSON schemas and field validations to bind into Spring Boot `@Valid` DTOs.
