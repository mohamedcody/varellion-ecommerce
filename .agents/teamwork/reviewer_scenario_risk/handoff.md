# Handoff Report: Architectural Scenario and Risk Analysis (COD Checkout Flow)

**Reviewer / Critic**: `reviewer_scenario_risk`  
**Timestamp**: 2026-11-04T11:55:00Z  
**Branch**: `feature/checkout-cod-flow` vs `dev`  
**Target Path**: `/home/mohamed-saad/Desktop/BRAND`  
**Verdict**: **REQUEST_CHANGES**

---

## 1. Observation

Direct observations from examining the codebase, database migrations, controllers, services, repositories, and React components:

### Scenario 1: Concurrency Handling for Stock Purchases
- **Pessimistic Locking Query**:
  - File: `backend/src/main/java/com/varellion/store/catalog/repository/ProductRepository.java` (lines 25–27):
    ```java
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.productId = :productId")
    Optional<Product> findByIdForUpdate(@Param("productId") UUID productId);
    ```
  - In PostgreSQL, this issues an exclusive row-level lock `SELECT ... FOR UPDATE` on `public.products`.
- **Deadlock Prevention via Deterministic Lock Ordering**:
  - File: `backend/src/main/java/com/varellion/store/order/service/OrderService.java` (lines 154–158):
    ```java
    List<CreateOrderRequest.CreateOrderItemRequest> sortedItems = request.getItems().stream()
            .sorted(Comparator.comparing(CreateOrderRequest.CreateOrderItemRequest::getProductId))
            .toList();
    ```
  - Products are always acquired in ascending UUID order across concurrent transactions, preventing AB-BA deadlocks.
- **Duplicate Product Check**:
  - File: `backend/src/main/java/com/varellion/store/order/service/OrderService.java` (lines 142–149):
    Duplicate product IDs within a single order request are explicitly validated and rejected with `IllegalArgumentException("لا يمكن تكرار نفس المنتج في بنود الطلب الواحد")`.
- **In-Memory Stock Calculation**:
  - File: `backend/src/main/java/com/varellion/store/order/service/OrderService.java` (lines 170–179):
    ```java
    int availableStock = (product.getStockQuantity() != null ? product.getStockQuantity() : 0)
            - (product.getReservedQuantity() != null ? product.getReservedQuantity() : 0);

    if (availableStock < itemReq.getQuantity()) {
        throw new IllegalArgumentException("الكمية المطلوبة من المنتج '" + product.getNameAr() + "' غير متوفرة في المخزون (المتبقي: " + Math.max(0, availableStock) + ")");
    }

    product.setReservedQuantity((product.getReservedQuantity() != null ? product.getReservedQuantity() : 0) + itemReq.getQuantity());
    productRepository.save(product);
    ```
- **Database Schema Constraints**:
  - File: `backend/src/main/resources/db/migration/V3__create_product_inventory_and_movements.sql` (lines 10–25):
    - `stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0)`
    - `reserved_quantity INTEGER NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0)`
    - `CONSTRAINT chk_stock_available CHECK (reserved_quantity <= stock_quantity)`
- **Inventory Reservation Release Orphan**:
  - File: `backend/src/main/java/com/varellion/store/order/service/OrderReservationService.java` (lines 34–40):
    Defines `isReservationExpired(Order order)`.
  - Grep search confirms `isReservationExpired` is **never invoked** anywhere in the application. There is **no scheduled background job or task** releasing expired reservations for unconfirmed orders.

---

### Scenario 2: Rollback Behavior During Failed Checkout
- **Transactional Boundary**:
  - File: `backend/src/main/java/com/varellion/store/order/service/OrderService.java` (line 136):
    ```java
    @Transactional
    public OrderResponseDto createOrder(String userEmail, CreateOrderRequest request)
    ```
  - Uses standard Spring `@Transactional` with default propagation `REQUIRED` and rollback policy on all `RuntimeException` and `Error`.
- **Exception Tracing**:
  - Insufficient stock, inactive product, missing product, or illegal arguments throw unchecked exceptions (`IllegalArgumentException`, `ResourceNotFoundException`), rolling back the entire database transaction.
  - In-memory modifications to `reservedQuantity` on preceding line items in multi-item orders are never committed to the database.
- **Cart Clearance Try/Catch within Active Transaction**:
  - File: `backend/src/main/java/com/varellion/store/order/service/OrderService.java` (lines 257–263):
    ```java
    try {
        cartService.clearCart(userEmail);
    } catch (Exception ex) {
        log.warn("[OrderService] Failed to clear cart after order {}: {}", orderNumber, ex.getMessage());
    }
    ```
  - `cartService.clearCart` operates within the same database transaction. While catching general `Exception` prevents application-level error escalation, if a persistence exception occurs within the Hibernate session, the transaction may be marked `rollback-only`, triggering an `UnexpectedRollbackException` on commit.

---

### Scenario 3: Duplicate Request Handling
- **Frontend Button State Debouncing**:
  - File: `frontend/src/app/checkout/page.tsx` (lines 25, 64, 127):
    `const [isSubmitting, setIsSubmitting] = useState(false);` is set to `true` on submission and `false` on catch.
  - File: `frontend/src/components/checkout/CheckoutForm.tsx` (lines 206, 228, 249, 277, 291, 315, 363, 381, 392–415):
    All form inputs, selects, textareas, and the submit `<Button type="submit" disabled={isSubmitting}>` are disabled during submission, displaying a spinner `<Loader2 className="animate-spin" />` and label "جاري معالجة طلبك بأمان...".
- **Backend Idempotency and Deduplication Gap**:
  - File: `backend/src/main/java/com/varellion/store/order/dto/CreateOrderRequest.java`:
    No `idempotencyKey`, `requestId`, or `token` field exists in the payload.
  - File: `backend/src/main/java/com/varellion/store/order/controller/OrderController.java` (lines 30–38):
    Does not inspect any `Idempotency-Key` or `X-Idempotency-Key` HTTP header.
  - File: `backend/src/main/java/com/varellion/store/order/service/OrderService.java` (lines 272–283):
    Generates a new random order number (`VAR-YYYYMMDD-XXXX`) on every invocation without verifying whether an identical pending order was submitted seconds earlier by the same customer.
  - File: `backend/src/main/java/com/varellion/store/security/filter/RateLimitFilter.java` (lines 43–52):
    Endpoint `/api/orders` (order creation) is **excluded from rate limiting**. Rate limiting is only applied to `/api/auth`, `/api/orders/lookup`, `/api/orders/track`, `/api/upload`, and `/api/ai`.

---

### Scenario 4: Cart Clearance Behavior
- **Backend Clearance**:
  - File: `backend/src/main/java/com/varellion/store/order/service/OrderService.java` (lines 257–263):
    `cartService.clearCart(userEmail)` is invoked after `orderRepository.save(order)`. It empties `public.cart_items` for the user in the database.
- **Frontend Clearance**:
  - File: `frontend/src/app/checkout/page.tsx` (lines 119–121):
    ```typescript
    // Cash on Delivery (COD): Clear cart and navigate directly to success screen
    clearCart();
    router.push(`/checkout/success?orderNumber=${encodeURIComponent(created.orderNumber)}`);
    ```
    Executed strictly **after** `await ordersService.createOrder(...)` resolves successfully.
  - File: `frontend/src/context/CartContext.tsx` (lines 314–331):
    ```typescript
    const clearCart = useCallback(() => {
      const previousItems = itemsRef.current;
      setItems([]);

      if (isAuthenticated) {
        cartService.clearCart().catch((err) => {
          console.error('[CartContext] Failed to clear cart on backend:', err);
          setItems(previousItems);
          setToastMessage('فشل تفريغ السلة، يرجى المحاولة مرة أخرى');
        });
      } else {
        try {
          localStorage.setItem(CART_STORAGE_KEY, JSON.stringify([]));
        } catch (err) {
          console.warn('[CartContext] Failed to clear local storage:', err);
        }
      }
    }, [isAuthenticated]);
    ```
  - In `CartContext.clearCart()`, a secondary asynchronous call `cartService.clearCart()` is made to the backend. If that call is aborted or fails during page navigation, `catch` rolls back React state by restoring `setItems(previousItems)`.
- **Failure Isolation**:
  - If `ordersService.createOrder` fails on `/checkout`, the function catches the error, sets `errorMessage`, and halts. `clearCart()` is **never reached**, leaving the user's cart items completely intact in React state and in the database.

---

### Scenario 5: Codebase Health and Verification Blocker
- **Working Tree State (`git status`)**:
  - Working tree currently has an uncommitted file deletion:
    `deleted: backend/src/main/java/com/varellion/store/order/dto/CreateOrderRequest.java`
- **Compiler Failure (`mvn -f backend/pom.xml test`)**:
  - Result: **Compilation failure with 4 errors** (`cannot find symbol: class CreateOrderRequest`). Zero backend tests can execute.

---

## 2. Logic Chain

1. **Concurrency and Stock Integrity**:
   - `OrderService.createOrder` executes in a Spring `@Transactional` boundary.
   - Products are sorted by `productId` before locking to guarantee a deterministic locking order and prevent database deadlocks.
   - Calling `productRepository.findByIdForUpdate(productId)` issues `SELECT ... FOR UPDATE` in PostgreSQL, acquiring exclusive row-level locks on the affected product rows.
   - When User A and User B concurrently attempt to buy the last unit of Product P:
     - User A's transaction acquires the lock. User B's transaction blocks.
     - User A validates `availableStock` (1 >= 1), increments `reservedQuantity` to 1, creates the order, and commits.
     - User B's transaction unblocks, reads the freshly committed row where `reserved_quantity = 1` and `stock_quantity = 1`, evaluates `availableStock` as 0, fails the check `0 < 1`, and throws `IllegalArgumentException`.
     - User B's transaction rolls back completely. User B receives an HTTP 400 Bad Request error.
   - At the database level, `chk_stock_available CHECK (reserved_quantity <= stock_quantity)` guarantees that reserved stock cannot exceed physical stock, and `CHECK (stock_quantity >= 0)` guarantees stock can never become negative.
   - **Conclusion on Concurrency**: High-concurrency stock purchases are safe from race conditions, deadlocks, and negative stock.

2. **Rollback Behavior**:
   - Any failure during `createOrder` (e.g. stock shortfall on item 2 of 3, inactive product, database constraint error) throws a `RuntimeException`.
   - Spring's transactional proxy catches the exception and issues a database `ROLLBACK`.
   - In PostgreSQL, row modifications to `reservedQuantity` made earlier in the loop are discarded.
   - No orphan `public.orders`, `public.order_items`, or `public.order_status_history` rows are committed.
   - **Conclusion on Rollback**: Atomic rollback is guaranteed. No partial order or reserved inventory leak occurs during checkout failures.

3. **Duplicate Requests & Missing Idempotency**:
   - Frontend provides basic UI debouncing (`isSubmitting` flag disables the button and inputs).
   - However, the backend exposes `POST /api/orders` without any idempotency token, deduplication filter, or recent submission check.
   - If two network requests reach the backend (via duplicate tab, client network retry, proxy replay, or automated script), both requests enter `createOrder` sequentially.
   - If stock is available, both requests succeed, generate different order numbers (`VAR-YYYYMMDD-XXXX`), reserve inventory twice, and create two distinct orders for the customer.
   - Furthermore, `POST /api/orders` is excluded from `RateLimitFilter.java`.
   - **Conclusion on Duplicate Requests**: System is vulnerable to duplicate order creation and double inventory reservations under duplicate network traffic.

4. **Cart Clearance Behavior**:
   - For Cash-on-Delivery (COD), cart clearance is triggered both on the server (inside `OrderService.createOrder`) and on the client (inside `CheckoutContent.handleOrderSubmission` after `createOrder` resolves).
   - If order creation fails, `clearCart()` is not called and the cart remains intact.
   - If order creation succeeds, the database cart is cleared, and React state is cleared.
   - On page refresh or return, the cart remains empty because the backend cart was emptied.
   - However, an adversarial failure mode exists in `CartContext.clearCart()`: because it makes an optimistic secondary call to `cartService.clearCart()` and registers a `.catch` handler that executes `setItems(previousItems)`, an aborted network request during the `router.push` transition can trigger the catch block and incorrectly re-populate the cart in React memory.
   - **Conclusion on Cart Clearance**: Cart clearance ordering is safe (clears only on success), but the optimistic error rollback in `CartContext` should be hardened against unmounts/navigation.

5. **Inventory Lifecycle Leak**:
   - Placing an order increments `reserved_quantity` and sets `confirmation_deadline` to 24 hours.
   - `OrderReservationService` provides `isReservationExpired()`, but there is **no scheduled task or cron job** executing expiration or decrementing `reserved_quantity` for abandoned/unconfirmed orders.
   - Over time, unconfirmed COD orders will permanently tie up inventory until products appear sold out.

---

## 3. Caveats

1. **Lock Wait Timeout**:
   - `findByIdForUpdate` does not specify `javax.persistence.lock.timeout`. Under intense database load or extreme contention on a single product, threads will wait until connection/statement timeout.
2. **Online Payment (Paymob) Cart Asymmetry**:
   - When payment method is `CARD`, the frontend redirects to Paymob before calling `clearCart()`. The backend cart is cleared, but if the customer abandons the Paymob portal and clicks the browser back button, the local React cart may still contain items until refreshed.
3. **Backend Test Suite Unverified Live**:
   - Because `CreateOrderRequest.java` was deleted in the working tree, the backend test suite could not be executed live during this review turn. Analysis of backend behavior was performed directly against the authoritative source code, JPA entities, and database migration scripts.

---

## 4. Conclusion

### Findings Matrix

| Finding ID | Severity | Scenario | Description | Impact |
|---|---|---|---|---|
| **F-01** | **CRITICAL (Blocker)** | Working Tree / Build | `CreateOrderRequest.java` is missing/deleted from working directory. | Backend fails compilation with 4 errors (`cannot find symbol: class CreateOrderRequest`). JUnit tests cannot run. |
| **F-02** | **CRITICAL (Blocker)** | Concurrency & Lifecycle | Missing background scheduler for order reservation expiration. | Unconfirmed orders will never release `reserved_quantity`, causing cumulative permanent inventory leakage. |
| **F-03** | **HIGH** | Duplicate Handling | No backend idempotency key or deduplication on `POST /api/orders`. | Duplicate network requests / retries create duplicate orders and double-decrement inventory. |
| **F-04** | **MEDIUM** | Duplicate Handling | `POST /api/orders` is excluded from `RateLimitFilter.java`. | No IP-based rate limiting on order creation. |
| **F-05** | **MEDIUM** | Cart Clearance | `CartContext.clearCart()` optimistic rollback restores items if secondary backend call fails during router navigation. | Transient cart reappearance in UI drawer upon successful order completion if navigation aborts the fetch. |
| **F-06** | **LOW** | Concurrency | No explicit lock timeout configured on `findByIdForUpdate`. | Under heavy lock contention, requests queue until database connection timeout. |

### PR Determination
- **VERDICT**: **REQUEST_CHANGES**
- **SAFE TO PUSH / OPEN PR**: **NO**.
  The branch cannot be pushed or merged until:
  1. `backend/src/main/java/com/varellion/store/order/dto/CreateOrderRequest.java` is restored and backend tests compile and pass cleanly (`mvn -f backend/pom.xml test`).
  2. A scheduled expiration job is implemented (or cron endpoint) to release expired inventory reservations via `OrderReservationService`.
  3. Backend idempotency or deduplication protection is implemented for `POST /api/orders`.

---

## 5. Verification Method

To independently verify these observations and conclusions:

1. **Verify Backend Compilation Blocker**:
   ```bash
   mvn -f backend/pom.xml test
   ```
   *Expected Result*: Failure with `cannot find symbol: class CreateOrderRequest`.

2. **Verify Database Check Constraints**:
   Inspect `backend/src/main/resources/db/migration/V3__create_product_inventory_and_movements.sql`:
   Lines 22–24: `CONSTRAINT chk_stock_available CHECK (reserved_quantity <= stock_quantity)`
   Lines 13–14: `stock_quantity >= 0`, `reserved_quantity >= 0`.

3. **Verify Lock Ordering & Deadlock Prevention**:
   Inspect `backend/src/main/java/com/varellion/store/order/service/OrderService.java`:
   Lines 154–157: `items.stream().sorted(Comparator.comparing(CreateOrderItemRequest::getProductId))`.

4. **Verify Missing Idempotency Key**:
   Inspect `backend/src/main/java/com/varellion/store/order/dto/CreateOrderRequest.java` and `OrderController.java`:
   Confirm absence of `idempotencyKey` and absence of `Idempotency-Key` header checking.

5. **Verify Orphaned Reservation Service**:
   Run grep search across `backend/src/main/java`:
   `grep -rn "isReservationExpired" backend/src/main/java`
   Confirm it is only defined in `OrderReservationService.java` and never called by any scheduler or service.
