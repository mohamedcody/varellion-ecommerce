-- =========================================================
-- VARELLION
-- Migration V7: Secure users table with RLS
-- SECURITY FIX: Prevent PostgREST/Supabase public API
-- from exposing user records (emails, hashes, roles)
-- =========================================================

-- Enable Row Level Security on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;

-- Revoke all access from Supabase public API roles
-- Only the service_role (used by the Spring Boot backend) should access this table
REVOKE ALL ON TABLE public.users FROM anon, authenticated;

-- Revoke sequence access to prevent enumeration
REVOKE ALL ON SEQUENCE public.users_id_seq FROM anon, authenticated;
