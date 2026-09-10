-- ==============================================================================
-- MIGRATION: ENABLE ROW LEVEL SECURITY (RLS) FOR SUPABASE / POSTGRES
-- ==============================================================================
-- This migration ensures that all tables in schema public have Row-Level Security
-- enabled and direct access via PostgREST (anon/authenticated roles) is revoked.
-- NextLMS connects as the postgres/superuser role, which bypasses RLS by default.
-- ==============================================================================

-- 1. Dynamically enable RLS on all current public tables
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

-- 2. Explicitly ensure RLS is enabled for known application tables
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

-- 3. Revoke direct permissions from anon and authenticated roles if they exist (Supabase environment)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
        REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
        REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON ROUTINES FROM anon;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;
        REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated;
        REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM authenticated;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM authenticated;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM authenticated;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON ROUTINES FROM authenticated;
    END IF;
END $$;
