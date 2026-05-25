-- Add SignaturePath column to Learners table
ALTER TABLE "Learners" ADD COLUMN IF NOT EXISTS "SignaturePath" VARCHAR(500);
