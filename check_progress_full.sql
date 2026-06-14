-- Full progress for learner 1 (Nkwenkwezi)
SELECT 
  p."ProjectQualificationUnitStandardId",
  p."FormativeAssessmentId",
  p."SummativeAssessmentId",
  p."FormativeCompleted",
  p."SummativeCompleted",
  p."FormativeModerated",
  p."SummativeModerated",
  -- count uploaded answers per type
  (SELECT COUNT(DISTINCT a."QuestionId") FROM "LearnerAssessmentAnswers" a 
   WHERE a."LearnerId" = 1 AND a."AssessmentId" = p."FormativeAssessmentId" AND a."AssessmentType" = 'Formative') as formative_uploaded,
  (SELECT COUNT(DISTINCT a."QuestionId") FROM "LearnerAssessmentAnswers" a 
   WHERE a."LearnerId" = 1 AND a."AssessmentId" = p."SummativeAssessmentId" AND a."AssessmentType" = 'Summative') as summative_uploaded,
  -- total questions per assessment
  (SELECT COUNT(*) FROM "FormativeAssessmentQuestions" q WHERE q."FormativeAssessmentId" = p."FormativeAssessmentId") as formative_total,
  (SELECT COUNT(*) FROM "SummativeAssessmentQuestions" q WHERE q."SummativeAssessmentId" = p."SummativeAssessmentId") as summative_total
FROM "LearnerAssessmentProgress" p
WHERE p."LearnerId" = 1;
