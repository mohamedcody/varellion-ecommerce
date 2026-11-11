# Deep Root-Cause Analysis: Frontend & Client Architecture (Issues 1, 4, 5)

**Investigator:** Explorer 1 Gen 2 (Frontend & Client Architecture Explorer)  
**Date:** 2026-10-31  
**Working Directory:** `/home/mohamed-saad/Desktop/BRAND/.agents/teamwork/explorer_1_gen2/`  
**Target Delivery:** `/home/mohamed-saad/Desktop/BRAND/.agents/teamwork/explorer_1_gen2/analysis.md`  

---

## 1. Skill Discovery and Selection Report (R1 Compliance)

In accordance with Requirement R1, repository-level and global Agent Skills have been inspected. The complete instructions of each selected skill were reviewed to ensure zero hallucination and strict adherence to established methodologies.

| Issue | Selected Skill | Skill Path | Selection Rationale | Guiding References |
| :--- | :--- | :--- | :--- | :--- |
| **Issue 1: Catalog Filtering Mismatch** | `awesome-bug-fix` (Primary) & `awesome-api-design` (Supporting) | `/home/mohamed-saad/Desktop/BRAND/.agents/skills/awesome-bug-fix/SKILL.md`<br>`/home/mohamed-saad/Desktop/BRAND/.agents/skills/awesome-api-design/SKILL.md` | `awesome-bug-fix` enforces systematic root-cause tracing across client-server seams before proposing fixes. `awesome-api-design` governs query param alignment (`category`, `q`, `sort`, `page`, `limit`) across frontend URL state, service layer, and Spring Boot REST controller. | `docs/product-requirements.md` Sec 3.3; `ProductControllerTest.java:83-98`; `services/api.ts:328-354` |
| **Issue 4: CartContext Concurrency Race Condition** | `awesome-bug-fix` (Primary) & `awesome-performance-audit` (Supporting) | `/home/mohamed-saad/Desktop/BRAND/.agents/skills/awesome-bug-fix/SKILL.md`<br>`/home/mohamed-saad/Desktop/BRAND/.agents/skills/awesome-performance-audit/SKILL.md` | `awesome-bug-fix` diagnoses asynchronous race conditions, optimistic rollbacks, and state reconciliation gaps. `awesome-performance-audit` provides patterns for async request queueing, mutex serialization, and debouncing. | `CartContext.tsx:165-279`; `CartService.java:51-88`; `CartContext.test.tsx` |
| **Issue 5: API Timeout AbortSignal Behavior** | `awesome-bug-fix` (Primary) & `systematic-debugging` (Supporting) | `/home/mohamed-saad/Desktop/BRAND/.agents/skills/awesome-bug-fix/SKILL.md`<br>`/home/mohamed-saad/Desktop/BRAND/.agents/skills/systematic-debugging/SKILL.md` | Rigorous isolation of signal composition bug, lifecycle tracing of `AbortController`, timer cleanups, and differentiating user aborts from genuine network timeouts. | `services/api.ts:102-124`; `api.test.ts:1-127`; WHATWG Fetch & DOM AbortSignal Spec |

---

## 2. Issue 1: Backend-Driven Catalog Filtering Mismatch

### 2.1 Overview & Classification
- **Issue Classification:** **CONFIRMED DEFECT**
- **Severity:** High (Catalog Incompleteness, Silent Data Loss, Broken Deep Linking, Unresponsive Filters)
- **Confidence Level:** 100% (Direct static analysis, cross-layer code tracing, contract verification)
- **Primary Affected Files:**
  - `frontend/src/app/products/page.tsx` (Lines 18–63, 65–84, 114–153)
  - `frontend/src/services/api.ts` (Lines 275–354)
- **Backend Reference Files:**
  - `backend/src/main/java/com/varellion/store/catalog/controller/ProductController.java` (Lines 26–36)
  - `backend/src/main/java/com/varellion/store/catalog/service/ProductService.java` (Lines 35–60, 102–112)
  - `backend/src/main/java/com/varellion/store/catalog/repository/ProductRepository.java` (Lines 29–57)
  - `backend/src/test/java/com/varellion/store/catalog/ProductControllerTest.java` (Lines 73–98)

---

### 2.2 Complete 9-Stage Data Flow Trace
Tracing data flow from UI Component down to the Database and back to UI Rendering:

```
[1. UI Component: ProductsContent]
      │
      ▼
[2. State: products, selectedCategory, searchQuery, sortBy, isLoading]
      │
      ▼
[3. Hooks: useSearchParams, useEffect(loadData, []), useMemo(filteredProducts)]
      │
      ▼
[4. Service Layer: catalogService.getProducts() called with NO ARGS]
      │
      ▼
[5. API Client: requestApi('/products') -> buildEndpointUrl -> fetch]
      │
      ▼
[6. HTTP Request: GET /api/products (NO QUERY PARAMS)]
      │
      ▼
[7. Backend: ProductController -> ProductService -> ProductRepository.findFilteredProducts]
      │   (Receives null params -> falls back to page=0, limit=20 default)
      ▼
[8. State Update: setProducts(prodsRes.products) receives ONLY 20 items]
      │
      ▼
[9. UI Rendering: useMemo filters strictly across the 20 items in memory]
```

1. **UI Component (`frontend/src/app/products/page.tsx:13-302`):**
   - `ProductsContent` renders the category filter pills (all, watches, leather, accessories), quick search input, sort selector, and `ProductGrid`.
2. **State (`page.tsx:23-30`):**
   - `const [products, setProducts] = useState<Product[]>([]);`
   - `const [categories, setCategories] = useState<Category[]>([]);`
   - `const [selectedCategory, setSelectedCategory] = useState<string>(paramCategory);`
   - `const [searchQuery, setSearchQuery] = useState<string>(paramSearch);`
   - `const [isFeaturedOnly, setIsFeaturedOnly] = useState<boolean>(paramFeatured);`
   - `const [sortBy, setSortBy] = useState<'bestseller' | 'price-asc' | 'price-desc'>('bestseller');`
   - `const [isLoading, setIsLoading] = useState<boolean>(true);`
3. **Hooks (`page.tsx:32-62, 114-152`):**
   - URL parameter synchronization `useEffect` (lines 32–42) updates internal state when URL changes.
   - Initial load `useEffect` (lines 45–62):
     ```typescript
     useEffect(() => {
       async function loadData() {
         setIsLoading(true);
         try {
           const [cats, prodsRes] = await Promise.all([
             catalogService.getCategories(),
             catalogService.getProducts(), // <--- INVOKED WITH ZERO ARGUMENTS
           ]);
           setCategories(cats);
           setProducts(prodsRes.products);
         } catch (err) {
           console.error('Failed to load catalog data:', err);
         } finally {
           setIsLoading(false);
         }
       }
       loadData();
     }, []); // <--- EMPTY DEPENDENCY ARRAY: NEVER RUNS AGAIN
     ```
   - Client-side filtering `useMemo` (lines 114–152): re-filters `products` in memory whenever `selectedCategory`, `searchQuery`, `isFeaturedOnly`, or `sortBy` change.
4. **Service Layer (`frontend/src/services/api.ts:275-354`):**
   - `catalogService.getProducts(params?: ProductFilterParams)` is fully capable of constructing backend query parameters:
     ```typescript
     const query = new URLSearchParams();
     if (params?.categorySlug && params.categorySlug !== 'all') query.append('category', params.categorySlug);
     if (params?.searchQuery) query.append('q', params.searchQuery.trim());
     if (params?.sortBy) query.append('sort', params.sortBy);
     if (params?.page !== undefined) query.append('page', params.page.toString());
     if (params?.limit !== undefined) query.append('limit', params.limit.toString());
     ```
   - Because `page.tsx` called `catalogService.getProducts()` without arguments, `params` is `undefined`, and `query.toString()` is empty `""`.
5. **API Client (`frontend/src/services/api.ts:89-191`):**
   - `requestApi('/products')` resolves URL to `http://localhost:8080/api/products` and dispatches `fetch(url, ...)`.
6. **HTTP Request:**
   - Client sends HTTP: `GET /api/products` with no query parameters.
7. **Backend Processing (`ProductController.java:26-36`, `ProductService.java:35-60`, `ProductRepository.java:29-57`):**
   - Controller handles:
     ```java
     @GetMapping
     public ResponseEntity<ApiResponse<PagedProductsResponse>> getProducts(
             @RequestParam(required = false) String category,
             @RequestParam(required = false, name = "q") String search,
             @RequestParam(required = false) String sort,
             @RequestParam(required = false, defaultValue = "0") int page,
             @RequestParam(required = false, defaultValue = "20") int limit
     )
     ```
   - When no params are passed, Spring defaults `page=0`, `limit=20`.
   - `ProductService.getProducts` creates `PageRequest.of(0, 20, Sort.by(DESC, "createdAt"))`.
   - `ProductRepository.findFilteredProducts(null, null, pageable)` executes SQL with `LIMIT 20 OFFSET 0`.
   - Backend returns `PagedProductsResponse` containing only the first 20 products.
8. **State Update:**
   - In `page.tsx:54`: `setProducts(prodsRes.products);`
   - Only the 20 products from page 0 are held in React state.
9. **UI Rendering:**
   - User clicks category pill (e.g. "محافظ جلد طبيعي") or types in search input.
   - `handleCategorySelect` / `handleSearchChange` updates state and pushes URL with `updateUrl`.
   - **NO network request is triggered.**
   - `filteredProducts` executes client-side filter over the 20 products in memory.
   - If products belonging to that category or matching the search query exist on pages 2, 3, etc. on the backend, they are NOT in memory.
   - The UI renders `ProductGrid` with 0 items: *"لم نجد أي قطع مطابقة"* (False empty state).

---

### 2.3 Detailed Defect Analysis & Root Causes

1. **Root Cause 1: Architectural Disconnect (Client-Side Prototype vs Backend-Driven Design):**
   `frontend/src/app/products/page.tsx` was implemented as a client-side filter prototype over an initial unparameterized fetch. The backend was explicitly designed with SQL-level filtering (`ProductRepository.java:29-57`), dynamic sorting (`ProductService.java:102-112`), and pagination (`PagedProductsResponse.java`). The frontend service layer (`frontend/src/services/api.ts:327-354`) was already wired to pass these query parameters, but the page component bypassed it entirely.
2. **Root Cause 2: Hardcoded One-Time Lifecycle Hook (`useEffect(..., [])`):**
   `loadData` runs only once on mount. When user changes category, search query, or sort order, `router.push(targetUrl, { scroll: false })` updates the URL, but no re-fetch is triggered.
3. **Root Cause 3: Query Parameter Key Inconsistency (`search` vs `q`):**
   In `frontend/src/app/products/page.tsx:75`:
   `params.set('search', search.trim());`
   However, both the backend `ProductController.java:29` (`@RequestParam(name = "q") String search`) and `catalogService.getProducts` (`query.append('q', params.searchQuery)`) use `q`.
   While `page.tsx:20` reads both (`searchParams.get('search') || searchParams.get('q')`), URL sharing and deep links create confusing parameter drift.
4. **Root Cause 4: Complete Absence of Catalog Pagination:**
   The backend returns `totalElements`, `totalPages`, `currentPage`, `pageSize`. The frontend service exposes `{ products, total }`. The page component drops `total` and provides zero pagination controls or infinite scrolling, limiting the entire store experience to at most 20 products.

---

### 2.4 Reproduction Steps
1. Seed the database with 30 products across 3 categories (e.g., 10 Watches, 10 Wallets, 10 Accessories).
2. Ensure the 10 Accessories are sorted towards the end (e.g., created earlier, so they appear on page 1 [indices 21–30]).
3. Navigate to `http://localhost:3000/products`.
4. Observe network tab: only 1 request `GET /api/products` returning 20 products.
5. Click on the "إكسسوارات رجالية" (Accessories) category pill.
6. Observe: Browser URL updates to `/products?category=accessories`.
7. Observe Network tab: **Zero network requests dispatched.**
8. Observe UI: Displays "لم نجد أي قطع مطابقة" (0 products found), even though 10 accessories exist in the database!

---

### 2.5 Proposed Solution & Remediation Plan
1. **Refactor `ProductsContent` in `frontend/src/app/products/page.tsx`:**
   - Bind catalog data fetching to URL search params (`category`, `q`, `sort`, `page`).
   - Use `useSearchParams()` as the single source of truth.
   - When URL params change, trigger `catalogService.getProducts({ categorySlug, searchQuery, sortBy, page, limit })`.
   - Update `updateUrl` to use `q` instead of `search`.
   - Store and display pagination state (`currentPage`, `totalPages`, `total`).
   - Retain client-side `isFeaturedOnly` filtering if not supported by backend, or add `isFeatured` param to backend.
2. **Debounce Search Input:**
   - Add a 300ms debounce to the search input before updating the URL / triggering the backend query.
3. **Required Tests:**
   - Vitest unit tests in `frontend/src/app/products/__tests__/page.test.tsx` verifying:
     - URL param change triggers `catalogService.getProducts` with correct arguments (`category`, `q`, `sort`).
     - Search input debounces and calls backend with `q=...`.
     - Pagination controls request subsequent pages (`page=1`).

---

## 3. Issue 4: CartContext Concurrency Race Condition During Rapid Additions

### 3.1 Overview & Classification
- **Issue Classification:** **CONFIRMED DEFECT**
- **Severity:** High (Data Loss, Cart Corruption, Broken Optimistic Rollbacks, UI Regressions)
- **Confidence Level:** 100% (Direct static analysis, concurrency lifecycle tracing, state mutation inspection)
- **Primary Affected File:**
  - `frontend/src/context/CartContext.tsx` (Lines 35–37, 165–218, 224–279, 284–309)
- **Backend Reference File:**
  - `backend/src/main/java/com/varellion/store/cart/service/CartService.java` (Lines 51–88)

---

### 3.2 Deep Concurrency & Lifecycle Breakdown

#### A. Request Ordering & Asynchronous Dispatch
In `frontend/src/context/CartContext.tsx` lines 203–216:
```typescript
if (isAuthenticated) {
  cartService
    .addItem(product.productId, quantity)
    .then((backendCart) => {
      setItems(backendCart.items.map(mapBackendItemToCartItem));
    })
    .catch((err) => {
      console.error('[CartContext] Failed to add item to backend cart:', err);
      setItems(previousItems);
      setToastMessage('حدث خطأ أثناء إضافة المنتج إلى السلة، يرجى المحاولة مرة أخرى');
    });
}
```
- There is **no mutex, no action queue, and no request serialization**.
- When a user rapidly adds multiple products (e.g., clicking "Add to Cart" on Product 1 at $t=0$, then Product 2 at $t=50\text{ms}$), two concurrent HTTP requests (`POST /api/cart/items`) are dispatched simultaneously into the network.

#### B. Response Ordering & Blind Full-State Overwrite
- HTTP requests over TCP/IP and multithreaded backend servers do not guarantee First-In-First-Out (FIFO) completion.
- Suppose Request 1 (Product 1) encounters 300ms network/DB latency, while Request 2 (Product 2) finishes in 100ms.
- **Timeline:**
  1. $t=0\text{ms}$: Request 1 dispatched (`addItem(Prod1)`). Optimistic state: `[Prod1]`.
  2. $t=50\text{ms}$: Request 2 dispatched (`addItem(Prod2)`). Optimistic state: `[Prod2, Prod1]`.
  3. $t=150\text{ms}$: Request 2 resolves on client. `backendCart` has `[Prod2, Prod1]` (or `[Prod2]`). `setItems` sets state to Request 2's cart.
  4. $t=300\text{ms}$: Request 1 resolves on client.
     Request 1's callback executes:
     `setItems(backendCart.items.map(mapBackendItemToCartItem));`
     **Because Request 1 was processed on the backend before Request 2 was recorded, Request 1's `backendCart` contains ONLY `[Prod1]`!**
  5. **State Overwrite:** `setItems` blindly replaces the React `items` array with `[Prod1]`.
  6. **Outcome:** Product 2 completely vanishes from the user's cart in the UI!

#### C. Catastrophic Error Rollback Corruption
Look at lines 169 and 212:
```typescript
const previousItems = itemsRef.current;
// ...
.catch((err) => {
  setItems(previousItems);
});
```
- `previousItems` is captured from `itemsRef.current` synchronously at the exact millisecond `addItem` is called.
- If Request 1 is fired at $t=0$, `previousItems` is `[]` (empty cart).
- User immediately fires Request 2 at $t=50\text{ms}$, adding Product 2 (optimistic cart now has `[Prod2, Prod1]`).
- If Request 1 fails (e.g. temporary network blip or 500 error):
  Request 1's catch handler fires:
  `setItems(previousItems);` // Sets cart to `[]`!
- **Outcome:** Request 1's rollback **wipes out Request 2's optimistic update**, even if Request 2 is currently succeeding or already succeeded!

#### D. Temporary ID Collision & Stale Identifier Trap
In `addItem` (lines 170, 191):
```typescript
const lineItemId = product.productId;
// ...
const newItem: CartItem = {
  cartItemId: lineItemId, // Assigning productId as cartItemId!
  productId: product.productId,
  product,
  quantity: initialQuantity,
  addedAt: new Date().toISOString(),
};
```
- The optimistic item is assigned `cartItemId = product.productId`.
- However, in the database (`cart_items`), `cart_item_id` is an independent primary key UUID generated by the backend (`CartItem.java:UUID cartItemId`).
- If a user rapidly clicks "Add to Cart" and then immediately clicks `updateQuantity` or `removeItem` within the 200–500ms network roundtrip window:
  `targetItem.cartItemId` will be `product.productId` instead of `cart_item_id`.
  `cartService.updateQuantity(targetItem.cartItemId, ...)` sends `PUT /api/cart/items/{productId}` instead of `PUT /api/cart/items/{cartItemId}`.
  The backend will return HTTP 404 (`ResourceNotFoundException`), triggering a failure cascade!

---

### 3.3 Reproduction Steps
1. Log in as an authenticated customer (`user@varellion.com`).
2. Open the browser DevTools Network tab and set throttling to "Fast 3G" or simulate 200ms latency.
3. Navigate to `/products`.
4. Rapidly click "Add to Cart" on Product A, then immediately click "Add to Cart" on Product B (within 100ms).
5. Alternatively, mock `cartService.addItem` in Vitest:
   - Call 1 (`addItem(ProdA)`) resolves in 400ms returning `{ items: [ProdA] }`.
   - Call 2 (`addItem(ProdB)`) resolves in 150ms returning `{ items: [ProdA, ProdB] }`.
6. Observe:
   - Call 2 finishes first, setting cart to `[ProdA, ProdB]`.
   - Call 1 finishes second, setting cart to `[ProdA]`.
   - Result: Product B disappears from the cart drawer.

---

### 3.4 Proposed Solution & Remediation Plan
1. **Asynchronous Request Queue / Mutex Pattern:**
   Implement a lightweight sequential promise queue (FIFO Action Queue) in `CartContext`:
   ```typescript
   const cartActionQueue = useRef<Promise<void>>(Promise.resolve());

   const enqueueCartAction = (action: () => Promise<void>) => {
     cartActionQueue.current = cartActionQueue.current
       .then(() => action())
       .catch((err) => console.error('[CartQueue] Error executing action:', err));
     return cartActionQueue.current;
   };
   ```
2. **State Reconciliation Instead of Blind Overwrite:**
   Instead of replacing `items` with `backendCart.items` wholesale, reconcile items by matching `productId` and merging quantities, or track request sequence versions (`requestSeqRef`):
   ```typescript
   const latestSeqRef = useRef(0);

   const addItem = (product: Product, quantity = 1) => {
     const seq = ++latestSeqRef.current;
     // ...
     cartService.addItem(product.productId, quantity).then((backendCart) => {
       // Only apply full state update if this is still the freshest response
       if (seq === latestSeqRef.current) {
         setItems(backendCart.items.map(mapBackendItemToCartItem));
       }
     });
   };
   ```
3. **Item-Specific Optimistic Rollback:**
   Instead of rolling back the entire array to `previousItems`, roll back *only the specific product item* that failed:
   ```typescript
   catch (err) {
     setItems((currentItems) => {
       // Revert only the specific item modification
       return currentItems.filter((i) => i.productId !== product.productId);
     });
   }
   ```
4. **Optimistic Temporary ID Prefixing:**
   Tag optimistic IDs (e.g. `temp-${product.productId}`) and disable quantity stepper / delete buttons for that item until backend returns real `cartItemId` (or handle mapping transparently).
5. **Debounce Quantity Steppers:**
   Add a 300ms debounce on quantity increment/decrement buttons to coalesce rapid user clicks into a single backend `updateQuantity` call.

---

## 4. Issue 5: API Timeout Behavior When Custom AbortSignal is Supplied

### 4.1 Overview & Classification
- **Issue Classification:** **CONFIRMED DEFECT**
- **Severity:** Medium-to-High (Indefinite Network Hangs, Spurious HTTP 408 Toasts on User Navigation)
- **Confidence Level:** 100% (Direct static analysis, WHATWG Fetch Specification compliance verification)
- **Primary Affected File:**
  - `frontend/src/services/api.ts` (Lines 102–124)
- **Secondary Reference:**
  - Mentioned as `api.ts:105` or `frontend/src/lib/api.ts:105` in request prompt. (Verified: file is located at `frontend/src/services/api.ts`).

---

### 4.2 Code Inspection & Mechanism Analysis
Inspecting lines 102–124 of `frontend/src/services/api.ts`:
```typescript
102:   // Network timeout safety (10 seconds timeout fallback)
103:   const controller = new AbortController();
104:   const timeoutId = setTimeout(() => controller.abort(), 10000);
105:   const signal = options?.signal || controller.signal;
106: 
107:   let res: Response;
108:   try {
109:     res = await fetch(url, {
110:       credentials: 'include',
111:       headers,
112:       ...options,
113:       signal,
114:     });
115:   } catch (err: unknown) {
116:     clearTimeout(timeoutId);
117:     if (err instanceof Error && err.name === 'AbortError') {
118:       throw new ApiError('Request timeout: Server took too long to respond', 408);
119:     }
120:     throw err;
121:   } finally {
122:     clearTimeout(timeoutId);
123:   }
```

#### Defect 1: Timeout Disconnection / Bypassing
- Look at line 105:
  `const signal = options?.signal || controller.signal;`
- When a caller provides a custom `options.signal` (e.g., passing an `AbortController.signal` from a React component `useEffect` to abort fetch on unmount, or from an auto-complete search input):
  - `signal` evaluates to `options.signal`.
  - `fetch` at line 109 is bound ONLY to `options.signal`.
  - The internal `controller` is never attached to `fetch`.
  - The 10-second timer `timeoutId` continues to tick. When it fires after 10 seconds:
    `controller.abort()` is executed.
    **`controller.abort()` aborts `controller.signal`, which NO ONE is listening to!**
  - If the server or network connection hangs indefinitely, the request will NEVER time out! The safety fallback is completely disabled whenever a custom signal is supplied.

#### Defect 2: Misclassification of Intentional User Cancellations as HTTP 408 Timeouts
- Look at lines 117–119:
  ```typescript
  if (err instanceof Error && err.name === 'AbortError') {
    throw new ApiError('Request timeout: Server took too long to respond', 408);
  }
  ```
- When a caller intentionally aborts a request (e.g. user navigates away, unmounts the page, or cancels a search):
  `fetch` throws a `DOMException` with `name = 'AbortError'`.
  The catch block intercepts this error and blindly throws:
  `new ApiError('Request timeout: Server took too long to respond', 408)`!
- This causes:
  - Legitimate component cleanups to be logged as server errors.
  - Spurious "Request timeout: Server took too long to respond" error banners and toasts displayed to users who simply clicked a link or typed a new search character.

---

### 4.3 Reproduction Steps
1. In a test script or browser console, invoke `requestApi`:
   ```typescript
   const userController = new AbortController();
   // User cancels request after 200ms
   setTimeout(() => userController.abort(), 200);

   try {
     await requestApi('/products', { signal: userController.signal });
   } catch (err) {
     console.log('Error caught:', err.status, err.message);
   }
   ```
2. **Observed Output:**
   Throws `ApiError: Request timeout: Server took too long to respond (status 408)`.
   **Expected Output:**
   Should rethrow `AbortError` or user cancellation, NOT HTTP 408.
3. Test Timeout with custom signal:
   Simulate an endpoint that takes 15 seconds to respond, passing a custom signal that is never aborted.
   **Observed Output:**
   The request hangs for 15 seconds; `controller.abort()` at 10s does not abort the fetch.
   **Expected Output:**
   The request should abort at 10s with HTTP 408.

---

### 4.4 Proposed Solution & Remediation Plan

#### Solution A: Modern Standard with `AbortSignal.any()` (Recommended for Node 20+ & Modern Evergreen Browsers)
Modern JavaScript environments (Node 20+, Chrome 116+, Safari 17.4+, Firefox 124+) support `AbortSignal.any()`:

```typescript
export async function requestApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = buildEndpointUrl(endpoint);
  // ... headers ...

  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => {
    timeoutController.abort(new Error('TIMEOUT_EXPIRED'));
  }, 10000);

  // Combine custom caller signal with internal timeout signal
  const signals: AbortSignal[] = [timeoutController.signal];
  if (options?.signal) {
    signals.push(options.signal);
  }

  const combinedSignal = typeof AbortSignal.any === 'function'
    ? AbortSignal.any(signals)
    : timeoutController.signal; // Fallback or bridge

  let res: Response;
  try {
    res = await fetch(url, {
      credentials: 'include',
      headers,
      ...options,
      signal: combinedSignal,
    });
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      // Check if abort was caused specifically by the timeout controller
      if (timeoutController.signal.aborted && timeoutController.signal.reason?.message === 'TIMEOUT_EXPIRED') {
        throw new ApiError('Request timeout: Server took too long to respond', 408);
      }
      // Otherwise, it was aborted by the caller
      throw err;
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
  // ...
}
```

#### Solution B: Universal Backward-Compatible Event Listener Chaining
For 100% universal compatibility across older environments without polyfills:

```typescript
export async function requestApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = buildEndpointUrl(endpoint);
  // ... headers ...

  const controller = new AbortController();
  let isTimedOut = false;
  const timeoutId = setTimeout(() => {
    isTimedOut = true;
    controller.abort();
  }, 10000);

  const callerSignal = options?.signal;
  let abortListener: (() => void) | null = null;

  if (callerSignal) {
    if (callerSignal.aborted) {
      controller.abort();
    } else {
      abortListener = () => controller.abort();
      callerSignal.addEventListener('abort', abortListener, { once: true });
    }
  }

  let res: Response;
  try {
    res = await fetch(url, {
      credentials: 'include',
      headers,
      ...options,
      signal: controller.signal,
    });
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      if (isTimedOut) {
        throw new ApiError('Request timeout: Server took too long to respond', 408);
      }
      // Caller-initiated cancellation: preserve AbortError
      throw err;
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
    if (callerSignal && abortListener) {
      callerSignal.removeEventListener('abort', abortListener);
    }
  }
  // ...
}
```

#### Required Unit Tests:
In `frontend/src/services/__tests__/api.test.ts`:
1. `times out after 10000ms and throws 408 ApiError when no custom signal provided`
2. `times out after 10000ms and throws 408 ApiError even when a custom signal is provided`
3. `rethrows original AbortError without 408 ApiError when caller signal aborts before timeout`

---

## 5. Synthesis & Cross-Cutting Impact Summary

| Issue | Root Cause | Immediate Customer Impact | Architectural Risk |
| :--- | :--- | :--- | :--- |
| **Issue 1 (Catalog)** | Frontend `page.tsx` executes unparameterized `catalogService.getProducts()` on mount and performs in-memory filtering via `useMemo`. Backend SQL filtering & pagination are bypassed. | Customers cannot find products past the initial 20 items. Categories and searches display false empty states. | Breaks ecommerce discovery scalability; invalidates backend SQL pagination and indexing. |
| **Issue 4 (Cart)** | Unsequenced async promises in `CartContext.tsx` with full-state overwrites (`setItems(backendCart.items...)`) and whole-state optimistic rollbacks. | Items added by customers vanish from cart during rapid clicking; cart total glitches; wrong cartItemId sent. | Direct loss of revenue; customer checkout abandonment; cart state drift between client and DB. |
| **Issue 5 (API Timeout)** | `options?.signal \|\| controller.signal` disconnects timeout when custom signal supplied; catch block converts all aborts to 408 timeout. | Hanging requests if custom signal passed; spurious timeout error toasts when user simply cancels or navigates. | Leaked connections, degraded client resilience, false negative network health alerts. |
