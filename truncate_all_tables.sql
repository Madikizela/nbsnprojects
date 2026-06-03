
-- Disable triggers temporarily to avoid foreign key issues
SET session_replication_role = 'replica';

-- Truncate all tables in the right order
TRUNCATE TABLE "LearnerAssessmentAnswers" CASCADE;
TRUNCATE TABLE "LearnerAssessmentProgress" CASCADE;
TRUNCATE TABLE "FormativeAssessmentQuestions" CASCADE;
TRUNCATE TABLE "SummativeAssessmentQuestions" CASCADE;
TRUNCATE TABLE "FormativeAssessments" CASCADE;
TRUNCATE TABLE "SummativeAssessments" CASCADE;
TRUNCATE TABLE "AssessmentQuestions" CASCADE;
TRUNCATE TABLE "UnitStandardAssessments" CASCADE;
TRUNCATE TABLE "AssessmentStrategyPlans" CASCADE;
TRUNCATE TABLE "AssessmentTypes" CASCADE;
TRUNCATE TABLE "TaskReminders" CASCADE;
TRUNCATE TABLE "Tasks" CASCADE;
TRUNCATE TABLE "DocumentAccessLogs" CASCADE;
TRUNCATE TABLE "DocumentAuditLogs" CASCADE;
TRUNCATE TABLE "DocumentPermissions" CASCADE;
TRUNCATE TABLE "Documents" CASCADE;
TRUNCATE TABLE "LogbookEntries" CASCADE;
TRUNCATE TABLE "SickNotes" CASCADE;
TRUNCATE TABLE "LearnerDocuments" CASCADE;
TRUNCATE TABLE "AttendanceLogs" CASCADE;
TRUNCATE TABLE "LearnerAttendances" CASCADE;
TRUNCATE TABLE "ClassEnrollments" CASCADE;
TRUNCATE TABLE "ClassTeachers" CASCADE;
TRUNCATE TABLE "SiteClasses" CASCADE;
TRUNCATE TABLE "Learners" CASCADE;
TRUNCATE TABLE "Lessons" CASCADE;
TRUNCATE TABLE "LearningPathways" CASCADE;
TRUNCATE TABLE "PhaseActivities" CASCADE;
TRUNCATE TABLE "PhaseSubActivities" CASCADE;
TRUNCATE TABLE "ProjectLearningPathways" CASCADE;
TRUNCATE TABLE "ProjectPhaseLearningPathways" CASCADE;
TRUNCATE TABLE "ProjectPhaseQualifications" CASCADE;
TRUNCATE TABLE "ProjectPhases" CASCADE;
TRUNCATE TABLE "ProjectQualificationUnitStandards" CASCADE;
TRUNCATE TABLE "ProjectQualifications" CASCADE;
TRUNCATE TABLE "ProjectAssignments" CASCADE;
TRUNCATE TABLE "ProjectSites" CASCADE;
TRUNCATE TABLE "Projects" CASCADE;
TRUNCATE TABLE "QualificationTypes" CASCADE;
TRUNCATE TABLE "Users" CASCADE;
TRUNCATE TABLE "SystemAdmins" CASCADE;
TRUNCATE TABLE "Departments" CASCADE;
TRUNCATE TABLE "Clients" CASCADE;
TRUNCATE TABLE "SkillsDevelopmentProviders" CASCADE;
TRUNCATE TABLE "Modules" CASCADE;
TRUNCATE TABLE "LegacyQualifications" CASCADE;
TRUNCATE TABLE "LegacyUnitStandards" CASCADE;
TRUNCATE TABLE "OccupationalQualifications" CASCADE;
TRUNCATE TABLE "OccupationalUnitStandards" CASCADE;

-- Re-enable triggers
SET session_replication_role = 'origin';
