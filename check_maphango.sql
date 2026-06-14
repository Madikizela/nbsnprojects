-- Find the learner
SELECT "Id", "FirstName", "LastName" FROM "Learners" 
WHERE "LastName" ILIKE '%maphango%' OR "FirstName" ILIKE '%nkwenkwezi%';

-- Check their assessment answers
SELECT 
  a."Id", a."LearnerId", a."AssessmentId", a."AssessmentType", 
  a."QuestionId", a."QuestionNumber", a."MarkStatus", a."Mark",
  a."ScannedDocumentPath"
FROM "LearnerAssessmentAnswers" a
JOIN "Learners" l ON l."Id" = a."LearnerId"
WHERE l."LastName" ILIKE '%maphango%' OR l."FirstName" ILIKE '%nkwenkwezi%'
ORDER BY a."AssessmentType", a."QuestionNumber";

-- Check their progress records
SELECT p.* 
FROM "LearnerAssessmentProgress" p
JOIN "Learners" l ON l."Id" = p."LearnerId"
WHERE l."LastName" ILIKE '%maphango%' OR l."FirstName" ILIKE '%nkwenkwezi%';
