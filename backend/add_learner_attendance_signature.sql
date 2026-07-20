-- Add SignaturePath column to LearnerAttendances table
-- This column stores the path to the learner's signature image for each attendance record

ALTER TABLE "LearnerAttendances" 
ADD COLUMN IF NOT EXISTS "SignaturePath" VARCHAR(500);

-- Add comment for documentation
COMMENT ON COLUMN "LearnerAttendances"."SignaturePath" IS 'Path to the learner signature image file for this attendance record';

-- Verify the column was added
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'LearnerAttendances' 
AND column_name = 'SignaturePath';
