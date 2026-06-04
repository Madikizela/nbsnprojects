-- Check what separator character is actually in the path
SELECT 
  "Id",
  "ScannedDocumentPath",
  position('/' in "ScannedDocumentPath") as has_forward_slash,
  position(E'\\' in "ScannedDocumentPath") as has_backslash,
  length("ScannedDocumentPath") as len
FROM "LearnerAssessmentAnswers"
LIMIT 3;

-- Try extracting filename with forward slash separator
UPDATE "LearnerAssessmentAnswers"
SET "ScannedDocumentPath" = substring("ScannedDocumentPath" from '[^/\\]+$')
WHERE "ScannedDocumentPath" LIKE '%:%';  -- has a drive letter = full path

SELECT "Id", "LearnerId", "ScannedDocumentPath" FROM "LearnerAssessmentAnswers" LIMIT 5;
