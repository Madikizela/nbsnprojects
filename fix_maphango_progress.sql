-- Fix Nkwenkwezi Maphango's progress — all 5 formative questions uploaded, mark as completed
UPDATE "LearnerAssessmentProgress"
SET 
  "FormativeCompleted" = true,
  "FormativeCompletedAt" = NOW(),
  "UpdatedAt" = NOW()
WHERE "LearnerId" = 1 
  AND "ProjectQualificationUnitStandardId" = 1;

-- Verify
SELECT "LearnerId", "FormativeCompleted", "FormativeCompletedAt", "SummativeCompleted"
FROM "LearnerAssessmentProgress"
WHERE "LearnerId" = 1;
