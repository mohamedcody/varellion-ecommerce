# Handoff Report: Frontend & Client Architecture (Issues 1, 4, 5)

**Agent:** Explorer 1 Gen 2 (Frontend & Client Architecture Explorer)  
**Date:** 2026-10-31  
**Working Directory:** `/home/mohamed-saad/Desktop/BRAND/.agents/teamwork/explorer_1_gen2/`  
**Handoff Type:** Hard (Task complete)  

---

## 1. Observation

### Issue 1: Backend-Driven Catalog Filtering Mismatch
- **Direct Code Observation 1.1 (`frontend/src/app/products/page.tsx:45-62`):**
  ```typescript
  // Load catalog categories and products
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [cats, prodsRes] = await Promise.all([
          catalogService.getCategories(),
          catalogService.getProducts(),
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
  }, []);
  ```
  `catalogService.getProducts()` is called without arguments on mount only (`[]` dependency array).
- **Direct Code Observation 1.2 (`frontend/src/app/products/page.tsx:114-152`):**
  Filtering and sorting are executed in-memory via `useMemo` over the initially loaded `products` state:
  ```typescript
  const filteredProducts = useMemo(() => {
    let result = [...products];
    if (selectedCategory !== 'all') {
      const cat = categories.find((c) => c.slug === selectedCategory);
      if (cat) result = result.filter((p) => p.categoryId === cat.categoryId);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(p => p.nameAr.toLowerCase().includes(q) || ...);
    }
    // ...
    return result;
  }, [products, selectedCategory, searchQuery, isFeaturedOnly, sortBy, categories]);
  ```
- **Direct Code Observation 1.3 (`frontend/src/app/products/page.tsx:75` vs `ProductController.java:29`):**
  In `page.tsx:75`, URL parameters are pushed as `search`:
  `if (search.trim()) { params.set('search', search.trim()); }`
  In `backend/src/main/java/com/varellion/store/catalog/controller/ProductController.java:29`:
  `@RequestParam(required = false, name = "q") String search`
- **Direct Code Observation 1.4 (`backend/src/main/java/com/varellion/store/catalog/service/ProductService.java:35-60`):**
  Backend limits unparameterized queries to 20 items:
  `int sanitizedSize = (size <= 0 || size > 100) ? 20 : size;`
  `Page<Product> pageResult = productRepository.findFilteredProducts(cleanCategory, cleanSearch, pageable);`
  The backend repository (`ProductRepository.java:29-57`) executes SQL with category filtering, search keyword matching across 4 fields, and pagination.

---

### Issue 4: CartContext Concurrency Race Condition During Rapid Additions
- **Direct Code Observation 4.1 (`frontend/src/context/CartContext.tsx:165-218`):**
  In `addItem`:
  ```typescript
  const previousItems = itemsRef.current;
  const lineItemId = product.productId;
  // ...
  setItems((prevItems) => { ... return [newItem, ...prevItems]; });
  // ...
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
  `addItem` launches unsequenced, unqueued async promises. The `.then()` callback executes `setItems(backendCart.items...)`, replacing the entire `items` array with the payload returned by that specific response.
  The `.catch()` callback executes `setItems(previousItems)`, replacing the cart with the snapshot captured before the call was dispatched.
- **Direct Code Observation 4.2 (`frontend/src/context/CartContext.tsx:170, 191`):**
  The optimistic item sets `cartItemId: product.productId`. The backend CartItem entity (`backend/src/main/java/com/varellion/store/cart/entity/CartItem.java`) uses an independent primary key UUID `cartItemId`.
- **Direct Code Observation 4.3 (`frontend/src/context/CartContext.tsx:224-279, 284-309`):**
  `updateQuantity` and `removeItem` execute the exact same blind overwrite and `previousItems` rollback pattern without debounce or request sequencing.

---

### Issue 5: API Timeout Behavior When Custom AbortSignal Supplied
- **Direct Code Observation 5.1 (`frontend/src/services/api.ts:102-124`):**
  ```typescript
  // Network timeout safety (10 seconds timeout fallback)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  const signal = options?.signal || controller.signal;

  let res: Response;
  try {
    res = await fetch(url, {
      credentials: 'include',
      headers,
      ...options,
      signal,
    });
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ApiError('Request timeout: Server took too long to respond', 408);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
  ```
  At line 105: `const signal = options?.signal || controller.signal;`
  When `options.signal` is provided, `signal` is assigned `options.signal`. `controller.signal` is discarded and NOT passed to `fetch`.
  At line 104: `setTimeout(() => controller.abort(), 10000)` continues running and calls `controller.abort()`, which does nothing to `options.signal` or `fetch`.
  At lines 117-119: Any `AbortError` (including intentional client-side aborts) is unconditionally transformed into `ApiError('Request timeout: Server took too long to respond', 408)`.

---

## 2. Logic Chain

1. **Issue 1 Logic Chain:**
   - From Observation 1.1: `page.tsx` calls `catalogService.getProducts()` with no arguments on initial mount only (`[]`).
   - From Observation 1.4: The backend default pagination returns at most 20 products for unparameterized queries.
   - From Observation 1.2: All subsequent category filtering, searching, and sorting are executed strictly within the in-memory array of 20 products via `useMemo`.
   - Inference: Any product in the catalog that is not among the first 20 products in the database is unreachable by user queries or category selections.
   - From Observation 1.3: URL updates write `search` rather than `q`, creating parameter naming drift with the backend `@RequestParam(name = "q")`.
   - Conclusion: The frontend operates as a client-side prototype that disconnects from the backend-driven filtering and pagination architecture.

2. **Issue 4 Logic Chain:**
   - From Observation 4.1: Multiple rapid invocations of `addItem` trigger concurrent asynchronous HTTP requests.
   - Network response arrival times are non-deterministic. If Request 1 (item A) resolves after Request 2 (item B), Request 1's `.then()` executes `setItems(backendCart.items...)`.
   - Because Request 1's `backendCart` only contains item A, `setItems` overwrites the state, causing item B to silently vanish from the UI.
   - If Request 1 fails, its `.catch()` executes `setItems(previousItems)`. Since `previousItems` was captured before Request 1, it reverts the cart to state 0, discarding Request 2's optimistic state as well.
   - From Observation 4.2: Rapid interactions before the backend responds use `product.productId` instead of `cartItemId`, causing subsequent `updateQuantity` or `removeItem` requests to fail with 404.
   - Conclusion: Concurrency race conditions and blind state overwrites in `CartContext.tsx` cause cart data loss, rollback corruption, and invalid ID lookups.

3. **Issue 5 Logic Chain:**
   - From Observation 5.1: `const signal = options?.signal || controller.signal;` chooses either the caller's signal OR the internal timeout controller signal, never both.
   - When a caller supplies a custom signal, the 10-second timeout controller is disconnected from `fetch`. If the network stalls, the request never times out.
   - When the caller aborts intentionally (e.g. unmounting a component or cancelling a search), `fetch` throws `AbortError`.
   - The catch block catches this and maps it to HTTP 408 "Request timeout: Server took too long to respond".
   - Conclusion: The timeout protection is bypassed when custom signals are provided, and intentional client cancellations are misreported as 408 server timeouts.

---

## 3. Caveats

- **No Caveats.** All three frontend issues have been inspected directly in their actual files, traced through call graphs, compared against backend controllers, entities, repositories, and test files.
- Note on file path for Issue 5: Prompt referenced `frontend/src/lib/api.ts:105`. The actual repository file is located at `frontend/src/services/api.ts` (lines 102–124). Both references represent the same universal API client.

---

## 4. Conclusion

All three reported frontend issues are **CONFIRMED DEFECTS**:
1. **Issue 1:** Catalog Filtering Mismatch in `frontend/src/app/products/page.tsx` is caused by bypassing backend query parameters and pagination, relying on a one-time unparameterized fetch and client-side `useMemo` filtering over only the first 20 products.
2. **Issue 4:** CartContext Concurrency Race Condition in `frontend/src/context/CartContext.tsx` is caused by unqueued concurrent async requests, blind full-state replacement (`setItems(backendCart.items...)`), corrupted global rollbacks (`previousItems`), and temporary ID collisions (`cartItemId = productId`).
3. **Issue 5:** API Timeout Behavior in `frontend/src/services/api.ts:105` is caused by an exclusive OR signal fallback (`options?.signal || controller.signal`) that decouples the timeout controller when a custom signal is passed, combined with catching all `AbortError`s and throwing a false 408 Request Timeout.

---

## 5. Verification Method

### 1. Issue 1 Verification:
- Inspect `frontend/src/app/products/page.tsx:45-62` and `page.tsx:114-152`.
- Inspect backend `backend/src/main/java/com/varellion/store/catalog/controller/ProductController.java:26-36` and test `ProductControllerTest.java:83-98`.
- Verification check: Confirm that `catalogService.getProducts()` in `page.tsx:51` takes 0 arguments and that `filteredProducts` filters in-memory on line 114. Confirm that changing category in browser does not trigger any network request in devtools.

### 2. Issue 4 Verification:
- Inspect `frontend/src/context/CartContext.tsx:165-218`.
- In a unit test or simulated environment:
  Mock `cartService.addItem` with delayed promises: Call 1 (delay 300ms, returns cart with Item A), Call 2 (delay 100ms, returns cart with Items A and B).
  Fire `addItem(A)` then `addItem(B)`.
  Assert final state of `items`: Call 1 overwrites Call 2, leaving only `[Item A]`. Item B is lost.

### 3. Issue 5 Verification:
- Inspect `frontend/src/services/api.ts:102-123`.
- In a unit test:
  Create an `AbortController`. Pass its signal to `requestApi('/endpoint', { signal })`. Call `abort()` after 50ms.
  Assert caught error: It will throw `ApiError` with status 408 and message `'Request timeout: Server took too long to respond'`.
  This confirms the false 408 bug.
