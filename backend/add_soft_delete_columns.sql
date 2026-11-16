-- ============================================================
-- Soft Delete Migration
-- Run once against the production PostgreSQL database.
-- Adds IsDeleted / DeletedAt / DeletedByUserId to every entity
-- table.  All columns are nullable-safe with defaults so
-- existing rows are unaffected.
-- ============================================================

-- Helper: skip if column already exists (idempotent)
-- Usage pattern:
--   ALTER TABLE "TableName" ADD COLUMN IF NOT EXISTS "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE;

-- ── User Management ──────────────────────────────────────────
ALTER TABLE "Users"                     ADD COLUMN IF NOT EXISTS "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "Users"                     ADD COLUMN IF NOT EXISTS "DeletedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "Users"                     ADD COLUMN IF NOT EXISTS "DeletedByUserId" INTEGER;

ALTER TABLE "SystemAdmins"              ADD COLUMN IF NOT EXISTS "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "SystemAdmins"              ADD COLUMN IF NOT EXISTS "DeletedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "SystemAdmins"              ADD COLUMN IF NOT EXISTS "DeletedByUserId" INTEGER;

ALTER TABLE "Clients"                   ADD COLUMN IF NOT EXISTS "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "Clients"                   ADD COLUMN IF NOT EXISTS "DeletedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "Clients"                   ADD COLUMN IF NOT EXISTS "DeletedByUserId" INTEGER;

ALTER TABLE "SkillsDevelopmentProviders" ADD COLUMN IF NOT EXISTS "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "SkillsDevelopmentProviders" ADD COLUMN IF NOT EXISTS "DeletedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "SkillsDevelopmentProviders" ADD COLUMN IF NOT EXISTS "DeletedByUserId" INTEGER;

ALTER TABLE "Departments"               ADD COLUMN IF NOT EXISTS "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "Departments"               ADD COLUMN IF NOT EXISTS "DeletedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "Departments"               ADD COLUMN IF NOT EXISTS "DeletedByUserId" INTEGER;

-- ── LMS ──────────────────────────────────────────────────────
ALTER TABLE "Courses"                   ADD COLUMN IF NOT EXISTS "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "Courses"                   ADD COLUMN IF NOT EXISTS "DeletedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "Courses"                   ADD COLUMN IF NOT EXISTS "DeletedByUserId" INTEGER;

ALTER TABLE "Modules"                   ADD COLUMN IF NOT EXISTS "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "Modules"                   ADD COLUMN IF NOT EXISTS "DeletedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "Modules"                   ADD COLUMN IF NOT EXISTS "DeletedByUserId" INTEGER;

ALTER TABLE "Lessons"                   ADD COLUMN IF NOT EXISTS "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "Lessons"                   ADD COLUMN IF NOT EXISTS "DeletedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "Lessons"                   ADD COLUMN IF NOT EXISTS "DeletedByUserId" INTEGER;

ALTER TABLE "LearningMaterials"         ADD COLUMN IF NOT EXISTS "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "LearningMaterials"         ADD COLUMN IF NOT EXISTS "DeletedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "LearningMaterials"         ADD COLUMN IF NOT EXISTS "DeletedByUserId" INTEGER;

-- ── Documents ────────────────────────────────────────────────
-- Documents already have these columns — skip or use IF NOT EXISTS
ALTER TABLE "Documents"                 ADD COLUMN IF NOT EXISTS "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "Documents"                 ADD COLUMN IF NOT EXISTS "DeletedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "Documents"                 ADD COLUMN IF NOT EXISTS "DeletedByUserId" INTEGER;

ALTER TABLE "LearnerDocuments"          ADD COLUMN IF NOT EXISTS "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "LearnerDocuments"          ADD COLUMN IF NOT EXISTS "DeletedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "LearnerDocuments"          ADD COLUMN IF NOT EXISTS "DeletedByUserId" INTEGER;

ALTER TABLE "GeneratedDocuments"        ADD COLUMN IF NOT EXISTS "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "GeneratedDocuments"        ADD COLUMN IF NOT EXISTS "DeletedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "GeneratedDocuments"        ADD COLUMN IF NOT EXISTS "DeletedByUserId" INTEGER;

-- ── Projects ─────────────────────────────────────────────────
ALTER TABLE "Projects"                  ADD COLUMN IF NOT EXISTS "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "Projects"                  ADD COLUMN IF NOT EXISTS "DeletedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "Projects"                  ADD COLUMN IF NOT EXISTS "DeletedByUserId" INTEGER;

ALTER TABLE "ProjectAssignments"        ADD COLUMN IF NOT EXISTS "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "ProjectAssignments"        ADD COLUMN IF NOT EXISTS "DeletedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "ProjectAssignments"        ADD COLUMN IF NOT EXISTS "DeletedByUserId" INTEGER;

ALTER TABLE "ProjectPhases"             ADD COLUMN IF NOT EXISTS "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "ProjectPhases"             ADD COLUMN IF NOT EXISTS "DeletedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "ProjectPhases"             ADD COLUMN IF NOT EXISTS "DeletedByUserId" INTEGER;

ALTER TABLE "ProjectSites"              ADD COLUMN IF NOT EXISTS "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "ProjectSites"              ADD COLUMN IF NOT EXISTS "DeletedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "ProjectSites"              ADD COLUMN IF NOT EXISTS "DeletedByUserId" INTEGER;

ALTER TABLE "ProjectQualifications"     ADD COLUMN IF NOT EXISTS "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "ProjectQualifications"     ADD COLUMN IF NOT EXISTS "DeletedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "ProjectQualifications"     ADD COLUMN IF NOT EXISTS "DeletedByUserId" INTEGER;

ALTER TABLE "ProjectQualificationUnitStandards" ADD COLUMN IF NOT EXISTS "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "ProjectQualificationUnitStandards" ADD COLUMN IF NOT EXISTS "DeletedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "ProjectQualificationUnitStandards" ADD COLUMN IF NOT EXISTS "DeletedByUserId" INTEGER;

ALTER TABLE "LearningPathways"          ADD COLUMN IF NOT EXISTS "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "LearningPathways"          ADD COLUMN IF NOT EXISTS "DeletedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "LearningPathways"          ADD COLUMN IF NOT EXISTS "DeletedByUserId" INTEGER;

ALTER TABLE "ProjectLearningPathways"   ADD COLUMN IF NOT EXISTS "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "ProjectLearningPathways"   ADD COLUMN IF NOT EXISTS "DeletedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "ProjectLearningPathways"   ADD COLUMN IF NOT EXISTS "DeletedByUserId" INTEGER;

ALTER TABLE "QualificationTypes"        ADD COLUMN IF NOT EXISTS "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "QualificationTypes"        ADD COLUMN IF NOT EXISTS "DeletedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "QualificationTypes"        ADD COLUMN IF NOT EXISTS "DeletedByUserId" INTEGER;

ALTER TABLE "ProjectPhaseQualifications" ADD COLUMN IF NOT EXISTS "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "ProjectPhaseQualifications" ADD COLUMN IF NOT EXISTS "DeletedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "ProjectPhaseQualifications" ADD COLUMN IF NOT EXISTS "DeletedByUserId" INTEGER;

ALTER TABLE "ProjectPhaseLearningPathways" ADD COLUMN IF NOT EXISTS "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "ProjectPhaseLearningPathways" ADD COLUMN IF NOT EXISTS "DeletedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "ProjectPhaseLearningPathways" ADD COLUMN IF NOT EXISTS "DeletedByUserId" INTEGER;

ALTER TABLE "PhaseActivities"           ADD COLUMN IF NOT EXISTS "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "PhaseActivities"           ADD COLUMN IF NOT EXISTS "DeletedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "PhaseActivities"           ADD COLUMN IF NOT EXISTS "DeletedByUserId" INTEGER;

ALTER TABLE "PhaseSubActivities"        ADD COLUMN IF NOT EXISTS "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "PhaseSubActivities"        ADD COLUMN IF NOT EXISTS "DeletedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "PhaseSubActivities"        ADD COLUMN IF NOT EXISTS "DeletedByUserId" INTEGER;

ALTER TABLE "ProjectBudgetPhases"       ADD COLUMN IF NOT EXISTS "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "ProjectBudgetPhases"       ADD COLUMN IF NOT EXISTS "DeletedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "ProjectBudgetPhases"       ADD COLUMN IF NOT EXISTS "DeletedByUserId" INTEGER;

ALTER TABLE "ProjectBudgetLineItems"    ADD COLUMN IF NOT EXISTS "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "ProjectBudgetLineItems"    ADD COLUMN IF NOT EXISTS "DeletedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "ProjectBudgetLineItems"    ADD COLUMN IF NOT EXISTS "DeletedByUserId" INTEGER;

-- ── Tasks ────────────────────────────────────────────────────
ALTER TABLE "Tasks"                     ADD COLUMN IF NOT EXISTS "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "Tasks"                     ADD COLUMN IF NOT EXISTS "DeletedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "Tasks"                     ADD COLUMN IF NOT EXISTS "DeletedByUserId" INTEGER;

ALTER TABLE "TaskReminders"             ADD COLUMN IF NOT EXISTS "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "TaskReminders"             ADD COLUMN IF NOT EXISTS "DeletedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "TaskReminders"             ADD COLUMN IF NOT EXISTS "DeletedByUserId" INTEGER;

-- ── Qualifications ───────────────────────────────────────────
ALTER TABLE "OccupationalQualifications" ADD COLUMN IF NOT EXISTS "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "OccupationalQualifications" ADD COLUMN IF NOT EXISTS "DeletedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "OccupationalQualifications" ADD COLUMN IF NOT EXISTS "DeletedByUserId" INTEGER;

ALTER TABLE "LegacyQualifications"      ADD COLUMN IF NOT EXISTS "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "LegacyQualifications"      ADD COLUMN IF NOT EXISTS "DeletedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "LegacyQualifications"      ADD COLUMN IF NOT EXISTS "DeletedByUserId" INTEGER;

ALTER TABLE "OccupationalUnitStandards" ADD COLUMN IF NOT EXISTS "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "OccupationalUnitStandards" ADD COLUMN IF NOT EXISTS "DeletedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "OccupationalUnitStandards" ADD COLUMN IF NOT EXISTS "DeletedByUserId" INTEGER;

ALTER TABLE "LegacyUnitStandards"       ADD COLUMN IF NOT EXISTS "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "LegacyUnitStandards"       ADD COLUMN IF NOT EXISTS "DeletedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "LegacyUnitStandards"       ADD COLUMN IF NOT EXISTS "DeletedByUserId" INTEGER;

-- ── Assessments ──────────────────────────────────────────────
ALTER TABLE "FormativeAssessments"      ADD COLUMN IF NOT EXISTS "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "FormativeAssessments"      ADD COLUMN IF NOT EXISTS "DeletedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "FormativeAssessments"      ADD COLUMN IF NOT EXISTS "DeletedByUserId" INTEGER;

ALTER TABLE "SummativeAssessments"      ADD COLUMN IF NOT EXISTS "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "SummativeAssessments"      ADD COLUMN IF NOT EXISTS "DeletedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "SummativeAssessments"      ADD COLUMN IF NOT EXISTS "DeletedByUserId" INTEGER;

ALTER TABLE "FormativeAssessmentQuestions" ADD COLUMN IF NOT EXISTS "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "FormativeAssessmentQuestions" ADD COLUMN IF NOT EXISTS "DeletedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "FormativeAssessmentQuestions" ADD COLUMN IF NOT EXISTS "DeletedByUserId" INTEGER;

ALTER TABLE "SummativeAssessmentQuestions" ADD COLUMN IF NOT EXISTS "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "SummativeAssessmentQuestions" ADD COLUMN IF NOT EXISTS "DeletedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "SummativeAssessmentQuestions" ADD COLUMN IF NOT EXISTS "DeletedByUserId" INTEGER;

ALTER TABLE "AssessmentStrategyPlans"   ADD COLUMN IF NOT EXISTS "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "AssessmentStrategyPlans"   ADD COLUMN IF NOT EXISTS "DeletedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "AssessmentStrategyPlans"   ADD COLUMN IF NOT EXISTS "DeletedByUserId" INTEGER;

ALTER TABLE "LogbookEntries"            ADD COLUMN IF NOT EXISTS "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "LogbookEntries"            ADD COLUMN IF NOT EXISTS "DeletedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "LogbookEntries"            ADD COLUMN IF NOT EXISTS "DeletedByUserId" INTEGER;

ALTER TABLE "LearnerAssessmentAnswers"  ADD COLUMN IF NOT EXISTS "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "LearnerAssessmentAnswers"  ADD COLUMN IF NOT EXISTS "DeletedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "LearnerAssessmentAnswers"  ADD COLUMN IF NOT EXISTS "DeletedByUserId" INTEGER;

ALTER TABLE "LearnerAssessmentProgress" ADD COLUMN IF NOT EXISTS "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "LearnerAssessmentProgress" ADD COLUMN IF NOT EXISTS "DeletedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "LearnerAssessmentProgress" ADD COLUMN IF NOT EXISTS "DeletedByUserId" INTEGER;

ALTER TABLE "AssessmentTypes"           ADD COLUMN IF NOT EXISTS "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "AssessmentTypes"           ADD COLUMN IF NOT EXISTS "DeletedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "AssessmentTypes"           ADD COLUMN IF NOT EXISTS "DeletedByUserId" INTEGER;

ALTER TABLE "UnitStandardAssessments"   ADD COLUMN IF NOT EXISTS "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "UnitStandardAssessments"   ADD COLUMN IF NOT EXISTS "DeletedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "UnitStandardAssessments"   ADD COLUMN IF NOT EXISTS "DeletedByUserId" INTEGER;

ALTER TABLE "AssessmentQuestions"       ADD COLUMN IF NOT EXISTS "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "AssessmentQuestions"       ADD COLUMN IF NOT EXISTS "DeletedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "AssessmentQuestions"       ADD COLUMN IF NOT EXISTS "DeletedByUserId" INTEGER;

-- ── Site / Learner Management ────────────────────────────────
ALTER TABLE "SiteClasses"               ADD COLUMN IF NOT EXISTS "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "SiteClasses"               ADD COLUMN IF NOT EXISTS "DeletedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "SiteClasses"               ADD COLUMN IF NOT EXISTS "DeletedByUserId" INTEGER;

ALTER TABLE "Learners"                  ADD COLUMN IF NOT EXISTS "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "Learners"                  ADD COLUMN IF NOT EXISTS "DeletedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "Learners"                  ADD COLUMN IF NOT EXISTS "DeletedByUserId" INTEGER;

ALTER TABLE "ClassEnrollments"          ADD COLUMN IF NOT EXISTS "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "ClassEnrollments"          ADD COLUMN IF NOT EXISTS "DeletedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "ClassEnrollments"          ADD COLUMN IF NOT EXISTS "DeletedByUserId" INTEGER;

ALTER TABLE "ClassTeachers"             ADD COLUMN IF NOT EXISTS "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "ClassTeachers"             ADD COLUMN IF NOT EXISTS "DeletedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "ClassTeachers"             ADD COLUMN IF NOT EXISTS "DeletedByUserId" INTEGER;

-- ── Attendance ───────────────────────────────────────────────
ALTER TABLE "LearnerAttendances"        ADD COLUMN IF NOT EXISTS "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "LearnerAttendances"        ADD COLUMN IF NOT EXISTS "DeletedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "LearnerAttendances"        ADD COLUMN IF NOT EXISTS "DeletedByUserId" INTEGER;

ALTER TABLE "AttendanceLogs"            ADD COLUMN IF NOT EXISTS "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "AttendanceLogs"            ADD COLUMN IF NOT EXISTS "DeletedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "AttendanceLogs"            ADD COLUMN IF NOT EXISTS "DeletedByUserId" INTEGER;

ALTER TABLE "SickNotes"                 ADD COLUMN IF NOT EXISTS "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "SickNotes"                 ADD COLUMN IF NOT EXISTS "DeletedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "SickNotes"                 ADD COLUMN IF NOT EXISTS "DeletedByUserId" INTEGER;

-- ── Other ────────────────────────────────────────────────────
ALTER TABLE "Announcements"             ADD COLUMN IF NOT EXISTS "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "Announcements"             ADD COLUMN IF NOT EXISTS "DeletedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "Announcements"             ADD COLUMN IF NOT EXISTS "DeletedByUserId" INTEGER;

ALTER TABLE "ExternalUserAccess"        ADD COLUMN IF NOT EXISTS "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "ExternalUserAccess"        ADD COLUMN IF NOT EXISTS "DeletedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "ExternalUserAccess"        ADD COLUMN IF NOT EXISTS "DeletedByUserId" INTEGER;

ALTER TABLE "Notifications"             ADD COLUMN IF NOT EXISTS "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "Notifications"             ADD COLUMN IF NOT EXISTS "DeletedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "Notifications"             ADD COLUMN IF NOT EXISTS "DeletedByUserId" INTEGER;

ALTER TABLE "AdminAuditLogs"            ADD COLUMN IF NOT EXISTS "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "AdminAuditLogs"            ADD COLUMN IF NOT EXISTS "DeletedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "AdminAuditLogs"            ADD COLUMN IF NOT EXISTS "DeletedByUserId" INTEGER;

-- ============================================================
-- Indexes for fast filtering (IsDeleted = false is the common path)
-- ============================================================
CREATE INDEX IF NOT EXISTS "IX_Users_IsDeleted"                     ON "Users" ("IsDeleted") WHERE "IsDeleted" = FALSE;
CREATE INDEX IF NOT EXISTS "IX_Clients_IsDeleted"                   ON "Clients" ("IsDeleted") WHERE "IsDeleted" = FALSE;
CREATE INDEX IF NOT EXISTS "IX_SkillsDevelopmentProviders_IsDeleted" ON "SkillsDevelopmentProviders" ("IsDeleted") WHERE "IsDeleted" = FALSE;
CREATE INDEX IF NOT EXISTS "IX_Learners_IsDeleted"                  ON "Learners" ("IsDeleted") WHERE "IsDeleted" = FALSE;
CREATE INDEX IF NOT EXISTS "IX_Projects_IsDeleted"                  ON "Projects" ("IsDeleted") WHERE "IsDeleted" = FALSE;
CREATE INDEX IF NOT EXISTS "IX_ProjectPhases_IsDeleted"             ON "ProjectPhases" ("IsDeleted") WHERE "IsDeleted" = FALSE;
CREATE INDEX IF NOT EXISTS "IX_ProjectSites_IsDeleted"              ON "ProjectSites" ("IsDeleted") WHERE "IsDeleted" = FALSE;
CREATE INDEX IF NOT EXISTS "IX_Documents_IsDeleted"                 ON "Documents" ("IsDeleted") WHERE "IsDeleted" = FALSE;
CREATE INDEX IF NOT EXISTS "IX_LearnerDocuments_IsDeleted"          ON "LearnerDocuments" ("IsDeleted") WHERE "IsDeleted" = FALSE;
CREATE INDEX IF NOT EXISTS "IX_GeneratedDocuments_IsDeleted"        ON "GeneratedDocuments" ("IsDeleted") WHERE "IsDeleted" = FALSE;
CREATE INDEX IF NOT EXISTS "IX_SiteClasses_IsDeleted"               ON "SiteClasses" ("IsDeleted") WHERE "IsDeleted" = FALSE;
CREATE INDEX IF NOT EXISTS "IX_Announcements_IsDeleted"             ON "Announcements" ("IsDeleted") WHERE "IsDeleted" = FALSE;

-- ============================================================
-- Done. All tables now have soft-delete columns.
-- The application's global query filter will automatically
-- exclude IsDeleted = TRUE rows from all queries.
-- ============================================================
