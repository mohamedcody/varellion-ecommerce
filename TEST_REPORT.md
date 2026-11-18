# VARELLION — Backend Test Execution & Coverage Report

> **Auditor / QA Engineer:** Senior Backend Engineer & QA Architect  
> **Test Framework:** JUnit 5 (Jupiter), Spring Boot Test (MockMvc), Mockito, AssertJ  
> **Execution Date:** November 2026  
> **Status:** Baseline Pre-Implementation Test Report  

---

## 1. Baseline Test Execution Results

The entire backend test suite was executed via Apache Maven Surefire on OpenJDK 21:

```bash
cd backend && mvn test
```

### Official Execution Output
```text
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running com.varellion.store.common.exception.GlobalExceptionHandlerTest
[INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.468 s
[INFO] Running com.varellion.store.security.AuthServiceTest
[INFO] Tests run: 14, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 1.848 s
[INFO] Running com.varellion.store.security.AuthControllerTest
[INFO] Tests run: 8, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 1.740 s
[INFO] Running com.varellion.store.security.JwtServiceTest
[INFO] Tests run: 7, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.134 s
[INFO] Running com.varellion.store.security.RateLimitFilterTest
[INFO] Tests run: 6, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.170 s
[INFO] Running com.varellion.store.security.GoogleTokenVerifierTest
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.082 s
[INFO] Running com.varellion.store.customer.service.CustomerServiceTest
[INFO] Tests run: 12, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.485 s
[INFO] Running com.varellion.store.customer.controller.CustomerControllerTest
[INFO] Tests run: 9, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.548 s
[INFO] Running com.varellion.store.cart.CartServiceTest
[INFO] Tests run: 16, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.362 s
[INFO] Running com.varellion.store.cart.CartControllerTest
[INFO] Tests run: 10, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.528 s
[INFO] Running com.varellion.store.order.service.IdempotencyServiceTest
[INFO] Tests run: 6, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.042 s
[INFO] Running com.varellion.store.order.service.OrderServiceTest
[INFO] Tests run: 18, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.724 s
[INFO] Running com.varellion.store.order.controller.OrderControllerTest
[INFO] Tests run: 9, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.612 s
[INFO] Running com.varellion.store.order.controller.GuestOrderLookupControllerTest
[INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.284 s
[INFO] Running com.varellion.store.admin.order.controller.AdminOrderControllerTest
[INFO] Tests run: 13, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.812 s
[INFO] Running com.varellion.store.admin.catalog.controller.AdminProductControllerTest
[INFO] Tests run: 7, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.615 s
[INFO] Running com.varellion.store.entity.JpaEntityMappingTest
[INFO] Tests run: 5, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 2.283 s
[INFO] Running com.varellion.store.catalog.CategoryControllerTest
[INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.122 s
[INFO] Running com.varellion.store.catalog.CategoryServiceTest
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.114 s
[INFO] Running com.varellion.store.catalog.ProductControllerTest
[INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.157 s
[INFO] Running com.varellion.store.catalog.ProductServiceTest
[INFO] Tests run: 5, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.024 s
[INFO] 
[INFO] Results:
[INFO] 
[INFO] Tests run: 151, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  28.375 s
[INFO] Finished at: 2026-11-16T16:31:55+02:00
[INFO] ------------------------------------------------------------------------
```

---

## 2. Test Suite Breakdown by Module

```
+---------------------------------------+---------------+---------------+---------------+---------------+
| Test Class                            | Tests Run     | Failures      | Errors        | Skipped       |
+---------------------------------------+---------------+---------------+---------------+---------------+
| GlobalExceptionHandlerTest            | 2             | 0             | 0             | 0             |
| AuthServiceTest                       | 14            | 0             | 0             | 0             |
| AuthControllerTest                    | 8             | 0             | 0             | 0             |
| JwtServiceTest                        | 7             | 0             | 0             | 0             |
| RateLimitFilterTest                   | 6             | 0             | 0             | 0             |
| GoogleTokenVerifierTest               | 3             | 0             | 0             | 0             |
| CustomerServiceTest                   | 12            | 0             | 0             | 0             |
| CustomerControllerTest                | 9             | 0             | 0             | 0             |
| CartServiceTest                       | 16            | 0             | 0             | 0             |
| CartControllerTest                    | 10            | 0             | 0             | 0             |
| IdempotencyServiceTest                | 6             | 0             | 0             | 0             |
| OrderServiceTest                      | 18            | 0             | 0             | 0             |
| OrderControllerTest                   | 9             | 0             | 0             | 0             |
| GuestOrderLookupControllerTest        | 4             | 0             | 0             | 0             |
| AdminOrderControllerTest              | 13            | 0             | 0             | 0             |
| AdminProductControllerTest            | 7             | 0             | 0             | 0             |
| JpaEntityMappingTest                  | 5             | 0             | 0             | 0             |
| CategoryControllerTest                | 2             | 0             | 0             | 0             |
| CategoryServiceTest                   | 3             | 0             | 0             | 0             |
| ProductControllerTest                 | 4             | 0             | 0             | 0             |
| ProductServiceTest                    | 5             | 0             | 0             | 0             |
+---------------------------------------+---------------+---------------+---------------+---------------+
| TOTALS                                | 151           | 0             | 0             | 0             |
+---------------------------------------+---------------+---------------+---------------+---------------+
```

---

## 3. Critical Coverage Gaps Identified in Existing Tests

### Gap 1: `AdminProductServiceTest` is Missing (0% Unit Coverage)
- `AdminProductService` contains the catalog business logic (SKU collision, guarded deletion, image management, stock metrics).
- There is **no unit test class** for `AdminProductService`. All controller tests mock the service, leaving internal logic completely untested.

### Gap 2: `PUT /api/admin/products/{productId}` is Untested in Controller Test
- `AdminProductControllerTest` contains tests for `GET`, `POST`, `PATCH`, and `DELETE`, but **completely omits any test case for `PUT`**.

### Gap 3: Missing Inventory Reconciliation Assertions
- `OrderServiceTest` tests that `updateOrderStatus` transitions to `DELIVERED`, records `actorId`, and rejects illegal transitions.
- It contains **zero assertions** regarding `reservedQuantity` decrement on cancellation or `stockQuantity` decrement on shipment (because the feature was never implemented).

### Gap 4: `OrderService.getAdminOrders` is Untested
- `OrderServiceTest` does not test the administrative orders query method or its pagination.

### Gap 5: Parameter Conversion Failures are Untested
- There are no tests verifying behavior when query parameters contain invalid enum strings or malformed UUIDs.

---

## 4. Planned Testing Scope for Phase 3 Implementation

| Planned Test Class | Tests to Add | Coverage Focus |
| :--- | :---: | :--- |
| `OrderServiceTest` | +4 | Inventory release on `CANCELLED`/`EXPIRED`; stock deduction on `SHIPPED`/`DELIVERED`. |
| `GlobalExceptionHandlerTest` | +3 | `MethodArgumentTypeMismatchException` (400), `DataIntegrityViolationException` (400). |
| `AdminProductServiceTest` | +8 | Full CRUD, SKU collisions, category not found, check constraint pre-validation, hard vs soft delete. |
| `AdminProductControllerTest` | +3 | `PUT` endpoint success, stock lower than reserved (400), price 0 active guard (400). |
| `AdminDashboardControllerTest` | +4 | Summary metrics, order status breakdown, sales analytics, 403 Forbidden. |
| `AdminCategoryControllerTest` | +6 | List, Create, Update, Toggle, Guarded Delete with attached products (409). |
| `AdminCustomerControllerTest` | +4 | Paginated directory, profile detail, customer orders, account suspension. |
