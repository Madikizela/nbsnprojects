
-- Add ZKTECO fingerprint columns to Learners table
ALTER TABLE "Learners" 
ADD COLUMN IF NOT EXISTS "LeftThumbTemplateZk" TEXT,
ADD COLUMN IF NOT EXISTS "RightThumbTemplateZk" TEXT;
