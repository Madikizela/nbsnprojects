-- Delete all learner documents
DELETE FROM "LearnerDocuments";

-- Confirm
SELECT COUNT(*) as remaining FROM "LearnerDocuments";
