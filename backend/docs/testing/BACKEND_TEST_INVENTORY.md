# VARELLION — Backend Test Inventory

**Date of Reconnaissance:** October 29, 2026  
**Auditor:** Senior Backend QA Engineer & Spring Boot Security Specialist  
**Repository Working Directory:** `backend/`  
**Application Port / Base URL:** `http://localhost:8080`

---

## 1. Technology Stack & Runtime Architecture

* **Framework:** Spring Boot `3.3.4` (Parent: `org.springframework.boot:spring-boot-starter-parent:3.3.4`)
* **Java Target:** Java `17` (Source/Target release 17)
* **Security & Auth:** Spring Security `6.x` + JJWT (Java JWT) `0.12.6` (`jjwt-api`, `jjwt-impl`, `jjwt-jackson`)
* **Persistence & ORM:** Spring Data JPA + Hibernate ORM `6.5.3.Final`
* **Database & Migration:** PostgreSQL Driver (`org.postgresql:postgresql:42.7.4`), Flyway Migration (`flyway-core`, `flyway-database-postgresql`)
* **Validation:** Jakarta Bean Validation (`spring-boot-starter-validation` / Hibernate Validator `8.0.1.Final`)
* **Google OAuth2 Integration:** Google API Client (`com.google.api-client:google-api-client:2.7.0`)
* **Test Infrastructure:** JUnit 5 (`JUnit Jupiter 5.10.3`), Mockito (`mockito-core:5.11.0`, `mockito-junit-jupiter`), AssertJ (`assertj-core:3.25.3`), H2 In-Memory Database (`com.h2database:h2:2.2.224`).

---

## 2. Global Security, Exception, & Response Contracts

### 2.1 Security Filter Architecture (`SecurityConfig.java`)
* **Session Management:** `SessionCreationPolicy.STATELESS` (No server-side HTTP sessions; all state in JWT).
* **CORS:** Enabled via `CorsConfig.java` allowing `FRONTEND_URL` (`http://localhost:3000`).
* **CSRF:** Disabled (`AbstractHttpConfigurer::disable`) for stateless token architecture.
* **Filter Ordering:**
  1. `RateLimitFilter` (Placed before `LogoutFilter`): Limits login requests (max 10 requests per minute per IP using Bucket4j in-memory token bucket).
  2. `JwtAuthenticationFilter` (Placed before `UsernamePasswordAuthenticationFilter`): Parses `Authorization: Bearer <jwt>`, validates expiration and signature, populates `SecurityContextHolder`.
* **Public Endpoints (No Auth Required):**
  * `/api/auth/**` (Registration, login, refresh, logout, Google OAuth)
  * `/actuator/health` (Health monitoring)
  * `GET /api/categories/**`, `GET /api/products/**` (Public catalog browsing)
  * `POST /api/orders/guest`, `POST /api/orders/lookup` (Guest order creation and tracking)
* **Protected Endpoints (Requires `ROLE_USER` or `ROLE_ADMIN`):**
  * `/api/customer/**` (Profile and delivery address management)
  * All other unmatched endpoints (`.anyRequest().authenticated()`).
* **Admin-Only Endpoints (`ROLE_ADMIN`):**
  * `/api/admin/**`, `/v3/api-docs/**`, `/swagger-ui/**`.

### 2.2 Global Exception Handling (`GlobalExceptionHandler.java`)
All error responses adhere to the standard `ErrorResponse` schema:
```json
{
  "timestamp": "2026-10-29T15:30:00",
  "status": 400,
  "error": "Bad Request | Validation Failed | Unauthorized | Locked | Not Found | Internal Server Error",
  "message": "Human-readable error description",
  "path": "/api/...",
  "validationErrors": {
    "fieldName": "Validation error message"
  }
}
```
* `ResourceNotFoundException` ➔ `404 Not Found`
* `IllegalArgumentException` ➔ `400 Bad Request`
* `MethodArgumentNotValidException` ➔ `400 Bad Request` (populates `validationErrors` map)
* `BadCredentialsException` ➔ `401 Unauthorized` (message: `"Invalid username or password"`)
* `LockedException` ➔ `423 Locked` (message: account locked duration notice)
* General `Exception` ➔ `500 Internal Server Error` (stack traces masked; logs warning internally).

---

## 3. Discovered Feature Inventory & Implementation Status

### Feature 1: Authentication & Session Management
* **Status:** **IMPLEMENTED & VERIFIED**
* **Controllers:** `AuthController.java` (`/api/auth`)
* **Supporting Services:** `AuthService.java`, `JwtService.java`, `CustomUserDetailsService.java`, `GoogleTokenVerifier.java`
* **Entities & Tables:** `User.java` ➔ `public.users` (Migrations: `V6__create_users_table.sql`, `V7__secure_users_table.sql`)
* **Endpoints:**
  1. `POST /api/auth/register` — Public registration. Creates user with `role="USER"` and auto-provisions `Customer` profile. Sets secure HTTP-Only `refresh_token` cookie.
  2. `POST /api/auth/login` — Public login with identifier (email or username) + password. Enforces 5 failed attempts lockout (15 minutes). Sets secure `refresh_token` cookie.
  3. `POST /api/auth/google` — Google OAuth2 ID Token login/signup. Verifies token integrity via Google public keys. Sets secure `refresh_token` cookie.
  4. `POST /api/auth/refresh` — Generates a new access token using `refresh_token` (from Cookie or JSON body).
  5. `POST /api/auth/logout` — Revokes session on client by setting `refresh_token` cookie with `maxAge(0)`.
* **Validation Rules:**
  * `email`: `@NotBlank`, `@Email`
  * `username`: `@NotBlank`, `@Size(min = 3, max = 50)`
  * `password`: `@NotBlank`, `@Size(min = 8, max = 100)`
* **Dependencies & Prerequisites:** Working database connection to `public.users` table.

---

### Feature 2: Customer Profile & Delivery Address Management
* **Status:** **IMPLEMENTED & VERIFIED**
* **Controllers:** `CustomerController.java` (`/api/customer`)
* **Supporting Services:** `CustomerService.java`, `CustomerRepository.java`, `CustomerAddressRepository.java`
* **Entities & Tables:** `Customer.java` ➔ `public.customers`, `CustomerAddress.java` ➔ `public.customer_addresses` (Migrations: `V1`, `V8`)
* **Endpoints:**
  1. `GET /api/customer/profile` — Requires Auth. Returns current authenticated customer details, linked email/username, and saved delivery address.
  2. `PUT /api/customer/profile` — Requires Auth. Updates full name (3-150 chars) and Egyptian phone number (`01[0125][0-9]{8}`).
  3. `PUT /api/customer/address` — Requires Auth. Upserts 1:1 primary delivery address (governorate, cityArea, detailedAddress).
* **Validation Rules:**
  * `governorate`: `@NotBlank`, `@Size(max = 100)`
  * `cityArea`: `@NotBlank`, `@Size(max = 100)`
  * `detailedAddress`: `@NotBlank`, `@Size(min = 5)`
  * `phoneNumber`: Regex `^$|^01[0125][0-9]{8}$` (Optional or valid Egyptian mobile)
* **Dependencies & Prerequisites:** Valid JWT Bearer token obtained from Feature 1.

---

### Feature 3: Product Catalog (Categories & Products)
* **Status:** **SKELETON ONLY (Pending Implementation)**
* **Controllers:** `CategoryController.java` (0 bytes), `ProductController.java` (0 bytes)
* **Supporting Services:** `CategoryService.java` (0 bytes), `ProductService.java` (0 bytes)
* **Entities & Tables:** `Category.java` ➔ `public.categories`, `Product.java` ➔ `public.products`, `ProductImage.java` ➔ `public.product_images` (Migration: `V2`)
* **Planned Endpoints:**
  * `GET /api/categories`, `GET /api/categories/{slug}`
  * `GET /api/products`, `GET /api/products/{slug}`
* **Note:** Skeletons verified; no executable runtime endpoints exist yet.

---

### Feature 4: Shopping Cart Management
* **Status:** **SKELETON ONLY (Pending Implementation)**
* **Controllers:** `CartController.java` (0 bytes)
* **Supporting Services:** `CartService.java` (0 bytes)
* **Entities & Tables:** `Cart.java` ➔ `public.carts`, `CartItem.java` ➔ `public.cart_items` (Migration: `V4`)
* **Planned Endpoints:**
  * `GET /api/cart`, `POST /api/cart/items`, `PUT /api/cart/items/{id}`, `DELETE /api/cart/items/{id}`
* **Note:** Skeletons verified; no executable runtime endpoints exist yet.

---

### Feature 5: Checkout & Order Processing
* **Status:** **SKELETON ONLY (Pending Implementation)**
* **Controllers:** `OrderController.java` (0 bytes), `GuestOrderLookupController.java` (0 bytes)
* **Supporting Services:** `OrderService.java` (0 bytes), `OrderReservationService.java` (0 bytes)
* **Entities & Tables:** `Order.java`, `OrderItem.java`, `OrderStatusHistory.java` ➔ `public.orders`, `public.order_items`, `public.order_status_history` (Migration: `V5`)
* **Planned Endpoints:**
  * `POST /api/orders/checkout`, `GET /api/orders/{orderNumber}`, `POST /api/orders/lookup`
* **Note:** Skeletons verified; no executable runtime endpoints exist yet.

---

## 4. Test Environment Profiles & Constraints

1. **Local Development Profile (`default`):**
   * Configured via `backend/src/main/resources/application.properties`.
   * Requires environment variables: `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`, `JWT_SECRET`.
   * Connects to Supabase / PostgreSQL with Flyway enabled.
2. **Offline Unit & Integration Test Profile (`application-test.properties`):**
   * H2 in-memory PostgreSQL compatibility mode: `jdbc:h2:mem:varellion_test;MODE=PostgreSQL`.
   * Flyway disabled in tests (`spring.flyway.enabled=false`).
   * JWT Secret and tokens hardcoded for deterministic mock assertions.
