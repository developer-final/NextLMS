-- ==============================================================================
-- SUPABASE PG_CRON SETUP SCRIPT FOR E-LEARNING SAAS
-- ==============================================================================
-- Instructions:
-- 1. Open your Supabase Dashboard -> Select your Project.
-- 2. Go to "SQL Editor" on the left navigation menu.
-- 3. Paste this script and click "Run".
-- ==============================================================================

-- Step 1: Enable the pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage on cron schema to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;

-- ==============================================================================
-- JOB 1: CANCEL STALE PENDING ORDERS (Runs every hour at minute 0)
-- Any order that remains PENDING for more than 24 hours will automatically be
-- marked as CANCELLED to free up reserved resources and maintain clean reports.
-- ==============================================================================
SELECT cron.unschedule('cancel-stale-pending-orders') 
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cancel-stale-pending-orders');

SELECT cron.schedule(
  'cancel-stale-pending-orders',
  '0 * * * *', -- At minute 0 of every hour
  $$
    UPDATE "orders"
    SET 
      "status" = 'CANCELLED',
      "adminNote" = COALESCE("adminNote", '') || ' [Auto-cancelled by Supabase pg_cron: Pending expired after 24 hours]',
      "updatedAt" = NOW()
    WHERE 
      "status" = 'PENDING' 
      AND "createdAt" < NOW() - INTERVAL '24 hours';
  $$
);

-- ==============================================================================
-- JOB 2: CLEANUP EXPIRED AUTH TOKENS (Runs every day at 03:00 UTC)
-- Deletes verification and password reset tokens that have expired (expiresAt < NOW()).
-- ==============================================================================
SELECT cron.unschedule('cleanup-expired-auth-tokens')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-expired-auth-tokens');

SELECT cron.schedule(
  'cleanup-expired-auth-tokens',
  '0 3 * * *', -- Daily at 03:00 UTC
  $$
    DELETE FROM "verification_tokens"
    WHERE "expiresAt" < NOW();
  $$
);

-- ==============================================================================
-- JOB 3: CLEANUP ORPHANED ATTACHMENTS (Runs daily at 03:30 UTC)
-- Removes unlinked upload records older than 24 hours (user uploaded but never saved).
-- ==============================================================================
SELECT cron.unschedule('cleanup-orphaned-attachments')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-orphaned-attachments');

SELECT cron.schedule(
  'cleanup-orphaned-attachments',
  '30 3 * * *', -- Daily at 03:30 UTC
  $$
    DELETE FROM "attachments"
    WHERE 
      "courseId" IS NULL 
      AND "lessonId" IS NULL 
      AND "postId" IS NULL 
      AND "createdAt" < NOW() - INTERVAL '24 hours';
  $$
);

-- ==============================================================================
-- JOB 4: PURGE STALE UNVERIFIED STUDENT ACCOUNTS (Runs daily at 04:00 UTC)
-- Deletes unverified student bot registrations older than 48 hours without orders.
-- ==============================================================================
SELECT cron.unschedule('purge-stale-unverified-students')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-stale-unverified-students');

SELECT cron.schedule(
  'purge-stale-unverified-students',
  '0 4 * * *', -- Daily at 04:00 UTC
  $$
    DELETE FROM "users"
    WHERE 
      "role" = 'STUDENT'
      AND "emailVerified" IS NULL
      AND "createdAt" < NOW() - INTERVAL '48 hours'
      AND "id" NOT IN (SELECT DISTINCT "userId" FROM "orders" WHERE "status" = 'COMPLETED');
  $$
);

-- ==============================================================================
-- USEFUL MONITORING QUERIES FOR ADMINS:
-- ==============================================================================
-- 1. View all active cron jobs:
--    SELECT jobid, jobname, schedule, command, active FROM cron.job;
--
-- 2. View execution history / logs of cron runs:
--    SELECT jobid, runid, job_pid, status, return_message, start_time, end_time 
--    FROM cron.job_run_details 
--    ORDER BY start_time DESC 
--    LIMIT 20;
--
-- 3. To remove a cron job manually:
--    SELECT cron.unschedule('cancel-stale-pending-orders');
-- ==============================================================================
