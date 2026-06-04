-- Check the exact path stored including any hidden characters
SELECT 
  "Id",
  length("ScannedDocumentPath") as path_length,
  "ScannedDocumentPath",
  ascii(substring("ScannedDocumentPath", 1, 1)) as first_char_ascii,
  position(chr(10) in "ScannedDocumentPath") as has_newline,
  position(chr(13) in "ScannedDocumentPath") as has_cr
FROM "LearnerAssessmentAnswers"
WHERE "LearnerId" = 2
LIMIT 3;
