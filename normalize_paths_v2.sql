-- Extract just the filename from the full Windows path (everything after last backslash)
UPDATE "LearnerAssessmentAnswers"
SET "ScannedDocumentPath" = substring("ScannedDocumentPath" from '[^\\]+$')
WHERE "ScannedDocumentPath" LIKE '%\%';

-- Verify
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN "ScannedDocumentPath" NOT LIKE '%\%' THEN 1 END) as cleaned,
  COUNT(CASE WHEN "ScannedDocumentPath" LIKE '%\%' THEN 1 END) as still_has_backslash
FROM "LearnerAssessmentAnswers";

-- Sample check
SELECT "Id", "LearnerId", "ScannedDocumentPath" FROM "LearnerAssessmentAnswers" LIMIT 5;
