-- ============================================================================
-- VARELLION E-Commerce Database Migration
-- Migration: V10__cleanup_legacy_auth_and_indexes.sql
-- Description: Decouple order status history from legacy auth, eliminate
--              redundant unique indexes, add catalog compound index,
--              and harden cart tables against direct PostgREST access.
-- Database: PostgreSQL 15+ (Supabase)
-- ============================================================================

-- 1. Drop legacy auth.users foreign key constraint from order_status_history
ALTER TABLE public.order_status_history
    DROP CONSTRAINT IF EXISTS order_status_history_actor_id_fkey;

-- 2. Drop redundant duplicate indexes on columns already indexed by UNIQUE constraints
DROP INDEX IF EXISTS public.idx_users_email;
DROP INDEX IF EXISTS public.idx_users_username;
DROP INDEX IF EXISTS public.idx_customers_user_account_id;

-- 3. Add composite index for active catalog filtering
CREATE INDEX IF NOT EXISTS idx_products_category_active
    ON public.products(category_id, is_active);

-- 4. PostgREST Hardening: Revoke direct client access on shopping cart tables
-- All cart mutations must route exclusively through the Spring Boot API
REVOKE ALL ON public.carts FROM anon, authenticated;
REVOKE ALL ON public.cart_items FROM anon, authenticated;
