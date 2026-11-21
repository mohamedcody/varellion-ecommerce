# Authoritative Order Creation, Inventory Reservation & Checkout Auth Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the authoritative backend order placement engine (`POST /api/orders`), atomic inventory reservation with concurrency protection, automatic cart clearing upon purchase, and strict checkout route authentication gating to turn VARELLION into a real, transactional e-commerce platform.

**Architecture:** 
- **Backend (Spring Boot 3.3.4):** Authenticated REST endpoint `POST /api/orders` receiving `CreateOrderRequest`. An atomic `@Transactional` service layer verifies authenticated customer identity, performs pessimistic write locks on requested products to prevent inventory race conditions, recalculates line items and governorate shipping fees authoritatively on the server, creates immutable `Order` and `OrderItem` records in PostgreSQL, logs initial state in `OrderStatusHistory`, and clears the customer's cart.
- **Frontend (Next.js 15 & React 19):** Gate `/checkout` with authentication check and automatic redirect to `/login?redirect=/checkout` while preserving cart contents. Remove local `sessionStorage` fallback in `ordersService.createOrder` to ensure only authoritative database orders are created and errors are properly surfaced to the user.

**Tech Stack:** Java 17, Spring Boot 3.3.4, Spring Data JPA, PostgreSQL (Supabase), Spring Security 6, Next.js 15.2, React 19, TypeScript, Vitest, JUnit 5, Mockito.

---

## User Review Required

> [!IMPORTANT]
> **Strict Server-Side Price & Shipping Authority:**
> The server will NOT accept or trust prices or shipping totals sent from the browser client. All unit prices are loaded from `public.products`, line totals are computed server-side, and shipping fees are calculated based on the customer's `shippingGovernorate` (Free shipping for orders >= 2,500 EGP, else 50 EGP for Cairo/Giza, 70 EGP for Delta/Alexandria, 90 EGP for Upper Egypt/Frontiers).

> [!IMPORTANT]
> **Enforced Authentication on Checkout:**
> In accordance with the business requirement and PostgreSQL schema (`customer_id UUID NOT NULL REFERENCES public.customers(user_id)`), guest visitors cannot submit an order without logging in or registering. If an unauthenticated user enters `/checkout`, they will be redirected to `/login?redirect=/checkout` with their cart preserved.

---

## Proposed Changes

### Task 1: Backend DTOs & Validation
Enhance `CreateOrderRequest.java` to accept additional frontend fields (`alternativePhone`, `paymentMethod`) and ensure strict validation annotations.

#### [MODIFY] `backend/src/main/java/com/varellion/store/order/dto/CreateOrderRequest.java`
- Add `alternativePhone` (optional Egyptian phone string).
- Add `paymentMethod` (defaults to `"CASH_ON_DELIVERY"`).
- Retain nested `CreateOrderItemRequest` with `@NotNull UUID productId` and `@Positive Integer quantity`.

---

### Task 2: Backend Repository Layer (Concurrency & Locking)
Add concurrency protection to avoid overselling when multiple customers check out concurrently.

#### [MODIFY] `backend/src/main/java/com/varellion/store/catalog/repository/ProductRepository.java`
- Add `@Lock(LockModeType.PESSIMISTIC_WRITE)` method:
```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("SELECT p FROM Product p WHERE p.productId = :productId")
Optional<Product> findByIdForUpdate(@Param("productId") UUID productId);
```

---

### Task 3: Backend OrderService (Transactional Creation & Inventory Reservation)
Implement `createOrder` method in `OrderService.java`.

#### [MODIFY] `backend/src/main/java/com/varellion/store/order/service/OrderService.java`
- Inject `ProductRepository` and `CartService`.
- Implement `public OrderResponseDto createOrder(String userEmail, CreateOrderRequest request)` annotated with `@Transactional`:
  1. **Resolve Customer:** Call `customerService.getOrCreateCustomerForUser(userEmail, request.getCustomerName())`.
  2. **Verify Stock with Row Lock:** For each item in `request.getItems()`, lock product via `productRepository.findByIdForUpdate(item.getProductId())`.
     - Check `isActive == true`.
     - Check available stock: `(stockQuantity - reservedQuantity) >= requestedQuantity`. If insufficient, throw `IllegalArgumentException` with descriptive Arabic message.
     - Increment `product.setReservedQuantity(product.getReservedQuantity() + requestedQuantity)`.
  3. **Calculate Financials Authoritatively:**
     - Sum item line totals: `unitPrice * quantity`.
     - Compute shipping fee:
       - Cairo / Giza: 50.00 EGP.
       - Alexandria / Delta / Canal: 70.00 EGP.
       - Upper Egypt / Frontier: 90.00 EGP.
       - If subtotal >= 2,500.00 EGP: shipping is 0.00 EGP (Free Shipping).
     - Compute `totalAmount = subtotal + shippingFee - discountTotal`.
  4. **Generate Order Number:**
     - Generate human-friendly format `VAR-YYYYMMDD-XXXX` and verify uniqueness.
  5. **Construct & Persist Order:**
     - Instantiate `Order` with `confirmationDeadline = OffsetDateTime.now().plusHours(24)`.
     - Attach `OrderItem` list with immutable snapshots (`unitPrice`, `unitCost`, `productNameAr`, `productNameEn`, `sku`, `lineTotal`).
     - Attach initial `OrderStatusHistory` entry (`PENDING_CUSTOMER_CONFIRMATION`, reason: `"تم تسجيل وتأكيد الطلب عبر المتجر"`).
     - Save via `orderRepository.save(order)`.
  6. **Clear Cart:**
     - Call `cartService.clearCart(userEmail)`.
  7. **Return DTO:** Return `mapToDto(order)`.

---

### Task 4: Backend REST Controller & Security Configuration

#### [MODIFY] `backend/src/main/java/com/varellion/store/order/controller/OrderController.java`
- Add `@PostMapping` endpoint:
```java
@PostMapping
public ResponseEntity<ApiResponse<OrderResponseDto>> createOrder(
        @AuthenticationPrincipal UserDetails userDetails,
        @Valid @RequestBody CreateOrderRequest request) {
    OrderResponseDto created = orderService.createOrder(userDetails.getUsername(), request);
    return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("تم تأكيد وتسجيل طلبك بنجاح", created));
}
```

---

### Task 5: Backend Automated Unit & Integration Tests

#### [MODIFY] `backend/src/test/java/com/varellion/store/order/service/OrderServiceTest.java`
- Add unit tests:
  - `createOrder_Success_COD`: Verifies correct calculations, reserved quantity increment, cart clearance, and `OrderResponseDto` return.
  - `createOrder_InsufficientStock_ThrowsException`: Verifies exception thrown and rollback when available stock is less than requested quantity.
  - `createOrder_InactiveProduct_ThrowsException`: Verifies rejection of inactive catalog items.

#### [MODIFY] `backend/src/test/java/com/varellion/store/order/controller/OrderControllerTest.java`
- Add controller slice tests:
  - `createOrder_Authenticated_Returns201`: Simulates valid authenticated customer request and verifies 201 Created.
  - `createOrder_Unauthenticated_Returns401`: Verifies that unauthorized requests are blocked.
  - `createOrder_InvalidPayload_Returns400`: Verifies validation error on blank customer phone or empty items list.

---

### Task 6: Frontend Auth Gate & Route Protection on `/checkout`

#### [MODIFY] `frontend/src/app/checkout/page.tsx`
- Integrate authentication check on mount:
  - If `!isLoading && !isAuthenticated`, redirect to `/login?redirect=/checkout`.
  - Display friendly loading state while checking authentication.

#### [MODIFY] `frontend/src/app/login/page.tsx`
- Ensure the `redirect` query parameter (e.g. `/checkout`) is strictly honored upon successful login so the customer is returned to their ready-to-submit checkout form.

---

### Task 7: Frontend OrdersService API Client & Real Order Submission

#### [MODIFY] `frontend/src/services/orders.ts`
- In `ordersService.createOrder`:
  - Call `await requestApi<ApiResponse<Order> | Order>('/orders', { method: 'POST', body: JSON.stringify(request) })`.
  - Safely unwrap data: `const order = (response as { data?: Order }).data ?? response;`.
  - Cache the real order in `sessionStorage.setItem(SESSION_ORDER_KEY, JSON.stringify(order))` for immediate consumption by `/checkout/success`.
  - Eliminate fake mock fallback in catch block; throw real error to display in UI banner.

---

### Task 8: Frontend Automated Tests & Build Fixes
- Fix named export in `frontend/src/app/track-order/page.tsx` (`normalizeEgyptianPhone`) so `npm run build` succeeds.
- Verify form validation and submission behavior in `frontend/src/components/checkout/__tests__/CheckoutForm.test.tsx` and `frontend/src/services/__tests__/orders.test.ts`.

---

## Verification Plan

### Automated Tests
1. **Backend Tests:**
   ```bash
   cd backend && mvn test
   ```
   *Expected:* All existing 89 tests + newly added tests pass (100% green).
2. **Frontend Tests:**
   ```bash
   cd frontend && npm test -- --run
   ```
   *Expected:* All Vitest test suites pass (27+ tests green).
3. **Frontend Production Build:**
   ```bash
   cd frontend && npm run build
   ```
   *Expected:* Clean compilation of all pages without type or build errors.

### Manual & Live End-to-End Verification
1. **Live Backend Submission via Curl:**
   - Authenticate with demo user credentials to obtain JWT.
   - Submit real order to `POST /api/orders` with JWT.
   - Verify HTTP 201 with `success: true`.
   - Verify order in Supabase DB (`public.orders`, `public.order_items`, `public.order_status_history`).
   - Verify `reserved_quantity` in `public.products` increased.
   - Verify cart in `public.carts` is empty.
   - Verify newly placed order immediately trackable via `GET /api/orders/track?orderNumber=...&phone=...`.
