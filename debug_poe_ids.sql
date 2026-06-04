-- For learner 2, show what pqUsIds their answers resolve to via formative questions
SELECT 
  a."Id" as answer_id,
  a."LearnerId",
  a."AssessmentType",
  a."AssessmentId",
  a."QuestionId",
  fq."FormativeAssessmentId",
  fa."ProjectQualificationUnitStandardId" as formative_pqus_id,
  sq."SummativeAssessmentId",
  sa."ProjectQualificationUnitStandardId" as summative_pqus_id
FROM "LearnerAssessmentAnswers" a
LEFT JOIN "FormativeAssessmentQuestions" fq ON fq."Id" = a."QuestionId" AND a."AssessmentType" = 'Formative'
LEFT JOIN "FormativeAssessments" fa ON fa."Id" = fq."FormativeAssessmentId"
LEFT JOIN "SummativeAssessmentQuestions" sq ON sq."Id" = a."QuestionId" AND a."AssessmentType" = 'Summative'
LEFT JOIN "SummativeAssessments" sa ON sa."Id" = sq."SummativeAssessmentId"
WHERE a."LearnerId" = 2
LIMIT 10;

-- What pqUsIds does learner 2's project qualification have?
SELECT 
  pqus."Id" as pqus_id,
  pqus."ProjectQualificationId",
  pqus."UnitStandardId",
  pqus."UnitStandardType"
FROM "ProjectQualificationUnitStandards" pqus
WHERE pqus."ProjectQualificationId" IN (
  SELECT pq."Id" 
  FROM "ProjectQualifications" pq
  JOIN "ProjectLearningPathways" plp ON plp."Id" = pq."ProjectLearningPathwayId"
  JOIN "Projects" p ON p."Id" = plp."ProjectId"
  JOIN "ProjectSites" ps ON ps."ProjectId" = p."Id"
  JOIN "SiteClasses" sc ON sc."ProjectSiteId" = ps."Id"
  JOIN "ClassEnrollments" ce ON ce."SiteClassId" = sc."Id"
  WHERE ce."LearnerId" = 2
  LIMIT 1
)
LIMIT 10;
