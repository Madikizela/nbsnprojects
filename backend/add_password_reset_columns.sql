-- Add password reset columns to Learners table
-- Run this migration to enable forgot password functionality

-- Add PasswordResetToken column
ALTER TABLE "Learners" 
ADD COLUMN IF NOT EXISTS "PasswordResetToken" VARCHAR(255);

-- Add PasswordResetTokenExpiry column
ALTER TABLE "Learners" 
ADD COLUMN IF NOT EXISTS "PasswordResetTokenExpiry" TIMESTAMP;

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS "IX_Learners_PasswordResetToken" 
ON "Learners" ("PasswordResetToken") 
WHERE "PasswordResetToken" IS NOT NULL;

-- Verify columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'Learners' 
AND column_name IN ('PasswordResetToken', 'PasswordResetTokenExpiry');
