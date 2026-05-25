-- Create SiteClasses table
CREATE TABLE IF NOT EXISTS "SiteClasses" (
    "Id" SERIAL PRIMARY KEY,
    "ProjectSiteId" INTEGER NOT NULL,
    "ClassName" VARCHAR(255) NOT NULL,
    "MaxLearners" INTEGER NOT NULL,
    "Status" VARCHAR(50) DEFAULT 'Active',
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "CreatedByUserId" INTEGER,
    
    CONSTRAINT "FK_SiteClasses_ProjectSites"
        FOREIGN KEY ("ProjectSiteId")
        REFERENCES "ProjectSites"("Id")
        ON DELETE CASCADE,
        
    CONSTRAINT "FK_SiteClasses_Users"
        FOREIGN KEY ("CreatedByUserId")
        REFERENCES "Users"("Id")
        ON DELETE SET NULL,
        
    CONSTRAINT "CHK_MaxLearners_Positive"
        CHECK ("MaxLearners" > 0)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS "IX_SiteClasses_ProjectSiteId" ON "SiteClasses"("ProjectSiteId");
CREATE INDEX IF NOT EXISTS "IX_SiteClasses_Status" ON "SiteClasses"("Status");

-- Add comment
COMMENT ON TABLE "SiteClasses" IS 'Stores class information for project sites';
COMMENT ON COLUMN "SiteClasses"."ClassName" IS 'Name of the class (letters and spaces only)';
COMMENT ON COLUMN "SiteClasses"."MaxLearners" IS 'Maximum number of learners allowed in the class';
