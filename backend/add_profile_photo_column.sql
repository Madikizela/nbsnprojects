-- Add ProfilePhotoPath column to Learners table
ALTER TABLE "Learners" 
ADD COLUMN IF NOT EXISTS "ProfilePhotoPath" VARCHAR(500);
