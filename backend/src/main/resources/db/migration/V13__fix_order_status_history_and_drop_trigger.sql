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
