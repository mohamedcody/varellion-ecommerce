# VARELLION — Engineering Audit Report

> **Auditor Role:** Senior Backend Engineer, Software Architect, QA Engineer & Security Auditor  
> **Target Application:** VARELLION Luxury E-Commerce Backend  
> **Tech Stack:** Spring Boot 3.3.4, Java 21, Spring Security 6.3, Spring Data JPA / Hibernate 6.5, PostgreSQL 15+ / Supabase  
> **Status:** Read-Only Engineering Audit (Phase One)  
> **Date:** November 2026  

---

## 1. Executive Summary

This engineering audit examines the entire backend architecture of the VARELLION luxury e-commerce platform. The system supports customer authentication, shopping carts, order creation with financial calculations and phone normalization, public catalog browsing, and administrative operations.

A rigorous, evidence-based code and database inspection reveals that while core customer flows are well-structured, the administrative backend is in a **partially implemented and fragile state**:
- Exactly **9 administrative endpoints** exist in code.
- A **critical business logic defect** exists in order fulfillment: cancelling or fulfilling orders fails to reconcile inventory stock in PostgreSQL, creating a permanent inventory leakage.
- **Unhandled exceptions** in Spring MVC cause invalid input and database check constraints to return HTTP 500 Internal Server Errors rather than HTTP 400 Bad Request.
- **Severe N+1 query storms** degrade performance on admin orders and products listing pages.
- Essential administrative domains (Executive Dashboard, Categories Management, Customers Directory, Staff Management, and Dynamic Shipping) are **100% missing** from the backend implementation.

---

## 2. Existing Backend Architecture

### 2.1 Package & Layer Organization
```
com.varellion.store
├── admin
│   ├── catalog
│   │   ├── controller.AdminProductController
│   │   ├── dto.* (AdminProductDto, CreateProductRequest, etc.)
│   │   └── service.AdminProductService
│   └── order
│       ├── controller.AdminOrderController
│       └── dto.* (PagedOrdersResponse, UpdateOrderStatusRequest)
├── cart
│   ├── controller.CartController
│   ├── dto.*
│   ├── entity.Cart, CartItem
│   ├── repository.CartRepository, CartItemRepository
│   └── service.CartService
├── catalog
│   ├── controller.CategoryController, ProductController
│   ├── dto.*
│   ├── entity.Category, Product, ProductImage
│   ├── repository.CategoryRepository, ProductRepository, ProductImageRepository
│   └── service.CategoryService, ProductService
├── common
│   ├── config.JpaAuditingConfig
│   ├── exception.BusinessException, ResourceNotFoundException, GlobalExceptionHandler
│   └── response.ApiResponse, ErrorResponse
├── customer
│   ├── controller.CustomerController
│   ├── dto.*
│   ├── entity.Customer, CustomerAddress
│   ├── repository.CustomerRepository, CustomerAddressRepository
│   └── service.CustomerService
├── order
│   ├── controller.OrderController, GuestOrderLookupController
│   ├── dto.*
│   ├── entity.Order, OrderItem, OrderStatus, OrderStatusHistory, ShippingFeeStatus
│   ├── repository.OrderRepository, OrderItemRepository, OrderStatusHistoryRepository
│   └── service.OrderService, OrderReservationService, IdempotencyService
└── security
    ├── config.ApplicationConfig, CorsConfig, SecurityConfig
    ├── controller.AuthController
    ├── dto.*
    ├── entity.User
    ├── filter.RateLimitFilter
    ├── jwt.JwtAuthenticationEntryPoint, JwtAccessDeniedHandler, JwtAuthenticationFilter, JwtService
    ├── repository.UserRepository
    └── service.AuthService, CustomUserDetails, CustomUserDetailsService, GoogleTokenVerifier
```

### 2.2 Entity Relationship & Data Model
- **`User` vs `Customer` Architecture:**
  - `public.users` (`id: BIGSERIAL PK`): Handles authentication credentials, password hashes, `role` (`"USER"` or `"ADMIN"`), `enabled`, `failed_attempts`, and `lockout_time`.
  - `public.customers` (`user_id: UUID PK`): Represents shopper profile (`full_name`, `phone_number`, `is_active`). Linked 1:1 to `public.users` via `user_account_id BIGINT UNIQUE REFERENCES public.users(id) ON DELETE CASCADE`.
  - Non-admin users are auto-provisioned a `Customer` profile upon registration or first login (`AuthService.java:91-94, 139-140`).
- **`CustomerAddress`:** Linked 1:1 to `Customer` via `customer_id UUID UNIQUE REFERENCES public.customers(user_id) ON DELETE CASCADE`.
- **`Category` & `Product`:**
  - `Category` has `category_id: UUID PK`, `slug: TEXT UNIQUE`.
  - `Product` has `product_id: UUID PK`, `category_id: UUID REFERENCES public.categories ON DELETE RESTRICT`. Contains lean inventory fields: `cost_price`, `stock_quantity`, `reserved_quantity`, and `sku`.
  - `ProductImage`: `image_id: UUID PK`, `product_id: UUID REFERENCES public.products ON DELETE CASCADE`.
- **`Order` & Line Items:**
  - `Order` has `order_id: UUID PK`, `order_number: VARCHAR(32) UNIQUE` (`VAR-YYYYMMDD-NNNN`), `customer_id: UUID REFERENCES public.customers ON DELETE RESTRICT`. Includes financial snapshot columns (`subtotal`, `shipping_fee`, `total_amount`), customer snapshot (`customer_name`, `customer_phone`, shipping address), and optimistic concurrency column `version: BIGINT`.
  - `OrderItem`: Snapshots catalog details (`product_name_ar`, `product_name_en`, `sku`, `unit_price`, `unit_cost`, `quantity`, `line_total`). Foreign key to `products(product_id)` is `ON DELETE RESTRICT`.
  - `OrderStatusHistory`: Append-only transition audit log (`history_id: UUID PK`, `order_id: UUID`, `previous_status`, `new_status`, `reason`, `actor_id: BIGINT REFERENCES public.users(id) ON DELETE SET NULL`).

---

## 3. Existing API Endpoints Inventory

The backend currently registers 27 REST endpoints across all domains:

```
+----+--------+---------------------------------------+-----------------------------+---------------------+
| #  | Method | Endpoint Route                        | Controller Class            | Security Scope      |
+----+--------+---------------------------------------+-----------------------------+---------------------+
| 1  | POST   | /api/auth/register                    | AuthController              | Public              |
| 2  | POST   | /api/auth/login                       | AuthController              | Public              |
| 3  | POST   | /api/auth/google                      | AuthController              | Public              |
| 4  | POST   | /api/auth/refresh                     | AuthController              | Public (Cookie)     |
| 5  | POST   | /api/auth/logout                      | AuthController              | Authenticated       |
| 6  | GET    | /api/customer/profile                 | CustomerController          | Authenticated       |
| 7  | PUT    | /api/customer/profile                 | CustomerController          | Authenticated       |
| 8  | PUT    | /api/customer/address                 | CustomerController          | Authenticated       |
| 9  | DELETE | /api/customer/address                 | CustomerController          | Authenticated       |
| 10 | GET    | /api/cart                             | CartController              | Authenticated       |
| 11 | POST   | /api/cart/items                       | CartController              | Authenticated       |
| 12 | PUT    | /api/cart/items/{cartItemId}          | CartController              | Authenticated       |
| 13 | DELETE | /api/cart/items/{cartItemId}          | CartController              | Authenticated       |
| 14 | DELETE | /api/cart                             | CartController              | Authenticated       |
| 15 | POST   | /api/cart/merge                       | CartController              | Authenticated       |
| 16 | POST   | /api/orders                           | OrderController             | Authenticated       |
| 17 | GET    | /api/orders/my-orders                 | OrderController             | Authenticated       |
| 18 | GET    | /api/orders/{orderNumber}             | OrderController             | Authenticated       |
| 19 | POST   | /api/orders/lookup                    | GuestOrderLookupController  | Public              |
| 20 | GET    | /api/orders/track                     | GuestOrderLookupController  | Public              |
| 21 | GET    | /api/categories                       | CategoryController          | Public              |
| 22 | GET    | /api/categories/{slug}                | CategoryController          | Public              |
| 23 | GET    | /api/products                         | ProductController           | Public              |
| 24 | GET    | /api/products/best-sellers            | ProductController           | Public              |
| 25 | GET    | /api/products/{identifier}            | ProductController           | Public              |
+----+--------+---------------------------------------+-----------------------------+---------------------+
| 26 | GET    | /api/admin/orders                     | AdminOrderController        | ROLE_ADMIN          |
| 27 | GET    | /api/admin/orders/{orderNumber}       | AdminOrderController        | ROLE_ADMIN          |
| 28 | PUT    | /api/admin/orders/{orderNumber}/status| AdminOrderController        | ROLE_ADMIN          |
| 29 | GET    | /api/admin/products                   | AdminProductController      | ROLE_ADMIN          |
| 30 | GET    | /api/admin/products/{productId}       | AdminProductController      | ROLE_ADMIN          |
| 31 | POST   | /api/admin/products                   | AdminProductController      | ROLE_ADMIN          |
| 32 | PUT    | /api/admin/products/{productId}       | AdminProductController      | ROLE_ADMIN          |
| 33 | PATCH  | /api/admin/products/{productId}/status| AdminProductController      | ROLE_ADMIN          |
| 34 | DELETE | /api/admin/products/{productId}       | AdminProductController      | ROLE_ADMIN          |
+----+--------+---------------------------------------+-----------------------------+---------------------+
```

---

## 4. Evidence-Based Audit Findings

### Finding 1: Critical Inventory Leakage During Order Status Transitions
- **File:** `backend/src/main/java/com/varellion/store/order/service/OrderService.java`
- **Method:** `updateOrderStatus(String orderNumber, OrderStatus newStatus, String reason, Long actorId)` (lines 450-490)
- **Code:**
  ```java
  // 3. Apply state transition
  order.setOrderStatus(newStatus);

  OrderStatusHistory history = OrderStatusHistory.builder()
          .order(order)
          .previousStatus(currentStatus != null ? currentStatus.name() : null)
          .newStatus(newStatus.name())
          .reason(reason != null ? reason : "Status changed to " + newStatus.name())
          .actorId(actorId)
          .createdAt(OffsetDateTime.now())
          .build();
  ...
  Order savedOrder = orderRepository.save(order);
  return mapToDto(savedOrder);
  ```
- **Why It Matters:**
  When `createOrder` is called (lines 180-183), `product.setReservedQuantity(...)` increments the reserved quantity. However, in `updateOrderStatus`:
  1. When transitioning to `CANCELLED` or `EXPIRED`, `reservedQuantity` is **never decremented**. This permanently locks reserved stock, reducing available inventory and falsely indicating out-of-stock.
  2. When transitioning to `SHIPPED` or `DELIVERED`, physical stock `stockQuantity` is **never decremented**, and `reservedQuantity` is **never cleared**. The physical inventory on hand is never reduced upon sale completion.

---

### Finding 2: Unhandled Database Check Constraint on Active Zero-Price Products
- **File 1:** `backend/src/main/java/com/varellion/store/admin/catalog/dto/CreateProductRequest.java` (line 41)
  ```java
  @NotNull(message = "سعر البيع مطلوب")
  @DecimalMin(value = "0.00", message = "السعر يجب أن يكون 0 أو أكثر")
  private BigDecimal price;
  ```
- **File 2:** `backend/src/main/resources/db/migration/V2__create_categories.sql` (lines 89-90)
  ```sql
  CONSTRAINT chk_active_product_price
      CHECK (NOT is_active OR price > 0)
  ```
- **Why It Matters:**
  The request DTO allows `price = 0.00` and `isActive = true`. Spring Bean validation passes. When the entity is persisted in PostgreSQL, the check constraint `chk_active_product_price` fails with `DataIntegrityViolationException`. Because this exception is not handled in `GlobalExceptionHandler`, Spring returns an unhandled **HTTP 500 Internal Server Error**.

---

### Finding 3: Unhandled Stock Constraint Violation on Product Update
- **File 1:** `backend/src/main/java/com/varellion/store/admin/catalog/service/AdminProductService.java` (lines 166-186)
- **File 2:** `backend/src/main/resources/db/migration/V3__create_product_inventory_and_movements.sql` (lines 20-22)
  ```sql
  CONSTRAINT chk_stock_available CHECK (reserved_quantity <= stock_quantity)
  ```
- **Why It Matters:**
  If a product has `reservedQuantity = 4` (due to active pending orders), and an admin updates `stockQuantity = 2` via `PUT /api/admin/products/{productId}`, `AdminProductService` saves without verifying `stockQuantity >= reservedQuantity`. PostgreSQL rejects the update with `chk_stock_available`, crashing the request with **HTTP 500 Internal Server Error**.

---

### Finding 4: Unhandled Query Parameter Type Mismatch
- **File:** `backend/src/main/java/com/varellion/store/common/exception/GlobalExceptionHandler.java`
- **Relevant Behavior:**
  When a client passes an invalid enum to `/api/admin/orders?status=INVALID` or a malformed UUID to `/api/admin/products/{productId}`, Spring MVC throws `org.springframework.web.method.annotation.MethodArgumentTypeMismatchException`.
  Because `GlobalExceptionHandler` does not have an explicit handler for `MethodArgumentTypeMismatchException`, it falls through to `handleGeneralException(Exception.class)`, emitting:
  ```json
  {
    "status": 500,
    "error": "Internal Server Error",
    "message": "An unexpected error occurred. Please try again later."
  }
  ```
- **Why It Matters:** Client validation errors must return HTTP 400 Bad Request, never HTTP 500.

---

### Finding 5: Accidental Image Deletion on Product Update
- **File:** `backend/src/main/java/com/varellion/store/admin/catalog/service/AdminProductService.java` (line 173)
- **Code:**
  ```java
  // 4. Update Images
  product.getImages().clear();
  if (request.getImages() != null && !request.getImages().isEmpty()) {
      for (CreateProductRequest.ProductImageInputDto imgDto : request.getImages()) {
          ...
          product.getImages().add(image);
      }
  }
  ```
- **Why It Matters:**
  In `UpdateProductRequest`, `images` defaults to `new ArrayList<>()`. If the frontend submits a partial update (e.g. changing only price or description), `product.getImages().clear()` triggers Hibernate orphan removal, **silently wiping all product images from the database**.

---

### Finding 6: Severe N+1 Query Problem in Admin Order Listing
- **File 1:** `backend/src/main/java/com/varellion/store/order/repository/OrderRepository.java` (lines 35-49)
- **File 2:** `backend/src/main/java/com/varellion/store/order/service/OrderService.java` (lines 325-327, 375-385, 492-500)
- **Relevant Behavior:**
  `findAdminOrders` selects only root `Order` entities. When mapping to DTO:
  - `order.getItems()` triggers a separate query per order.
  - `order.getStatusHistory()` triggers a separate query per order.
  - For each item, `item.getProduct().getImages()` triggers lazy loading for `Product` and `ProductImage`.
- **Why It Matters:**
  A page of 20 orders generates **80+ SQL queries**, creating unacceptable database latency and CPU overhead under administrative load.

---

### Finding 7: Complete Lack of Test Coverage for `AdminProductService`
- **File:** `backend/src/test/java/com/varellion/store/admin/catalog/controller/AdminProductControllerTest.java`
- **Relevant Behavior:**
  The controller test uses `@MockBean private AdminProductService adminProductService;`.
  The file `AdminProductServiceTest.java` **does not exist anywhere in the repository**.
  Furthermore, `AdminProductControllerTest` has tests for GET, POST, PATCH, and DELETE, but **completely omits any test for `PUT /api/admin/products/{productId}`**.
- **Why It Matters:** The core administrative product management service is running with 0% direct unit test coverage.

---

## 5. Summary of Missing Administrative Functionality

| Administrative Domain | Status in Code | Missing Functionality | Impact on Next.js Admin UI |
| :--- | :---: | :--- | :--- |
| **Executive Dashboard** | **0%** | Summary KPIs, status distribution, sales timeline analytics. | Landing page `/admin` cannot display cards or charts; redirects to orders. |
| **Categories Management** | **0%** | Admin Category listing, creation, updates, status toggle, guarded delete. | Admins cannot manage catalog structure; cannot create categories needed for products. |
| **Customer Management** | **0%** | Customer directory, full profile, customer orders, account suspension. | `/admin/customers` page cannot be implemented. |
| **User / Staff Management** | **0%** | Staff listing, staff creation, account unlocking, role modification. | No way to provision or manage admin staff without raw SQL seeds. |
| **Orders Operations** | **40%** | Admin notes updates, delivery address correction, quick status badge counters. | Customer service cannot edit order notes or fix customer phone/address errors. |
| **Inventory Quick Actions** | **0%** | Dedicated stock adjustment, low-stock threshold alerts. | Restocking requires submitting entire 15-field product metadata payload. |
| **Shipping Management** | **0%** | Dynamic governorate pricing, free shipping threshold management. | Shipping rates remain hardcoded in Java code. |
