-- Create ProjectSites table
CREATE TABLE IF NOT EXISTS "ProjectSites" (
    "Id" SERIAL PRIMARY KEY,
    "ProjectId" INTEGER NOT NULL,
    "SiteName" VARCHAR(255) NOT NULL,
    "SiteCode" VARCHAR(50),
    "Address" TEXT,
    "Province" VARCHAR(100),
    "City" VARCHAR(100),
    "PostalCode" VARCHAR(20),
    "ContactPerson" VARCHAR(255),
    "ContactPhone" VARCHAR(50),
    "ContactEmail" VARCHAR(255),
    "Latitude" DECIMAL(10, 8),
    "Longitude" DECIMAL(11, 8),
    "Capacity" INTEGER,
    "Status" VARCHAR(50) DEFAULT 'Active',
    "Description" TEXT,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "CreatedByUserId" INTEGER,
    
    CONSTRAINT "FK_ProjectSites_Projects"
        FOREIGN KEY ("ProjectId")
        REFERENCES "Projects"("Id")
        ON DELETE CASCADE,
        
    CONSTRAINT "FK_ProjectSites_Users"
        FOREIGN KEY ("CreatedByUserId")
        REFERENCES "Users"("Id")
        ON DELETE SET NULL
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS "IX_ProjectSites_ProjectId" ON "ProjectSites"("ProjectId");
CREATE INDEX IF NOT EXISTS "IX_ProjectSites_Status" ON "ProjectSites"("Status");

-- Add comment
COMMENT ON TABLE "ProjectSites" IS 'Stores site/location information for projects managed by logistics';
