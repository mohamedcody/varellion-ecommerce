# Milestone 1 Exploration Report: Flyway Migration V13 & Schema Alignment

## 1. Observation

### 1.1 Existing Flyway Migrations Inventory (`backend/src/main/resources/db/migration/`)
A direct inspection of `backend/src/main/resources/db/migration/` revealed 12 migration files:
- `V1__create_customers_and_addresses.sql` (5,216 bytes)
- `V2__create_categories.sql` (4,677 bytes)
- `V3__create_product_inventory_and_movements.sql` (1,393 bytes)
- `V4__create_carts_and_cart_items.sql` (3,602 bytes)
- `V5__create_orders_module.sql` (7,741 bytes)
- `V6__create_users_table.sql` (926 bytes)
- `V7__secure_users_table.sql` (752 bytes)
- `V8__decouple_customers_from_auth_users.sql` (1,483 bytes)
- `V9__seed_catalog_products.sql` (8,712 bytes)
- `V10__cleanup_legacy_auth_and_indexes.sql` (1,363 bytes)
- `V11__add_order_status_history_trigger.sql` (1,666 bytes)
- `V12__add_version_to_orders.sql` (458 bytes)

### 1.2 Creation & History of `order_status_history` and `actor_id`
1. **Creation in `V5__create_orders_module.sql` (lines 142–163)**:
   ```sql
   CREATE TABLE IF NOT EXISTS public.order_status_history (
       history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

       order_id UUID NOT NULL
           REFERENCES public.orders(order_id)
           ON DELETE CASCADE,

       previous_status VARCHAR(50) NULL,
       new_status VARCHAR(50) NOT NULL,
       reason TEXT NULL,

       -- Actor ID references auth.users(id) for human admin, or NULL for background system jobs
       actor_id UUID NULL
           REFERENCES auth.users(id)
           ON DELETE SET NULL,

       created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );

   CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id
       ON public.order_status_history(order_id, created_at ASC);
   ```
   - In `V5`, `actor_id` was created as `UUID NULL` with an inline foreign key constraint referencing legacy Supabase `auth.users(id) ON DELETE SET NULL` (auto-named by PostgreSQL as `order_status_history_actor_id_fkey`).

2. **Decoupling in `V10__cleanup_legacy_auth_and_indexes.sql` (lines 10–13)**:
   ```sql
   -- 1. Drop legacy auth.users foreign key constraint from order_status_history
   ALTER TABLE public.order_status_history
       DROP CONSTRAINT IF EXISTS order_status_history_actor_id_fkey;
   ```
   - In `V10`, the foreign key constraint referencing `auth.users(id)` was dropped, but the column `actor_id` was **never altered**. It remained `UUID NULL` in PostgreSQL.

3. **Creation of Internal `public.users` in `V6__create_users_table.sql` (lines 7–19)**:
   ```sql
   CREATE TABLE IF NOT EXISTS public.users (
       id BIGSERIAL PRIMARY KEY,
       email VARCHAR(150) NOT NULL UNIQUE,
       username VARCHAR(150) NOT NULL UNIQUE,
       password VARCHAR(255) NOT NULL,
       role VARCHAR(20) NOT NULL DEFAULT 'USER',
       enabled BOOLEAN NOT NULL DEFAULT TRUE,
       email_verified BOOLEAN NOT NULL DEFAULT FALSE,
       failed_attempts INTEGER NOT NULL DEFAULT 0,
       lockout_time TIMESTAMPTZ,
       created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
       updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );
   ```
   - `public.users.id` is `BIGSERIAL` (underlying type: `BIGINT`).

4. **Trigger Definition in `V11__add_order_status_history_trigger.sql` (lines 7–48)**:
   ```sql
   CREATE OR REPLACE FUNCTION public.log_order_status_transition()
   RETURNS TRIGGER
   SECURITY DEFINER
   SET search_path = public
   AS $$
   BEGIN
       IF (TG_OP = 'UPDATE' AND OLD.order_status IS DISTINCT FROM NEW.order_status) THEN
           -- Prevent duplicate entries if the application layer or another trigger already logged this transition
           IF NOT EXISTS (
               SELECT 1 FROM public.order_status_history
               WHERE order_id = NEW.order_id
                 AND new_status = NEW.order_status
                 AND created_at >= NOW() - INTERVAL '2 seconds'
           ) THEN
               INSERT INTO public.order_status_history (
                   order_id,
                   previous_status,
                   new_status,
                   reason,
                   actor_id,
                   created_at
               ) VALUES (
                   NEW.order_id,
                   OLD.order_status,
                   NEW.order_status,
                   'Status updated to ' || NEW.order_status,
                   NULL,
                   NOW()
               );
           END IF;
       END IF;
       RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;

   DROP TRIGGER IF EXISTS trg_orders_status_history ON public.orders;

   CREATE TRIGGER trg_orders_status_history
   AFTER UPDATE OF order_status ON public.orders
   FOR EACH ROW
   EXECUTE FUNCTION public.log_order_status_transition();
   ```
   - Verbatim trigger name: `trg_orders_status_history` on table `public.orders`.
   - Verbatim trigger function: `public.log_order_status_transition()`.
   - The trigger unconditionally sets `actor_id` to `NULL` (line 33).

### 1.3 Dialect Handling in Database Migrations and Tests
1. **Migration Dialect**:
   - All migrations `V1` through `V12` target **PostgreSQL 15+ (Supabase)** exclusively.
   - Header comments uniformly declare `-- Database: PostgreSQL 15+ (Supabase)`.
   - Migrations use PL/pgSQL language constructs (`$$ LANGUAGE plpgsql`), PostgreSQL UUID generator `gen_random_uuid()`, PostgreSQL row-level security (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`), and role privileges (`REVOKE ... FROM anon, authenticated`).
   - There are **no H2 or multi-dialect abstractions** inside Flyway migrations.
2. **Spring Boot Production Database Configuration (`backend/src/main/resources/application.properties`)**:
   - `spring.datasource.driver-class-name=org.postgresql.Driver`
   - `spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect`
   - `spring.jpa.hibernate.ddl-auto=validate`
   - `spring.flyway.enabled=true`
   - `spring.flyway.baseline-on-migrate=true`
   - `spring.flyway.locations=classpath:db/migration`
3. **Test Database Configuration (`backend/src/test/resources/application-test.properties`)**:
   - `spring.datasource.url=jdbc:h2:mem:varellion_test;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH`
   - `spring.datasource.driver-class-name=org.h2.Driver`
   - `spring.jpa.database-platform=org.hibernate.dialect.H2Dialect`
   - `spring.jpa.hibernate.ddl-auto=create-drop`
   - `spring.flyway.enabled=false`
   - Flyway is explicitly **disabled** during tests (`spring.flyway.enabled=false`). The schema is created in-memory by Hibernate from JPA entity mappings.
4. **Testcontainers / Offline Testing**:
   - No Testcontainers dependency exists in `backend/pom.xml`. Test suite runs against offline H2 in PostgreSQL compatibility mode.

---

## 2. Logic Chain

1. **Why the Trigger Must Be Dropped**:
   - As observed in `OrderService.java` (lines 475–488), the application layer (`OrderService.updateOrderStatus`) programmatically creates an `OrderStatusHistory` entry, populating the authentic `actorId` and administrative `reason`.
   - When `orderRepository.save(order)` is invoked, Hibernate updates `public.orders.order_status`.
   - Concurrently, PostgreSQL fires `trg_orders_status_history`, executing `log_order_status_transition()`. The trigger executes an `INSERT INTO public.order_status_history` setting `actor_id = NULL` and `reason = 'Status updated to ' || NEW.order_status`.
   - Because of transaction boundaries and timing in PostgreSQL, the trigger's `NOT EXISTS (... created_at >= NOW() - INTERVAL '2 seconds')` guard can race with Hibernate's entity insertion, creating duplicate status history rows and wiping or corrupting the actor attribution to `NULL`.
   - Dropping `trg_orders_status_history` and `log_order_status_transition()` eliminates the database-side race condition, ensuring `OrderService` is the sole, authoritative source of audit history records.

2. **Why `actor_id` Must Be Altered to BIGINT and How to Handle Historical Data**:
   - `public.users.id` is `BIGSERIAL` (`BIGINT`), and `CustomUserDetails.getId()` returns `Long`.
   - In `order_status_history`, `actor_id` is currently `UUID NULL` (V5 & V10).
   - In PostgreSQL, altering a `UUID` column directly to `BIGINT` via `ALTER COLUMN actor_id TYPE BIGINT` fails immediately because there is no direct type cast from `uuid` to `bigint`.
   - Furthermore, PostgreSQL does not define an operator `uuid ~ text`. Running `actor_id ~ '^[0-9]+$'` on a `UUID` column causes `ERROR: operator does not exist: uuid ~ unknown`.
   - Therefore, casting to text first (`actor_id::text ~ '^[0-9]+$'`) is required.
   - For historical UUIDs (such as synthetic MD5 UUIDs from `nameUUIDFromBytes`), `actor_id::text` contains hyphens and hex characters and will not match `'^[0-9]+$'`. Evaluating with `USING (CASE WHEN actor_id::text ~ '^[0-9]+$' THEN (actor_id::text)::bigint ELSE NULL END)` safely converts all UUIDs, non-numeric strings, and existing NULLs to `NULL`, while preserving any valid numeric values without raising invalid syntax exceptions.

3. **Why Orphan Cleansing Is Required Prior to Adding Foreign Key**:
   - If historical records contain non-null numeric values in `actor_id` that do not exist in `public.users(id)`, executing `ALTER TABLE ... ADD CONSTRAINT ... REFERENCES public.users(id)` will fail with a foreign key violation.
   - Running an idempotent cleanup:
     ```sql
     UPDATE public.order_status_history
     SET actor_id = NULL
     WHERE actor_id IS NOT NULL
       AND NOT EXISTS (
           SELECT 1 FROM public.users u WHERE u.id = order_status_history.actor_id
       );
     ```
     guarantees that adding the foreign key constraint referencing `public.users(id) ON DELETE SET NULL` will always succeed cleanly.

4. **Impact on Hibernate Validation and JPA Entities**:
   - In production, `application.properties` sets `spring.jpa.hibernate.ddl-auto=validate`.
   - Once Flyway migration V13 changes `actor_id` to `BIGINT`, Hibernate requires `OrderStatusHistory.actorId` in Java to match `BIGINT` (`Long`).
   - Updating `OrderStatusHistory.java` to `private Long actorId;` will satisfy Hibernate validation.
   - In `application-test.properties`, `spring.jpa.hibernate.ddl-auto=create-drop` will generate `actor_id bigint` in H2 matching the updated Java entity.

---

## 3. Caveats

1. **Unstaged Working Tree Changes**:
   - The workspace currently contains unstaged changes in `backend/src/main/java/com/varellion/store/order/service/OrderService.java`, `backend/src/test/java/com/varellion/store/order/service/OrderServiceTest.java`, and `backend/src/test/resources/application-test.properties`.
   - As an explorer agent, no repository files have been edited. The implementation agent must preserve all unstaged changes during Milestone 1 execution.
2. **Flyway Execution Scope**:
   - Flyway is executed in production / CI environments with PostgreSQL. In local unit/integration tests running with `mvn test`, `spring.flyway.enabled=false` is active in `application-test.properties`.
3. **Database Indexing**:
   - Adding `CREATE INDEX IF NOT EXISTS idx_order_status_history_actor_id ON public.order_status_history(actor_id);` is recommended alongside the foreign key constraint to optimize foreign key lookups and cascading operations (`ON DELETE SET NULL`).

---

## 4. Conclusion & Proposed Migration Specification

### 4.1 Migration File Name & Location
- **Path**: `backend/src/main/resources/db/migration/V13__fix_order_status_history_and_drop_trigger.sql`

### 4.2 Exact SQL Content for Migration V13
```sql
-- ============================================================================
-- VARELLION E-Commerce Database Migration
-- Migration: V13__fix_order_status_history_and_drop_trigger.sql
-- Description: Drop redundant order status history trigger and function, alter
--              actor_id from UUID to BIGINT, and add foreign key referencing
--              public.users(id) ON DELETE SET NULL.
-- Database: PostgreSQL 15+ (Supabase)
-- ============================================================================

-- 1. Drop redundant PostgreSQL trigger on public.orders
DROP TRIGGER IF EXISTS trg_orders_status_history ON public.orders;

-- 2. Drop trigger function
DROP FUNCTION IF EXISTS public.log_order_status_transition();

-- 3. Safely alter order_status_history.actor_id from UUID to BIGINT
--    Non-numeric strings (e.g. historical UUIDs) and existing NULLs convert to NULL.
ALTER TABLE public.order_status_history
    ALTER COLUMN actor_id TYPE BIGINT
    USING (
        CASE
            WHEN actor_id::text ~ '^[0-9]+$' THEN (actor_id::text)::bigint
            ELSE NULL
        END
    );

-- 4. Clean up any historical actor_id values that do not correspond to valid users
--    ensuring the foreign key constraint addition succeeds without violation.
UPDATE public.order_status_history
SET actor_id = NULL
WHERE actor_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM public.users u WHERE u.id = order_status_history.actor_id
  );

-- 5. Drop any existing foreign key constraint if present, then add new constraint
ALTER TABLE public.order_status_history
    DROP CONSTRAINT IF EXISTS fk_order_status_history_actor_id,
    DROP CONSTRAINT IF EXISTS order_status_history_actor_id_fkey;

ALTER TABLE public.order_status_history
    ADD CONSTRAINT fk_order_status_history_actor_id
    FOREIGN KEY (actor_id)
    REFERENCES public.users(id)
    ON DELETE SET NULL;

-- 6. Add performance index on foreign key column actor_id
CREATE INDEX IF NOT EXISTS idx_order_status_history_actor_id
    ON public.order_status_history(actor_id);
```

### 4.3 Summary of Downstream Changes for Implementation Agents
1. **`OrderStatusHistory.java`**:
   - Change `private UUID actorId;` to `private Long actorId;`.
   - Update builder method signature from `UUID actorId` to `Long actorId`.
2. **`OrderService.java`**:
   - Change `updateOrderStatus(String orderNumber, OrderStatus newStatus, String reason, UUID actorId)` to accept `Long actorId`.
   - Update backward-compatible overload `updateOrderStatus(..., (Long) null)`.
3. **`AdminOrderController.java`**:
   - Replace MD5 hash generation `resolveActorUuid(actorId)` with direct extraction of `Long id` from `CustomUserDetails` (or lookup via `UserRepository` when principal is standard `UserDetails`).
4. **`JpaEntityMappingTest.java`**:
   - In `testOrderLifecyclePersistence`, change `.actorId(customer.getUserId())` (which is `UUID`) to `.actorId(null)` or customer's `userAccountId` (`Long`).
5. **`OrderServiceTest.java`**:
   - Update `UUID actorId = UUID.randomUUID()` to `Long actorId = 1L`.

---

## 5. Verification Method

### 5.1 Syntax Verification
1. Inspect `V13__fix_order_status_history_and_drop_trigger.sql` against PostgreSQL 15 DDL specification.
2. Confirm the regex cast `actor_id::text ~ '^[0-9]+$'` evaluates correctly without type mismatch against `UUID` column types.

### 5.2 Application & Test Compilation Verification
Execute the test command from the repository root:
```bash
mvn -f backend/pom.xml test
```
- Expected result: All unit and integration tests compile cleanly and pass.
- Invalidation conditions: Any compilation error in `JpaEntityMappingTest`, `OrderServiceTest`, or `AdminOrderControllerTest` regarding `UUID` vs `Long` type mismatch for `actorId`.
