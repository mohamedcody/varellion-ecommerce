-- ============================================================================
-- VARELLION E-Commerce Database Migration
-- Migration: V4__create_carts_and_cart_items.sql
-- Description: Create shopping cart and cart items for registered customers
-- Database: PostgreSQL 15+ (Supabase)
-- ============================================================================

-- ============================================================================
-- TABLE 1: public.carts
-- Active shopping cart belonging to a registered customer (1:1 relationship)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.carts (
    cart_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    customer_id UUID NOT NULL UNIQUE
        REFERENCES public.customers(user_id)
        ON DELETE CASCADE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to automatically update updated_at (reusing function from V2)
CREATE TRIGGER trg_carts_updated_at
BEFORE UPDATE ON public.carts
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- ============================================================================
-- TABLE 2: public.cart_items
-- Individual product items within a customer's cart
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.cart_items (
    cart_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    cart_id UUID NOT NULL
        REFERENCES public.carts(cart_id)
        ON DELETE CASCADE,

    product_id UUID NOT NULL
        REFERENCES public.products(product_id)
        ON DELETE CASCADE,

    quantity INTEGER NOT NULL
        CHECK (quantity > 0),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Ensure a product can only appear once in a cart (enforce quantity increments)
    CONSTRAINT uq_cart_product UNIQUE (cart_id, product_id)
);

-- Fast lookup indexes
CREATE INDEX idx_cart_items_cart_id ON public.cart_items(cart_id);
CREATE INDEX idx_cart_items_product_id ON public.cart_items(product_id);

-- Trigger to automatically update updated_at
CREATE TRIGGER trg_cart_items_updated_at
BEFORE UPDATE ON public.cart_items
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- 1. Carts Policy: Customers can only view and manage their own cart
CREATE POLICY "Users can manage own cart"
    ON public.carts
    FOR ALL
    TO authenticated
    USING (customer_id = auth.uid())
    WITH CHECK (customer_id = auth.uid());

-- 2. Cart Items Policy: Customers can only view and manage items in their own cart
CREATE POLICY "Users can manage own cart items"
    ON public.cart_items
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.carts c
            WHERE c.cart_id = cart_items.cart_id
            AND c.customer_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.carts c
            WHERE c.cart_id = cart_items.cart_id
            AND c.customer_id = auth.uid()
        )
    );

-- 3. Anonymous users cannot access carts directly via PostgREST
REVOKE ALL ON public.carts FROM anon;
REVOKE ALL ON public.cart_items FROM anon;
