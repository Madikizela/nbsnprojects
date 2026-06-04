-- Fix assessment answer file paths: update old project path to current project path
UPDATE "LearnerAssessmentAnswers"
SET "ScannedDocumentPath" = REPLACE(
    "ScannedDocumentPath",
    'C:\Users\madik\Documents\New_version\backend\uploads\assessment-answers\',
    'C:\Users\madik\Documents\nbsnprojects\backend\uploads\assessment-answers\'
)
WHERE "ScannedDocumentPath" LIKE '%New_version%';

-- Verify the update
SELECT COUNT(*) as still_old_path FROM "LearnerAssessmentAnswers" WHERE "ScannedDocumentPath" LIKE '%New_version%';
SELECT COUNT(*) as updated_paths FROM "LearnerAssessmentAnswers" WHERE "ScannedDocumentPath" LIKE '%nbsnprojects%';
