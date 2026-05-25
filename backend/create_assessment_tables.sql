-- Create Formative Assessments Table
CREATE TABLE IF NOT EXISTS "FormativeAssessments" (
    "Id" SERIAL PRIMARY KEY,
    "ProjectQualificationUnitStandardId" INTEGER NOT NULL,
    "AssessmentDate" TIMESTAMP NOT NULL,
    "AssessmentMethod" VARCHAR(100),
    "Score" DECIMAL(5,2),
    "MaxScore" DECIMAL(5,2),
    "AssessorName" VARCHAR(255),
    "Comments" TEXT,
    "Status" VARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'Completed', 'Reviewed'
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT "FK_FormativeAssessments_ProjectQualificationUnitStandards"
        FOREIGN KEY ("ProjectQualificationUnitStandardId")
        REFERENCES "ProjectQualificationUnitStandards"("Id")
        ON DELETE CASCADE
);

-- Create Summative Assessments Table
CREATE TABLE IF NOT EXISTS "SummativeAssessments" (
    "Id" SERIAL PRIMARY KEY,
    "ProjectQualificationUnitStandardId" INTEGER NOT NULL,
    "AssessmentDate" TIMESTAMP NOT NULL,
    "FinalScore" DECIMAL(5,2),
    "MaxScore" DECIMAL(5,2),
    "Status" VARCHAR(50) NOT NULL, -- 'Competent', 'Not Yet Competent', 'Pending'
    "AssessorName" VARCHAR(255),
    "ModeratorName" VARCHAR(255),
    "Comments" TEXT,
    "ModeratorComments" TEXT,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT "FK_SummativeAssessments_ProjectQualificationUnitStandards"
        FOREIGN KEY ("ProjectQualificationUnitStandardId")
        REFERENCES "ProjectQualificationUnitStandards"("Id")
        ON DELETE CASCADE
);

-- Create Logbook Entries Table
CREATE TABLE IF NOT EXISTS "LogbookEntries" (
    "Id" SERIAL PRIMARY KEY,
    "ProjectQualificationUnitStandardId" INTEGER NOT NULL,
    "EntryDate" TIMESTAMP NOT NULL,
    "ActivityDescription" TEXT NOT NULL,
    "HoursSpent" DECIMAL(5,2),
    "SupervisorName" VARCHAR(255),
    "SupervisorSignature" VARCHAR(255),
    "Approved" BOOLEAN DEFAULT FALSE,
    "ApprovedDate" TIMESTAMP,
    "EvidenceUrl" TEXT,
    "Comments" TEXT,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT "FK_LogbookEntries_ProjectQualificationUnitStandards"
        FOREIGN KEY ("ProjectQualificationUnitStandardId")
        REFERENCES "ProjectQualificationUnitStandards"("Id")
        ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "IX_FormativeAssessments_ProjectQualificationUnitStandardId"
    ON "FormativeAssessments"("ProjectQualificationUnitStandardId");

CREATE INDEX IF NOT EXISTS "IX_SummativeAssessments_ProjectQualificationUnitStandardId"
    ON "SummativeAssessments"("ProjectQualificationUnitStandardId");

CREATE INDEX IF NOT EXISTS "IX_LogbookEntries_ProjectQualificationUnitStandardId"
    ON "LogbookEntries"("ProjectQualificationUnitStandardId");

-- Add comments
COMMENT ON TABLE "FormativeAssessments" IS 'Stores formative assessments for unit standards - ongoing learning progress tracking';
COMMENT ON TABLE "SummativeAssessments" IS 'Stores summative assessments for unit standards - final evaluation of competence';
COMMENT ON TABLE "LogbookEntries" IS 'Stores logbook entries for unit standards - practical activity records';
