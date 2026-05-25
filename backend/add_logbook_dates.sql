-- Add StartDate and EndDate columns to LogbookEntries table
-- Keep EntryDate for backward compatibility but make it nullable

ALTER TABLE "LogbookEntries" 
ADD COLUMN "StartDate" TIMESTAMP,
ADD COLUMN "EndDate" TIMESTAMP;

-- Update existing records to use EntryDate as StartDate
UPDATE "LogbookEntries" 
SET "StartDate" = "EntryDate",
    "EndDate" = "EntryDate"
WHERE "StartDate" IS NULL;

-- Make StartDate and EndDate required
ALTER TABLE "LogbookEntries" 
ALTER COLUMN "StartDate" SET NOT NULL,
ALTER COLUMN "EndDate" SET NOT NULL;

-- Make EntryDate nullable (for backward compatibility)
ALTER TABLE "LogbookEntries" 
ALTER COLUMN "EntryDate" DROP NOT NULL;

SELECT 'Logbook dates columns added successfully' as result;
