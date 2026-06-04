-- Delete all assessment answers and progress for all learners
DELETE FROM "LearnerAssessmentAnswers";
DELETE FROM "LearnerAssessmentProgress";

-- Confirm
SELECT COUNT(*) as answers_remaining FROM "LearnerAssessmentAnswers";
SELECT COUNT(*) as progress_remaining FROM "LearnerAssessmentProgress";
