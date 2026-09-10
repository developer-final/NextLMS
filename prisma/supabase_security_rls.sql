-- ==============================================================================
-- SUPABASE SECURITY HARDENING: ROW LEVEL SECURITY (RLS) & ACCESS LOCKDOWN
-- ==============================================================================
-- Purpose:
-- Fix Supabase Security Advisor alert "rls_disabled_in_public (Critical issue)".
-- Prevents unauthorized external access to tables via Supabase's auto-generated
-- PostgREST API (https://<project-ref>.supabase.co/rest/v1/) using anon/authenticated keys.
--
-- Note on NextLMS Compatibility:
-- NextLMS server-side backend connects via Prisma ORM using the "postgres" role.
-- In PostgreSQL / Supabase, the "postgres" role (superuser / table owner) possesses
-- the BYPASSRLS attribute by default. Enabling RLS here completely protects the
-- database from external PostgREST probes while allowing NextLMS full access.
-- ==============================================================================

-- 1. Enable Row-Level Security (RLS) dynamically on all existing public tables
DO $$ 
DECLARE 
    tbl RECORD;
BEGIN 
    FOR tbl IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    ) 
    LOOP 
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl.tablename); 
    END LOOP; 
END $$;

-- 2. Explicitly enforce RLS on all known application tables
ALTER TABLE IF EXISTS "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "courses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "sections" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "lessons" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "attachments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "blog_posts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "tags" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "enrollments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "lesson_progress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "order_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "coupons" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "reviews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "certificates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "verification_tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "commissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "payout_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "knowledge_documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "document_chunks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "_BlogPostToTag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "_CourseToTag" ENABLE ROW LEVEL SECURITY;

-- 3. Revoke all direct permissions from anon and authenticated roles on schema public
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon, authenticated;

-- 4. Ensure future tables created in public schema do not grant permissions to anon/authenticated
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON ROUTINES FROM anon, authenticated;
