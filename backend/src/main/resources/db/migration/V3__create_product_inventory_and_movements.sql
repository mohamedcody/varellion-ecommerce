-- ============================================================================
-- VARELLION E-Commerce Database Migration
-- Migration: V3__create_product_inventory_and_movements.sql
-- Description: Add stock inventory tracking, cost price, and SKU to products
-- Database: PostgreSQL 15+ (Supabase)
-- ============================================================================

-- 1. Add inventory, cost, and SKU columns directly to public.products
-- This implements the Lean Inventory Model: a single authoritative source of truth.
ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS sku VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS cost_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (cost_price >= 0),
    ADD COLUMN IF NOT EXISTS stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    ADD COLUMN IF NOT EXISTS reserved_quantity INTEGER NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0);

-- 2. Add constraint: Reserved quantity must never exceed on-hand physical stock
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_stock_available'
    ) THEN
        ALTER TABLE public.products
            ADD CONSTRAINT chk_stock_available CHECK (reserved_quantity <= stock_quantity);
    END IF;
END $$;

-- 3. Create index for fast product lookup by SKU
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
