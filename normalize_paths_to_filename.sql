-- Normalize all existing absolute paths to just the filename
-- This makes paths work on any machine/environment
UPDATE "LearnerAssessmentAnswers"
SET "ScannedDocumentPath" = reverse(split_part(reverse(replace("ScannedDocumentPath", '\', '/')), '/', 1))
WHERE "ScannedDocumentPath" LIKE '%\%' OR "ScannedDocumentPath" LIKE '%/%uploads%';

-- Verify: all paths should now be just filenames (no slashes)
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN "ScannedDocumentPath" NOT LIKE '%/%' AND "ScannedDocumentPath" NOT LIKE '%\%' THEN 1 END) as filename_only,
  COUNT(CASE WHEN "ScannedDocumentPath" LIKE '%/%' OR "ScannedDocumentPath" LIKE '%\%' THEN 1 END) as still_has_path
FROM "LearnerAssessmentAnswers";

-- Show a sample
SELECT "Id", "LearnerId", "ScannedDocumentPath" FROM "LearnerAssessmentAnswers" LIMIT 5;
