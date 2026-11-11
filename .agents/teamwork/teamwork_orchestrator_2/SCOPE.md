# Scope: Package B Audit System and Trigger Issues

## Architecture
- Backend: Spring Boot (Java, Maven), Flyway migrations, JPA/Hibernate, PostgreSQL / H2 test DB.
- Target components:
  - Flyway migration `V13__fix_order_status_history_and_drop_trigger.sql` in `backend/src/main/resources/db/migration/`.
  - JPA Entity `OrderStatusHistory.java` (convert `actorId` to `Long`).
  - Service `OrderService.java` (`updateOrderStatus` authoritative creation of `OrderStatusHistory`, avoiding duplicates).
  - Controller `AdminOrderController.java` (extract authentic `Long id` from `CustomUserDetails` / `User` instead of synthetic MD5 UUID).
  - Tests in `backend/src/test/` to verify migrations, audit transitions, actor IDs, and clean build.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | V13 Migration | Drop trigger `trg_orders_status_history`, drop function `log_order_status_transition()`, alter `actor_id` to `BIGINT` (handling non-numeric as NULL), add FK to `users(id) ON DELETE SET NULL` | M1 | ORIGINAL_REQUEST § R1 |
| 2 | JPA Entity Update | Update `OrderStatusHistory` JPA entity: `actorId` type `Long`, matching `users(id)` | M1 | ORIGINAL_REQUEST § R2 |
| 3 | OrderService Audit Creation | Ensure `OrderService.updateOrderStatus` is the authoritative creator of history records, no duplicate trigger entries | M1 | ORIGINAL_REQUEST § R2 |
| 4 | Admin Actor ID Resolution | Extract authentic `Long id` from `CustomUserDetails`/`User` in `AdminOrderController`, pass to `OrderService` | M1 | ORIGINAL_REQUEST § R3 |
| 5 | Verification & Tests | Ensure all unit/integration tests pass with `mvn -f backend/pom.xml test` and preserve unstaged changes | M1 | ORIGINAL_REQUEST § Acceptance Criteria |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Package B Resolution | V13 Migration, JPA entity update, AdminOrderController resolution, OrderService audit history, and full test suite pass | none | DONE |
