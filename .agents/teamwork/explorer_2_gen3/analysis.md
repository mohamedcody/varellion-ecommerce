# Root Cause Analysis: Backend, Database & Payment Systems (Issues 2, 3, 7)

**Explorer**: Explorer 2 Gen 3 (Backend, Database & Payment Systems Explorer)  
**Date**: 2026-10-31  
**Working Directory**: `/home/mohamed-saad/Desktop/BRAND/.agents/teamwork/explorer_2_gen3/`  
**Target Repository**: VARELLION Ecommerce Storefront & Backend  

---

## 1. Skill Selection Matrix

In accordance with R1 of the investigation mandate, the following real agent skills have been selected and strictly followed:

| Issue # | Issue Title | Selected Skill | Skill Path | Selection Rationale & Instructions Followed |
|:---:|:---|:---|:---|:---|
| **Issue 2** | Potential N+1 queries in `Product.images` (`ProductService.java` & `CartService.java`) | `awesome-database-audit` | `/home/mohamed-saad/Desktop/BRAND/.agents/skills/awesome-database-audit/SKILL.md` | Followed **Track B (Query patterns and indexes)**: Analyzed ORM lazy-load loops on hot query paths, mapped call sites from controller down to SQL queries, evaluated join fanouts, pagination Cartesian risks (`HHH000104`), and batch fetching strategies. |
| **Issue 3** | Potential N+1 queries in `CategoryService.getActiveCategories()` | `awesome-database-audit` | `/home/mohamed-saad/Desktop/BRAND/.agents/skills/awesome-database-audit/SKILL.md` | Followed **Track B (Query patterns and indexes)**: Traced per-row repository execution in `.stream().map()` pipelines; formulated single-query JPQL aggregation and projection replacements to eliminate repetitive roundtrips. |
| **Issue 7** | Live Paymob Callback Verification | `awesome-security-audit` & `awesome-root-cause` | `/home/mohamed-saad/Desktop/BRAND/.agents/skills/awesome-security-audit/SKILL.md` & `/home/mohamed-saad/Desktop/BRAND/.agents/skills/awesome-root-cause/SKILL.md` | Followed **Passive Security Audit** (Attack-surface mapping, trust boundaries, external webhook validation, CWE-345/347/602 classification) and **5-Whys Root Cause Analysis** to expose missing server-side architecture, unverified client parameter spoofing, and Paymob HMAC-SHA512 verification omissions. |

---

## 2. Issue 2: Potential N+1 Queries in `Product.images` (`ProductService.java` & `CartService.java`)

### A. Executive Finding & Classification
- **Status**: **CONFIRMED (Critical Performance Bug)**
- **Severity**: **HIGH**
- **Confidence Level**: **100% (Verified via static analysis and code tracing)**
- **CWE / Defect Category**: CWE-1048 (Invoking Database Queries in a Loop), N+1 Query Antipattern

---

### B. Exact Locations
1. `backend/src/main/java/com/varellion/store/catalog/entity/Product.java`:
   - Line 32: `@ManyToOne(fetch = FetchType.LAZY, optional = false) private Category category;`
   - Lines 74–76: `@OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY) @OrderBy("displayOrder ASC") private List<ProductImage> images = new ArrayList<>();`
2. `backend/src/main/java/com/varellion/store/catalog/repository/ProductRepository.java`:
   - Lines 29–57: `findFilteredProducts` JPQL query performs `JOIN p.category c` (inner join without `FETCH`) and omits `p.images` entirely.
   - Lines 59–65: `findBestSellers` JPQL query fetches `p.category` via `JOIN FETCH`, but omits `p.images`.
3. `backend/src/main/java/com/varellion/store/catalog/service/ProductService.java`:
   - Lines 49–51: Iterates over paginated product entities: `pageResult.getContent().stream().map(this::toDto).toList()`
   - Lines 119–124 (`toDto`): Invokes `product.getImages().stream()...` on lazy uninitialized collection.
   - Lines 128–131 (`toDto`): Invokes `product.getCategory().getSlug()`, `getNameAr()`, `getNameEn()` on uninitialized proxy.
4. `backend/src/main/java/com/varellion/store/cart/repository/CartRepository.java`:
   - Line 15: `@EntityGraph(attributePaths = {"items", "items.product"}) Optional<Cart> findByCustomer(...)`
   - Line 18: `@EntityGraph(attributePaths = {"items", "items.product"}) Optional<Cart> findByCustomerUserId(...)`
   (Note: `"items.product.images"` is omitted).
5. `backend/src/main/java/com/varellion/store/cart/service/CartService.java`:
   - Lines 208–221 (`toCartDto`): Iterates over `cart.getItems()`.
   - Lines 248–254 (`toCartItemDto`): Invokes `p.getImages().stream()...` on each `CartItem`'s product.
6. `backend/src/main/resources/application.properties`:
   - Lines 27–36: `spring.jpa.properties.hibernate.default_batch_fetch_size` is **MISSING**.

---

### C. End-to-End Data Flow Trace

#### Trace 1: `GET /api/products?page=0&limit=20` (Catalog Browsing)
```
[Client HTTP Request]
       │
       ▼
[ProductController.java:27-36]
  └─ calls productService.getProducts(category, search, sort, 0, 20)
       │
       ▼
[ProductService.java:35-60]
  └─ calls productRepository.findFilteredProducts(cleanCategory, cleanSearch, pageable)
       │
       ▼
[ProductRepository.java:29-57] (Hibernate SQL Execution)
  ├─ [Query 1 - Count]: SELECT count(p.product_id) FROM products p JOIN categories c ...
  └─ [Query 2 - Page Result]: SELECT p.* FROM products p JOIN categories c ... LIMIT 20 OFFSET 0
       │
       ▼
[ProductService.java:49-51] (DTO Mapping Pipeline)
  └─ pageResult.getContent().stream().map(this::toDto).toList()
       │
       ├─► For Product #1:
       │     ├─ product.getImages() (Line 120): Uninitialized PersistentBag triggers:
       │     │  [Query 3]: SELECT i.* FROM product_images i WHERE i.product_id = ? ORDER BY i.display_order ASC
       │     └─ product.getCategory().getSlug() (Line 129): Uninitialized Category proxy triggers:
       │        [Query 4]: SELECT c.* FROM categories c WHERE c.category_id = ?
       │
       ├─► For Product #2:
       │     ├─ product.getImages() triggers:
       │     │  [Query 5]: SELECT i.* FROM product_images i WHERE i.product_id = ? ORDER BY i.display_order ASC
       │     └─ product.getCategory() triggers (if not in L1 cache):
       │        [Query 6]: SELECT c.* FROM categories c WHERE c.category_id = ?
       │
       ▼ ... repeats for all N products on the page (N = 20)
       │
[Total Queries Executed]: 2 (Count + Page) + 20 (Images) + [1..20] (Categories) = 23 to 42 SQL queries!
       │
       ▼
[ProductController] returns ResponseEntity<ApiResponse<PagedProductsResponse>> (HTTP 200)
```

#### Trace 2: `GET /api/cart` (Cart Retrieval & Mutations)
```
[Client HTTP Request: GET /api/cart]
       │
       ▼
[CartController.java:30-34]
  └─ calls cartService.getCart(userEmail)
       │
       ▼
[CartService.java:40-45]
  └─ calls cartRepository.findByCustomer(customer)
       │
       ▼
[CartRepository.java:15-16]
  └─ Executes SQL with @EntityGraph(attributePaths = {"items", "items.product"}):
     [Query 1]: SELECT c.*, ci.*, p.* FROM carts c
                LEFT JOIN cart_items ci ON ...
                LEFT JOIN products p ON ...
                WHERE c.customer_id = ?
       │
       ▼
[CartService.java:208-238] (toCartDto)
  └─ loops through cart.getItems()
       │
       ├─► Item #1: toCartItemDto(item) (Line 248):
       │     └─ accesses p.getImages() -> Uninitialized PersistentBag triggers:
       │        [Query 2]: SELECT i.* FROM product_images i WHERE i.product_id = ?
       │
       ├─► Item #2: toCartItemDto(item) (Line 248):
       │     └─ accesses p.getImages() -> triggers:
       │        [Query 3]: SELECT i.* FROM product_images i WHERE i.product_id = ?
       │
       ▼ ... repeats for all K line items in customer's cart
       │
[Total Queries Executed]: 1 (Cart+Items+Product) + K (Images queries for K products)
```

---

### D. Distinction: Symptom vs. Root Cause
- **Symptom**: Database connection pool exhaustion under load, slow response times on `/api/products` and `/api/cart`, multiple sequential `SELECT ... FROM product_images` and `SELECT ... FROM categories` visible in SQL logs.
- **Root Cause**:
  1. `Product.images` is mapped as `FetchType.LAZY` (which is good practice to prevent eager Cartesian joins), but **batch fetching is completely unconfigured** in the application (`spring.jpa.properties.hibernate.default_batch_fetch_size` is absent, and `@BatchSize` is not present on the entity collection).
  2. In `ProductRepository.findFilteredProducts`, `JOIN p.category c` is used for filtering rather than `JOIN FETCH p.category c`. While collection `JOIN FETCH` cannot be used on `p.images` with pagination due to Hibernate memory pagination limits (`HHH000104`), `category` is a `@ManyToOne` relationship which *can* and *should* be fetched or included in an `@EntityGraph`.
  3. In `CartRepository`, `@EntityGraph(attributePaths = {"items", "items.product"})` explicitly stops at `items.product` and does not include product images.

---

### E. Evidence & Reproduction Steps
1. **Repository Evidence**:
   - In `backend/src/main/resources/application.properties`, observe lines 27–36:
     ```properties
     spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
     spring.jpa.hibernate.ddl-auto=validate
     spring.jpa.show-sql=false
     spring.jpa.open-in-view=false
     spring.jpa.properties.hibernate.jdbc.batch_size=25
     ```
     `hibernate.default_batch_fetch_size` is completely absent.
2. **Reproduction in Test vs Production**:
   - In unit tests (`ProductServiceTest.java:80-82` and `CartServiceTest.java:87`), test fixtures manually populate `new ArrayList<>()` with pre-created Java objects. Mockito returns in-memory collections, bypassing Hibernate's proxy mechanisms. Thus, the tests pass while concealing the runtime N+1 behavior.
   - If SQL logging is enabled (`spring.jpa.show-sql=true` or `logging.level.org.hibernate.SQL=DEBUG`), hitting `GET /api/products?limit=20` outputs 22 to 42 SQL queries for a single HTTP request.

---

### F. Recommended Solution & Code Snippets

#### 1. Configure Global Hibernate Batch Fetching (`application.properties`)
Add the following property to `backend/src/main/resources/application.properties`:
```properties
# Hibernate Batch Fetching to eliminate N+1 queries across all lazy collections
spring.jpa.properties.hibernate.default_batch_fetch_size=50
```
*Effect*: Hibernate automatically groups lazy collection queries into a single batched query using SQL `IN`:
`SELECT ... FROM product_images WHERE product_id IN (?, ?, ?, ...)` (1 query instead of 20!).

#### 2. Optimize `ProductRepository.java`
Update `findFilteredProducts` and `findBestSellers` to fetch the `@ManyToOne` category:
```java
// backend/src/main/java/com/varellion/store/catalog/repository/ProductRepository.java

@Query(value = """
    SELECT p FROM Product p
    JOIN FETCH p.category c
    WHERE p.isActive = true
      AND (CAST(:categorySlug AS string) IS NULL OR c.slug = :categorySlug)
      AND (CAST(:search AS string) IS NULL OR (
           LOWER(p.nameAr) LIKE CONCAT('%', LOWER(CAST(:search AS string)), '%') OR
           LOWER(p.nameEn) LIKE CONCAT('%', LOWER(CAST(:search AS string)), '%') OR
           LOWER(p.sku) LIKE CONCAT('%', LOWER(CAST(:search AS string)), '%') OR
           LOWER(p.descriptionAr) LIKE CONCAT('%', LOWER(CAST(:search AS string)), '%')
      ))
""",
countQuery = """
    SELECT COUNT(p) FROM Product p
    JOIN p.category c
    WHERE p.isActive = true
      AND (CAST(:categorySlug AS string) IS NULL OR c.slug = :categorySlug)
      AND (CAST(:search AS string) IS NULL OR (
           LOWER(p.nameAr) LIKE CONCAT('%', LOWER(CAST(:search AS string)), '%') OR
           LOWER(p.nameEn) LIKE CONCAT('%', LOWER(CAST(:search AS string)), '%') OR
           LOWER(p.sku) LIKE CONCAT('%', LOWER(CAST(:search AS string)), '%') OR
           LOWER(p.descriptionAr) LIKE CONCAT('%', LOWER(CAST(:search AS string)), '%')
      ))
""")
Page<Product> findFilteredProducts(
        @Param("categorySlug") String categorySlug,
        @Param("search") String search,
        Pageable pageable
);
```

#### 3. Optimize `CartRepository.java`
With `default_batch_fetch_size=50`, accessing `p.getImages()` in cart items will execute exactly 1 `IN` query for all products in the cart.
Alternatively, annotate `Product.java`:
```java
@OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
@OrderBy("displayOrder ASC")
@org.hibernate.annotations.BatchSize(size = 50)
private List<ProductImage> images = new ArrayList<>();
```

### G. Trade-offs & Alternatives Considered
- **Alternative 1: `JOIN FETCH p.images` in `findFilteredProducts`**:
  *Rejected*: In Hibernate, joining a collection with `Pageable` emits warning `HHH000104: firstResult/maxResults specified with collection fetch; applying in memory!`. This loads the full table into JVM memory before paginating, causing severe heap bloat and CPU spikes.
- **Alternative 2: Two-Step Query in `ProductService`**:
  Fetch IDs first via `Page<UUID>`, then fetch entities via `findAllByIdWithDetails(ids)`.
  *Trade-off*: More boilerplate; `default_batch_fetch_size=50` accomplishes the exact same optimization transparently in 2 SQL queries (1 for page + 1 for images) without modifying service query plumbing.

---

## 3. Issue 3: Potential N+1 Queries in `CategoryService.getActiveCategories()`

### A. Executive Finding & Classification
- **Status**: **CONFIRMED (Definite 1+N Query Antipattern)**
- **Severity**: **MEDIUM-HIGH**
- **Confidence Level**: **100% (Directly evident in method implementation)**
- **CWE / Defect Category**: CWE-1048 (Invoking Database Queries in a Loop), N+1 Query Antipattern

---

### B. Exact Locations
1. `backend/src/main/java/com/varellion/store/catalog/service/CategoryService.java`:
   - Lines 23–28:
     ```java
     public List<CategoryDto> getActiveCategories() {
         return categoryRepository.findAllByIsActiveTrueOrderByCreatedAtAsc()
                 .stream()
                 .map(this::toDto)
                 .toList();
     }
     ```
   - Lines 36–48:
     ```java
     private CategoryDto toDto(Category category) {
         long productCount = categoryRepository.countActiveProductsByCategoryId(category.getCategoryId());
         return new CategoryDto(
                 category.getCategoryId(),
                 category.getNameAr(),
                 category.getNameEn(),
                 category.getSlug(),
                 category.getDescriptionAr(),
                 category.getDescriptionEn(),
                 category.getIsActive(),
                 productCount
         );
     }
     ```
2. `backend/src/main/java/com/varellion/store/catalog/repository/CategoryRepository.java`:
   - Line 19: `List<Category> findAllByIsActiveTrueOrderByCreatedAtAsc();`
   - Lines 23–24:
     ```java
     @Query("SELECT COUNT(p) FROM Product p WHERE p.category.categoryId = :categoryId AND p.isActive = true")
     long countActiveProductsByCategoryId(@Param("categoryId") UUID categoryId);
     ```

---

### C. End-to-End Data Flow Trace
```
[Client HTTP Request: GET /api/categories]
       │
       ▼
[CategoryController.java:29-32]
  └─ calls categoryService.getActiveCategories()
       │
       ▼
[CategoryService.java:23-28]
  └─ calls categoryRepository.findAllByIsActiveTrueOrderByCreatedAtAsc()
       │
       ▼
[CategoryRepository.java:19]
  └─ [Query 1]: SELECT c.* FROM categories c WHERE c.is_active = true ORDER BY c.created_at ASC
       │
       ▼ (Returns list of N category entities, e.g., 10 categories)
[CategoryService.java:26]
  └─ .stream().map(this::toDto)
       │
       ├─► For Category 1 (Watches):
       │     └─ calls categoryRepository.countActiveProductsByCategoryId(cat1.id)
       │        [Query 2]: SELECT COUNT(p.product_id) FROM products p WHERE p.category_id = ? AND p.is_active = true
       │
       ├─► For Category 2 (Wallets):
       │     └─ calls categoryRepository.countActiveProductsByCategoryId(cat2.id)
       │        [Query 3]: SELECT COUNT(p.product_id) FROM products p WHERE p.category_id = ? AND p.is_active = true
       │
       ▼ ... repeats sequentially for every category in the catalog (N times)
       │
[Total Queries Executed]: Exactly 1 + N SQL roundtrips!
       │
       ▼
[CategoryController] returns ResponseEntity<ApiResponse<List<CategoryDto>>> (HTTP 200)
```

---

### D. Distinction: Symptom vs. Root Cause
- **Symptom**: Network latency accumulation on `/api/categories`, where each category adds 10–30ms of database roundtrip time to the request duration.
- **Root Cause**: Explicit iterative repository invocation in application code. Instead of aggregating product counts at the database level using `GROUP BY`, the service layer executes a standalone `countActiveProductsByCategoryId` query for each element inside a Java stream.

---

### E. Evidence & Reproduction Steps
1. **Code Inspection**:
   In `CategoryService.java` line 37:
   `long productCount = categoryRepository.countActiveProductsByCategoryId(category.getCategoryId());`
   This is executed inside the `map` callback for every item in `findAllByIsActiveTrueOrderByCreatedAtAsc()`.
2. **Unit Test Inadequacy**:
   In `backend/src/test/java/com/varellion/store/catalog/CategoryServiceTest.java:44-50`, the test mocks a list containing only 1 category (`List.of(category)`), verifying `countActiveProductsByCategoryId` is called once. The unit test passes, masking the 1+N multiplication effect that occurs with real data.
3. **Reproduction**:
   Seed 10 active categories in the database and issue `curl http://localhost:8080/api/categories`. With Hibernate SQL logging enabled, exactly 11 SQL queries appear in the console.

---

### F. Recommended Solution & Code Snippets

#### Single Query JPQL Constructor Expression [RECOMMENDED]
Replace the loop with a single JPQL query performing a `LEFT JOIN` and `GROUP BY` that maps directly into `CategoryDto`:

1. Add method to `backend/src/main/java/com/varellion/store/catalog/repository/CategoryRepository.java`:
```java
@Query("""
    SELECT new com.varellion.store.catalog.dto.CategoryDto(
        c.categoryId,
        c.nameAr,
        c.nameEn,
        c.slug,
        c.descriptionAr,
        c.descriptionEn,
        c.isActive,
        COUNT(CASE WHEN p.isActive = true THEN p.productId ELSE NULL END)
    )
    FROM Category c
    LEFT JOIN Product p ON p.category = c
    WHERE c.isActive = true
    GROUP BY c.categoryId, c.nameAr, c.nameEn, c.slug, c.descriptionAr, c.descriptionEn, c.isActive, c.createdAt
    ORDER BY c.createdAt ASC
""")
List<CategoryDto> findAllActiveCategoriesWithProductCount();
```

2. Update `backend/src/main/java/com/varellion/store/catalog/service/CategoryService.java`:
```java
public List<CategoryDto> getActiveCategories() {
    return categoryRepository.findAllActiveCategoriesWithProductCount();
}
```

*Result*: Eliminates the N+1 queries completely. **Execution drops from 1 + N queries to EXACTLY 1 query.**

---

## 4. Issue 7: Live Paymob Callback Verification

### A. Executive Finding & Classification
- **Status**: **CONFIRMED (Critical Security & Architecture Vulnerability)**
- **Severity**: **CRITICAL**
- **Confidence Level**: **100% (Verified across full backend and frontend codebases)**
- **CWE Classifications**:
  - **CWE-345**: Insufficient Verification of Data Authenticity
  - **CWE-347**: Improper Verification of Cryptographic Signature
  - **CWE-602**: Client-Side Enforcement of Server-Side Security
  - **CWE-306**: Missing Authentication for Critical Function

---

### B. Exact Locations
1. `backend/src/main/java/com/varellion/store/order/controller/OrderController.java`:
   - File exists as a **0-byte empty stub** (line 1, 0 bytes).
2. `backend/src/main/java/com/varellion/store/order/service/OrderService.java`:
   - File exists as a **0-byte empty stub** (line 1, 0 bytes).
3. Backend Payment / Webhook Module:
   - **Completely missing**. No `PaymentController`, `PaymobWebhookController`, or `PaymobService` exists in `backend/src/main/java/`.
4. `frontend/src/services/payment.ts`:
   - Lines 19–32: Calls `POST /api/payments/paymob/initiate`.
   - Lines 35–54: Catches connection failure (which always occurs since the backend endpoint does not exist) and silently routes to `/checkout/mock-paymob`.
5. `frontend/src/app/checkout/mock-paymob/page.tsx`:
   - Lines 19–28: "Simulate Success" button pushes directly to:
     `/checkout/callback?success=true&orderNumber=${orderNumber}&transactionId=PAYMOB_TXN_${Date.now()}`
6. `frontend/src/app/checkout/callback/page.tsx`:
   - Lines 17–22:
     ```typescript
     const successParam = searchParams.get('success');
     const orderNumber = searchParams.get('orderNumber') || searchParams.get('order_number') || 'VAR-ORD-PENDING';
     const transactionId = searchParams.get('transactionId') || searchParams.get('txn_response_code');
     const isSuccess = successParam === 'true';
     ```
   - Lines 25–46:
     ```typescript
     useEffect(() => {
       if (isSuccess) {
         // 1. Update last placed order to CONFIRMED
         const cached = ordersService.getLastPlacedOrder();
         if (cached) {
           cached.orderStatus = 'CONFIRMED';
           if (typeof window !== 'undefined') {
             sessionStorage.setItem('varellion_last_order', JSON.stringify(cached));
           }
         }
         clearCart();
         router.push(`/checkout/success?orderNumber=${encodeURIComponent(orderNumber)}`);
       }
     }, [isSuccess, ...]);
     ```

---

### C. End-to-End Data Flow Trace

#### The Intended Live Paymob Payment Architecture
```
[Customer Browser]       [Merchant Backend (Spring Boot)]             [Paymob Gateway]
       │                                 │                                    │
       ├─ 1. Submits Checkout (Card) ───►│                                    │
       │                                 ├─ 2. Auth & Register Order ────────►│
       │                                 ├─ 3. Obtain Payment Key ───────────►│
       │                                 │◄─ Returns payment_token ───────────┤
       │◄─ 4. Returns paymentUrl / token ┤                                    │
       │                                                                      │
       ├─ 5. Enters Card / 3D-Secure in Paymob Hosted Checkout ──────────────►│
       │                                                                      │
       │                                 │◄─ 6. Webhook POST (Server-to-Server)│
       │                                 │    Payload + HMAC Signature        │
       │                                 ├─ 7. Recalculates HMAC-SHA512       │
       │                                 ├─ 8. Compares constant-time         │
       │                                 ├─ 9. Checks transactionId (idempot) │
       │                                 ├─ 10. Checks success==true &        │
       │                                 │      pending==false & amount match │
       │                                 ├─ 11. Transitions DB: CONFIRMED    │
       │                                 │─ 12. Returns HTTP 200 OK ─────────►│
       │                                                                      │
       │◄─ 13. Browser Redirection (GET /checkout/callback?hmac=...) ─────────┤
       ├─ 14. Fetches authoritative order status from Backend ───────────────►│
```

#### The ACTUAL Current Vulnerable Flow in VARELLION
```
[Attacker / User Browser]
       │
       ├─ 1. Directly navigates to:
       │     http://localhost:3000/checkout/callback?success=true&orderNumber=VAR-20261028-9999
       │
       ▼
[/checkout/callback/page.tsx:17-46]
  ├─ Reads searchParams.get('success') === 'true'
  ├─ NO HMAC calculated or checked!
  ├─ NO request sent to Backend or Paymob!
  ├─ Sets cached.orderStatus = 'CONFIRMED' in browser sessionStorage!
  ├─ Clears shopping cart!
  └─ Redirects to /checkout/success?orderNumber=VAR-20261028-9999
       │
       ▼
[/checkout/success/page.tsx]
  Displays: "تم تأكيد طلبك بنجاح! رقم الطلب: VAR-20261028-9999"
  (Zero funds collected, zero bank confirmation, 100% spoofed!)
```

---

### D. Deep Technical Analysis of Paymob Verification Requirements

#### 1. Paymob HMAC-SHA512 Algorithm & Field Ordering
Paymob requires the merchant to calculate an HMAC using the **SHA-512** algorithm with the secret **Paymob HMAC Key** (`PAYMOB_HMAC_SECRET`).
The input string to the HMAC calculation MUST be the concatenation of the values of the following **20 transaction callback fields in exact alphabetical (lexicographical) order**:

| # | Paymob Field Name | Payload Path | Type / Value Notes |
|:---:|:---|:---|:---|
| 1 | `amount_cents` | `obj.amount_cents` | Integer in cents (e.g. `250000`) |
| 2 | `created_at` | `obj.created_at` | ISO timestamp string |
| 3 | `currency` | `obj.currency` | String (e.g. `"EGP"`) |
| 4 | `error_occured` | `obj.error_occured` | Boolean (`"true"` / `"false"`) |
| 5 | `has_parent_transaction` | `obj.has_parent_transaction` | Boolean (`"true"` / `"false"`) |
| 6 | `id` | `obj.id` | Paymob transaction ID (Integer) |
| 7 | `integration_id` | `obj.integration_id` | Paymob Integration ID (Integer) |
| 8 | `is_3d_secure` | `obj.is_3d_secure` | Boolean (`"true"` / `"false"`) |
| 9 | `is_auth` | `obj.is_auth` | Boolean (`"true"` / `"false"`) |
| 10 | `is_capture` | `obj.is_capture` | Boolean (`"true"` / `"false"`) |
| 11 | `is_refunded` | `obj.is_refunded` | Boolean (`"true"` / `"false"`) |
| 12 | `is_standalone_payment` | `obj.is_standalone_payment` | Boolean (`"true"` / `"false"`) |
| 13 | `is_voided` | `obj.is_voided` | Boolean (`"true"` / `"false"`) |
| 14 | `order.id` | `obj.order.id` | Paymob internal order ID (Integer) |
| 15 | `owner` | `obj.owner` | Merchant owner ID (Integer) |
| 16 | `pending` | `obj.pending` | Boolean (`"true"` / `"false"`) |
| 17 | `source_data.pan` | `obj.source_data.pan` | Masked card number (e.g. `"2346"`) |
| 18 | `source_data.sub_type` | `obj.source_data.sub_type` | Subtype (e.g. `"MasterCard"`) |
| 19 | `source_data.type` | `obj.source_data.type` | Type (e.g. `"card"`) |
| 20 | `success` | `obj.success` | Boolean (`"true"` / `"false"`) |

*Concatenation Rule*:
`concatenatedString = amount_cents + created_at + currency + error_occured + has_parent_transaction + id + integration_id + is_3d_secure + is_auth + is_capture + is_refunded + is_standalone_payment + is_voided + order.id + owner + pending + source_data.pan + source_data.sub_type + source_data.type + success`

#### 2. Paymob Webhook Verification Flaws in Current Codebase
1. **Total Absence of Server-Side HMAC Validation**: The backend contains zero classes or methods implementing the Paymob HMAC-SHA512 verification.
2. **Missing Transaction Idempotency**: If Paymob retries a webhook or an attacker replays a transaction payload, there is no `paymob_transactions` table to record `transaction_id` with a `UNIQUE` constraint.
3. **Pending vs. Success Status Mishandling**: In Paymob, mobile wallet payments or deferred channels emit initial callbacks with `pending: true` and `success: false` or `success: null`. The current frontend logic only checks `success === 'true'`, but has no awareness of pending statuses.
4. **Amount Tampering Vulnerability**: There is no check comparing `amount_cents` in the callback with the order's registered `total_amount * 100` in the database.
5. **Constant-Time Comparison**: Cryptographic comparisons must use `MessageDigest.isEqual()` to prevent timing attacks.

---

### E. Customer Impact & Business Risk
- **Impact**: **Catastrophic (Total Financial Bypass & Fraud Vulnerability)**.
- Any attacker can purchase luxury goods (watches, leather products) for 0 EGP by simply submitting an order, bypassing payment, and entering the callback URL with `?success=true`. Orders would appear as confirmed in admin lists if linked to client states, resulting in severe physical inventory loss and financial damage.

---

### F. Comprehensive Remediation Architecture

#### 1. Backend Payment Webhook Controller (`PaymobWebhookController.java`)
Create a dedicated, public webhook endpoint: `POST /api/v1/payments/paymob/webhook`
```java
@RestController
@RequestMapping("/api/v1/payments/paymob")
@RequiredArgsConstructor
@Slf4j
public class PaymobWebhookController {

    private final PaymobVerificationService paymobVerificationService;
    private final OrderService orderService;

    @PostMapping("/webhook")
    public ResponseEntity<Void> handleWebhook(
            @RequestParam(name = "hmac") String hmacSignature,
            @RequestBody PaymobCallbackPayload payload
    ) {
        // 1. Verify HMAC-SHA512 signature
        boolean isValid = paymobVerificationService.verifyHmac(payload, hmacSignature);
        if (!isValid) {
            log.warn("Invalid Paymob webhook HMAC signature received: {}", hmacSignature);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        // 2. Process transaction and transition order
        paymobVerificationService.processTransactionCallback(payload);
        return ResponseEntity.ok().build();
    }
}
```

#### 2. Cryptographic HMAC Verification Service (`PaymobVerificationService.java`)
```java
@Service
@RequiredArgsConstructor
@Slf4j
public class PaymobVerificationService {

    @Value("${paymob.hmac-secret}")
    private String hmacSecret;

    private final OrderRepository orderRepository;
    private final PaymentTransactionRepository transactionRepository;

    public boolean verifyHmac(PaymobCallbackPayload payload, String incomingHmac) {
        if (incomingHmac == null || payload == null || payload.getObj() == null) {
            return false;
        }

        TransactionObj obj = payload.getObj();
        String concatenated = String.join("",
                String.valueOf(obj.getAmountCents()),
                String.valueOf(obj.getCreatedAt()),
                String.valueOf(obj.getCurrency()),
                String.valueOf(obj.getErrorOccured()),
                String.valueOf(obj.getHasParentTransaction()),
                String.valueOf(obj.getId()),
                String.valueOf(obj.getIntegrationId()),
                String.valueOf(obj.getIs3dSecure()),
                String.valueOf(obj.getIsAuth()),
                String.valueOf(obj.getIsCapture()),
                String.valueOf(obj.getIsRefunded()),
                String.valueOf(obj.getIsStandalonePayment()),
                String.valueOf(obj.getIsVoided()),
                String.valueOf(obj.getOrder() != null ? obj.getOrder().getId() : ""),
                String.valueOf(obj.getOwner()),
                String.valueOf(obj.getPending()),
                String.valueOf(obj.getSourceData() != null ? obj.getSourceData().getPan() : ""),
                String.valueOf(obj.getSourceData() != null ? obj.getSourceData().getSubType() : ""),
                String.valueOf(obj.getSourceData() != null ? obj.getSourceData().getType() : ""),
                String.valueOf(obj.getSuccess())
        );

        String calculatedHmac = calculateHmacSha512(concatenated, hmacSecret);
        return MessageDigest.isEqual(
                calculatedHmac.getBytes(StandardCharsets.UTF_8),
                incomingHmac.getBytes(StandardCharsets.UTF_8)
        );
    }

    private String calculateHmacSha512(String data, String key) {
        try {
            Mac mac = Mac.getInstance("HmacSHA512");
            SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
            mac.init(secretKey);
            byte[] rawHmac = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(2 * rawHmac.length);
            for (byte b : rawHmac) {
                sb.append(String.format("%02x", b & 0xff));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new IllegalStateException("Failed to calculate HMAC-SHA512", e);
        }
    }

    @Transactional
    public void processTransactionCallback(PaymobCallbackPayload payload) {
        TransactionObj obj = payload.getObj();
        long transactionId = obj.getId();

        // 1. Idempotency Check
        if (transactionRepository.existsByTransactionId(transactionId)) {
            log.info("Duplicate Paymob transaction {} received, skipping.", transactionId);
            return;
        }

        // 2. Validate Order & Amount
        String merchantOrderNumber = obj.getOrder().getMerchantOrderId();
        Order order = orderRepository.findByOrderNumber(merchantOrderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + merchantOrderNumber));

        long expectedCents = order.getTotalAmount().multiply(BigDecimal.valueOf(100)).longValue();
        if (obj.getAmountCents() != expectedCents) {
            log.error("Amount mismatch for order {}: expected {} cents, got {}",
                    merchantOrderNumber, expectedCents, obj.getAmountCents());
            throw new BusinessException("Transaction amount does not match order total");
        }

        // 3. Status Transition
        if (Boolean.TRUE.equals(obj.getSuccess()) && Boolean.FALSE.equals(obj.getPending())) {
            order.setOrderStatus(OrderStatus.CONFIRMED);
            orderRepository.save(order);
        } else if (Boolean.TRUE.equals(obj.getPending())) {
            // Keep pending customer confirmation / awaiting payment
        }

        // Record transaction audit
        transactionRepository.save(new PaymentTransaction(transactionId, order, obj.getSuccess(), obj.getAmountCents()));
    }
}
```

#### 3. Frontend Callback Hardening (`frontend/src/app/checkout/callback/page.tsx`)
Never mutate order status in `sessionStorage` based on URL query parameters. Instead, fetch the authoritative order status from the backend:
```typescript
useEffect(() => {
  async function verifyOrder() {
    try {
      // Query backend for authoritative order status (updated by webhook)
      const verifiedOrder = await ordersService.trackOrder(orderNumber, phone);
      if (verifiedOrder && verifiedOrder.orderStatus === 'CONFIRMED') {
        clearCart();
        router.push(`/checkout/success?orderNumber=${encodeURIComponent(orderNumber)}`);
      } else {
        // Show payment pending or failed state
      }
    } catch {
      // Route to failure with retry or COD conversion
    }
  }
  verifyOrder();
}, [orderNumber, phone]);
```

---

## 5. Comparative Summary & Technical Verdict

| Dimension | Issue 2: Product Images N+1 | Issue 3: Category Active N+1 | Issue 7: Live Paymob Callback |
|:---|:---|:---|:---|
| **Defect Type** | Database Query Performance | Database Query Performance | Security Vulnerability & Missing Architecture |
| **Confirmed?** | **YES** | **YES** | **YES** |
| **Severity** | High | Medium-High | Critical |
| **Root Cause** | Unconfigured batch fetching + missing `@EntityGraph` path for images | Iterative `.map()` loop calling single-row count query | Missing backend webhook endpoint; unverified client URL parameter trust |
| **Resolution Complexity** | Low (Add configuration & annotations) | Low (Single JPQL aggregation constructor query) | High (Implement backend order service, webhook controller, HMAC-SHA512 verification, idempotency) |
| **Risk of Regression** | Minimal | Zero (API contract unchanged) | Low (Secures payment flow without disrupting COD) |
