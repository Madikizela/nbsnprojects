-- =====================================================
-- Database Cleanup and Performance Optimization
-- =====================================================

-- 1. CLEAN UP TEST DATA
-- =====================================================

-- Remove test documents (keep only production data)
DELETE FROM "LearnerDocuments" 
WHERE "FileName" LIKE '%test%' 
   OR "FileName" LIKE '%Test%'
   OR "FileName" LIKE '%System_Enhancement_Phases%'
   OR "DocumentType" = 'Test Document';

-- Reset document approval statuses to Pending for fresh start
UPDATE "LearnerDocuments" 
SET "ApprovalStatus" = 'Pending',
    "ApprovedByUserId" = NULL,
    "ApprovedAt" = NULL,
    "DeclineReason" = NULL,
    "UpdatedAt" = NOW()
WHERE "ApprovalStatus" IN ('Approved', 'Declined');

-- Clean up any orphaned records
DELETE FROM "LearnerDocuments" 
WHERE "LearnerId" NOT IN (SELECT "Id" FROM "Learners");

-- 2. CREATE PERFORMANCE INDEXES
-- =====================================================

-- LearnerDocuments table indexes (most critical for Document Approvals)
CREATE INDEX IF NOT EXISTS "IX_LearnerDocuments_LearnerId" 
ON "LearnerDocuments" ("LearnerId");

CREATE INDEX IF NOT EXISTS "IX_LearnerDocuments_ApprovalStatus" 
ON "LearnerDocuments" ("ApprovalStatus");

CREATE INDEX IF NOT EXISTS "IX_LearnerDocuments_DocumentType" 
ON "LearnerDocuments" ("DocumentType");

CREATE INDEX IF NOT EXISTS "IX_LearnerDocuments_ApprovalStatus_DocumentType" 
ON "LearnerDocuments" ("ApprovalStatus", "DocumentType");

CREATE INDEX IF NOT EXISTS "IX_LearnerDocuments_LearnerId_ApprovalStatus" 
ON "LearnerDocuments" ("LearnerId", "ApprovalStatus");

CREATE INDEX IF NOT EXISTS "IX_LearnerDocuments_UploadedAt" 
ON "LearnerDocuments" ("UploadedAt");

CREATE INDEX IF NOT EXISTS "IX_LearnerDocuments_ApprovedAt" 
ON "LearnerDocuments" ("ApprovedAt") WHERE "ApprovedAt" IS NOT NULL;

-- ClassEnrollments indexes (for learner-project relationships)
CREATE INDEX IF NOT EXISTS "IX_ClassEnrollments_LearnerId" 
ON "ClassEnrollments" ("LearnerId");

CREATE INDEX IF NOT EXISTS "IX_ClassEnrollments_SiteClassId" 
ON "ClassEnrollments" ("SiteClassId");

CREATE INDEX IF NOT EXISTS "IX_ClassEnrollments_LearnerId_SiteClassId" 
ON "ClassEnrollments" ("LearnerId", "SiteClassId");

-- SiteClasses indexes (for project hierarchy)
CREATE INDEX IF NOT EXISTS "IX_SiteClasses_ProjectSiteId" 
ON "SiteClasses" ("ProjectSiteId");

CREATE INDEX IF NOT EXISTS "IX_SiteClasses_Status" 
ON "SiteClasses" ("Status");

-- ProjectSites indexes
CREATE INDEX IF NOT EXISTS "IX_ProjectSites_ProjectId" 
ON "ProjectSites" ("ProjectId");

CREATE INDEX IF NOT EXISTS "IX_ProjectSites_Status" 
ON "ProjectSites" ("Status");

-- Projects indexes
CREATE INDEX IF NOT EXISTS "IX_Projects_Status" 
ON "Projects" ("Status");

CREATE INDEX IF NOT EXISTS "IX_Projects_SkillsDevelopmentProviderId" 
ON "Projects" ("SkillsDevelopmentProviderId");

-- Learners indexes
CREATE INDEX IF NOT EXISTS "IX_Learners_Status" 
ON "Learners" ("Status");

CREATE INDEX IF NOT EXISTS "IX_Learners_IdNumber" 
ON "Learners" ("IdNumber");

-- Users indexes (for approval tracking)
CREATE INDEX IF NOT EXISTS "IX_Users_Role" 
ON "Users" ("Role");

CREATE INDEX IF NOT EXISTS "IX_Users_Status" 
ON "Users" ("Status");

-- 3. COMPOSITE INDEXES FOR COMPLEX QUERIES
-- =====================================================

-- For document approval statistics queries
CREATE INDEX IF NOT EXISTS "IX_LearnerDocuments_Stats_Composite" 
ON "LearnerDocuments" ("DocumentType", "ApprovalStatus", "LearnerId");

-- For project document queries (used in DocumentApprovalsController)
CREATE INDEX IF NOT EXISTS "IX_Project_Document_Hierarchy" 
ON "ClassEnrollments" ("SiteClassId", "LearnerId");

-- For learner document compliance queries
CREATE INDEX IF NOT EXISTS "IX_Learner_Document_Compliance" 
ON "LearnerDocuments" ("LearnerId", "DocumentType", "ApprovalStatus");

-- 4. PARTIAL INDEXES FOR SPECIFIC CONDITIONS
-- =====================================================

-- Index only pending documents (most frequently queried)
CREATE INDEX IF NOT EXISTS "IX_LearnerDocuments_Pending_Only" 
ON "LearnerDocuments" ("LearnerId", "DocumentType") 
WHERE "ApprovalStatus" = 'Pending';

-- Index only active learners
CREATE INDEX IF NOT EXISTS "IX_Learners_Active_Only" 
ON "Learners" ("Id", "Status") 
WHERE "Status" = 'Active';

-- Index only active projects
CREATE INDEX IF NOT EXISTS "IX_Projects_Active_Only" 
ON "Projects" ("Id", "SkillsDevelopmentProviderId") 
WHERE "Status" = 'Active';

-- 5. FOREIGN KEY INDEXES (if not already created by EF)
-- =====================================================

-- Ensure all foreign keys have indexes
CREATE INDEX IF NOT EXISTS "IX_LearnerDocuments_UploadedByUserId" 
ON "LearnerDocuments" ("UploadedByUserId") WHERE "UploadedByUserId" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "IX_LearnerDocuments_ApprovedByUserId" 
ON "LearnerDocuments" ("ApprovedByUserId") WHERE "ApprovedByUserId" IS NOT NULL;

-- 6. UPDATE TABLE STATISTICS
-- =====================================================

-- Update PostgreSQL statistics for better query planning
ANALYZE "LearnerDocuments";
ANALYZE "ClassEnrollments";
ANALYZE "SiteClasses";
ANALYZE "ProjectSites";
ANALYZE "Projects";
ANALYZE "Learners";
ANALYZE "Users";

-- 7. VACUUM TABLES (optional - for maintenance)
-- =====================================================

-- Uncomment these lines if you want to reclaim space after deletions
-- VACUUM ANALYZE "LearnerDocuments";
-- VACUUM ANALYZE "ClassEnrollments";
-- VACUUM ANALYZE "Projects";

-- =====================================================
-- PERFORMANCE VERIFICATION QUERIES
-- =====================================================

-- Check index usage (run these after some usage to verify indexes are being used)
/*
-- View index usage statistics
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes 
WHERE tablename IN ('LearnerDocuments', 'ClassEnrollments', 'SiteClasses', 'ProjectSites', 'Projects', 'Learners')
ORDER BY tablename, idx_scan DESC;

-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE tablename IN ('LearnerDocuments', 'ClassEnrollments', 'SiteClasses', 'ProjectSites', 'Projects', 'Learners')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
*/

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Database cleanup and optimization completed successfully!';
    RAISE NOTICE '📊 Indexes created for optimal Document Approvals performance';
    RAISE NOTICE '🧹 Test data cleaned up';
    RAISE NOTICE '📈 Table statistics updated';
END $$;