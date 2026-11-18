# VARELLION Luxury E-Commerce — Complete Admin Frontend Engineering Blueprint

> **Document File:** `AHMED_ESSAM.md`  
> **Document Role:** Single Source of Truth for building the VARELLION Admin Dashboard Frontend and manually verifying all existing Spring Boot Admin APIs.  
> **Audit Date:** 2026-11-18  
> **Evidence Policy:** Every architectural claim, endpoint, DTO field, validation rule, and gap in this document is verified directly from the repository source code. Labels used throughout:
> - **`VERIFIED`**: Confirmed directly from repository source code / test artifacts.
> - **`PARTIALLY VERIFIED`**: Partial code or H2 test evidence exists; full production behavior not confirmed.
> - **`UNVERIFIED`**: Cannot be confirmed from inspected repository files.
> - **`NOT IMPLEMENTED`**: Confirmed absent after repository-wide inspection.

---

## 1. Executive Summary

VARELLION is a full-stack Arabic-first (`dir="rtl"`) luxury men's accessories e-commerce platform (watches, leather goods, cardholders) targeting the Egyptian market (`EGP`, 27 governorates, Cash on Delivery launch direction).

### Key Architectural Reality (`VERIFIED`)
1. **Backend Admin API Layer is Substantially Built:** Spring Boot `3.3.4` already exposes **25 dedicated `/api/admin/**` REST endpoints** across **5 Admin Controllers** (`AdminDashboardController`, `AdminCategoryController`, `AdminProductController`, `AdminOrderController`, `AdminCustomerController`), plus **5 `/api/auth/**` endpoints** (`AuthController`), all protected by stateless JWT authentication, `HttpOnly` refresh cookies, and dual-layer `ROLE_ADMIN` enforcement (`SecurityConfig.java:70` + `@PreAuthorize("hasRole('ADMIN')")`).
2. **Frontend Admin UI is Only Partially Built:** Next.js `15.2.1` (App Router, React `19.0.0`, Tailwind CSS `4.0.9`) currently implements **only one real Admin page**: `/admin/orders` (`frontend/src/app/admin/orders/page.tsx`) with `OrderStatusUpdateDialog` and `adminOrdersService`. The root `/admin` route (`frontend/src/app/admin/page.tsx`) immediately redirects to `/admin/orders`. There are **no frontend pages or services yet** for Dashboard Overview, Products CRUD, Categories CRUD, Inventory Management, Order Details/Notes/Address editing, or Customers Management.
3. **Critical Discovered Contract Bugs & Gaps (Must Be Known Before Coding):**
   - `OrderResponseDto.java` does **not** expose `adminNotes` even though `PATCH /api/admin/orders/{orderNumber}/notes` persists it (`OrderService.java:566-573` vs `OrderResponseDto.java:23-68`).
   - `frontend/src/types/index.ts:232` types `OrderItem.totalPrice`, whereas backend `OrderItemDto` serializes `lineTotal` (`OrderService.java:665`).
   - `OrderStatus.EXCHANGED` is a **dead/unreachable enum state** (`OrderStatus.java:16,31-51`).
   - `OrderStatus.DELIVERED` is terminal — post-delivery returns (`DELIVERED -> RETURNED`) are blocked (`OrderStatus.java:50`).
   - No file/image upload endpoint exists (`NOT IMPLEMENTED`); product images are persisted as external URL strings only.
   - No Paymob backend endpoints, no coupon engine, no SMS/WhatsApp integration, no reviews module, and no physical return-receipt / damaged-stock workflow exist (`NOT IMPLEMENTED`).

---

## 2. Repository Structure

Top-level workspace (`/home/mohamed-saad/Desktop/BRAND`) (`VERIFIED`):

```text
BRAND/
├── backend/                          # Spring Boot 3.3.4 / Java 17 target (Maven, no mvnw)
│   ├── pom.xml                       # Dependencies & build plugins
│   └── src/
│       ├── main/java/com/varellion/store/
│       │   ├── admin/                # 5 Admin controllers, 4 Admin services, 18 Admin DTOs
│       │   │   ├── catalog/          # AdminCategoryController, AdminProductController + Services + DTOs
│       │   │   ├── customer/         # AdminCustomerController + Service + DTOs
│       │   │   ├── dashboard/        # AdminDashboardController + Service + DTOs
│       │   │   └── order/            # AdminOrderController + Order Admin DTOs (uses OrderService)
│       │   ├── cart/                 # Customer shopping cart module
│       │   ├── catalog/              # Public catalog entities (Product, Category, ProductImage) & repos
│       │   ├── common/               # ApiResponse, ErrorResponse, BusinessException, GlobalExceptionHandler
│       │   ├── customer/             # Customer & CustomerAddress entities, service, repo
│       │   ├── order/                # Order, OrderItem, OrderStatus, OrderStatusHistory, OrderService, IdempotencyService
│       │   └── security/             # AuthController, AuthService, JwtService, JwtAuthenticationFilter, RateLimitFilter, ClientIpResolver, SecurityConfig, CorsConfig
│       ├── main/resources/
│       │   ├── application.properties
│       │   └── db/migration/         # Flyway SQL migrations V1 through V13
│       └── test/
│           ├── java/com/varellion/store/  # 33 test classes (including 9 admin test suites + order/concurrency suites)
│           └── resources/application-test.properties  # Isolated H2 in-memory config
├── frontend/                         # Next.js 15.2.1 App Router + React 19 + TypeScript 5.8 + Tailwind v4
│   ├── package.json
│   ├── next.config.ts
│   ├── tsconfig.json
│   ├── vitest.config.mjs
│   └── src/
│       ├── app/                      # App Router pages (includes /admin, /admin/orders, /login, /checkout, /profile, /products, /track-order)
│       ├── components/
│       │   ├── admin/                # OrderStatusUpdateDialog.tsx (+ test)
│       │   ├── auth/                 # AuthGuard.tsx, GoogleSignInButton.tsx (+ test)
│       │   ├── ui/                   # Badge, Button, Card, Dialog, Input, Sheet, Skeleton
│       │   └── ...                   # cart, checkout, layout, orders, product, profile, providers, seo
│       ├── context/                  # AuthContext.tsx, CartContext.tsx
│       ├── lib/                      # utils.ts, url.ts, utm.ts, seo/schema.ts, validations/{checkout,customer}.ts
│       ├── services/                 # api.ts, auth.ts, adminOrders.ts, cart.ts, customer.ts, orders.ts, payment.ts
│       ├── styles/globals.css        # Tailwind v4 @theme inline + VARELLION design tokens
│       └── types/index.ts            # Shared TypeScript interfaces
├── nginx.conf                        # Reverse proxy (/api/ -> backend:8080, / -> frontend:3000)
├── compose.prod.yml                  # Production Docker Compose topology
├── bruno/                            # Bruno API collection (includes bruno/admin/)
├── docs/admin/                       # Pre-existing admin documentation notes
├── README.md                         # Project overview (verify against code; never trust blindly)
├── API_CONTRACT.md                   # Pre-existing contract notes
└── PROJECT_CONTEXT.md                # Pre-existing project context
```

*(Note: `AGENTS.md` and `CLAUDE.md` do **not** exist at the repository root — `VERIFIED`.)*

---

## 3. Actual Frontend Architecture (`VERIFIED`)

Inspected directly from `frontend/package.json`, `frontend/tsconfig.json`, `frontend/next.config.ts`, `frontend/vitest.config.mjs`, and `frontend/src/`:

| Concern | Verified Implementation | Source Reference |
|---|---|---|
| **Framework & Router** | Next.js `^15.2.1` using **App Router** (`src/app/`), `output: 'standalone'`, `reactStrictMode: true` | `frontend/package.json:17`, `frontend/next.config.ts:3-5` |
| **React & TypeScript** | React `^19.0.0`, React DOM `^19.0.0`, TypeScript `^5.8.2` (`strict: true`, path alias `@/* -> ./src/*`) | `frontend/package.json:18-19,32`, `frontend/tsconfig.json:7,22` |
| **Styling & Icons** | Tailwind CSS v4 (`^4.0.9` + `@tailwindcss/postcss`), `class-variance-authority ^0.7.1`, `clsx ^2.1.1`, `tailwind-merge ^3.0.2`, `lucide-react ^1.16.0` | `frontend/package.json:14-23,31`, `frontend/src/styles/globals.css:1` |
| **Locale & Direction** | Arabic RTL globally (`<html lang="ar" dir="rtl">`), fonts `Tajawal` (body) & `Cinzel` (luxury display) loaded from Google Fonts | `frontend/src/app/layout.tsx:33-40` |
| **State Management** | React Context API (`AuthProvider`, `CartProvider`) + local component `useState`/`useCallback` (no Redux, Zustand, or React Query installed) | `frontend/src/context/AuthContext.tsx`, `frontend/src/context/CartContext.tsx`, `frontend/package.json` |
| **HTTP Client** | Custom Fetch wrapper `requestApi<T>()` with `credentials: 'include'`, 30s `AbortController` timeout, in-memory Bearer token injection, and concurrent 401 refresh queue | `frontend/src/services/api.ts:58-233` |
| **Route Protection** | Client-side `<AuthGuard requiredRole="ADMIN">` redirecting unauthenticated users to `/login?redirect=...` and non-admins to `/` | `frontend/src/components/auth/AuthGuard.tsx:8-54` |
| **Existing Admin Routes** | `/admin` (server redirect to `/admin/orders`) and `/admin/orders` (client page with table, search, status filter, pagination, and `OrderStatusUpdateDialog`) | `frontend/src/app/admin/page.tsx:1-5`, `frontend/src/app/admin/orders/page.tsx:1-339` |
| **Existing Layout Caveat** | Root layout (`frontend/src/app/layout.tsx:56-62`) renders storefront `<Header />`, `<Footer />`, `<CartDrawer />`, `<CartToast />` around ALL pages including `/admin/*`. No dedicated `src/app/admin/layout.tsx` sidebar shell exists yet. | `frontend/src/app/layout.tsx:53-64` |
| **Form Validation** | Hand-written TypeScript validators (no Zod/React Hook Form installed), e.g., `validateProfile`, `validateAddress`, `EGYPTIAN_PHONE_REGEX` | `frontend/src/lib/validations/customer.ts:1-63`, `frontend/src/lib/validations/checkout.ts` |
| **Testing Stack** | Vitest `^5.0.5`, `@testing-library/react ^16.3.3`, `jsdom ^30.1.3` (`npm test` -> `vitest run`) | `frontend/package.json:11,24,29,33`, `frontend/vitest.config.mjs:1-16` |
| **Allowed Image Hosts** | `images.unsplash.com`, `*.supabase.co`, `http://localhost`, `http://127.0.0.1` | `frontend/next.config.ts:6-25` |

---

## 4. Actual Backend Architecture (`VERIFIED`)

Inspected directly from `backend/pom.xml`, `backend/src/main/java/com/varellion/store/`, and `backend/src/main/resources/db/migration/`:

| Concern | Verified Implementation | Source Reference |
|---|---|---|
| **Runtime & Framework** | Spring Boot `3.3.4` (`spring-boot-starter-parent`), Java `17` compilation target (OpenJDK `21.0.13` local runtime), Hibernate ORM `6.5.3.Final`, Spring Data JPA, Spring Security, Bean Validation (`jakarta.validation`), JJWT `0.12.6`, MapStruct `1.6.3`, Lombok | `backend/pom.xml:7-27,31-121` |
| **Database & Migrations** | PostgreSQL `15+` (Supabase in production, driver `42.7.4`), Flyway migrations `V1`–`V13` (`V13__fix_order_status_history_and_drop_trigger.sql` is latest); isolated H2 in-memory for tests (`spring.flyway.enabled=false`) | `backend/src/main/resources/db/migration/`, `backend/src/test/resources/application-test.properties:6-17` |
| **Standard Response Envelope** | All `/api/admin/**` endpoints return `ApiResponse<T>` (`{ timestamp, success, message, data }`). **Exception:** `/api/auth/**` returns `AuthResponse` directly (NOT wrapped in `ApiResponse`). | `Admin*Controller.java`, `AuthController.java:33-87`, `frontend/src/types/index.ts:10-15,45-51` |
| **Standard Error Envelope** | `GlobalExceptionHandler` returns `ErrorResponse` (`{ timestamp, status, error, message, path, validationErrors? }`) for `400`, `401`, `403`, `404`, `409` (including `ObjectOptimisticLockingFailureException`), `423`, `429`, `500`. | `backend/src/main/java/com/varellion/store/common/exception/GlobalExceptionHandler.java:195-205` |
| **Security Filter Order** | `RateLimitFilter` (before `LogoutFilter`) → `JwtAuthenticationFilter` (before `UsernamePasswordAuthenticationFilter`) → Spring Security `authorizeHttpRequests` (`/api/admin/**` requires `hasRole("ADMIN")`) → `@EnableMethodSecurity` + class-level `@PreAuthorize("hasRole('ADMIN')")` on all 5 Admin controllers. | `SecurityConfig.java:23,69-88`, all 5 `Admin*Controller.java` |
| **Reverse Proxy** | Nginx proxies `/api/` → `http://backend:8080` (`client_max_body_size 10M`, `proxy_read_timeout 60s`) and `/` → `http://frontend:3000`. | `nginx.conf:25,40-82` |

---

## 5. Admin Authentication and Authorization

### 5.1 Authentication Session Lifecycle (`17.E` — `VERIFIED`)

1. **Login (`POST /api/auth/login`):**
   - Admin navigates to `/login` (or gets redirected to `/login?redirect=/admin/...` by `AuthGuard`).
   - Frontend calls `authService.login({ identifier, password })` (`frontend/src/services/auth.ts:13-21`).
   - Backend `AuthService.login()` (`AuthService.java:46-109`):
     - Looks up `User` by `username` OR `email` (`AuthService.java:48-50`).
     - Enforces account lockout: 5 consecutive failed passwords lock the account for **15 minutes** (`LockedException` → `HTTP 423`) (`AuthService.java:32-33,53-74`).
     - Rejects disabled accounts (`!user.isEnabled()` → `BadCredentialsException` → `HTTP 401`) (`AuthService.java:82-84`).
     - Skips auto-provisioning a `Customer` record for `ADMIN` accounts (`AuthService.java:92-94`).
     - Generates short-lived JWT `accessToken` + `refreshToken` (`AuthService.java:97-98`).
   - Backend `AuthController.login()` (`AuthController.java:32-40,89-97`) sets `Set-Cookie: refresh_token=<jwt>; Path=/; Max-Age=<refreshExpirationMs/1000>; HttpOnly; SameSite=Lax` (plus `Secure` when `app.security.cookie.secure=true`) and returns `AuthResponse` JSON **without** `refreshToken` (SEC-02).
   - Frontend `AuthContext.login()` (`AuthContext.tsx:114-124`) stores `accessToken` and `user { email, username, role }` **in React memory + module variable `inMemoryAccessToken` ONLY**. Never touches `localStorage` or `sessionStorage`.
   - `login/page.tsx:19-33` validates `redirect` via `getSafeRedirectUrl()` (blocks external/protocol-relative URLs and blocks non-`ADMIN` from landing on `/admin*`).
2. **Initial Page Load / Browser Refresh (Silent Hydration):**
   - `AuthProvider` mounts and runs `initSession()` (`AuthContext.tsx:73-107`), calling `POST /api/auth/refresh` with `credentials: 'include'` and empty body.
   - Browser sends `refresh_token` `HttpOnly` cookie automatically.
   - Backend `AuthController.refreshToken()` (`AuthController.java:62-78`) reads `@CookieValue("refresh_token")`, validates user enabled/unlocked status via `AuthService.refreshToken()`, rotates the cookie, and returns a fresh `AuthResponse` with a new `accessToken` and `role`.
   - If cookie is absent/expired/revoked, `AuthContext` silently sets `user = null, accessToken = null, isLoading = false`.
3. **Access Token Attachment & Expiration Refresh Queue:**
   - Every `requestApi()` call attaches `Authorization: Bearer <token>` and `credentials: 'include'` (`frontend/src/services/api.ts:123-126,150`).
   - On `HTTP 401` on any non-`/auth/*` route (`api.ts:167-220`):
     - Sets `isRefreshing = true`; concurrent 401 requests queue in `refreshQueue`.
     - Calls `tokenRefreshHandler()` → `POST /api/auth/refresh`.
     - **On Refresh Success:** Updates `inMemoryAccessToken` and `AuthContext`, replays the failed request and every queued request with the new Bearer token.
     - **On Refresh Failure:** Rejects all queued requests, invokes `onAuthExpiredCallback()` (clears `user` & `accessToken`), and throws `ApiError(..., 401)`. `AuthGuard` then reacts to `isAuthenticated === false` and redirects to `/login?redirect=<currentPath>`.
4. **Logout (`POST /api/auth/logout`):**
   - `AuthController.logout()` (`AuthController.java:80-87`) clears `refresh_token` cookie (`Max-Age=0`).
   - `AuthContext.logout()` (`AuthContext.tsx:165-175`) clears in-memory `user` and `accessToken` even if the network call fails (`finally` block).
5. **CORS Configuration (`VERIFIED` — `CorsConfig.java:19-58`):**
   - `allowedOrigins` sourced from `FRONTEND_URL` (default `http://localhost:3000`, comma-separated list supported).
   - `allowedMethods`: `GET, POST, PUT, PATCH, DELETE, OPTIONS`.
   - `allowedHeaders`: `*`; `allowCredentials: true`; `maxAge: 3600`.
6. **Admin Account Provisioning (`VERIFIED`):**
   - Public registration (`POST /api/auth/register`) **hardcodes `role = "USER"`** (`AuthService.java:126`). It can NEVER create an Admin.
   - Admin accounts come only from protected channels (database seed/migration or Google OAuth matching `ADMIN_EMAILS`, `AuthService.java:42-43,124`).

### 5.2 Admin Action and Permission Matrix (`17.G` — `VERIFIED`)

> **Security Rule:** Frontend route guards (`AuthGuard`) and UI visibility (`Header.tsx:287`) are UX conveniences ONLY. Real enforcement happens on the Spring Boot backend (`SecurityConfig.java:70` + `@PreAuthorize("hasRole('ADMIN')")` + `JwtAuthenticationFilter`).

| Admin Functional Area | Frontend Route Access | Frontend Control Visibility | Backend URL Rule (`SecurityConfig.java`) | Method Security Annotation | Enforcement Result for `GUEST` / `USER` |
|---|---|---|---|---|---|
| Admin Dashboard KPIs & Analytics | `<AuthGuard requiredRole="ADMIN">` on `/admin` | Admin nav link shown only if `user?.role === 'ADMIN'` (`Header.tsx:287`) | `/api/admin/**` → `hasRole("ADMIN")` (`line 70`) | `@PreAuthorize("hasRole('ADMIN')")` (`AdminDashboardController:25`) | `401` (Guest) / `403` (USER) |
| Products CRUD & Status Toggle | `<AuthGuard requiredRole="ADMIN">` on `/admin/products*` | Admin sidebar link (to be built) | `/api/admin/**` → `hasRole("ADMIN")` | `@PreAuthorize("hasRole('ADMIN')")` (`AdminProductController:24`) | `401` (Guest) / `403` (USER) |
| Categories CRUD & Status Toggle | `<AuthGuard requiredRole="ADMIN">` on `/admin/categories*` | Admin sidebar link (to be built) | `/api/admin/**` → `hasRole("ADMIN")` | `@PreAuthorize("hasRole('ADMIN')")` (`AdminCategoryController:28`) | `401` (Guest) / `403` (USER) |
| Inventory Adjustments (via Product Update) | `<AuthGuard requiredRole="ADMIN">` on `/admin/inventory` | Admin sidebar link (to be built) | `/api/admin/**` → `hasRole("ADMIN")` | `@PreAuthorize("hasRole('ADMIN')")` (`AdminProductController:24`) | `401` (Guest) / `403` (USER) |
| Orders Listing, Details, Status, Notes, Address | `<AuthGuard requiredRole="ADMIN">` on `/admin/orders*` (`page.tsx:84`) | Implemented for list & status modal; missing for notes/address/details | `/api/admin/**` → `hasRole("ADMIN")` | `@PreAuthorize("hasRole('ADMIN')")` (`AdminOrderController:33`) | `401` (Guest) / `403` (USER) |
| Customers Listing, Details, Orders, Ban/Unban | `<AuthGuard requiredRole="ADMIN">` on `/admin/customers*` | Admin sidebar link (to be built) | `/api/admin/**` → `hasRole("ADMIN")` | `@PreAuthorize("hasRole('ADMIN')")` (`AdminCustomerController:26`) | `401` (Guest) / `403` (USER) |
| Swagger / OpenAPI Docs | N/A | N/A | `/v3/api-docs/**`, `/swagger-ui/**` → `hasRole("ADMIN")` (`line 69`) | N/A | `401` / `403` |
| Auth Endpoints (`/api/auth/**`) | Public (`/login`) | Login form | `/api/auth/**` → `permitAll()` (`line 60`) | None (RateLimited via `RateLimitFilter`) | Public (429 on abuse, 423 on lockout) |

---

## 6. Complete Admin API Inventory & Complete API Contract Matrix (`17.C`)

All **25 Admin endpoints** (`ROLE_ADMIN` + `Bearer` JWT required) and **5 Auth endpoints** (`VERIFIED` from controller source files):

### 6.1 Authentication Endpoints (`AuthController.java`, base `/api/auth`)

| # | Method | Exact Path | Auth / Role | Request DTO & Validation | Response DTO & Status | Service Evidence | Test Evidence | Frontend Consumer |
|---|---|---|---|---|---|---|---|---|
| A1 | `POST` | `/api/auth/login` | Public | `LoginRequest` (`identifier` `@NotBlank`, `password` `@NotBlank`) | `200 OK` `AuthResponse` + `Set-Cookie: refresh_token` (HttpOnly). Errors: `400`, `401`, `423`, `429` | `AuthService.login()` (`:46-109`) | `AuthControllerTest`, `AuthServiceTest` | `authService.login()` (`auth.ts:13`) |
| A2 | `POST` | `/api/auth/register` | Public | `RegisterRequest` (`username`, `email`, `password`). Always creates `USER` only. | `200 OK` `AuthResponse` + `Set-Cookie`. Errors: `400`, `429` | `AuthService.register()` (`:112-156`) | `AuthControllerTest`, `AuthServiceTest` | `authService.register()` (`auth.ts:26`) |
| A3 | `POST` | `/api/auth/google` | Public | `GoogleLoginRequest` (`idToken` `@NotBlank`) | `200 OK` `AuthResponse` + `Set-Cookie`. Errors: `400`, `401`, `429` | `AuthService.googleLogin()` (`:159`) | `AuthControllerTest`, `GoogleTokenVerifierTest` | `authService.googleLogin()` (`auth.ts:41`) |
| A4 | `POST` | `/api/auth/refresh` | `refresh_token` HttpOnly Cookie (fallback body `refreshToken`) | Empty body preferred (`AuthController.java:63-70`) | `200 OK` `AuthResponse` + rotated `Set-Cookie`. Errors: `401`, `429` | `AuthService.refreshToken()` | `AuthControllerTest`, `AuthServiceTest` | `authService.refreshToken()` (`auth.ts:52`) + `api.ts:193` |
| A5 | `POST` | `/api/auth/logout` | Public / Cookie | None | `200 OK` `{ "message": "Logged out successfully" }` + cleared cookie (`Max-Age=0`) | `AuthController.logout()` (`:80-87`) | `AuthControllerTest` | `authService.logout()` (`auth.ts:61`) |

### 6.2 Dashboard Analytics Endpoints (`AdminDashboardController.java`, base `/api/admin/dashboard`)

| # | Method | Exact Path | Query / Path Params | Request DTO | Response (`ApiResponse<T>`) & Status | Service / Repo Evidence | Test Evidence | Frontend Consumer |
|---|---|---|---|---|---|---|---|---|
| D1 | `GET` | `/api/admin/dashboard/summary` | None | None | `200 OK` `ApiResponse<DashboardSummaryDto>`. Errors: `401`, `403`, `500` | `AdminDashboardService.getSummary()` (`:37-59`) → `OrderRepository`, `ProductRepository` (threshold `5`), `CustomerRepository` | `AdminDashboardControllerTest` (5), `AdminDashboardServiceTest` (3) | **MISSING** (to build `/admin`) |
| D2 | `GET` | `/api/admin/dashboard/order-status-stats` | None | None | `200 OK` `ApiResponse<Map<String, Long>>` (all 10 `OrderStatus` keys guaranteed). Errors: `401`, `403` | `AdminDashboardService.getOrderStatusStats()` (`:65-80`) → `OrderRepository.countOrdersGroupByStatus()` | `AdminDashboardControllerTest`, `AdminDashboardServiceTest` | **MISSING** (to build `/admin`) |
| D3 | `GET` | `/api/admin/dashboard/sales-analytics` | Query: `days` (`int`, default `30`, clamped `[7, 90]`) | None | `200 OK` `ApiResponse<SalesAnalyticsDto>` (`periodDays`, `totalPeriodRevenue`, `totalPeriodOrders`, `timeline[]`). Errors: `400`, `401`, `403` | `AdminDashboardService.getSalesAnalytics()` (`:86-134`) → `OrderRepository.findOrdersForAnalytics()` | `AdminDashboardControllerTest`, `AdminDashboardServiceTest` | **MISSING** (to build `/admin`) |

### 6.3 Category Management Endpoints (`AdminCategoryController.java`, base `/api/admin/categories`)

| # | Method | Exact Path | Query / Path Params | Request DTO & Validation | Response (`ApiResponse<T>`) & Status | Service / Repo Evidence | Test Evidence | Frontend Consumer |
|---|---|---|---|---|---|---|---|---|
| C1 | `GET` | `/api/admin/categories` | None (not paginated; sorted by `createdAt ASC`) | None | `200 OK` `ApiResponse<List<AdminCategoryDto>>`. Errors: `401`, `403` | `AdminCategoryService.getAllCategories()` (`:29-46`) → `CategoryRepository` | `AdminCategoryControllerTest` (7), `AdminCategoryServiceTest` (8) | **MISSING** |
| C2 | `GET` | `/api/admin/categories/{categoryId}` | Path: `categoryId` (`UUID`) | None | `200 OK` `ApiResponse<AdminCategoryDto>`. Errors: `400`, `401`, `403`, `404` | `AdminCategoryService.getCategoryById()` (`:52-58`) | `AdminCategoryControllerTest`, `AdminCategoryServiceTest` | **MISSING** |
| C3 | `POST` | `/api/admin/categories` | None | `@Valid CreateCategoryRequest`: `nameAr` (`@NotBlank`, max 100), `nameEn` (`@NotBlank`, max 100), `slug` (`@NotBlank`, `^[a-z0-9]+(?:-[a-z0-9]+)*$`, max 100), `descriptionAr?`, `descriptionEn?`, `isActive?` (default `true`) | `201 Created` `ApiResponse<AdminCategoryDto>`. Errors: `400`, `401`, `403`, `409` (duplicate slug) | `AdminCategoryService.createCategory()` (`:64-83`) | `AdminCategoryControllerTest`, `AdminCategoryServiceTest` | **MISSING** |
| C4 | `PUT` | `/api/admin/categories/{categoryId}` | Path: `categoryId` (`UUID`) | `@Valid UpdateCategoryRequest` (same fields/constraints as `CreateCategoryRequest`) | `200 OK` `ApiResponse<AdminCategoryDto>`. Errors: `400`, `401`, `403`, `404`, `409` | `AdminCategoryService.updateCategory()` (`:89-111`) | `AdminCategoryControllerTest`, `AdminCategoryServiceTest` | **MISSING** |
| C5 | `PATCH` | `/api/admin/categories/{categoryId}/status` | Path: `categoryId` (`UUID`) | `ToggleProductStatusRequest` (`{ isActive: boolean }`) — **Note:** no `@Valid` on controller; `null` treated as `false` (`:82`) | `200 OK` `ApiResponse<AdminCategoryDto>`. Errors: `400`, `401`, `403`, `404` | `AdminCategoryService.toggleCategoryStatus()` (`:117-125`) | `AdminCategoryControllerTest`, `AdminCategoryServiceTest` | **MISSING** |
| C6 | `DELETE` | `/api/admin/categories/{categoryId}` | Path: `categoryId` (`UUID`) | None | `200 OK` `ApiResponse<Void>` (`data: null`). Errors: `401`, `403`, `404`, **`409`** (if `productCount > 0`) | `AdminCategoryService.deleteCategory()` (`:131-146`) | `AdminCategoryControllerTest`, `AdminCategoryServiceTest` | **MISSING** |

### 6.4 Product & Inventory Management Endpoints (`AdminProductController.java`, base `/api/admin/products`)

| # | Method | Exact Path | Query / Path Params | Request DTO & Validation | Response (`ApiResponse<T>`) & Status | Service / Repo Evidence | Test Evidence | Frontend Consumer |
|---|---|---|---|---|---|---|---|---|
| P1 | `GET` | `/api/admin/products` | Query: `category?` (slug or `"all"`), `search?` (nameAr/nameEn/sku), `isActive?` (`Boolean`), `page` (default `0`), `limit` (default `20`, max `100`), `sortBy` (`price`\|`stockQuantity`\|`nameAr`\|default `createdAt`), `sortDirection` (`ASC`\|default `DESC`) | None | `200 OK` `ApiResponse<PagedAdminProductsResponse>`. Errors: `400`, `401`, `403` | `AdminProductService.getAdminProducts()` (`:59-100`) → `ProductRepository.findAdminProducts()` | `AdminProductControllerTest` (12), `AdminProductServiceTest` (14) | **MISSING** |
| P2 | `GET` | `/api/admin/products/{productId}` | Path: `productId` (`UUID`) | None | `200 OK` `ApiResponse<AdminProductDto>` (includes `stockQuantity`, `reservedQuantity`, `availableStock`, `costPrice`, `images`). Errors: `400`, `401`, `403`, `404` | `AdminProductService.getAdminProductById()` (`:106-110`) → `ProductRepository.findByIdWithDetailsAdmin()` | `AdminProductControllerTest`, `AdminProductServiceTest` | **MISSING** |
| P3 | `POST` | `/api/admin/products` | None | `@Valid CreateProductRequest`: `nameAr` (`@NotBlank`, max 255), `nameEn` (`@NotBlank`, max 255), `categoryId` (`@NotNull` UUID), `descriptionAr?`, `descriptionEn?`, `price` (`@NotNull`, `>=0`; **must be `>0` if `isActive=true`**), `costPrice` (`@NotNull`, `>=0`), `stockQuantity` (`@NotNull`, `>=0`), `sku` (`@NotBlank`, `^[A-Za-z0-9-_]+$`, max 100, uppercased), `isActive` (default `true`), `images[]` (`imageUrl` `@NotBlank`, `isMain?`, `displayOrder?`) | `201 Created` `ApiResponse<AdminProductDto>`. Errors: `400`, `401`, `403`, `404` (category), `409` (duplicate SKU) | `AdminProductService.createProduct()` (`:116-165`) | `AdminProductControllerTest`, `AdminProductServiceTest` | **MISSING** |
| P4 | `PUT` | `/api/admin/products/{productId}` | Path: `productId` (`UUID`) | `@Valid UpdateProductRequest` (same fields as `CreateProductRequest`). **Business checks:** `stockQuantity >= reservedQuantity` (`:192-194`), `price > 0` if active (`:186-188`), unique SKU (`:179-181`). If `images == null`, existing images are preserved; if array sent, replaces all images (`:217-230`). | `200 OK` `ApiResponse<AdminProductDto>`. Errors: `400` (stock < reserved or price <= 0 active), `401`, `403`, `404`, `409` (duplicate SKU) | `AdminProductService.updateProduct()` (`:171-235`) | `AdminProductControllerTest`, `AdminProductServiceTest` | **MISSING** *(Also serves as the ONLY existing endpoint for inventory stock adjustments)* |
| P5 | `PATCH` | `/api/admin/products/{productId}/status` | Path: `productId` (`UUID`) | `@Valid ToggleProductStatusRequest` (`isActive` `@NotNull`) | `200 OK` `ApiResponse<AdminProductDto>`. Errors: `400` (activating product with `price <= 0`), `401`, `403`, `404` | `AdminProductService.toggleProductStatus()` (`:241-254`) | `AdminProductControllerTest`, `AdminProductServiceTest` | **MISSING** |
| P6 | `DELETE` | `/api/admin/products/{productId}` | Path: `productId` (`UUID`) | None | `200 OK` `ApiResponse<String>` (soft-deletes `isActive=false` if product appears in `order_items`; hard-deletes otherwise). Errors: `401`, `403`, `404` | `AdminProductService.deleteProduct()` (`:260-278`) → `OrderItemRepository.existsByProductId()` | `AdminProductControllerTest`, `AdminProductServiceTest` | **MISSING** |

### 6.5 Order Management Endpoints (`AdminOrderController.java`, base `/api/admin/orders`)

| # | Method | Exact Path | Query / Path Params | Request DTO & Validation | Response (`ApiResponse<T>`) & Status | Service / Repo Evidence | Test Evidence | Frontend Consumer |
|---|---|---|---|---|---|---|---|---|
| O1 | `GET` | `/api/admin/orders` | Query: `page` (default `0`), `limit` (default `10`, clamped `1..100`), `status?` (`OrderStatus`), `search?` (orderNumber/phone/name), `sortBy` (`totalAmount`\|`orderStatus`\|default `createdAt`), `sortDirection` (`ASC`\|default `DESC`) | None | `200 OK` `ApiResponse<PagedOrdersResponse>`. Errors: `400` (invalid status enum), `401`, `403` | `OrderService.getAdminOrders()` (`:331-355`) → `OrderRepository.findAdminOrders()` | `AdminOrderControllerTest` (20) | **CONNECTED** (`adminOrdersService.getOrders` — note: `sortBy`/`sortDirection` not yet wired in UI) |
| O2 | `GET` | `/api/admin/orders/statistics` | None | None | `200 OK` `ApiResponse<OrderStatusCountDto>` (`allOrders`, per-status fields, `statusBreakdown` map). Errors: `401`, `403` | `OrderService.getOrderStatusStatistics()` (`:622-651`) | `AdminOrderControllerTest`, `OrderServiceTest` | **MISSING** (badges not yet wired) |
| O3 | `GET` | `/api/admin/orders/{orderNumber}` | Path: `orderNumber` (`@Pattern("^VAR-\\d{8}-\\d{4}$")`) | None | `200 OK` `ApiResponse<OrderResponseDto>`. Errors: `400` (invalid pattern), `401`, `403`, `404` | `OrderService.getAdminOrderByNumber()` | `AdminOrderControllerTest` | **SERVICE EXISTS (`adminOrders.ts:118`), NO UI PAGE YET** |
| O4 | `PUT` | `/api/admin/orders/{orderNumber}/status` | Path: `orderNumber` (`^VAR-\d{8}-\d{4}$`) | `@Valid UpdateOrderStatusRequest`: `newStatus` (`@NotNull` `OrderStatus`), `reason?` (`@Size(max=500)`) | `200 OK` `ApiResponse<OrderResponseDto>`. Errors: `400` (invalid transition / terminal / validation), `401`, `403`, `404`, **`409`** (`@Version` optimistic lock conflict) | `OrderService.updateOrderStatus()` (`:474-566`) | `AdminOrderControllerTest`, `OrderServiceTest` (47), `OrderLifecycleInventoryIntegrationTest` (6), `OrderConcurrencyDeadlockIntegrationTest` (1) | **CONNECTED** (`OrderStatusUpdateDialog.tsx:61`) |
| O5 | `PATCH` | `/api/admin/orders/{orderNumber}/notes` | Path: `orderNumber` (`^VAR-\d{8}-\d{4}$`) | `@Valid UpdateAdminNotesRequest`: `adminNotes?` (`@Size(max=1000)`) | `200 OK` `ApiResponse<OrderResponseDto>` *(Caveat: `OrderResponseDto` omits `adminNotes` field!)* Errors: `400`, `401`, `403`, `404` | `OrderService.updateAdminNotes()` (`:572-579`) | `AdminOrderControllerTest`, `OrderServiceTest` | **MISSING** |
| O6 | `PATCH` | `/api/admin/orders/{orderNumber}/delivery-address` | Path: `orderNumber` (`^VAR-\d{8}-\d{4}$`) | `@Valid UpdateDeliveryAddressRequest`: `shippingGovernorate` (`@NotBlank`, max 100), `shippingCityArea` (`@NotBlank`, max 100), `shippingDetailedAddress` (`@NotBlank`, max 500), `customerPhone?` (normalized via `normalizeEgyptianPhone`), `customerName?`. Recalculates `shippingFee` & `totalAmount` if governorate changes. Blocked if status is `SHIPPED`, `DELIVERED`, `CANCELLED`, or `EXPIRED`. | `200 OK` `ApiResponse<OrderResponseDto>`. Errors: `400`, `401`, `403`, `404` | `OrderService.updateOrderDeliveryAddress()` (`:585-616`) | `AdminOrderControllerTest`, `OrderServiceTest` | **MISSING** |

### 6.6 Customer Management Endpoints (`AdminCustomerController.java`, base `/api/admin/customers`)

| # | Method | Exact Path | Query / Path Params | Request DTO & Validation | Response (`ApiResponse<T>`) & Status | Service / Repo Evidence | Test Evidence | Frontend Consumer |
|---|---|---|---|---|---|---|---|---|
| U1 | `GET` | `/api/admin/customers` | Query: `page` (default `0`), `limit` (default `20`, max `100`), `search?` (name or phone) | None | `200 OK` `ApiResponse<PagedAdminCustomersResponse>` (sorted `createdAt DESC`, includes `email`, `totalOrders`, `totalSpent`). Errors: `401`, `403` | `AdminCustomerService.getAdminCustomers()` (`:42-100`) → `CustomerRepository`, `UserRepository`, `OrderRepository` | `AdminCustomerControllerTest` (6), `AdminCustomerServiceTest` (8) | **MISSING** |
| U2 | `GET` | `/api/admin/customers/{customerId}` | Path: `customerId` (`UUID`) | None | `200 OK` `ApiResponse<AdminCustomerDetailDto>` (includes address, `email`, `isActive`, `totalOrders`, `totalSpent`). Errors: `400`, `401`, `403`, `404` | `AdminCustomerService.getAdminCustomerById()` (`:106-135`) | `AdminCustomerControllerTest`, `AdminCustomerServiceTest` | **MISSING** |
| U3 | `GET` | `/api/admin/customers/{customerId}/orders` | Path: `customerId` (`UUID`); Query: `page` (`0`), `limit` (`10`, max `100`) | None | `200 OK` `ApiResponse<List<OrderResponseDto>>` *(Note: raw `List`, not paged wrapper!)*. Errors: `400`, `401`, `403`, `404` | `AdminCustomerService.getCustomerOrders()` (`:141-152`) | `AdminCustomerControllerTest`, `AdminCustomerServiceTest` | **MISSING** |
| U4 | `PATCH` | `/api/admin/customers/{customerId}/status` | Path: `customerId` (`UUID`) | `ToggleProductStatusRequest` (`{ isActive: boolean }`) — no `@Valid`; syncs both `Customer.isActive` AND `User.enabled` in one transaction (`:163-171`). | `200 OK` `ApiResponse<AdminCustomerDetailDto>`. Errors: `400`, `401`, `403`, `404` | `AdminCustomerService.toggleCustomerStatus()` (`:159-177`) | `AdminCustomerControllerTest`, `AdminCustomerServiceTest` | **MISSING** |

---

## 7. Admin Pages and Routes Blueprint & Implementation Readiness Matrix (`17.I`)

### Recommended Admin Shell Layout
Create `frontend/src/app/admin/layout.tsx` wrapping all `/admin/**` routes inside `<AuthGuard requiredRole="ADMIN">` with a persistent RTL luxury sidebar (Obsidian `#0E0F11` desktop rail + mobile `<Sheet>` drawer) and admin header bar (admin username/email, storefront link, logout button). *(Note: Currently `frontend/src/app/layout.tsx` wraps every route in the customer `<Header />` and `<Footer />`; the future developer should either conditionally hide customer chrome on `/admin` paths or isolate storefront routes into a `(storefront)` Next.js Route Group.)*

### Page Blueprint & Readiness Matrix (`17.I`)

| Page / Module | Route URL | Readiness Status (`17.I`) | Available Backend APIs | Missing Backend Support / Blockers |
|---|---|---|---|---|
| **A. Admin Login** | `/login?redirect=/admin` *(reuse existing)* | **READY** | `POST /api/auth/login`, `/refresh`, `/logout`, `/google` | None (existing `login/page.tsx` already guards `/admin` redirect via `getSafeRedirectUrl`). |
| **B. Dashboard Overview** | `/admin` *(replace redirect in `admin/page.tsx`)* | **FRONTEND WORK REQUIRED** | `GET /api/admin/dashboard/summary`, `/order-status-stats`, `/sales-analytics?days=` | No backend export/CSV, no top-products/category-revenue breakdown, no custom date-range (`start`/`end`), `lowStockThreshold` hardcoded to `5`. |
| **C. Products Management** | `/admin/products`, `/admin/products/new`, `/admin/products/[productId]` | **FRONTEND WORK REQUIRED** *(Image upload `BACKEND WORK REQUIRED`)* | `GET/POST /api/admin/products`, `GET/PUT/DELETE /api/admin/products/{id}`, `PATCH /api/admin/products/{id}/status`, `GET /api/admin/categories` | **No file upload endpoint** (images must be entered as valid URLs); no product variants (size/color) entity in schema. |
| **C2. Categories Management** | `/admin/categories` | **FRONTEND WORK REQUIRED** | `GET/POST /api/admin/categories`, `GET/PUT/DELETE /api/admin/categories/{id}`, `PATCH /api/admin/categories/{id}/status` | None (full CRUD implemented on backend). |
| **D. Inventory Management** | `/admin/inventory` | **PARTIAL / FRONTEND WORK REQUIRED** *(Dedicated stock ledger & return intake `BACKEND WORK REQUIRED`)* | `GET /api/admin/products?sortBy=stockQuantity&sortDirection=ASC`, `PUT /api/admin/products/{id}` | No dedicated `PATCH /api/admin/products/{id}/stock` endpoint (must send full `UpdateProductRequest`), no `inventory_movements` ledger, no `Product.@Version` / `PESSIMISTIC_WRITE` in `AdminProductService.updateProduct()`, no return-receipt / damaged-stock workflow (`SEC-INV-01`). |
| **E. Orders Listing & Status** | `/admin/orders` | **READY (Partial UI Built)** | `GET /api/admin/orders`, `GET /api/admin/orders/statistics`, `PUT /api/admin/orders/{orderNumber}/status` | Existing UI lacks status count badges (`statistics`), `sortBy`/`sortDirection` controls, and link to Order Details page. |
| **E2. Order Details, Notes & Address** | `/admin/orders/[orderNumber]` | **FRONTEND WORK REQUIRED** *(Notes display `BACKEND WORK REQUIRED`)* | `GET /api/admin/orders/{orderNumber}`, `PUT .../status`, `PATCH .../notes`, `PATCH .../delivery-address` | `OrderResponseDto` omits `adminNotes` (so saved notes cannot be read back after page refresh); `OrderItem.totalPrice` frontend type mismatch (`lineTotal` in backend). |
| **F. Customers Management** | `/admin/customers`, `/admin/customers/[customerId]` | **FRONTEND WORK REQUIRED** | `GET /api/admin/customers`, `GET /api/admin/customers/{id}`, `GET /api/admin/customers/{id}/orders`, `PATCH /api/admin/customers/{id}/status` | `/{id}/orders` returns plain `List<OrderResponseDto>` without `totalElements`/`totalPages` metadata. |

---

## 8. Page-by-Page Component Specifications, User Actions (`17.A`), & UX States (`17.D`)

> **Global UX State Contract (Applies to EVERY Admin Page — `17.D`):**
> - **Initial / Loading:** Render `<Skeleton />` placeholders matching exact layout (table rows, KPI cards); disable submit/refresh buttons and show `<Loader2 className="animate-spin" />`.
> - **Empty State:** Centered icon + clear Arabic headline + secondary hint + reset-filter CTA (when filters are active).
> - **Validation Error (`400`):** Highlight fields via `Input`'s `error` prop using `ApiError.validationErrors` map, plus top `role="alert"` banner for non-field business errors.
> - **Unauthorized (`401`):** Handled transparently by `requestApi` refresh queue; if refresh fails, `AuthContext` clears session and `AuthGuard` redirects to `/login?redirect=<path>`.
> - **Forbidden (`403`):** Display clear Arabic access-denied banner (and `AuthGuard` prevents non-`ADMIN` from rendering `/admin/*`).
> - **Optimistic Lock / Business Conflict (`409`):** Display `err.message` prominently with an explicit **"تحديث البيانات" (Reload Latest Data)** action button.
> - **Server (`500`) & Network / Timeout (`408` / `TypeError`):** Display `role="alert"` banner with **"إعادة المحاولة" (Retry)** button; never wipe user form input on error.
> - **Destructive Actions:** Always gate behind `<Dialog>` confirmation modal (`Delete Product`, `Delete Category`, `Deactivate Customer`, `Cancel Order`).

### 8.A Admin Login (`/login?redirect=/admin`)
- **Purpose:** Authenticate an `ADMIN` user into the dashboard.
- **Required Components:** Existing `frontend/src/app/login/page.tsx` (`Card`, `Input`, `Button`, `GoogleSignInButton`).
- **User Actions (`17.A`):**
  1. **Submit Login Form:** Input `identifier` (email/username) + `password` → `POST /api/auth/login` → on `200` with `role === 'ADMIN'`, navigates to `/admin` (or validated `redirect` param); on `role === 'USER'`, redirects to `/`. On `401` shows uniform invalid-credentials message; on `423` shows 15-min lockout notice; on `429` shows rate-limit notice.
  2. **Google Sign-In:** `POST /api/auth/google` with `{ idToken }` → works for admins whose email is in `ADMIN_EMAILS`.
  3. **Toggle Password Visibility:** Local boolean state; button must meet 44×44px target.

### 8.B Dashboard Overview (`/admin`)
- **Purpose:** Executive operational KPIs, order pipeline breakdown, and sliding-window revenue trend.
- **Required Components:** `DashboardKpiGrid` (6 `<Card>`s), `SalesTrendChart` (SVG/table chart for 7/30/90 days — avoid heavy dependencies unless approved), `OrderStatusBreakdownList`, `PeriodSelector` (`7` / `30` / `90` days), `RefreshButton`.
- **Available Metrics (`VERIFIED`):**
  - `GET /api/admin/dashboard/summary`: `totalRevenue` (EGP, excludes `CANCELLED` & `EXPIRED`), `totalOrders`, `pendingOrders` (`PENDING_CUSTOMER_CONFIRMATION + CONFIRMED + PREPARING`), `deliveredOrders`, `lowStockProductsCount` (`availableStock <= 5 && isActive`), `totalCustomers`.
  - `GET /api/admin/dashboard/order-status-stats`: counts for all 10 `OrderStatus` keys.
  - `GET /api/admin/dashboard/sales-analytics?days={7|30|90}`: `periodDays`, `totalPeriodRevenue`, `totalPeriodOrders`, `timeline[{ date, revenue, ordersCount }]`.
- **Unavailable Metrics (Do NOT fabricate UI controls):** Profit margin / COGS report, top-selling products widget, payment-method split, refund/return monetary totals, CSV export.
- **User Actions (`17.A`):**
  1. **Initial Mount / Refresh Click:** Parallel `Promise.all` to `D1`, `D2`, `D3`.
  2. **Change Period Dropdown (`7`, `30`, `90`):** Re-fetches `GET /api/admin/dashboard/sales-analytics?days=<val>` only.
  3. **Click "Low Stock" KPI Card:** Navigates to `/admin/inventory` (sorted ascending by `stockQuantity`).
  4. **Click Any Status Count Pill:** Navigates to `/admin/orders?status=<STATUS>`.

### 8.C Products Management (`/admin/products`, `/admin/products/new`, `/admin/products/[productId]`)
- **Purpose:** Full catalog lifecycle management (list, filter, create, edit, toggle active visibility, soft/hard delete).
- **Table Columns (`/admin/products`):** Thumbnail (`images[main]`), Product (`nameAr` + `nameEn`), `SKU` (mono LTR), Category (`categoryNameAr`), Price & Cost (`price` / `costPrice` EGP), Stock (`stockQuantity` / `reservedQuantity` / `availableStock`), Status `<Badge>` (`isActive`), Actions (`Edit`, `Toggle Status`, `Delete`).
- **Form Fields (`/new` & `/[productId]`):**
  - `nameAr` (required, max 255), `nameEn` (required, max 255), `categoryId` (required select populated from `GET /api/admin/categories`), `sku` (required, regex `/^[A-Za-z0-9-_]+$/`, max 100), `price` (required number `>= 0`; must be `> 0` when `isActive = true`), `costPrice` (required number `>= 0`), `stockQuantity` (required integer `>= 0`; on edit must be `>= current reservedQuantity`), `descriptionAr` (optional textarea), `descriptionEn` (optional textarea), `isActive` (toggle, default `true`), `images[]` (repeatable URL list: `imageUrl` required non-blank, `isMain` radio/checkbox, `displayOrder` integer).
- **User Actions (`17.A`):**
  1. **Search / Filter / Sort / Paginate:** Calls `GET /api/admin/products?category=&search=&isActive=&page=&limit=20&sortBy=&sortDirection=`. Resets `page = 0` on filter change.
  2. **Create Product Submit:** `POST /api/admin/products` → `201 Created`, shows success toast/banner, navigates to `/admin/products`. Handles `409` duplicate SKU and `400` validation errors.
  3. **Edit Product Submit:** `PUT /api/admin/products/{productId}` → `200 OK`, updates state. **Important:** Always send the complete `images` array (or omit/`null` intentionally to preserve existing images per `AdminProductService.java:217`).
  4. **Toggle Active Switch:** `PATCH /api/admin/products/{productId}/status` with `{ isActive: !current }` → `200 OK`. Handles `400` if `price <= 0`.
  5. **Delete Product Button:** Opens confirmation `<Dialog>` explaining automatic archival if linked to past orders → `DELETE /api/admin/products/{productId}` → `200 OK`, displays backend `message` (whether archived or permanently deleted), refreshes list.

### 8.C2 Categories Management (`/admin/categories`)
- **Purpose:** Manage product categories required by Products form.
- **Table Columns:** Name (`nameAr` / `nameEn`), Slug (mono LTR), Products Count (`productCount`), Status (`isActive`), Actions (`Edit`, `Toggle Status`, `Delete`).
- **User Actions (`17.A`):**
  1. **Create Category Modal:** `POST /api/admin/categories` (validates slug `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`). Handles `409` duplicate slug.
  2. **Edit Category Modal:** `PUT /api/admin/categories/{categoryId}`.
  3. **Toggle Status:** `PATCH /api/admin/categories/{categoryId}/status` with explicit boolean `{ isActive: true | false }`.
  4. **Delete Category:** Disabled or guarded with tooltip if `productCount > 0`; confirmation `<Dialog>` → `DELETE /api/admin/categories/{categoryId}` (backend enforces `409 Conflict` if `productCount > 0`).

### 8.D Inventory Management (`/admin/inventory`)
- **Purpose:** Operational stock monitoring (Physical vs Reserved vs Available) and controlled stock restock/adjustment.
- **Table Columns:** SKU, Product Name, Physical Stock (`stockQuantity`), Reserved (`reservedQuantity`), Available (`availableStock`), Low-Stock Indicator (`availableStock <= 5`), Active Status, Action (`Adjust Stock`).
- **User Actions (`17.A`):**
  1. **Load & Sort Low-Stock First:** `GET /api/admin/products?sortBy=stockQuantity&sortDirection=ASC&page=0&limit=20`.
  2. **Adjust Physical Stock Modal:**
     - Fetches fresh `GET /api/admin/products/{productId}` immediately before opening modal (reduces stale-overwrite window because `Product` currently lacks `@Version`!).
     - Validates client-side `newStockQuantity >= product.reservedQuantity` (mirrors `AdminProductService.java:192`).
     - Submits `PUT /api/admin/products/{productId}` carrying all existing product fields + updated `stockQuantity` + `images: null` (preserves images).
     - Displays warning note inside modal: *"تعديل المخزون يتم مباشرة على الكتالوج؛ يرجى عدم إضافة قطع مرتجعة إلا بعد فحصها فعليًا والتأكد من سلامتها (SEC-INV-01)."*

### 8.E Orders Management (`/admin/orders` & `/admin/orders/[orderNumber]`)
- **Purpose:** Complete order lifecycle visibility, status transitions, operational notes, and pre-dispatch address corrections.
- **Existing `/admin/orders` Enhancements Needed:**
  - Wire `GET /api/admin/orders/statistics` to render clickable status-count filter tabs/badges.
  - Wire `sortBy` (`createdAt`, `totalAmount`, `orderStatus`) & `sortDirection` (`DESC`/`ASC`) query params into `adminOrdersService.getOrders()`.
  - Add **"عرض التفاصيل" (View Details)** link navigating to `/admin/orders/${order.orderNumber}`.
- **New `/admin/orders/[orderNumber]` Details Page:**
  - Fetches `GET /api/admin/orders/{orderNumber}`.
  - Displays: Order summary card (number, status badge, created/updated dates, confirmation deadline), Customer & Shipping card, Financials card (backend-computed `subtotal`, `discountTotal`, `shippingFee`, `totalAmount` — read-only!), Payment method (`paymentMethod`), Line Items table (read `item.lineTotal ?? item.totalPrice` defensively until `types/index.ts` is aligned!), Status History timeline (`statusHistory[]`).
  - **User Actions (`17.A`):**
    1. **Update Status Button:** Reuses existing `<OrderStatusUpdateDialog>` (`PUT /api/admin/orders/{orderNumber}/status`). Shows ONLY `getPermittedNextStatuses(order.orderStatus)`. Handles `400` illegal transition and `409` optimistic lock conflict (prompting page reload).
    2. **Edit Delivery Address Modal:** Enabled **ONLY** when status is NOT `SHIPPED`, `DELIVERED`, `CANCELLED`, or `EXPIRED` (`OrderService.java:590`). Submits `PATCH /api/admin/orders/{orderNumber}/delivery-address`. Displays updated backend-recalculated `shippingFee` and `totalAmount`.
    3. **Save Admin Notes Form:** Submits `PATCH /api/admin/orders/{orderNumber}/notes` (`max 1000 chars`). **Known Limitation Notice:** Because `OrderResponseDto` does not return `adminNotes`, display a clear success confirmation without promising pre-filled persistence on reload until backend DTO adds `adminNotes`.

### 8.F Customers Management (`/admin/customers` & `/admin/customers/[customerId]`)
- **Purpose:** View registered customer accounts, lifetime order metrics, order history, and activate/deactivate (ban/unban) accounts.
- **Table Columns (`/admin/customers`):** Full Name, Email, Phone (mono LTR), Governorate/City, Total Orders (`totalOrders`), Total Spent (`totalSpent` EGP), Account Status (`isActive`), Joined Date, Actions (`Details`, `Activate/Deactivate`).
- **User Actions (`17.A`):**
  1. **Search & Paginate:** `GET /api/admin/customers?page=0&limit=20&search=` (searches name or phone).
  2. **View Customer Detail (`/admin/customers/[customerId]`):** Parallel calls to `GET /api/admin/customers/{customerId}` and `GET /api/admin/customers/{customerId}/orders?page=0&limit=10`.
  3. **Activate / Deactivate Account:** Opens confirmation `<Dialog>` warning that deactivation immediately blocks the customer's active Access Token and Refresh Token (`AdminCustomerService.java:166-171`). Submits `PATCH /api/admin/customers/{customerId}/status` with `{ isActive: !current }` → `200 OK` returns updated `AdminCustomerDetailDto`.

---

## 9. API Integration Architecture & End-to-End Data Flow Tracing (`17.B`)

### 9.1 Existing Client Infrastructure (REUSE — Do NOT Introduce Axios or Supabase Client)
- **Base URL Resolution:** `resolveApiBaseUrl()` (`frontend/src/services/api.ts:7-24`) reads `NEXT_PUBLIC_API_URL` in browser (default `http://localhost:8080/api`) and `INTERNAL_API_URL || BACKEND_URL` in SSR. `buildEndpointUrl()` (`api.ts:49-56`) safely prevents `/api/api/...` duplication.
- **Mandatory Rules:**
  - All new admin services (`adminDashboard.ts`, `adminProducts.ts`, `adminCategories.ts`, `adminCustomers.ts`) MUST import and call `requestApi<ApiResponse<T>>()` from `@/services/api`.
  - Unwrap `.data` from `ApiResponse<T>` consistently (just like `adminOrders.ts:115`).
  - NEVER call Supabase PostgREST directly from the frontend (`V5__create_orders_module.sql:194-196` revokes all DML from `anon`/`authenticated`).

### 9.2 Seven End-to-End Data Flow Traces (`17.B` — `VERIFIED`)

1. **Admin Authentication:**  
   `LoginPage` (`app/login/page.tsx:66`) → `AuthContext.login()` (`AuthContext.tsx:114`) → `authService.login()` (`auth.ts:13`) → `requestApi('/auth/login', POST)` (`api.ts:115`) → `RateLimitFilter` → `SecurityConfig` (`permitAll`) → `AuthController.login()` (`:32`) → `AuthService.login()` (`:46`) → `UserRepository.findByUsername/Email` + `JwtService.generateToken/RefreshToken` → `Set-Cookie: refresh_token` (HttpOnly) + `AuthResponse` JSON → `AuthContext` stores `accessToken` + `user` in memory → `router.push('/admin')`.
2. **Product Creation:**  
   `AdminProductForm` *(to build)* → `adminProductsService.createProduct()` *(to build)* → `requestApi('/admin/products', POST)` (`Bearer` token + cookie) → `RateLimitFilter` → `JwtAuthenticationFilter` (validates JWT + `user.isEnabled()`) → `SecurityConfig.hasRole("ADMIN")` → `AdminProductController.createProduct()` (`:60`, `@Valid`) → `AdminProductService.createProduct()` (`:116`, `@Transactional`, SKU uniqueness, active price > 0, category lookup) → `ProductRepository.save()` → `public.products` + `public.product_images` → `201 Created ApiResponse<AdminProductDto>` → UI toast & redirect.
3. **Product Update:**  
   `AdminProductForm` *(to build)* → `adminProductsService.updateProduct(id, req)` → `requestApi('/admin/products/{id}', PUT)` → Security Chain (`ROLE_ADMIN`) → `AdminProductController.updateProduct()` (`:69`, `@Valid`) → `AdminProductService.updateProduct()` (`:171`, `@Transactional`, `findByIdWithDetailsAdmin` *(no lock)*, `stockQuantity >= reservedQuantity`) → `ProductRepository.save()` → `200 OK ApiResponse<AdminProductDto>` → UI updates state.
4. **Inventory Adjustment:**  
   `InventoryAdjustDialog` *(to build)* → `adminProductsService.getById(id)` (fresh read) → `adminProductsService.updateProduct(id, { ...fresh, stockQuantity: newStock, images: null })` → Security Chain (`ROLE_ADMIN`) → `AdminProductController.updateProduct()` (`:69`) → `AdminProductService.updateProduct()` (`:191-194,210`, validates `newStock >= reservedQuantity`) → `public.products` (`chk_stock_available` DB constraint) → `200 OK ApiResponse<AdminProductDto>` → UI refreshes row.
5. **Order Listing:**  
   `AdminOrdersPage` (`app/admin/orders/page.tsx:43`) → `adminOrdersService.getOrders()` (`adminOrders.ts:103`) → `requestApi('/admin/orders?...', GET)` → Security Chain (`ROLE_ADMIN`) → `AdminOrderController.getAdminOrders()` (`:44`) → `OrderService.getAdminOrders()` (`:331`, readOnly tx, sort whitelist) → `OrderRepository.findAdminOrders()` → `public.orders` → `200 OK ApiResponse<PagedOrdersResponse>` → `setData(res)`.
6. **Order Status Update:**  
   `OrderStatusUpdateDialog` (`components/admin/OrderStatusUpdateDialog.tsx:61`) → `adminOrdersService.updateOrderStatus()` (`adminOrders.ts:126`) → `requestApi('/admin/orders/{orderNumber}/status', PUT)` → Security Chain (`ROLE_ADMIN`) → `AdminOrderController.updateOrderStatus()` (`:87`, `@Pattern` + `@Valid`, resolves `actorId` from `CustomUserDetails`/`UserRepository`) → `OrderService.updateOrderStatus()` (`:474`, `@Transactional`, idempotency → `OrderStatus.canTransitionTo()` → `isPreShipmentState` guard → `TreeMap` sorted `ProductRepository.findByIdForUpdate()` (`PESSIMISTIC_WRITE`) → `Order` `@Version` update + `OrderStatusHistory` insert) → `200 OK ApiResponse<OrderResponseDto>` (or `400`/`409`) → `handleStatusChangeSuccess()` patches row in place.
7. **Customer Activation / Deactivation:**  
   `AdminCustomersPage` *(to build)* → `adminCustomersService.toggleStatus(id, isActive)` *(to build)* → `requestApi('/admin/customers/{id}/status', PATCH)` → Security Chain (`ROLE_ADMIN`) → `AdminCustomerController.toggleCustomerStatus()` (`:71`) → `AdminCustomerService.toggleCustomerStatus()` (`:159`, `@Transactional`) → `CustomerRepository.save(isActive)` + `UserRepository.save(enabled)` → `public.customers` & `public.users` → `200 OK ApiResponse<AdminCustomerDetailDto>` → UI updates badge; disabled user's tokens are immediately rejected on next request.

---

## 10. Request and Response Examples (`VERIFIED` against Java DTOs)

### 10.1 Admin Login (`POST /api/auth/login`)
```json
// Request
{
  "identifier": "admin@varellion.com",
  "password": "<REDACTED_PASSWORD>"
}

// 200 OK Response (Set-Cookie: refresh_token=<JWT>; Path=/; Max-Age=604800; HttpOnly; SameSite=Lax)
{
  "accessToken": "<JWT_ACCESS_TOKEN>",
  "email": "admin@varellion.com",
  "username": "admin",
  "role": "ADMIN",
  "message": "Login successful"
}
```

### 10.2 Dashboard Summary (`GET /api/admin/dashboard/summary`)
```json
{
  "timestamp": "2026-11-18T10:00:00Z",
  "success": true,
  "message": "Success",
  "data": {
    "totalRevenue": 48500.00,
    "totalOrders": 24,
    "pendingOrders": 5,
    "deliveredOrders": 15,
    "lowStockProductsCount": 3,
    "totalCustomers": 18
  }
}
```

### 10.3 Create Product (`POST /api/admin/products`)
```json
// Request
{
  "nameAr": "ساعة فارليون أوبسيديان",
  "nameEn": "VARELLION Obsidian Watch",
  "categoryId": "550e8400-e29b-41d4-a716-446655440000",
  "descriptionAr": "ساعة ستانلس ستيل 316L بضمان شامل",
  "descriptionEn": "316L stainless steel luxury timepiece",
  "price": 3450.00,
  "costPrice": 1800.00,
  "stockQuantity": 20,
  "sku": "VAR-OBS-001",
  "isActive": true,
  "images": [
    {
      "imageUrl": "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9",
      "isMain": true,
      "displayOrder": 0
    }
  ]
}

// 201 Created Response
{
  "timestamp": "2026-11-18T10:05:00Z",
  "success": true,
  "message": "تم إنشاء المنتج بنجاح",
  "data": {
    "productId": "11111111-2222-3333-4444-555555555555",
    "categoryId": "550e8400-e29b-41d4-a716-446655440000",
    "categorySlug": "watches",
    "categoryNameAr": "الساعات",
    "categoryNameEn": "Watches",
    "sku": "VAR-OBS-001",
    "nameAr": "ساعة فارليون أوبسيديان",
    "nameEn": "VARELLION Obsidian Watch",
    "descriptionAr": "ساعة ستانلس ستيل 316L بضمان شامل",
    "descriptionEn": "316L stainless steel luxury timepiece",
    "price": 3450.00,
    "costPrice": 1800.00,
    "stockQuantity": 20,
    "reservedQuantity": 0,
    "availableStock": 20,
    "isActive": true,
    "images": [
      {
        "imageId": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
        "imageUrl": "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9",
        "isMain": true,
        "displayOrder": 0
      }
    ],
    "createdAt": "2026-11-18T10:05:00Z",
    "updatedAt": "2026-11-18T10:05:00Z"
  }
}
```

### 10.4 Update Order Status (`PUT /api/admin/orders/VAR-20261118-0001/status`)
```json
// Request
{
  "newStatus": "SHIPPED",
  "reason": "تم تسليم الشحنة لمندوب الشحن - بوليصة #9921"
}

// 409 Conflict Example (Optimistic Lock)
{
  "timestamp": "2026-11-18T10:10:00",
  "status": 409,
  "error": "Conflict",
  "message": "تم تعديل الطلب بواسطة جلسة أخرى، يرجى تحديث الصفحة والمحاولة مرة أخرى",
  "path": "/api/admin/orders/VAR-20261118-0001/status"
}
```

### 10.5 Validation Error Envelope (`400 Bad Request`)
```json
{
  "timestamp": "2026-11-18T10:12:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/api/admin/products",
  "validationErrors": {
    "sku": "صيغة SKU يجب أن تحتوي على أحرف وأرقام وشرطات فقط",
    "price": "السعر يجب أن يكون 0 أو أكثر"
  }
}
```

---

## 11. Data Models and DTO Reference (`VERIFIED`)

Exact TypeScript contracts matching the real Spring Boot DTOs (to be added/aligned in `frontend/src/types/index.ts` or `frontend/src/types/admin.ts`):

```ts
// Matches DashboardSummaryDto.java:17-24
export interface DashboardSummaryDto {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  lowStockProductsCount: number;
  totalCustomers: number;
}

// Matches SalesAnalyticsDto.java:18-34
export interface DailySalesPointDto {
  date: string; // YYYY-MM-DD
  revenue: number;
  ordersCount: number;
}

export interface SalesAnalyticsDto {
  periodDays: number;
  totalPeriodRevenue: number;
  totalPeriodOrders: number;
  timeline: DailySalesPointDto[];
}

// Matches AdminCategoryDto.java:15-26
export interface AdminCategoryDto {
  categoryId: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  descriptionAr: string | null;
  descriptionEn: string | null;
  isActive: boolean;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

// Matches CreateCategoryRequest.java / UpdateCategoryRequest.java
export interface AdminCategoryPayload {
  nameAr: string;
  nameEn: string;
  slug: string; // ^[a-z0-9]+(?:-[a-z0-9]+)*$
  descriptionAr?: string;
  descriptionEn?: string;
  isActive?: boolean;
}

// Matches ProductImageDto.java:8-13 & CreateProductRequest.ProductImageInputDto:65-71
export interface AdminProductImageInput {
  imageUrl: string;
  isMain?: boolean;
  displayOrder?: number;
}

export interface AdminProductImageDto {
  imageId: string;
  imageUrl: string;
  isMain: boolean;
  displayOrder: number;
}

// Matches AdminProductDto.java:21-41
export interface AdminProductDto {
  productId: string;
  categoryId: string | null;
  categorySlug: string | null;
  categoryNameAr: string | null;
  categoryNameEn: string | null;
  sku: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string | null;
  descriptionEn: string | null;
  price: number;
  costPrice: number;
  stockQuantity: number;
  reservedQuantity: number;
  availableStock: number; // Math.max(0, stockQuantity - reservedQuantity)
  isActive: boolean;
  images: AdminProductImageDto[];
  createdAt: string;
  updatedAt: string;
}

// Matches PagedAdminProductsResponse.java:17-23
export interface PagedAdminProductsResponse {
  products: AdminProductDto[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

// Matches CreateProductRequest.java & UpdateProductRequest.java
export interface AdminProductPayload {
  nameAr: string;
  nameEn: string;
  categoryId: string;
  descriptionAr?: string;
  descriptionEn?: string;
  price: number;
  costPrice: number;
  stockQuantity: number;
  sku: string; // ^[A-Za-z0-9-_]+$
  isActive?: boolean;
  images?: AdminProductImageInput[] | null; // null preserves existing images on PUT
}

// Matches OrderStatusCountDto.java:14-25
export interface OrderStatusCountDto {
  allOrders: number;
  pendingConfirmation: number;
  confirmed: number;
  preparing: number;
  shipped: number;
  delivered: number;
  deliveryFailed: number;
  cancelled: number;
  expired: number;
  statusBreakdown: Record<string, number>;
}

// Matches UpdateDeliveryAddressRequest.java:14-30
export interface UpdateDeliveryAddressPayload {
  shippingGovernorate: string;
  shippingCityArea: string;
  shippingDetailedAddress: string;
  customerPhone?: string;
  customerName?: string;
}

// Matches AdminCustomerSummaryDto.java:16-28
export interface AdminCustomerSummaryDto {
  customerId: string;
  userAccountId: number | null;
  fullName: string | null;
  email: string | null;
  phoneNumber: string | null;
  governorate: string | null;
  cityArea: string | null;
  isActive: boolean;
  totalOrders: number;
  totalSpent: number;
  createdAt: string;
}

// Matches AdminCustomerDetailDto.java:16-30
export interface AdminCustomerDetailDto extends AdminCustomerSummaryDto {
  detailedAddress: string | null;
  updatedAt: string;
}

// Matches PagedAdminCustomersResponse.java:14-20
export interface PagedAdminCustomersResponse {
  customers: AdminCustomerSummaryDto[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}
```

### Verified DTO Mismatches Between Existing Frontend & Backend (`VERIFIED`)
1. **`OrderItem.totalPrice` vs `OrderItemDto.lineTotal`:** `frontend/src/types/index.ts:232` declares `totalPrice: number`, whereas backend `OrderService.mapItemToDto()` (`OrderService.java:665`) sets `.lineTotal(item.getLineTotal())`. The Admin Order Details table MUST read `lineTotal` (and align `types/index.ts` in the implementation phase).
2. **`OrderResponseDto` omits `adminNotes`:** `frontend/src/types/index.ts:267` declares `adminNotes?: string`, but `OrderResponseDto.java:23-68` does **not** include `adminNotes` and `OrderService.mapToDto()` (`OrderService.java:426-452`) never populates it.

---

## 12. Business Rules, Security Constraints, and File/Image Management (`17.F`)

### 12.1 Financial Integrity (`VERIFIED`)
- Client-supplied prices, subtotals, shipping fees, and totals are **completely ignored**. `OrderService.createOrder()` (`OrderService.java:190-210`) computes authoritative line totals from `product.getPrice()` and shipping fees via `calculateAuthoritativeShippingFee()` (`OrderService.java:112-135`):
  - `subtotal >= 2500 EGP` → `0.00 EGP` (Free Shipping)
  - Cairo / Giza / Qalyubia → `50.00 EGP`
  - Alexandria / Matrouh → `60.00 EGP`
  - Delta & Canal governorates → `65.00 EGP`
  - North Upper Egypt (Fayoum, Beni Suef, Minya, Assiut) → `75.00 EGP`
  - Other Upper Egypt / Red Sea / Sinai → `85.00 EGP`
- Changing the shipping governorate via `PATCH /api/admin/orders/{orderNumber}/delivery-address` triggers server-side recalculation of `shippingFee` and `totalAmount` (`OrderService.java:596-600`). The Admin UI must display returned backend numbers, never compute authoritative totals client-side.

### 12.2 Inventory Integrity (`SEC-INV-01` — `VERIFIED`)
- **Three Stock Concepts:** `stockQuantity` (physical warehouse units), `reservedQuantity` (units reserved for pre-shipment orders), `availableStock = Math.max(0, stockQuantity - reservedQuantity)`. Database constraint `chk_stock_available` enforces `reserved_quantity <= stock_quantity` (`V3__create_product_inventory_and_movements.sql:23`).
- **Mutation Rules (`OrderService.java:495-546`):**
  - Order creation → increments `reservedQuantity` only (`OrderService.java:187`).
  - Pre-shipment `CANCELLED` / `EXPIRED` (`PENDING_CUSTOMER_CONFIRMATION`, `CONFIRMED`, `PREPARING`) → decrements `reservedQuantity` only.
  - Pre-shipment → `SHIPPED` → decrements both `reservedQuantity` and `stockQuantity` once.
  - Post-shipment transitions (`SHIPPED` / `DELIVERY_FAILED` → `DELIVERY_FAILED`, `RETURNED`, `CANCELLED`, `SHIPPED`, `DELIVERED`) → **zero automatic inventory mutation**.
- **Return Policy:** A `RETURNED` status does NOT prove physical warehouse receipt or sellable condition. Returned/damaged goods must NEVER be auto-restocked on status change. Manual stock updates via `PUT /api/admin/products/{id}` enforce `stockQuantity >= reservedQuantity` (`AdminProductService.java:192`).
- **Concurrency:** `OrderService` sorts `productId` ascending (`TreeMap` / `.sorted()`) before acquiring `PESSIMISTIC_WRITE` (`ProductRepository.findByIdForUpdate()`), and `Order` enforces optimistic locking via `@Version` (`Order.java:33-35`) returning `HTTP 409`.

### 12.3 Order Lifecycle Rules (`VERIFIED` — `OrderStatus.java:26-52`)
- **Allowed Transitions:**
  - `PENDING_CUSTOMER_CONFIRMATION` → `CONFIRMED`, `CANCELLED`, `EXPIRED`
  - `CONFIRMED` → `PREPARING`, `SHIPPED`, `CANCELLED`
  - `PREPARING` → `SHIPPED`, `CANCELLED`
  - `SHIPPED` → `DELIVERED`, `DELIVERY_FAILED`, `RETURNED`, `CANCELLED`
  - `DELIVERY_FAILED` → `SHIPPED`, `DELIVERED`, `RETURNED`, `CANCELLED`
- **Terminal States (No Outbound Transitions):** `DELIVERED`, `CANCELLED`, `EXPIRED`, `RETURNED`, `EXCHANGED`.
- **`EXCHANGED` Dead State:** Zero inbound transitions exist (`OrderStatusTest.canTransitionTo_Exchanged_IsCurrentlyUnreachable` verified). Do not display `EXCHANGED` as a selectable target in dropdowns.
- **Same-Status Transitions:** Idempotent no-op (`OrderService.java:481-484`).

### 12.4 Authentication, Authorization & Egyptian Phone Rules (`VERIFIED`)
- **Token Storage:** Access token strictly in React memory (`AuthContext.tsx:28`); refresh token strictly in `HttpOnly; SameSite=Lax; Path=/` cookie (`AuthController.java:90-96`). Never use `localStorage`/`sessionStorage`.
- **Public Registration:** Always assigns `USER` (`AuthService.java:126`); never creates `ADMIN`.
- **Egyptian Phone Validation:** Regex `^01[0125][0-9]{8}$` (`frontend/src/lib/validations/customer.ts:3`). Backend `OrderService.normalizeEgyptianPhone()` (`OrderService.java:65-76`) normalizes `+20`, `0020`, `20`, spaces, and hyphens into 11 digits (`01XXXXXXXXX`).

### 12.5 File and Image Management (`17.F` — `NOT IMPLEMENTED`)
- **Upload Endpoint:** `NOT IMPLEMENTED` (repository-wide search confirmed zero `MultipartFile` or `/api/upload` controllers; `RateLimitFilter.java:61` has a dormant path rule for `/api/upload` with no backing controller).
- **Current Behavior (`VERIFIED`):** `CreateProductRequest` and `UpdateProductRequest` accept `images: [{ imageUrl, isMain, displayOrder }]` as plain URL strings (`AdminProductService.java:150-160,217-230`).
- **Allowed Next.js `<Image>` Domains (`frontend/next.config.ts:6-25`):** `https://images.unsplash.com`, `https://*.supabase.co`, `http://localhost`, `http://127.0.0.1`. External URLs outside those hostnames will throw a Next.js Image Optimization error unless rendered with a fallback `<img>` preview in Admin or added to `next.config.ts`.
- **Update Behavior:** Passing `images: null` on `PUT /api/admin/products/{id}` preserves existing images; passing an array (even `[]`) clears and replaces `product.images` (`AdminProductService.java:217-230`).

---

## 13. VARELLION Design System (`VERIFIED`)

Inspected directly from `frontend/src/styles/globals.css`, `frontend/src/app/layout.tsx`, and `frontend/src/components/ui/`:

### 13.1 Brand Palette & Semantic Tokens (`globals.css:46-104`)
| Token | Hex Value | Role / WCAG Note |
|---|---|---|
| `--obsidian-950` | `#0E0F11` | Deepest luxury dark (Admin Sidebar background, dark headers) |
| `--obsidian-900` / `--primary` | `#141619` | Primary buttons, high-contrast dark surfaces |
| `--obsidian-850` / `--obsidian-800` | `#1A1D20` / `#22262B` | Sidebar hover/active surfaces |
| `--ivory-50` / `--background` | `#FAF9F6` | Warm Ivory page canvas |
| `--ivory-100` / `--secondary` | `#F4F1EA` | Table header fills (`bg-secondary/60`), subtle panels |
| `--ivory-200` / `--border` | `#EAE5D9` | Card/table borders & input outlines |
| `--gold-500` / `--ring` | `#C5A059` | Brushed Gold accent, active focus rings, active nav indicator |
| `--gold-700` / `--accent-foreground` | `#876725` | Dark Gold text on light surfaces (**WCAG 2.2 AA 4.8:1 compliant**) |
| `--destructive` | `#B42318` | Destructive buttons, error alerts, critical status badges |
| `--card` | `#FFFFFF` | Elevated cards, modals, tables |

### 13.2 Typography, RTL, Shared UI & Accessibility (`VERIFIED`)
- **Fonts:** `Tajawal` (400/500/700/800) for Arabic body & UI; `Cinzel` (600/700/800/900) for `VARELLION` brand wordmark (`layout.tsx:38`, `globals.css:4-5`).
- **Direction:** Global `dir="rtl"` (`layout.tsx:33`); use logical CSS properties (`text-start`, `ms-*`, `me-*`, `ps-*`, `pe-*`) and `dir="ltr"` for monospace identifiers (`orderNumber`, `sku`, `phoneNumber`, `email`).
- **Reusable Components to Reuse (Do NOT Rebuild):**
  - `Button` (`components/ui/Button.tsx`): variants `default`, `luxury`, `gold`, `destructive`, `outline`, `secondary`, `ghost`, `link`; `isLoading` spinner; `default` (`min-h-[44px]`) and `icon` (`min-h-[44px] min-w-[44px]`) meet WCAG 44×44px. *(Avoid `size="sm"` for primary touch actions on mobile unless padding/hit area reaches 44px.)*
  - `Input` (`components/ui/Input.tsx`): built-in `label`, `error` (`role="alert"`, `aria-invalid`, `aria-describedby`), `helperText`.
  - `Badge` (`components/ui/Badge.tsx`): variants `default`, `luxury`, `gold`, `secondary`, `destructive`, `outline`, `success`, `warning`.
  - `Dialog` (`components/ui/Dialog.tsx`): accessible modal (`role="dialog"`, `aria-modal="true"`, automatic Tab focus trap, `Escape` close, focus restoration).
  - `Card`, `Sheet` (ideal for mobile admin sidebar & order quick-view drawer), `Skeleton`.
- **Reduced Motion:** Global `@media (prefers-reduced-motion: reduce)` already active (`globals.css:145-155`).

---

## 14. BACKEND GAPS AND FRONTEND BLOCKERS

| Feature / Area | Classification | Direct Repository Evidence & Impact |
|---|---|---|
| **Paymob Online Payment Initiation** | `NOT IMPLEMENTED` | Zero backend classes/controllers for `/api/payments/paymob/initiate`. `frontend/src/services/payment.ts:19-54` calls a non-existent endpoint and falls back to dev simulator `/checkout/mock-paymob`. |
| **Paymob Webhook Handling** | `NOT IMPLEMENTED` | Zero webhook controllers or HMAC verifiers in `backend/src/main/java/`. |
| **Cash on Delivery (COD) Orders** | `PARTIALLY IMPLEMENTED` | Real COD order creation works end-to-end without Paymob (`OrderService.createOrder`, `CreateOrderRequest.paymentMethod = "CASH_ON_DELIVERY"`). **Gap:** `public.orders` has NO `payment_method` or `payment_status` columns (`V5__create_orders_module.sql:12-78`); `paymentMethod` is only written into `admin_notes` text and `OrderResponseDto` always defaults to `"CASH_ON_DELIVERY"` on subsequent reads. |
| **Coupon / Promo Engine** | `NOT IMPLEMENTED` | Zero coupon entities/services/controllers; `OrderService.java:209` hardcodes `BigDecimal discountTotal = BigDecimal.ZERO`. |
| **SMS Notifications** | `NOT IMPLEMENTED` | Only referenced in a javadoc comment (`GuestOrderLookupController.java:33`). Zero SMS client or service. |
| **WhatsApp Notifications** | `NOT IMPLEMENTED` | Zero WhatsApp service or webhook integration in backend. |
| **Customer Reviews** | `NOT IMPLEMENTED` | Zero review tables, entities, or controllers. |
| **Return Intake Workflow (Warehouse Receipt)** | `NOT IMPLEMENTED` | `OrderStatus.RETURNED` exists, and `SEC-INV-01` correctly prevents auto-restocking on status change, but there is no `/restock` / `/receive-return` endpoint or `return_received_at` DB column. Deferred to future migration `V14`. |
| **Damaged Returned Inventory Recording** | `NOT IMPLEMENTED` | `public.products` has only `stock_quantity` and `reserved_quantity` (`V3`). No `damaged_quantity` or `inventory_movements` ledger exists. |
| **Dashboard Analytics** | `IMPLEMENTED` *(basic scope)* | `GET /api/admin/dashboard/summary`, `/order-status-stats`, `/sales-analytics?days=` are implemented and tested (8 tests). **Limitations:** `lowStockThreshold` hardcoded to `5`; `totalRevenue` excludes `CANCELLED`/`EXPIRED` (`OrderRepository.java:54`) but does NOT exclude `RETURNED`; no top-products or profit-margin endpoints. |
| **Product Image File Upload** | `NOT IMPLEMENTED` | Zero multipart upload endpoints. Admins must paste hosted image URLs. |
| **Order Admin Notes Read-Back** | `PARTIALLY IMPLEMENTED` | `PATCH /api/admin/orders/{orderNumber}/notes` writes `order.adminNotes`, but `OrderResponseDto.java` omits `adminNotes`, so Admin UI cannot display previously saved notes on reload. |
| **Post-Delivery Return (`DELIVERED -> RETURNED`) & `EXCHANGED`** | `NOT IMPLEMENTED` / Blocked | `OrderStatus.java:50` locks `DELIVERED` as terminal and leaves `EXCHANGED` unreachable. |
| **Dedicated Inventory Stock Patch & Product Optimistic Lock** | `PARTIALLY IMPLEMENTED` | Stock edits must use full `PUT /api/admin/products/{id}`. `Product.java` lacks `@Version` and `AdminProductService.updateProduct()` (`:174`) does not use `findByIdForUpdate()`, creating a Lost Update risk if an admin edits a product while an order ships concurrently. |
| **Auto-Expiry Background Job for Pending Orders** | `NOT IMPLEMENTED` | `OrderReservationService.isReservationExpired()` (`:34-40`) has 0 callers and no `@Scheduled` job exists; pending orders stay reserved until manually set to `EXPIRED`/`CANCELLED`. |

---

## 15. Manual Testing Plan & Integration Test Scenarios (`17.H`)

> **Database Disclaimer:** Automated tests in Section 16 run on isolated **H2 in-memory**. H2 **does NOT prove PostgreSQL production concurrency, Flyway constraints, or Supabase RLS behavior**. Use this manual testing plan against a local Spring Boot + dedicated non-production PostgreSQL/Supabase test database (NEVER production data).

| # | Scenario | Starting Condition | UI Steps | API Endpoint & Request | Expected Visible UI & Backend / DB Effect | Cleanup |
|---|---|---|---|---|---|---|
| **M-01** | **Admin Login Success** | Unauthenticated browser at `/admin` | Redirected to `/login?redirect=/admin`; enter Admin email + password; submit | `POST /api/auth/login` | Redirects to `/admin`; DevTools shows `Set-Cookie: refresh_token` (`HttpOnly`); `localStorage` & `sessionStorage` have ZERO tokens; KPI cards load `200 OK` | None |
| **M-02** | **Unauthorized Guest & Non-Admin (`USER`) Access** | (a) Guest visits `/admin/orders`; (b) Logged-in `USER` visits `/admin/orders` & calls `/api/admin/dashboard/summary` via DevTools | Observe redirects + direct fetch response | `GET /api/admin/dashboard/summary` | (a) Guest redirected to `/login?redirect=/admin/orders`, API returns `401`; (b) `USER` redirected to `/`, API returns `403 Forbidden` | Logout `USER` |
| **M-03** | **Dashboard Loading & Period Switch** | Logged in as `ADMIN` on `/admin` | Observe skeletons → 6 KPI cards → switch analytics period `7` → `30` → `90` | `GET /api/admin/dashboard/summary`, `/order-status-stats`, `/sales-analytics?days=7` | Numbers match DB totals; timeline array contains exact day count (`7`/`30`/`90`); no console errors | None |
| **M-04** | **Product Listing, Filter & Sort** | Logged in as `ADMIN` on `/admin/products` | Filter by category, toggle Active/Inactive, search by SKU, sort by `stockQuantity ASC`, go to Page 2 | `GET /api/admin/products?category=...&search=...&sortBy=stockQuantity&sortDirection=ASC&page=1` | Filtered rows match criteria; pagination controls update `currentPage` and disable Prev/Next at bounds | Reset filters |
| **M-05** | **Product Creation & Duplicate SKU Conflict** | At `/admin/products/new` | Create valid product with `SKU: VAR-QA-001`, `price: 1500`, `costPrice: 800`, `stockQuantity: 10`, valid Unsplash URL; then submit again with same SKU | `POST /api/admin/products` | 1st submit: `201 Created`, appears in list with `availableStock=10`, DB row inserted. 2nd submit: `409 Conflict` Arabic duplicate-SKU error shown; form input preserved | Delete test product via M-06 |
| **M-06** | **Product Edit, Toggle & Delete (Hard vs Soft)** | Product `VAR-QA-001` exists (0 orders) + another product with >=1 order | Edit price/name; toggle `isActive=false`; delete `VAR-QA-001` (hard delete); attempt delete on ordered product (soft archive) | `PUT /api/admin/products/{id}`, `PATCH .../status`, `DELETE /api/admin/products/{id}` | Unordered product permanently removed (`200`); ordered product stays in DB with `is_active=false` and archive message shown | Restore ordered product `isActive=true` |
| **M-07** | **Inventory Adjustment & Guard (`stock < reserved`)** | Product with `stockQuantity=10, reservedQuantity=3` | At `/admin/inventory`: (a) try setting `stockQuantity=2`; (b) set `stockQuantity=12` | `PUT /api/admin/products/{id}` | (a) Rejected with `400 Bad Request` (`لا يمكن تقليل كمية المخزون عن الكمية المحجوزة`), DB unchanged; (b) `200 OK`, `stockQuantity=12, availableStock=9` | Restore stock to `10` |
| **M-08** | **Order Listing, Search & Status Filter** | At `/admin/orders` | Search by order number / customer phone; select status filter `CONFIRMED` | `GET /api/admin/orders?status=CONFIRMED&search=...` | Matching orders render with accurate total, status badge, and Arabic date | Clear filter |
| **M-09** | **Order Details & Pre-Dispatch Address Edit** | Order in `PENDING_CUSTOMER_CONFIRMATION` (Cairo, fee `50`) | Open `/admin/orders/{orderNumber}`; edit governorate to `أسوان` | `GET /api/admin/orders/{orderNumber}`, `PATCH .../delivery-address` | `200 OK`; backend recalculates `shippingFee` to `85.00` (if subtotal `< 2500`) and updates `totalAmount`; UI reflects backend totals | Revert test order or use disposable order |
| **M-10** | **Valid Order Status Transitions & Stock Deduction** | Test COD order in `PENDING_CUSTOMER_CONFIRMATION` (`qty=2`, product `stock=10, reserved=2`) | Transition `PENDING -> CONFIRMED -> SHIPPED -> DELIVERED` via `OrderStatusUpdateDialog` | `PUT /api/admin/orders/{orderNumber}/status` | At `CONFIRMED`: `stock=10, reserved=2`. At `SHIPPED`: `stock=8, reserved=0` (deducted once). At `DELIVERED`: `stock=8, reserved=0` (no double deduct). `order_status_history` records each step with admin `actorId` | Use disposable test order |
| **M-11** | **Post-Shipment Return / Cancel (`SEC-INV-01`)** | Test order in `SHIPPED` (`stock=8, reserved=0`) | Transition `SHIPPED -> DELIVERY_FAILED -> RETURNED` | `PUT /api/admin/orders/{orderNumber}/status` | Status updates to `RETURNED`; **`stockQuantity` remains `8`** (zero automatic restock); dialog now shows terminal state message | Use disposable test order |
| **M-12** | **Invalid / Terminal Transition & `409` Conflict** | (a) Order in `DELIVERED`; (b) Two tabs open on same `CONFIRMED` order | (a) Verify dropdown blocked + direct API `PUT` returns `400`; (b) Tab 1 moves to `PREPARING`, Tab 2 tries `SHIPPED` concurrently | `PUT /api/admin/orders/{orderNumber}/status` | (a) UI shows terminal state; direct API returns `400`; (b) Concurrent stale write gets `409 Conflict` without corrupting inventory | None |
| **M-13** | **Customer Listing, Details & Deactivation Enforcement** | Test customer account (`USER`) logged in on second browser | At `/admin/customers`: search customer → open details → click Deactivate + confirm; in second browser call `/api/orders/my-orders` and `/api/auth/refresh` | `GET /api/admin/customers`, `PATCH /api/admin/customers/{id}/status` (`{ isActive: false }`) | `customers.is_active=false` AND `users.enabled=false`; second browser's existing JWT is rejected (`401`) and refresh fails (`401`) immediately! Re-activate restores login | Re-activate test customer |
| **M-14** | **Backend Validation Errors (`400`)** | At `/admin/products/new` | Bypass HTML validation or submit invalid SKU (`"bad sku!"`) and `price: 0` with `isActive: true` | `POST /api/admin/products` | `400 Bad Request`; field-level errors from `validationErrors` render under each input | None |
| **M-15** | **Network Failure & 30s Timeout Handling** | Admin page open; simulate offline in DevTools Network tab | Click Refresh or Submit | Any `/api/admin/**` | Alert banner appears with Retry button; form input is NOT lost; buttons re-enable after `finally` | Restore network |
| **M-16** | **Session Expiration, Auto-Refresh & Browser Reload** | Logged in as `ADMIN` | (a) Press F5 hard reload on `/admin/orders`; (b) Wait for access token expiry (or clear cookie) and click Refresh | `POST /api/auth/refresh` | (a) Silent refresh restores session and renders page without flicker to login; (b) When refresh cookie is expired/cleared, `401` triggers logout cleanup and redirects to `/login?redirect=/admin/orders` | Re-login |

---

## 16. Existing Automated Test Coverage (`VERIFIED`)

### 16.1 Backend Automated Tests (Isolated H2 In-Memory + Mockito)
- **Order Lifecycle, Inventory & Concurrency Suite (Freshly Executed 2026-11-18 — `104/104 PASS`):**
  - `OrderServiceTest`: 47/47 PASS (Mockito unit — includes 9 `SEC-INV-01` tests)
  - `AdminOrderControllerTest`: 20/20 PASS (`@SpringBootTest` + MockMvc + `@MockBean OrderService` on H2)
  - `OrderControllerTest`: 7/7 PASS (Standalone MockMvc)
  - `GuestOrderLookupControllerTest`: 6/6 PASS (Standalone MockMvc)
  - `OrderLifecycleInventoryIntegrationTest`: 6/6 PASS (`@SpringBootTest` real H2 persistence, `CyclicBarrier` last-unit overselling, stale `@Version` rollback)
  - `OrderStatusTest`: 5/5 PASS (100-cell transition matrix)
  - `JpaEntityMappingTest`: 5/5 PASS (`@DataJpaTest` H2)
  - `GlobalExceptionHandlerTest`: 4/4 PASS (409 optimistic lock & validation handlers)
  - `IdempotencyServiceTest`: 3/3 PASS
  - `OrderConcurrencyDeadlockIntegrationTest`: 1/1 PASS (`@SpringBootTest` H2, 2 threads opposite product order)
- **Admin Module Existing Surefire Reports (`backend/target/surefire-reports/` — Pre-existing Run, `63/63 PASS`):**
  - `AdminProductServiceTest`: 14/14, `AdminProductControllerTest`: 12/12
  - `AdminCategoryServiceTest`: 8/8, `AdminCategoryControllerTest`: 7/7
  - `AdminCustomerServiceTest`: 8/8, `AdminCustomerControllerTest`: 6/6
  - `AdminDashboardControllerTest`: 5/5, `AdminDashboardServiceTest`: 3/3

> **Important Limitation:** All backend integration tests run against **H2 in-memory (`MODE=PostgreSQL`, `spring.flyway.enabled=false`)**. Real PostgreSQL MVCC, `SELECT ... FOR UPDATE`, Flyway SQL constraints (`V1`–`V13`), and Supabase RLS policies are **NOT VERIFIED** by H2 tests.

### 16.2 Frontend Automated Tests (Vitest + React Testing Library — Inspected on Disk)
- Existing Admin/Auth/API test files (`frontend/src/`):
  - `frontend/src/app/admin/orders/__tests__/page.test.tsx`
  - `frontend/src/components/admin/__tests__/OrderStatusUpdateDialog.test.tsx`
  - `frontend/src/services/__tests__/adminOrders.test.ts`
  - `frontend/src/components/auth/__tests__/AuthGuard.test.tsx`
  - `frontend/src/services/__tests__/api.test.ts`
  *(Note: Frontend Vitest suite was NOT re-executed during this documentation-only mission — status: `PARTIALLY VERIFIED` on disk.)*

---

## 17. External Technical References (Official Documentation Matched to Installed Versions)

All references below are **Official Vendor / Standards Documentation** (no community blog tutorials used as proof of repo features):

1. **Next.js 15 App Router — Layouts, Route Groups & Redirects:**  
   https://nextjs.org/docs/app/building-your-application/routing/layouts-and-templates  
   *Supports:* Designing `frontend/src/app/admin/layout.tsx` and isolating admin chrome from storefront layout in Next.js `15.2.1`.
2. **Next.js 15 Image Optimization (`remotePatterns`):**  
   https://nextjs.org/docs/app/api-reference/config/next-config-js/images  
   *Supports:* Handling external product image URLs against `frontend/next.config.ts` allowed domains (`images.unsplash.com`, `*.supabase.co`).
3. **React 19 Context & Hooks Reference:**  
   https://react.dev/reference/react/useContext  
   *Supports:* Reusing `AuthContext` in-memory session state and `useCallback`/`useMemo` patterns in React `19.0.0`.
4. **TypeScript 5.8 Compiler & Strict Mode:**  
   https://www.typescriptlang.org/tsconfig/  
   *Supports:* Enforcing strict DTO typing (`strict: true`) in `frontend/tsconfig.json`.
5. **Tailwind CSS v4 (`@theme` & CSS Variables):**  
   https://tailwindcss.com/docs/theme  
   *Supports:* Reusing `@theme inline` custom luxury tokens in `frontend/src/styles/globals.css` (`tailwindcss ^4.0.9`).
6. **Spring Boot 3.3 Reference Documentation (Web, Validation, JPA):**  
   https://docs.spring.io/spring-boot/3.3/index.html  
   *Supports:* Understanding `spring-boot-starter-parent 3.3.4`, Jakarta Bean Validation `400` responses, and `Pageable` sorting.
7. **Spring Security 6 — Method Security (`@PreAuthorize`) & CORS:**  
   https://docs.spring.io/spring-security/reference/6.3/servlet/authorization/method-security.html  
   *Supports:* Verifying server-side `ROLE_ADMIN` enforcement and `CorsConfig` `allowCredentials(true)` behavior.
8. **MDN Web Docs — Fetch API (`credentials: 'include'`), `AbortSignal.any()`, & `Set-Cookie` (`HttpOnly`, `SameSite`):**  
   https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch  
   https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies  
   *Supports:* `requestApi()` cookie transmission, 30s abort timeout, and `refresh_token` `HttpOnly` cookie lifecycle.
9. **W3C WCAG 2.2 — Target Size Minimum (SC 2.5.8) & Contrast Minimum (SC 1.4.3):**  
   https://www.w3.org/TR/WCAG22/#target-size-minimum  
   *Supports:* Enforcing 44×44px interactive touch targets and `#876725` Dark Gold (4.8:1 contrast) on light Warm Ivory surfaces.

---

## 18. Internal Code References & Developer Handoff Instructions (`17.J`)

> **Mandatory Revalidation Rule:** Before writing a single line of code, re-inspect these exact repository files because active work in progress may change line numbers or DTO fields.

Read files in this exact order before implementing each Admin module:

| Order | File Path | Why It Matters & Convention to Reuse | Mistake to Avoid |
|---|---|---|---|
| **1** | `frontend/src/services/api.ts` | Core `requestApi<T>()` with Bearer injection, `credentials: 'include'`, 30s timeout, and 401 refresh queue. | Never create a second Axios/fetch client or bypass `requestApi`. |
| **2** | `frontend/src/context/AuthContext.tsx` & `frontend/src/components/auth/AuthGuard.tsx` | In-memory token hydration via `/api/auth/refresh` + `<AuthGuard requiredRole="ADMIN">`. | Never store tokens in `localStorage`/`sessionStorage`; never rely on `AuthGuard` as a security boundary. |
| **3** | `frontend/src/styles/globals.css`, `frontend/src/app/layout.tsx`, `frontend/src/components/ui/{Button,Input,Badge,Dialog,Card,Sheet,Skeleton}.tsx` | VARELLION luxury palette, RTL `dir="rtl"`, Tajawal/Cinzel fonts, accessible modal focus trap, 44px buttons. | Never invent new colors or raw `<div onClick>` modals; always preserve RTL logical classes (`ms-*`, `text-start`). |
| **4** | `frontend/src/services/adminOrders.ts`, `frontend/src/app/admin/orders/page.tsx`, `frontend/src/components/admin/OrderStatusUpdateDialog.tsx` | Reference pattern for `ApiResponse<T>` unwrapping, `PERMITTED_STATUS_TRANSITIONS`, error/empty/loading states. | Never hardcode mock fallback arrays in Admin pages; never allow arbitrary status strings. |
| **5** | `backend/src/main/java/com/varellion/store/admin/dashboard/controller/AdminDashboardController.java` + `AdminDashboardService.java` + DTOs | Exact Dashboard KPI and `sales-analytics?days=` (clamped 7..90) contracts. | Do not assume custom date ranges or profit margin fields exist. |
| **6** | `backend/src/main/java/com/varellion/store/admin/catalog/controller/AdminProductController.java` + `AdminCategoryController.java` + Services + DTOs | Exact Product/Category validation regexes (`SKU`, `slug`), `stockQuantity >= reservedQuantity`, `price > 0` when active, soft vs hard delete, `images: null` preservation rule. | Never send `images: []` during a stock-only update (wipes product gallery!); always send `images: null` or full image list. |
| **7** | `backend/src/main/java/com/varellion/store/admin/order/controller/AdminOrderController.java` + `OrderService.java` + `OrderStatus.java` + `OrderResponseDto.java` | Order status state machine, `SEC-INV-01` inventory policy, `409` optimistic lock handling, `adminNotes` DTO omission, `lineTotal` field name. | Never assume `RETURNED` restocks inventory; never read `item.totalPrice` without mapping `lineTotal`. |
| **8** | `backend/src/main/java/com/varellion/store/admin/customer/controller/AdminCustomerController.java` + `AdminCustomerService.java` + DTOs | Customer pagination, plain-List `/{id}/orders` response, atomic `Customer.isActive` + `User.enabled` ban sync. | Never expect `PagedOrdersResponse` from `GET /api/admin/customers/{id}/orders` — it returns `List<OrderResponseDto>`. |

---

## 19. Implementation Roadmap (DO NOT IMPLEMENT IN THIS MISSION)

Adjusted to actual codebase dependencies (noting `/admin/orders` and `AuthGuard` already exist):

### Phase 1: Admin Protected Shell & Navigation Layout
- **Pages / Files:** `frontend/src/app/admin/layout.tsx`, `AdminSidebar.tsx` (desktop Obsidian rail + mobile `<Sheet>`), `AdminTopbar.tsx`, refactor `app/layout.tsx` or Route Groups so storefront header/footer don't clutter `/admin/*`.
- **APIs:** `/api/auth/refresh`, `/api/auth/logout`.
- **Acceptance Criteria:** Non-admin redirected to `/`; guest redirected to `/login?redirect=/admin/...`; all nav links ≥44px height in RTL; Vitest tests pass.

### Phase 2: Shared Admin Types, API Services & Reusable Data Table / Confirm Dialog
- **Files:** `frontend/src/types/admin.ts` (plus fix `OrderItem.lineTotal` alignment), `adminDashboard.ts`, `adminCategories.ts`, `adminProducts.ts`, `adminCustomers.ts`, extend `adminOrders.ts` (`getStatistics`, `updateNotes`, `updateDeliveryAddress`, `sortBy`/`sortDirection`), `ConfirmActionDialog.tsx`.
- **Dependencies:** Phase 1.
- **Acceptance Criteria:** 100% TypeScript `strict` clean (`npm run type-check`); unit tests for every service matching `adminOrders.test.ts`.

### Phase 3: Categories & Products Management (`/admin/categories`, `/admin/products*`)
- **Pages:** `/admin/categories`, `/admin/products`, `/admin/products/new`, `/admin/products/[productId]`.
- **APIs:** `C1`–`C6`, `P1`–`P6`.
- **Dependencies:** Phase 2 (Categories must exist before Product Create dropdown).
- **Known Blocker:** No file upload endpoint — implement URL-based image gallery manager with domain preview warning.

### Phase 4: Inventory Management (`/admin/inventory`)
- **Pages:** `/admin/inventory` + `StockAdjustmentDialog.tsx`.
- **APIs:** `P1` (`sortBy=stockQuantity&sortDirection=ASC`), `P2` (fresh fetch before modal), `P4` (`images: null`).
- **Known Blockers:** No dedicated stock-patch endpoint, no `Product.@Version`, no return-receipt/damaged-stock workflow (deferred to backend `V14`).

### Phase 5: Orders Management Enhancements (`/admin/orders` & `/admin/orders/[orderNumber]`)
- **Pages:** Upgrade existing `/admin/orders` (add status count badges from `O2`, sorting, details link) + build `/admin/orders/[orderNumber]` (items, history, `OrderStatusUpdateDialog`, address editor `O6`, notes editor `O5`).
- **APIs:** `O1`–`O6`.
- **Known Blocker:** `OrderResponseDto` omits `adminNotes` (backend 2-line addition recommended before expecting read-back).

### Phase 6: Customers Management (`/admin/customers` & `/admin/customers/[customerId]`)
- **Pages:** `/admin/customers`, `/admin/customers/[customerId]`.
- **APIs:** `U1`–`U4`.
- **Acceptance Criteria:** Search, pagination, order history view, confirmed ban/unban toggling both `Customer` and `User`.

### Phase 7: Dashboard Overview (`/admin`)
- **Pages:** Replace redirect in `frontend/src/app/admin/page.tsx` with KPI cards, order status breakdown, and 7/30/90-day sales trend visualization.
- **APIs:** `D1`, `D2`, `D3`.
- **Dependencies:** Phases 1–6 (so KPI click-through links resolve to real pages!).

### Phase 8: Manual End-to-End QA & Bug Fixing
- Execute all 16 Manual Testing Plan scenarios (Section 15) against local Spring Boot + non-production PostgreSQL test DB; run `npm run type-check`, `npm run lint`, `npm test`, and backend Maven test suite.

---

## 20. Risks and Unverified Assumptions

1. **PostgreSQL Production Locking & Constraints (`UNVERIFIED`):** All automated backend integration tests run on H2 (`spring.flyway.enabled=false`). Real PostgreSQL `SELECT ... FOR UPDATE` behavior, Flyway `V1`–`V13` check constraints, and Supabase RLS must be validated on a non-production PostgreSQL instance.
2. **Product Concurrent Edit Lost Update (`VERIFIED` Risk):** `Product` lacks `@Version` and `AdminProductService.updateProduct()` uses non-locking `findByIdWithDetailsAdmin()`. Mitigate in Admin UI by fetching fresh product immediately before stock adjustment until backend adds locking/`@Version`.
3. **Uncommitted Working Tree Churn (`VERIFIED` Risk):** Multiple admin backend controllers/services/tests (`admin/catalog`, `admin/customer`, `admin/dashboard`) are currently **untracked** in Git; the future developer must confirm they are committed/merged cleanly before deploying.
4. **Frontend Vitest Current Pass Status (`UNVERIFIED` in this session):** Frontend test files were inspected on disk, not executed during this documentation-only mission.
5. **Cookie `Secure` Flag Behind Local HTTP (`VERIFIED` Config Note):** `AuthController.java:26` defaults `app.security.cookie.secure=true`. For local `http://localhost:3000` manual testing, ensure backend runs with `app.security.cookie.secure=false` so browsers accept `Set-Cookie: refresh_token` over HTTP.
6. **Dashboard `totalRevenue` Includes `RETURNED` Orders (`VERIFIED`):** `OrderRepository.calculateTotalRevenue()` (`:54`) excludes `CANCELLED` and `EXPIRED` only — not `RETURNED`. Clarify with product owner whether returned orders should be excluded in a future backend update.

---

## 21. Final Completeness Checklist & Coverage Matrix

| Area | Inspected | Documented | Evidence | Remaining Gaps |
|---|---|---|---|---|
| **Frontend Stack, Routes, Auth & UI Components** | Yes (100% of `frontend/src/` tree & configs) | Yes (Sections 3, 5, 7, 8, 13, 18) | `package.json`, `tsconfig.json`, `next.config.ts`, `globals.css`, `layout.tsx`, `AuthContext.tsx`, `AuthGuard.tsx`, `api.ts`, `adminOrders.ts`, `admin/orders/page.tsx`, `OrderStatusUpdateDialog.tsx` | Frontend Vitest suite not re-executed in this read-only doc mission (`UNVERIFIED` live pass) |
| **Backend Admin Controllers, Services, DTOs & Security** | Yes (All 5 Admin Controllers, 4 Admin Services + `OrderService`, 18 Admin DTOs, `AuthController`, `AuthService`, `SecurityConfig`, `CorsConfig`) | Yes (Sections 4, 5, 6, 9, 10, 11, 12) | Exact file paths & line numbers across `backend/src/main/java/com/varellion/store/{admin,order,security,catalog}/` | None in static inspection; PostgreSQL runtime behavior remains `UNVERIFIED` (H2 only) |
| **Complete Admin API Inventory (25 Admin + 5 Auth)** | Yes (30/30 endpoints inspected) | Yes (Section 6 + Section 10) | Every controller method, DTO, validation rule, HTTP status, and test suite verified | `OrderResponseDto.adminNotes` omission & `OrderItem.lineTotal` mismatch flagged for fix |
| **Admin Pages, Actions & UX State Specs** | Yes (All 6+ required functional modules) | Yes (Sections 7, 8, 19) | Mapped 1:1 to real backend endpoints; zero fabricated controls | Return-intake, image upload, coupons, Paymob, SMS/WhatsApp explicitly marked `NOT IMPLEMENTED` |
| **Business, Inventory (`SEC-INV-01`) & Security Rules** | Yes | Yes (Sections 5, 6, 12, 14) | `OrderService.java`, `OrderStatus.java`, `AuthService.java`, `V3`/`V5`/`V12`/`V13` migrations, `customer.ts` | Auto-expiry reaper job (`OrderReservationService`) & return-receipt `V14` remain deferred |
| **Manual QA Plan & Automated Coverage** | Yes | Yes (Sections 15, 16) | 16 manual E2E test scenarios + 104 freshly run order tests + 63 admin Surefire reports | Real PostgreSQL / staging Supabase verification pending environment setup |
| **Safety & Secret Hygiene** | Yes | Yes | Zero secrets written; zero source/DB/Git mutations; only `AHMED_ESSAM.md` created | None |
