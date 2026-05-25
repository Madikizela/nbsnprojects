-- =====================================================
-- ATTENDANCE TRACKING OPTIMIZATION - DATABASE INDEXES
-- =====================================================

-- Drop existing indexes if they exist (to avoid conflicts)
DROP INDEX IF EXISTS "IX_LearnerAttendances_AttendanceDate_LearnerId";
DROP INDEX IF EXISTS "IX_LearnerAttendances_AttendanceDate_ClockInTime";
DROP INDEX IF EXISTS "IX_LearnerAttendances_LearnerId_AttendanceDate";
DROP INDEX IF EXISTS "IX_LearnerAttendances_ClassId_AttendanceDate";
DROP INDEX IF EXISTS "IX_ClassEnrollments_Status_SiteClassId";
DROP INDEX IF EXISTS "IX_ClassEnrollments_LearnerId_Status";
DROP INDEX IF EXISTS "IX_SiteClasses_ProjectSiteId";
DROP INDEX IF EXISTS "IX_ProjectSites_ProjectId";
DROP INDEX IF EXISTS "IX_Projects_Id_ProjectName";

-- =====================================================
-- PRIMARY ATTENDANCE TRACKING INDEXES
-- =====================================================

-- 1. LearnerAttendances - Most critical for attendance queries
-- Composite index for date-based attendance queries
CREATE INDEX "IX_LearnerAttendances_AttendanceDate_LearnerId" 
ON "LearnerAttendances" ("AttendanceDate", "LearnerId");

-- Index for attendance queries with clock-in status
CREATE INDEX "IX_LearnerAttendances_AttendanceDate_ClockInTime" 
ON "LearnerAttendances" ("AttendanceDate", "ClockInTime") 
WHERE "ClockInTime" IS NOT NULL;

-- Index for learner-specific attendance history
CREATE INDEX "IX_LearnerAttendances_LearnerId_AttendanceDate" 
ON "LearnerAttendances" ("LearnerId", "AttendanceDate" DESC);

-- Index for class-specific attendance queries
CREATE INDEX "IX_LearnerAttendances_ClassId_AttendanceDate" 
ON "LearnerAttendances" ("ClassId", "AttendanceDate");

-- =====================================================
-- ENROLLMENT AND CLASS STRUCTURE INDEXES
-- =====================================================

-- 2. ClassEnrollments - Critical for active learner queries
-- Composite index for active enrollments by class
CREATE INDEX "IX_ClassEnrollments_Status_SiteClassId" 
ON "ClassEnrollments" ("Status", "SiteClassId") 
WHERE "Status" = 'Active';

-- Index for learner enrollment status
CREATE INDEX "IX_ClassEnrollments_LearnerId_Status" 
ON "ClassEnrollments" ("LearnerId", "Status");

-- =====================================================
-- PROJECT HIERARCHY INDEXES
-- =====================================================

-- 3. SiteClasses - For project-to-class mapping
CREATE INDEX "IX_SiteClasses_ProjectSiteId" 
ON "SiteClasses" ("ProjectSiteId");

-- 4. ProjectSites - For project hierarchy
CREATE INDEX "IX_ProjectSites_ProjectId" 
ON "ProjectSites" ("ProjectId");

-- 5. Projects - For project queries
CREATE INDEX "IX_Projects_Id_ProjectName" 
ON "Projects" ("Id", "ProjectName");

-- =====================================================
-- SPECIALIZED INDEXES FOR WEEKLY ATTENDANCE
-- =====================================================

-- Index for date range queries (weekly attendance)
CREATE INDEX "IX_LearnerAttendances_AttendanceDate_Range" 
ON "LearnerAttendances" ("AttendanceDate", "LearnerId", "ClassId", "ClockInTime", "ClockOutTime");

-- =====================================================
-- STATISTICS UPDATE
-- =====================================================

-- Update table statistics for better query planning
ANALYZE "LearnerAttendances";
ANALYZE "ClassEnrollments";
ANALYZE "SiteClasses";
ANALYZE "ProjectSites";
ANALYZE "Projects";

-- =====================================================
-- INDEX VERIFICATION QUERIES
-- =====================================================

-- Check if indexes were created successfully
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('LearnerAttendances', 'ClassEnrollments', 'SiteClasses', 'ProjectSites', 'Projects')
    AND indexname LIKE 'IX_%'
ORDER BY tablename, indexname;

-- Check index usage statistics (run after some queries)
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE indexname LIKE 'IX_%'
ORDER BY idx_tup_read DESC;

PRINT 'Attendance Tracking indexes created successfully!';