
-- =========================================================
-- VARELLION
-- Migration 001: Categories, Products, Product Images
-- PostgreSQL / Supabase
-- =========================================================

BEGIN;

-- ---------------------------------------------------------
-- 1. Shared updated_at trigger function
-- ---------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- ---------------------------------------------------------
-- 2. Categories
-- ---------------------------------------------------------

CREATE TABLE public.categories (
    category_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name_ar TEXT NOT NULL
        CHECK (LENGTH(BTRIM(name_ar)) > 0),

    name_en TEXT NOT NULL
        CHECK (LENGTH(BTRIM(name_en)) > 0),

    slug TEXT NOT NULL UNIQUE
        CHECK (
            slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
        ),

    description_ar TEXT,
    description_en TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------
-- 3. Products
-- ---------------------------------------------------------

CREATE TABLE public.products (
    product_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    category_id UUID NOT NULL,

    name_ar TEXT NOT NULL
        CHECK (LENGTH(BTRIM(name_ar)) > 0),

    name_en TEXT NOT NULL
        CHECK (LENGTH(BTRIM(name_en)) > 0),

    description_ar TEXT,
    description_en TEXT,

    price NUMERIC(10, 2) NOT NULL DEFAULT 0
        CHECK (price >= 0),

    is_active BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_products_category
        FOREIGN KEY (category_id)
        REFERENCES public.categories(category_id)
        ON DELETE RESTRICT,

    -- An active product must have a price greater than zero.
    -- A product must be deactivated before its price is set to zero.
    CONSTRAINT chk_active_product_price
        CHECK (NOT is_active OR price > 0)
);

CREATE INDEX idx_products_category_id
    ON public.products(category_id);

CREATE TRIGGER trg_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------
-- 4. Product Images
-- ---------------------------------------------------------

CREATE TABLE public.product_images (
    image_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    product_id UUID NOT NULL,

    image_url TEXT NOT NULL
        CHECK (LENGTH(BTRIM(image_url)) > 0),

    is_main BOOLEAN NOT NULL DEFAULT FALSE,

    display_order INTEGER NOT NULL DEFAULT 0
        CHECK (display_order >= 0),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_product_images_product
        FOREIGN KEY (product_id)
        REFERENCES public.products(product_id)
        ON DELETE CASCADE
);

CREATE INDEX idx_product_images_product_order
    ON public.product_images(product_id, display_order);

-- Intentionally:
-- No UNIQUE constraint on image_url.
-- No limit on the number of main images per product.
-- Products can exist without images.

-- ---------------------------------------------------------
-- 5. Row Level Security
-- Public can read all catalog records, including inactive ones.
-- Client-side INSERT / UPDATE / DELETE is not granted.
-- ---------------------------------------------------------

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- Categories
CREATE POLICY "Public can read all categories"
ON public.categories
FOR SELECT
TO anon, authenticated
USING (TRUE);

-- Products
CREATE POLICY "Public can read all products"
ON public.products
FOR SELECT
TO anon, authenticated
USING (TRUE);

-- Product images
CREATE POLICY "Public can read all product images"
ON public.product_images
FOR SELECT
TO anon, authenticated
USING (TRUE);

-- Explicitly limit table privileges for client roles.
REVOKE ALL ON TABLE
    public.categories,
    public.products,
    public.product_images
FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE
    public.categories,
    public.products,
    public.product_images
TO anon, authenticated;

COMMIT;
