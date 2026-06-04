-- Fix ALL remaining old-path references for all learners
UPDATE "LearnerAssessmentAnswers"
SET "ScannedDocumentPath" = REPLACE(
    "ScannedDocumentPath",
    'C:\Users\madik\Documents\New_version\backend\uploads\assessment-answers\',
    'C:\Users\madik\Documents\nbsnprojects\backend\uploads\assessment-answers\'
)
WHERE "ScannedDocumentPath" LIKE '%New_version%';

-- Show a summary: which learners have DB records and whether their files exist on the expected path
SELECT 
  "LearnerId",
  COUNT(*) as total_answers,
  COUNT(CASE WHEN "ScannedDocumentPath" LIKE '%nbsnprojects%' THEN 1 END) as new_path_count,
  COUNT(CASE WHEN "ScannedDocumentPath" LIKE '%New_version%' THEN 1 END) as old_path_count
FROM "LearnerAssessmentAnswers"
GROUP BY "LearnerId"
ORDER BY "LearnerId";
