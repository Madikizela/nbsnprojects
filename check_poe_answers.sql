SELECT 
  a."Id", 
  a."LearnerId", 
  a."AssessmentId", 
  a."AssessmentType", 
  a."QuestionId",
  a."QuestionNumber",
  a."ScannedDocumentPath",
  a."MimeType",
  CASE WHEN a."ScannedDocumentPath" IS NOT NULL AND length(a."ScannedDocumentPath") > 0 THEN 'Has path' ELSE 'No path' END as path_status
FROM "LearnerAssessmentAnswers" a
LIMIT 20;
