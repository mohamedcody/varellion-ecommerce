-- =========================================================
-- VARELLION
-- Migration V8: Decouple Customers from legacy Supabase auth.users
-- and bind directly to internal Spring Security public.users
-- =========================================================

-- 1. Drop legacy foreign key constraint referencing auth.users(id)
ALTER TABLE public.customers
    DROP CONSTRAINT IF EXISTS customers_user_id_fkey;

-- 2. Drop legacy trigger and function on auth.users if exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created_customer'
    ) THEN
        DROP TRIGGER IF EXISTS on_auth_user_created_customer ON auth.users;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;

DROP FUNCTION IF EXISTS public.handle_new_customer();

-- 3. Add direct foreign key link to public.users(id)
ALTER TABLE public.customers
    ADD COLUMN IF NOT EXISTS user_account_id BIGINT
        REFERENCES public.users(id) ON DELETE CASCADE;

-- 4. Create performance index on user_account_id
CREATE INDEX IF NOT EXISTS idx_customers_user_account_id
    ON public.customers(user_account_id);
