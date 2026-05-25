-- Add PracticeNumber column to Users table for teachers
ALTER TABLE "Users" 
ADD COLUMN IF NOT EXISTS "PracticeNumber" VARCHAR(50);

-- Add comment
COMMENT ON COLUMN "Users"."PracticeNumber" IS 'Practice number for teachers';
