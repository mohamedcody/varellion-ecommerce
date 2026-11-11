# Scope: Admin Order Status Update Workflow

## Architecture & Code Layout
- Working directory: `/home/mohamed-saad/Desktop/BRAND/backend`
- Target files:
  1. `OrderStatus.java` (Enum logic only - do NOT rename existing enum constants)
  2. `AdminOrderController.java`
  3. `OrderService.java`
  4. `GlobalExceptionHandler.java` (only if needed to map `ConstraintViolationException` or invalid state transition to `400 Bad Request` using existing response format)
  5. `AdminOrderControllerTest.java` & `OrderServiceTest.java`
- Strict prohibition: Do NOT modify any SQL migration files, DB schemas, JPA entities (`Order.java`, `OrderStatusHistory.java`, etc.), or DTOs (`UpdateOrderStatusRequest`, `OrderResponseDto`, `ApiResponse`).
- If any requirement requires modifying unlisted files, stop immediately and report before making edits.

## Requirements Summary
- **R1. Architectural Guardrails**: Strict file modification whitelist. Preserve `OrderService.updateOrderStatus(orderNumber, newStatus, reason)` signature for backward compatibility.
- **R2. Admin Actor Audit Trail**: Extract actor identifier in `AdminOrderController`, overload `OrderService.updateOrderStatus` with actor identifier parameter, populate `actorId` (UUID) on `OrderStatusHistory`.
- **R3. State Machine & Idempotency**:
  - `OrderStatus.canTransitionTo(OrderStatus nextStatus)`: Terminal states cannot transition; prevent backward transitions.
  - Idempotency in `OrderService`: return mapped `OrderResponseDto` immediately without duplicate `OrderStatusHistory` if status is unchanged.
  - Transition check: throw existing 400 Bad Request exception with clear message if invalid transition.
- **R4. Logging & Validation**:
  - `@Slf4j` and `@Validated` on `AdminOrderController`.
  - `@Pattern(regexp = "^VAR-\\d{8}-\\d{4}$", message = "صيغة رقم الطلب غير صحيحة")` on `@PathVariable String orderNumber`.
  - Audit logging: `log.info("Admin [{}] changed status of order [{}] to [{}] - Reason: {}", actorId, orderNumber, request.getNewStatus(), request.getReason());`.
  - `GlobalExceptionHandler`: map `ConstraintViolationException` to 400 Bad Request using existing response format.
- **R5. Security & Unit Tests**:
  - Spring Security enforcement on `AdminOrderController` (401 anonymous, 403 non-admin, 200 admin, 400 invalid orderNumber pattern).
  - Unit tests for actorId saving, idempotency, invalid state transition exception.

## Verification Resources
- Command: `mvn test`
- Env: `SPRING_DATASOURCE_PASSWORD=test JWT_SECRET=dGVzdC1zZWNyZXQta2V5LW11c3QtYmUtYXQtbGVhc3QtMjU2LWJpdHMtbG9uZw==`
- Working Dir: `/home/mohamed-saad/Desktop/BRAND/backend`
