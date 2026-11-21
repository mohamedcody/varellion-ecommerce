# Worker Dispatch: Admin Order Status Update Implementation

## Working Directory
`/home/mohamed-saad/Desktop/BRAND/.agents/teamwork/teamwork_worker_r1_1`

## Mandatory Files to Read First
1. `/home/mohamed-saad/Desktop/BRAND/.agents/teamwork/ORIGINAL_REQUEST.md`
2. `/home/mohamed-saad/Desktop/BRAND/.agents/teamwork/teamwork_orchestrator_1/SCOPE.md`
3. Explorer Reports:
   - `/home/mohamed-saad/Desktop/BRAND/.agents/teamwork/teamwork_explorer_r1_1/handoff.md`
   - `/home/mohamed-saad/Desktop/BRAND/.agents/teamwork/teamwork_explorer_r1_2/handoff.md`
   - `/home/mohamed-saad/Desktop/BRAND/.agents/teamwork/teamwork_explorer_r1_3/handoff.md`

## Write Ownership & Strict Whitelist
You are permitted to modify ONLY these 5 files:
1. `backend/src/main/java/com/varellion/store/order/entity/OrderStatus.java`
2. `backend/src/main/java/com/varellion/store/admin/order/controller/AdminOrderController.java`
3. `backend/src/main/java/com/varellion/store/order/service/OrderService.java`
4. `backend/src/main/java/com/varellion/store/common/exception/GlobalExceptionHandler.java`
5. `backend/src/test/java/com/varellion/store/admin/order/controller/AdminOrderControllerTest.java` and `backend/src/test/java/com/varellion/store/order/service/OrderServiceTest.java`

DO NOT modify any database migrations, schemas, JPA entities (`Order.java`, `OrderStatusHistory.java`, etc.), or DTOs (`UpdateOrderStatusRequest`, `OrderResponseDto`, `ApiResponse`).

## Specific Tasks
1. `OrderStatus.java`:
   - Add `public boolean canTransitionTo(OrderStatus nextStatus)`:
     - Return `false` if `nextStatus == null` or `nextStatus == this`.
     - Terminal states (`DELIVERED`, `CANCELLED`, `EXPIRED`, `RETURNED`, `EXCHANGED`) cannot transition to any state (`false`).
     - Illogical backward transitions (e.g., `CONFIRMED -> PENDING_CUSTOMER_CONFIRMATION`, `PREPARING -> CONFIRMED`, etc.) must return `false`.
     - Allowed forward transitions per explorer reports.
2. `AdminOrderController.java`:
   - Add `@Slf4j` and `@Validated` annotations.
   - On `@PathVariable String orderNumber`: add `@Pattern(regexp = "^VAR-\\d{8}-\\d{4}$", message = "صيغة رقم الطلب غير صحيحة")`.
   - Extract actor identifier safely: check `Authentication` parameter and fallback to `SecurityContextHolder.getContext().getAuthentication()`. Handle `UserDetails` / String without `ClassCastException`.
   - Add audit log: `log.info("Admin [{}] changed status of order [{}] to [{}] - Reason: {}", actorId, orderNumber, request.getNewStatus(), request.getReason());`.
   - Resolve `actorUuid` deterministically (e.g. `UUID.nameUUIDFromBytes(...)` or `UUID.fromString(...)` if valid UUID string).
   - Call overloaded `orderService.updateOrderStatus(orderNumber, request.getNewStatus(), request.getReason(), actorUuid)`.
3. `OrderService.java`:
   - Keep existing 3-arg method `public OrderResponseDto updateOrderStatus(String orderNumber, OrderStatus newStatus, String reason)` delegating to `updateOrderStatus(orderNumber, newStatus, reason, (UUID) null)`.
   - Implement overloaded 4-arg method `public OrderResponseDto updateOrderStatus(String orderNumber, OrderStatus newStatus, String reason, UUID actorId)`:
     - Retrieve order;
     - Idempotency check: if `order.getOrderStatus() == newStatus`, log and immediately return `mapToDto(order)` WITHOUT creating `OrderStatusHistory` or calling `orderRepository.save(order)`;
     - State machine validation: if `!order.getOrderStatus().canTransitionTo(newStatus)`, throw `new BusinessException(...)` (which maps to 400 Bad Request);
     - Set new status, build `OrderStatusHistory` with `actorId(actorId)`, add to order, save, and return `mapToDto(savedOrder)`.
4. `GlobalExceptionHandler.java`:
   - Add `@ExceptionHandler(jakarta.validation.ConstraintViolationException.class)` (and `HandlerMethodValidationException.class`) returning HTTP 400 Bad Request with `ErrorResponse` containing validation errors.
5. `AdminOrderControllerTest.java` & `OrderServiceTest.java`:
   - Keep existing tests passing. Note: In `AdminOrderControllerTest`, update the order number in the "not found" test from `"VAR-NONEXISTENT"` to a valid pattern (e.g. `"VAR-99999999-9999"`) so it doesn't fail pattern validation when testing 404.
   - Add tests for:
     - `actorId` properly saved in `OrderStatusHistory`.
     - Idempotency (updating to same status does not save duplicate history).
     - Invalid state transition throws 400 Bad Request exception (`BusinessException`).
     - Spring Security enforcement on `AdminOrderController` (401 Unauthorized for anonymous, 403 Forbidden for `ROLE_USER`, 200 OK for `ROLE_ADMIN`, 400 Bad Request for invalid order number pattern).

## Verification Command
Run and verify:
`cd /home/mohamed-saad/Desktop/BRAND/backend && SPRING_DATASOURCE_PASSWORD=test JWT_SECRET=dGVzdC1zZWNyZXQta2V5LW11c3QtYmUtYXQtbGVhc3QtMjU2LWJpdHMtbG9uZw== mvn test`
All tests must pass.
Report results in `handoff.md`.


## 2026-11-06T20:44:41Z
Received dispatch message:
- You are teamwork_worker_r1_1.
- Working directory: /home/mohamed-saad/Desktop/BRAND/.agents/teamwork/teamwork_worker_r1_1
- Strict File Whitelist:
  - backend/src/main/java/com/varellion/store/order/entity/OrderStatus.java
  - backend/src/main/java/com/varellion/store/admin/order/controller/AdminOrderController.java
  - backend/src/main/java/com/varellion/store/order/service/OrderService.java
  - backend/src/main/java/com/varellion/store/common/exception/GlobalExceptionHandler.java
  - backend/src/test/java/com/varellion/store/admin/order/controller/AdminOrderControllerTest.java
  - backend/src/test/java/com/varellion/store/order/service/OrderServiceTest.java
- Tasks: R1 through R5 implementation and verification.
