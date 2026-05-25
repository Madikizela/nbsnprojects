-- Add teacher profile columns to Users table
ALTER TABLE "Users" 
ADD COLUMN IF NOT EXISTS "AddressLine1" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "AddressLine2" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "City" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "Province" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "PostalCode" VARCHAR(20),
ADD COLUMN IF NOT EXISTS "ProfileImage" TEXT,
ADD COLUMN IF NOT EXISTS "Signature" TEXT;

-- Verify columns were added
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'Users' 
AND column_name IN ('AddressLine1', 'AddressLine2', 'City', 'Province', 'PostalCode', 'ProfileImage', 'Signature')
ORDER BY column_name;
