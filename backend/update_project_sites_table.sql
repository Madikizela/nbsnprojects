-- Add new columns to ProjectSites table
ALTER TABLE "ProjectSites" 
ADD COLUMN IF NOT EXISTS "Category" VARCHAR(50),
ADD COLUMN IF NOT EXISTS "ContactFirstName" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "ContactLastName" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "ContactCellNumber" VARCHAR(50);

-- Rename existing contact columns for clarity
ALTER TABLE "ProjectSites" 
RENAME COLUMN "ContactPerson" TO "ContactPersonOld";

-- Update SiteCode to be more flexible
COMMENT ON COLUMN "ProjectSites"."Category" IS 'Site category: Workplace or Institutional';
COMMENT ON COLUMN "ProjectSites"."ContactFirstName" IS 'Contact person first name';
COMMENT ON COLUMN "ProjectSites"."ContactLastName" IS 'Contact person last name';
COMMENT ON COLUMN "ProjectSites"."ContactCellNumber" IS 'Contact person cell number';
