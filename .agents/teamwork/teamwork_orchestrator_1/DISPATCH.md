## 2026-11-06T20:24:08Z

Resolve the audit trail, state-machine transition, validation, and security testing issues in the Admin Order Status Update workflow.

Working directory: /home/mohamed-saad/Desktop/BRAND/backend
Integrity mode: development

## Requirements

### R1. Architectural Guardrails and Target Scope
- Do NOT modify any SQL migration files (Flyway/Liquibase), database schemas, or JPA `@Entity` structure (`Order.java`, `OrderStatusHistory.java`, etc.). Use existing fields as they already exist.
- Do NOT add, remove, or rename fields in any Request or Response DTOs (`UpdateOrderStatusRequest`, `OrderResponseDto`, `ApiResponse`). The API contract must remain 100% unchanged.
- Modify ONLY the allowed target files:
  1. `OrderStatus.java` (Enum logic only - do NOT rename existing enum constants)
  2. `AdminOrderController.java`
  3. `OrderService.java`
  4. `GlobalExceptionHandler.java` (only if needed to map `ConstraintViolationException` or invalid state transition to `400 Bad Request` using the existing response format)
  5. `AdminOrderControllerTest.java` & `OrderServiceTest.java`
- If fulfilling any requirement requires modifying unlisted files, stop immediately and report before making edits.
- Maintain backward compatibility in `OrderService` by keeping the existing `updateOrderStatus(orderNumber, newStatus, reason)` signature intact (e.g., via method overloading).

### R2. Admin Actor Audit Trail
- In `AdminOrderController.updateOrderStatus`: Extract the actor identifier from the authenticated admin user safely without breaking existing signature contracts for HTTP clients.
- In `OrderService`: Overload `updateOrderStatus(String orderNumber, OrderStatus newStatus, String reason, ...)` with an actor identifier parameter, and keep the existing 3-argument method delegating to it so existing callers do not break.
- Populate `actorId` on `OrderStatusHistory` within the strict guardrails (the implementing team decides the mapping approach given that `OrderStatusHistory.actorId` is a `UUID`).

### R3. State Machine & Idempotency
- In `OrderStatus.java`: Add helper method `public boolean canTransitionTo(OrderStatus nextStatus)` without altering existing enum names:
  - Terminal states (`DELIVERED`, `CANCELLED`, etc.) cannot transition to any state.
  - Prevent illogical backward transitions (e.g., `CONFIRMED` -> `PENDING_PAYMENT`).
- In `OrderService.updateOrderStatus`:
  - Idempotency (No-op): If `order.getOrderStatus() == newStatus`, return the mapped `OrderResponseDto` immediately without saving a duplicate `OrderStatusHistory` record.
  - Transition Check: If `!currentStatus.canTransitionTo(newStatus)`, throw the project's existing 400 Bad Request exception with a clear message.

### R4. Logging & PathVariable Validation
- In `AdminOrderController`:
  - Add `@Slf4j` and `@Validated`.
  - Add `@Pattern(regexp = "^VAR-\\d{8}-\\d{4}$", message = "صيغة رقم الطلب غير صحيحة")` on `@PathVariable String orderNumber`.
  - Add audit logging: `log.info("Admin [{}] changed status of order [{}] to [{}] - Reason: {}", actorId, orderNumber, request.getNewStatus(), request.getReason());`.
- In `GlobalExceptionHandler`: Handle `ConstraintViolationException` and return `400 Bad Request` using the existing response format.

### R5. Security & Unit Tests
- Keep existing unit tests passing and add tests covering:
  1. `actorId` properly saved in `OrderStatusHistory`.
  2. Idempotency (updating to the same status produces no duplicate history saved).
  3. Invalid state transition throwing a 400 Bad Request exception.
  4. Spring Security enforcement on `AdminOrderController` (`401 Unauthorized` for anonymous, `403 Forbidden` for `ROLE_USER`, `200 OK` for `ROLE_ADMIN`, and `400 Bad Request` for invalid `orderNumber` pattern).

## Verification Resources
- Run tests via `mvn test` with environment variables `SPRING_DATASOURCE_PASSWORD=test JWT_SECRET=dGVzdC1zZWNyZXQta2V5LW11c3QtYmUtYXQtbGVhc3QtMjU2LWJpdHMtbG9uZw==` in directory `/home/mohamed-saad/Desktop/BRAND/backend`.
