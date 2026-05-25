-- Create Learners table
CREATE TABLE IF NOT EXISTS "Learners" (
    "Id" SERIAL PRIMARY KEY,
    "SiteClassId" INTEGER NOT NULL,
    "CreatedByUserId" INTEGER,
    
    -- Personal Information
    "Title" VARCHAR(10) NOT NULL,
    "Name" VARCHAR(100) NOT NULL,
    "Surname" VARCHAR(100) NOT NULL,
    "IdNumber" VARCHAR(13) NOT NULL,
    "ContactNumber" VARCHAR(20),
    "Email" VARCHAR(100),
    "DateOfBirth" TIMESTAMP,
    "Age" INTEGER,
    "Gender" VARCHAR(50),
    "Race" VARCHAR(50),
    "HomeLanguage" VARCHAR(50),
    "Disability" VARCHAR(100),
    
    -- Address Information
    "AddressLine1" VARCHAR(255),
    "AddressLine2" VARCHAR(255),
    "AddressLine3" VARCHAR(255),
    "PostalCode" VARCHAR(10),
    
    -- Education Information
    "HighSchoolName" VARCHAR(200),
    "YearOfCompletion" INTEGER,
    "SchoolLocation" VARCHAR(200),
    "HighestGradePassed" VARCHAR(50),
    
    -- Next of Kin Information
    "NextOfKinName" VARCHAR(200),
    "NextOfKinRelation" VARCHAR(50),
    "NextOfKinContactNumber" VARCHAR(20),
    
    -- Bank Information
    "BankName" VARCHAR(100),
    "AccountType" VARCHAR(50),
    "AccountNumber" VARCHAR(50),
    "BranchCode" VARCHAR(20),
    
    -- Status and Timestamps
    "Status" VARCHAR(50) NOT NULL DEFAULT 'Active',
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT "FK_Learners_SiteClasses" FOREIGN KEY ("SiteClassId") 
        REFERENCES "SiteClasses"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_Learners_Users" FOREIGN KEY ("CreatedByUserId") 
        REFERENCES "Users"("Id") ON DELETE SET NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "IX_Learners_SiteClassId" ON "Learners"("SiteClassId");
CREATE INDEX IF NOT EXISTS "IX_Learners_IdNumber" ON "Learners"("IdNumber");
CREATE INDEX IF NOT EXISTS "IX_Learners_Surname" ON "Learners"("Surname");
CREATE INDEX IF NOT EXISTS "IX_Learners_Status" ON "Learners"("Status");
CREATE INDEX IF NOT EXISTS "IX_Learners_CreatedByUserId" ON "Learners"("CreatedByUserId");

-- Add unique constraint on ID Number to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS "UX_Learners_IdNumber" ON "Learners"("IdNumber");
