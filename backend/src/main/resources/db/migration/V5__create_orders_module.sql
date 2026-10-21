-- ============================================================================
-- VARELLION E-Commerce Database Migration
-- Migration: V5__create_orders_module.sql
-- Description: Create orders, order_items, and order_status_history tables
-- Database: PostgreSQL 15+ (Supabase)
-- ============================================================================

-- ============================================================================
-- TABLE 1: public.orders
-- Master order records with authoritative financial and delivery snapshots
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
    order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Unique human-friendly order identifier (e.g. VAR-20261018-0001)
    order_number VARCHAR(32) NOT NULL UNIQUE
        CHECK (LENGTH(TRIM(order_number)) >= 6),

    -- Customer reference (Registered customer is required for checkout)
    customer_id UUID NOT NULL
        REFERENCES public.customers(user_id)
        ON DELETE RESTRICT,

    -- Immutable Customer Contact Snapshot at time of purchase
    customer_name VARCHAR(150) NOT NULL
        CHECK (LENGTH(TRIM(customer_name)) > 0),
    customer_phone VARCHAR(30) NOT NULL
        CHECK (LENGTH(TRIM(customer_phone)) >= 8),

    -- Immutable Delivery Address Snapshot at time of purchase
    shipping_governorate VARCHAR(100) NOT NULL
        CHECK (LENGTH(TRIM(shipping_governorate)) > 0),
    shipping_city_area VARCHAR(100) NOT NULL
        CHECK (LENGTH(TRIM(shipping_city_area)) > 0),
    shipping_detailed_address TEXT NOT NULL
        CHECK (LENGTH(TRIM(shipping_detailed_address)) > 0),

    -- Financial Calculations (Stored as exact decimals in EGP)
    currency VARCHAR(3) NOT NULL DEFAULT 'EGP'
        CHECK (currency = 'EGP'),
    subtotal NUMERIC(10, 2) NOT NULL
        CHECK (subtotal >= 0),
    discount_total NUMERIC(10, 2) NOT NULL DEFAULT 0.00
        CHECK (discount_total >= 0),
    shipping_fee NUMERIC(10, 2) NULL
        CHECK (shipping_fee IS NULL OR shipping_fee >= 0),
    total_amount NUMERIC(10, 2) NULL
        CHECK (total_amount IS NULL OR total_amount >= 0),

    -- Order Lifecycle & Shipping Statuses
    order_status VARCHAR(50) NOT NULL DEFAULT 'PENDING_CUSTOMER_CONFIRMATION'
        CHECK (order_status IN (
            'PENDING_CUSTOMER_CONFIRMATION',
            'CONFIRMED',
            'PREPARING',
            'SHIPPED',
            'DELIVERED',
            'DELIVERY_FAILED',
            'CANCELLED',
            'EXPIRED',
            'RETURNED',
            'EXCHANGED'
        )),

    shipping_fee_status VARCHAR(30) NOT NULL DEFAULT 'PENDING'
        CHECK (shipping_fee_status IN ('PENDING', 'CONFIRMED')),

    -- Inventory Reservation Expiry (24-hour reservation window)
    confirmation_deadline TIMESTAMPTZ NULL,

    -- Customer and Administrator Notes
    customer_notes TEXT NULL,
    admin_notes TEXT NULL,

    -- Audit Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_confirmation_deadline ON public.orders(confirmation_deadline)
    WHERE order_status = 'PENDING_CUSTOMER_CONFIRMATION';

-- Trigger to update updated_at automatically
CREATE TRIGGER trg_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- ============================================================================
-- TABLE 2: public.order_items
-- Individual product line items with immutable price, cost, and catalog snapshots
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.order_items (
    order_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    order_id UUID NOT NULL
        REFERENCES public.orders(order_id)
        ON DELETE CASCADE,

    -- Retained product reference (RESTRICT protects historical sales from catalog deletion)
    product_id UUID NULL
        REFERENCES public.products(product_id)
        ON DELETE RESTRICT,

    -- Authoritative Catalog Snapshots at time of order creation
    product_name_ar TEXT NOT NULL
        CHECK (LENGTH(TRIM(product_name_ar)) > 0),
    product_name_en TEXT NOT NULL
        CHECK (LENGTH(TRIM(product_name_en)) > 0),
    sku VARCHAR(100) NOT NULL
        CHECK (LENGTH(TRIM(sku)) > 0),

    -- Financial Snapshots (Selling price and Cost price for historical profit reporting)
    unit_price NUMERIC(10, 2) NOT NULL
        CHECK (unit_price >= 0),
    unit_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00
        CHECK (unit_cost >= 0),
    quantity INTEGER NOT NULL
        CHECK (quantity > 0),
    line_total NUMERIC(10, 2) NOT NULL
        CHECK (line_total >= 0),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Prevent duplicate line entries for the same product in a single order
    CONSTRAINT uq_order_product UNIQUE (order_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);


-- ============================================================================
-- TABLE 3: public.order_status_history
-- Append-only audit log tracking every lifecycle transition and responsible actor
-- ============================================================================
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


-- ============================================================================
-- ROW LEVEL SECURITY (RLS) & PRIVILEGE HARDENING
-- ============================================================================
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- 1. Orders: Authenticated customers can view ONLY their own orders
CREATE POLICY "Customers view own orders"
    ON public.orders
    FOR SELECT
    TO authenticated
    USING (customer_id = auth.uid());

-- 2. Order Items: Authenticated customers can view items belonging to their orders
CREATE POLICY "Customers view own order items"
    ON public.order_items
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.order_id = order_items.order_id
            AND o.customer_id = auth.uid()
        )
    );

-- 3. PostgREST Hardening: Client apps cannot directly insert/update/delete orders
-- All business flows (creation, state transitions, cancellations) route through Spring Boot.
REVOKE INSERT, UPDATE, DELETE ON public.orders FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.order_items FROM anon, authenticated;
REVOKE ALL ON public.order_status_history FROM anon, authenticated;
