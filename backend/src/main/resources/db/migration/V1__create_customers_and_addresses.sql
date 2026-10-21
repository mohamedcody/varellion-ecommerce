
-- =========================================================
-- VARELLION
-- Migration: Customers and Customer Addresses
-- Database: PostgreSQL / Supabase
-- =========================================================

BEGIN;

-- =========================================================
-- 1. CUSTOMERS
-- =========================================================

CREATE TABLE public.customers (
    user_id UUID PRIMARY KEY
        REFERENCES auth.users(id) ON DELETE RESTRICT,

    full_name TEXT,

    phone_number TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- 2. CUSTOMER ADDRESSES
-- One saved address per customer in v1
-- =========================================================

CREATE TABLE public.customer_addresses (
    address_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    customer_id UUID NOT NULL UNIQUE
        REFERENCES public.customers(user_id) ON DELETE CASCADE,

    governorate TEXT NOT NULL
        CHECK (length(trim(governorate)) > 0),

    city_area TEXT NOT NULL
        CHECK (length(trim(city_area)) > 0),

    detailed_address TEXT NOT NULL
        CHECK (length(trim(detailed_address)) > 0),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- 3. AUTOMATIC UPDATED_AT
-- =========================================================

CREATE OR REPLACE FUNCTION public.set_customer_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.set_customer_updated_at();

-- =========================================================
-- 4. CREATE CUSTOMER PROFILE AFTER AUTH SIGNUP
-- =========================================================

CREATE OR REPLACE FUNCTION public.handle_new_customer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.customers (user_id, full_name)
    VALUES (
        NEW.id,
        COALESCE(
            NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'full_name'), ''),
            NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'name'), '')
        )
    )
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_customer
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_customer();

-- Prevent direct execution of trigger functions by API roles.
REVOKE ALL ON FUNCTION public.set_customer_updated_at()
    FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.handle_new_customer()
    FROM PUBLIC, anon, authenticated;

-- =========================================================
-- 5. ENABLE ROW LEVEL SECURITY
-- =========================================================

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- 6. CUSTOMERS POLICIES
-- =========================================================

CREATE POLICY customers_select_own
ON public.customers
FOR SELECT
TO authenticated
USING (
    user_id = (SELECT auth.uid())
);

CREATE POLICY customers_update_own
ON public.customers
FOR UPDATE
TO authenticated
USING (
    user_id = (SELECT auth.uid())
)
WITH CHECK (
    user_id = (SELECT auth.uid())
);

-- No direct INSERT or DELETE policy for customers.
-- Customer profiles are created by the Auth trigger.

-- =========================================================
-- 7. CUSTOMER ADDRESSES POLICIES
-- =========================================================

CREATE POLICY customer_addresses_select_own
ON public.customer_addresses
FOR SELECT
TO authenticated
USING (
    customer_id = (SELECT auth.uid())
);

CREATE POLICY customer_addresses_insert_own
ON public.customer_addresses
FOR INSERT
TO authenticated
WITH CHECK (
    customer_id = (SELECT auth.uid())
);

CREATE POLICY customer_addresses_update_own
ON public.customer_addresses
FOR UPDATE
TO authenticated
USING (
    customer_id = (SELECT auth.uid())
)
WITH CHECK (
    customer_id = (SELECT auth.uid())
);

CREATE POLICY customer_addresses_delete_own
ON public.customer_addresses
FOR DELETE
TO authenticated
USING (
    customer_id = (SELECT auth.uid())
);

-- =========================================================
-- 8. GRANTS
-- =========================================================

REVOKE ALL ON TABLE public.customers
    FROM PUBLIC, anon, authenticated;

REVOKE ALL ON TABLE public.customer_addresses
    FROM PUBLIC, anon, authenticated;

GRANT USAGE ON SCHEMA public TO authenticated;

-- Customers: read own profile and update permitted fields only.
GRANT SELECT ON TABLE public.customers TO authenticated;

GRANT UPDATE (full_name, phone_number)
ON TABLE public.customers
TO authenticated;

-- Addresses: authenticated customers manage their own address.
GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.customer_addresses
TO authenticated;

COMMIT;
