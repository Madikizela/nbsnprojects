-- Create table to store selected unit standards for project qualifications
CREATE TABLE IF NOT EXISTS "ProjectQualificationUnitStandards" (
    "Id" SERIAL PRIMARY KEY,
    "ProjectQualificationId" INTEGER NOT NULL,
    "UnitStandardId" INTEGER NOT NULL,
    "UnitStandardType" VARCHAR(50) NOT NULL, -- 'Occupational' or 'Legacy'
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Foreign key to ProjectQualifications
    CONSTRAINT "FK_ProjectQualificationUnitStandards_ProjectQualifications"
        FOREIGN KEY ("ProjectQualificationId")
        REFERENCES "ProjectQualifications"("Id")
        ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate unit standards for same qualification
    CONSTRAINT "UQ_ProjectQualification_UnitStandard"
        UNIQUE ("ProjectQualificationId", "UnitStandardId", "UnitStandardType")
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS "IX_ProjectQualificationUnitStandards_ProjectQualificationId"
    ON "ProjectQualificationUnitStandards"("ProjectQualificationId");

-- Add comment
COMMENT ON TABLE "ProjectQualificationUnitStandards" IS 'Stores selected unit standards for project qualifications';
COMMENT ON COLUMN "ProjectQualificationUnitStandards"."UnitStandardType" IS 'Type of unit standard: Occupational or Legacy';
