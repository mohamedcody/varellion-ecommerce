-- ============================================================================
-- VARELLION E-Commerce Database Migration
-- Migration: V12__add_version_to_orders.sql
-- Description: Add version column for optimistic concurrency control on orders
-- Database: PostgreSQL 15+ (Supabase)
-- ============================================================================

ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;
