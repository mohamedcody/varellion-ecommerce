# Dispatch Log

## 2026-11-09T19:46:01Z
Resolve Package B audit system and trigger issues in the VARELLION E-commerce backend by dropping the redundant PostgreSQL trigger in a new Flyway migration, converting order status history actor IDs to BIGINT with a foreign key to users, and resolving real authenticated admin IDs.

Working directory: /home/mohamed-saad/Desktop/BRAND/backend
Integrity mode: development

## Requirements

### R1. Database Migration V13 (Trigger Removal and Foreign Key Constraint)
- Create Flyway migration `V13__fix_order_status_history_and_drop_trigger.sql` without modifying any existing migrations (V1 through V12).
- Drop PostgreSQL trigger `trg_orders_status_history` and trigger function `log_order_status_transition()` on `public.orders`.
- Alter `public.order_status_history.actor_id` from UUID to `BIGINT`, setting existing legacy non-numeric `actor_id` values to NULL during the column alteration so the migration cleanly succeeds without type conversion errors on historical records.
- Add a foreign key constraint on `public.order_status_history(actor_id)` referencing `public.users(id) ON DELETE SET NULL`.

### R2. JPA Entity and Audit History Management
- Update `OrderStatusHistory` JPA entity to represent `actorId` as `Long` referencing the user ID, aligning with `public.users(id)`.
- Ensure `OrderService.updateOrderStatus` serves as the authoritative creator of order status history entries, preventing duplicate history records.
- Preserve existing working code and unstaged changes across the repository.

### R3. Authenticated Admin Actor Identity Resolution
- In `AdminOrderController.java`, resolve the authenticated admin's real `Long id` from `CustomUserDetails` / `User` rather than generating synthetic MD5 UUID hashes from the username.
- Pass the resolved `Long actorId` to `OrderService.updateOrderStatus` so real admin user IDs are recorded in `order_status_history`.

## Acceptance Criteria

### Migration & Database Integrity
- [ ] Flyway migration `V13__fix_order_status_history_and_drop_trigger.sql` executes cleanly without errors.
- [ ] Existing migrations `V1` through `V12` remain unmodified.
- [ ] PostgreSQL trigger `trg_orders_status_history` and trigger function `log_order_status_transition()` are dropped.
- [ ] `public.order_status_history.actor_id` is altered to `BIGINT` with foreign key `REFERENCES public.users(id) ON DELETE SET NULL`.

### Audit History & Actor Resolution
- [ ] Updating an order's status records the authentic `Long` user ID of the authenticated admin in `order_status_history.actor_id`.
- [ ] Order status transitions create exactly one audit entry in `order_status_history` without duplicate trigger-generated entries or wiping `actor_id` to NULL.

### Test Suite Execution
- [ ] All backend unit and integration tests compile and pass via `mvn -f backend/pom.xml test`.
- [ ] Existing working code and unstaged git changes remain preserved.
