# VARELLION — Complete Project Discovery Audit

**Audit Phase:** Phase One — Complete Architecture & Codebase Discovery  
**Audit Date:** 2026-11-04  
**Auditor:** Senior Software Architect, Senior Frontend Engineer & DevOps Engineer  
**Status:** Read-Only Complete Discovery — No Application Files Modified  

---

## 1. Executive Summary & Verification Standard

This audit provides a comprehensive, ground-truth inventory of the **VARELLION** e-commerce platform across both frontend and backend sub-projects. Every finding is classified according to the mandatory evidence hierarchy:

- **VERIFIED:** Directly observed in source code, configuration files, test suites, or database migrations.
- **DOCUMENTED CLAIM:** Found in documentation or progress trackers but requiring explicit runtime/code verification.
- **UNKNOWN — DO NOT ASSUME:** Missing from the repository; requirements must be requested from stakeholders.
- **CONFLICT:** Discrepancy between two repository sources (documented transparently).
- **PROPOSAL — REQUIRES APPROVAL:** Forward-looking recommendation requiring owner consent before execution.

---

## 2. System Architecture & Tech Stack Inventory

### 2.1 Frontend Architecture
- **Framework:** Next.js 15.2.1 (App Router) — [frontend/package.json:17](file:///home/mohamed-saad/Desktop/BRAND/frontend/package.json#L17).
- **Core Library:** React 19.0.0 & React-DOM 19.0.0 — [frontend/package.json:18-19](file:///home/mohamed-saad/Desktop/BRAND/frontend/package.json#L18-L19).
- **Language:** TypeScript 5.8.2 in Strict Mode (`tsconfig.json: "strict": true`) — [frontend/tsconfig.json:12](file:///home/mohamed-saad/Desktop/BRAND/frontend/tsconfig.json#L12).
- **Styling:** Tailwind CSS v4.0.9 via `@tailwindcss/postcss` with CSS `@theme` inline tokens in `globals.css` — [frontend/src/styles/globals.css:1-43](file:///home/mohamed-saad/Desktop/BRAND/frontend/src/styles/globals.css#L1-L43).
- **Iconography:** Lucide React v1.16.0 — [frontend/package.json:16](file:///home/mohamed-saad/Desktop/BRAND/frontend/package.json#L16).
- **Testing Framework:** Vitest v5.0.5 with `@testing-library/react` v16.3.3 and `jsdom` v30.1.3 — [frontend/package.json:33](file:///home/mohamed-saad/Desktop/BRAND/frontend/package.json#L33).
- **Current Test Suite Status:** **52/52 tests passing** across 12 test files (`vitest run --run`).

### 2.2 Backend Architecture
- **Framework:** Spring Boot 3.3.4 (Maven multi-module setup) — [backend/pom.xml:7](file:///home/mohamed-saad/Desktop/BRAND/backend/pom.xml#L7).
- **Security:** Spring Security 6.3.3 with stateless JWT Bearer filter and HttpOnly cookie support — [backend/pom.xml](file:///home/mohamed-saad/Desktop/BRAND/backend/pom.xml).
- **Persistence:** Spring Data JPA with Hibernate 6.5.3 (dialect: PostgreSQLDialect, `ddl-auto=validate`) — [backend/src/main/resources/application.properties:30-31](file:///home/mohamed-saad/Desktop/BRAND/backend/src/main/resources/application.properties#L30-L31).
- **Runtime Environment:** Java 21 (compiler targets release 17 in `pom.xml:23`, but runs on OpenJDK 21 daemon) — [backend/pom.xml:23](file:///home/mohamed-saad/Desktop/BRAND/backend/pom.xml#L23).
- **Database Engine:** PostgreSQL via Supabase Cloud Pooler (port 6543) managed by Flyway migrations V1–V11 — [backend/src/main/resources/db/migration/](file:///home/mohamed-saad/Desktop/BRAND/backend/src/main/resources/db/migration/).
- **Current Test Suite Status:** **103/103 tests passing** (0 failures, 0 errors, JUnitPlatformProvider, duration ~23.2s).

---

## 3. Directory Structure & Code Organization

### 3.1 Frontend File Structure (`frontend/src/`)
```
frontend/src/
├── app/
│   ├── layout.tsx                     # Root shell: Tajawal + Cinzel web fonts, Skip link, AuthProvider, CartProvider, Header, Footer
│   ├── page.tsx                       # Homepage: Editorial hero, 4 confidence pillars, curated category showcase, craftsmanship guarantee
│   ├── products/
│   │   ├── page.tsx                   # Product catalog: Category filtering, search debounce, sort dropdown, pagination
│   │   └── [slug]/
│   │       └── page.tsx               # Product Detail Page (PDP): Gallery thumbnails, SKU, stock indicator, Add to Cart
│   ├── checkout/
│   │   ├── page.tsx                   # Checkout master page: Governorate shipping calculation, COD/Card selection, order submission
│   │   ├── success/
│   │   │   └── page.tsx               # Order confirmation: Summary, direct WhatsApp concierge tracking URL, print slip
│   │   ├── callback/
│   │   │   └── page.tsx               # Paymob payment redirect handler
│   │   └── mock-paymob/
│   │       └── page.tsx               # Mock Paymob payment sandbox for testing
│   ├── track-order/
│   │   ├── page.tsx                   # Guest order tracking form and status dashboard
│   │   └── __tests__/page.test.tsx    # End-to-end tracking integration tests (4 tests passing)
│   ├── profile/
│   │   ├── page.tsx                   # Authenticated customer profile: Personal details and saved delivery address
│   │   └── __tests__/page.test.tsx    # Profile tests (3 tests passing)
│   ├── login/
│   │   └── page.tsx                   # Customer login: Email/password, Google OAuth, Open-Redirect protection
│   └── register/
│       └── page.tsx                   # Customer registration: Egyptian phone validation, password strength
├── components/
│   ├── auth/                          # AuthGuard.tsx, GoogleSignInButton.tsx
│   ├── cart/                          # CartDrawer.tsx, CartToast.tsx
│   ├── checkout/                      # CheckoutForm.tsx, OrderSummaryCard.tsx, PaymentMethodSelector.tsx, ShippingGovernorateSelect.tsx
│   ├── layout/                        # Header.tsx, Footer.tsx, MobileNav.tsx, SearchDialog.tsx
│   ├── orders/                        # OrderTrackingCard.tsx, OrderTrackingTimeline.tsx
│   ├── product/                       # ProductCard.tsx (dual-image hover, tabular price), ProductGrid.tsx
│   ├── profile/                       # PersonalInfoCard.tsx, DeliveryAddressCard.tsx, DeleteAddressDialog.tsx
│   └── ui/                            # Button.tsx, Input.tsx, Card.tsx, Badge.tsx, Dialog.tsx, Sheet.tsx, Skeleton.tsx
├── context/                           # AuthContext.tsx, CartContext.tsx
├── services/                          # api.ts (fetch wrapper + 30s timeout), auth.ts, cart.ts, customer.ts, orders.ts, payment.ts
├── config/                            # site.ts (brand metadata, navigation, trust pillars)
├── data/                              # shippingZones.ts (27 Egyptian governorates rates), mockProducts.ts
├── lib/                               # utils.ts (cn helper), validations/ (checkout.ts, customer.ts)
└── styles/                            # globals.css (Tailwind v4 tokens: Obsidian, Warm Ivory, Brushed Gold)
```

### 3.2 Backend File Structure (`backend/src/main/java/com/varellion/store/`)
```
backend/src/main/java/com/varellion/store/
├── VarellionApplication.java          # Spring Boot main application class
├── common/
│   ├── config/JpaAuditingConfig.java  # Enables @CreatedDate and @LastModifiedDate
│   ├── exception/                     # BusinessException, ResourceNotFoundException, GlobalExceptionHandler
│   └── response/                      # ApiResponse<T>, ErrorResponse
├── security/
│   ├── config/                        # SecurityConfig (stateless, CSP, HSTS, frame-ancestors), CorsConfig, ApplicationConfig
│   ├── controller/AuthController.java # /api/auth/register, /login, /refresh, /google, /logout
│   ├── dto/                           # LoginRequest, RegisterRequest, AuthResponse, GoogleLoginRequest
│   ├── entity/User.java               # Auth user (email, username, password_hash, role, failed_attempts, lock_until)
│   ├── filter/RateLimitFilter.java    # In-memory sliding window IP rate limiter (Auth: 5/min, Tracking: 10/min)
│   ├── jwt/                           # JwtService, JwtTokenProvider, JwtAuthenticationFilter, EntryPoint, AccessDeniedHandler
│   ├── repository/UserRepository.java
│   └── service/                       # AuthService, CustomUserDetailsService, GoogleTokenVerifier
├── customer/
│   ├── controller/CustomerController.java # /api/customer/profile, /address (GET, PUT, DELETE)
│   ├── dto/                           # CustomerDto, AddressDto, UpdateProfileRequest
│   ├── entity/                        # Customer (decoupled from User via user_account_id), CustomerAddress
│   ├── repository/                    # CustomerRepository, CustomerAddressRepository
│   └── service/CustomerService.java   # Auto-provisioning and address management
├── catalog/
│   ├── controller/                    # ProductController (/api/products), CategoryController (/api/categories)
│   ├── dto/                           # ProductDto, CategoryDto, PagedProductsResponse, ProductFilterRequest
│   ├── entity/                        # Product, Category, ProductImage
│   ├── repository/                    # ProductRepository, CategoryRepository, ProductImageRepository
│   └── service/                       # ProductService, CategoryService
├── cart/
│   ├── controller/CartController.java # /api/cart, /items, /merge (Authenticated database-backed cart)
│   ├── dto/                           # CartDto, CartItemDto, AddToCartRequest, UpdateCartItemRequest, MergeCartRequest
│   ├── entity/                        # Cart, CartItem (unique constraint on cart_id + product_id)
│   ├── repository/                    # CartRepository, CartItemRepository
│   └── service/CartService.java
└── order/
    ├── controller/
    │   ├── OrderController.java       # POST /api/orders, GET /my-orders, GET /{orderNumber} (Authenticated)
    │   └── GuestOrderLookupController.java # GET /api/orders/track, POST /api/orders/lookup (Public guest tracking)
    ├── dto/                           # CreateOrderRequest, OrderResponseDto, OrderLookupRequest, OrderStatusHistoryDto
    ├── entity/                        # Order, OrderItem, OrderStatusHistory, OrderStatus, ShippingFeeStatus
    ├── repository/                    # OrderRepository, OrderItemRepository, OrderStatusHistoryRepository
    └── service/
        ├── OrderService.java          # Authoritative financial computation, pessimistic product lock, cart clearance
        └── OrderReservationService.java # 24h deadline calculation, expiration check
```

---

## 4. Source of Truth for Critical Workflows

| Workflow | Primary Source of Truth (Backend) | Frontend Consumer & Cache | Verified Status |
|---|---|---|---|
| **Catalog & Products** | `catalog` schema (`Product`, `Category`, `ProductImage`) populated by migration `V9__seed_catalog_products.sql`. | `catalogService` in `frontend/src/services/api.ts` -> `app/products/page.tsx`. | **VERIFIED** |
| **Authentication & Tokens** | `security.User` + `AuthService` (`jwt.secret`, 15-min access token in response, 7-day refresh token in HttpOnly cookie). | `AuthContext.tsx` maintains access token in memory; refreshes silently via `POST /api/auth/refresh`. | **VERIFIED** |
| **Cart State** | Guest cart: `localStorage` (`varellion_cart`). Authenticated cart: synced with `backend/src/.../cart/service/CartService.java`. | `CartContext.tsx` manages optimistic local state and auto-merges upon login. | **VERIFIED** |
| **Shipping Fees** | `OrderService.calculateAuthoritativeShippingFee()` based on 5 regional tiers (Cairo/Giza 50 EGP, Alex 60 EGP, Delta/Canal 65 EGP, Upper Egypt 75 EGP, Frontier 85 EGP). | `frontend/src/data/shippingZones.ts` (`calculateShippingFee`) exactly matches backend rates. | **VERIFIED** |
| **Order Creation** | `OrderService.createOrder()` runs in a `@Transactional` block: pessimistic lock on `products`, decrements stock, records `OrderStatusHistory`, clears DB cart. | `frontend/src/services/orders.ts` -> `POST /api/orders` with 30s timeout and sessionStorage fallback. | **VERIFIED** |
| **Order Tracking** | `GuestOrderLookupController` -> `OrderService.trackOrder(orderNumber, phone)` validates Egyptian phone and returns full timeline. | `frontend/src/app/track-order/page.tsx` + `OrderTrackingTimeline.tsx`. | **VERIFIED** |
| **Customer Addresses** | `public.customer_addresses` table (`V1__create_customers_and_addresses.sql`). | `customerService` in `frontend/src/services/customer.ts` -> `app/profile/page.tsx`. | **VERIFIED** |

---

## 5. Incomplete Functionality & Technical Boundaries

1. **Admin Portal & Management Features:**
   - **Status:** **COMPLETED OMISSION (UNKNOWN — DO NOT ASSUME)**.
   - **Evidence:** Zero controllers, zero routes, zero frontend pages exist for administration in the main VARELLION project. The only references exist in `_references/next-shadcn-dashboard-starter` and `Order.adminNotes` in `Order.java:85`.
2. **Online Payment Gateway (Paymob):**
   - **Status:** **PARTIAL / MOCK ONLY**.
   - **Evidence:** `frontend/src/services/payment.ts` redirects to `/checkout/mock-paymob` or constructs an unverified URL. Backend has no Paymob HMAC webhook or callback controller. Real payment requires Paymob merchant credentials and server-side webhook signature verification.
3. **Automated Order Reservation Cleanup:**
   - **Status:** **STUBBED / INCOMPLETE**.
   - **Evidence:** `OrderReservationService.java` calculates confirmation deadline (24 hours) and checks `isReservationExpired()`, but lacks a background `@Scheduled` cron job to automatically release unconfirmed reservations and restore product inventory.
4. **Idempotency Protection on Order Creation:**
   - **Status:** **MISSING ON BACKEND**.
   - **Evidence:** `OrderController.java` does not accept or validate an `Idempotency-Key` HTTP header. Duplicate POST requests with the same cart items within seconds could create duplicate orders if submitted multiple times.

---

## 6. Known Assumptions & Verification Log

- **Assumption:** "All 27 Egyptian governorates are supported for shipping."
  - **Verdict:** **VERIFIED**. Both `shippingZones.ts` and `OrderService.java` enumerate and calculate rates for all 27 governorates.
- **Assumption:** "Customers can check out as Guest."
  - **Verdict:** **CONFLICT / FALSE**. The frontend `app/checkout/page.tsx` wraps the flow with `AuthGuard`, and `OrderController.createOrder` requires `@AuthenticationPrincipal UserDetails`. Guest order creation is NOT implemented on the backend; all orders require an authenticated user account.
- **Assumption:** "Images are hosted locally."
  - **Verdict:** **CONFLICT / FALSE**. `frontend/public` contains 0 product images. Product images in `V9__seed_catalog_products.sql` and `mockProducts.ts` reference Unsplash CDN URLs (`https://images.unsplash.com/...`).

---

**Report Certification:**  
This project discovery audit represents the verified reality of the VARELLION codebase as of November 4, 2026. All findings are traceable directly to source files.
