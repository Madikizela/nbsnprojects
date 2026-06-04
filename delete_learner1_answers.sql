-- Show what will be deleted first
SELECT "Id", "ScannedDocumentPath" FROM "LearnerAssessmentAnswers" WHERE "LearnerId" = 1;

-- Delete all assessment answers for learner 1
DELETE FROM "LearnerAssessmentAnswers" WHERE "LearnerId" = 1;

-- Delete progress records for learner 1
DELETE FROM "LearnerAssessmentProgress" WHERE "LearnerId" = 1;

-- Confirm deletion
SELECT COUNT(*) as remaining FROM "LearnerAssessmentAnswers" WHERE "LearnerId" = 1;
