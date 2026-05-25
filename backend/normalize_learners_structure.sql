-- Step 1: Drop the old Learners table (if exists)
DROP TABLE IF EXISTS "Learners" CASCADE;

-- Step 2: Create the new normalized Learners table (core information only)
CREATE TABLE IF NOT EXISTS "Learners" (
    "Id" SERIAL PRIMARY KEY,
    "CreatedByUserId" INTEGER,
    
    -- Personal Information (Core)
    "Title" VARCHAR(10) NOT NULL,
    "FirstName" VARCHAR(100) NOT NULL,
    "LastName" VARCHAR(100) NOT NULL,
    "IdNumber" VARCHAR(13) NOT NULL UNIQUE,
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
    
    -- Timestamps
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT "FK_Learners_Users" FOREIGN KEY ("CreatedByUserId") 
        REFERENCES "Users"("Id") ON DELETE SET NULL
);

-- Step 3: Create ClassEnrollments junction table
CREATE TABLE IF NOT EXISTS "ClassEnrollments" (
    "Id" SERIAL PRIMARY KEY,
    "LearnerId" INTEGER NOT NULL,
    "SiteClassId" INTEGER NOT NULL,
    "EnrollmentDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Status" VARCHAR(50) NOT NULL DEFAULT 'Active',
    "CompletionDate" TIMESTAMP,
    "WithdrawalDate" TIMESTAMP,
    "WithdrawalReason" TEXT,
    "CreatedByUserId" INTEGER,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT "FK_ClassEnrollments_Learners" FOREIGN KEY ("LearnerId") 
        REFERENCES "Learners"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_ClassEnrollments_SiteClasses" FOREIGN KEY ("SiteClassId") 
        REFERENCES "SiteClasses"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_ClassEnrollments_Users" FOREIGN KEY ("CreatedByUserId") 
        REFERENCES "Users"("Id") ON DELETE SET NULL,
    
    -- Unique constraint: A learner can only be enrolled once in a class (unless withdrawn)
    CONSTRAINT "UQ_ClassEnrollments_Learner_Class" UNIQUE ("LearnerId", "SiteClassId")
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "IX_Learners_IdNumber" ON "Learners"("IdNumber");
CREATE INDEX IF NOT EXISTS "IX_Learners_LastName" ON "Learners"("LastName");
CREATE INDEX IF NOT EXISTS "IX_Learners_CreatedByUserId" ON "Learners"("CreatedByUserId");

CREATE INDEX IF NOT EXISTS "IX_ClassEnrollments_LearnerId" ON "ClassEnrollments"("LearnerId");
CREATE INDEX IF NOT EXISTS "IX_ClassEnrollments_SiteClassId" ON "ClassEnrollments"("SiteClassId");
CREATE INDEX IF NOT EXISTS "IX_ClassEnrollments_Status" ON "ClassEnrollments"("Status");
CREATE INDEX IF NOT EXISTS "IX_ClassEnrollments_CreatedByUserId" ON "ClassEnrollments"("CreatedByUserId");

-- Add comments for documentation
COMMENT ON TABLE "Learners" IS 'Core learner information - reusable across multiple class enrollments';
COMMENT ON TABLE "ClassEnrollments" IS 'Junction table linking learners to classes with enrollment details';
COMMENT ON COLUMN "Learners"."IdNumber" IS 'South African ID Number - 13 digits, must be unique';
COMMENT ON COLUMN "ClassEnrollments"."Status" IS 'Enrollment status: Active, Completed, Withdrawn, Suspended';
