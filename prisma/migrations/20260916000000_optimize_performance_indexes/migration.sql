-- ==============================================================================
-- MIGRATION: OPTIMIZE HIGH-FREQUENCY QUERY INDEXES
-- ==============================================================================
-- 1. Optimize admin user listing and filtering (role, status, createdAt DESC)
-- 2. Optimize student active enrollments lookup (userId, status)
-- 3. Optimize course approved reviews query (courseId, isApproved)
-- 4. Optimize real-time commission maturity resolution (status, availableAt)
-- ==============================================================================

-- 1. CreateIndex on users (role, status, createdAt DESC)
CREATE INDEX IF NOT EXISTS "users_role_status_createdAt_idx" ON "users"("role", "status", "createdAt" DESC);

-- 2. CreateIndex on enrollments (userId, status)
CREATE INDEX IF NOT EXISTS "enrollments_userId_status_idx" ON "enrollments"("userId", "status");

-- 3. CreateIndex on reviews (courseId, isApproved)
CREATE INDEX IF NOT EXISTS "reviews_courseId_isApproved_idx" ON "reviews"("courseId", "isApproved");

-- 4. CreateIndex on commissions (status, availableAt)
CREATE INDEX IF NOT EXISTS "commissions_status_availableAt_idx" ON "commissions"("status", "availableAt");
