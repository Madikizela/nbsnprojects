-- Create SickNotes table
CREATE TABLE IF NOT EXISTS "SickNotes" (
    "Id" SERIAL PRIMARY KEY,
    "LearnerId" INTEGER NOT NULL,
    "MedicalFacility" VARCHAR(200) NOT NULL,
    "PractitionerName" VARCHAR(200) NOT NULL,
    "StartDate" TIMESTAMP WITH TIME ZONE NOT NULL,
    "EndDate" TIMESTAMP WITH TIME ZONE NOT NULL,
    "IssuedDate" TIMESTAMP WITH TIME ZONE NOT NULL,
    "EncryptedFilePath" VARCHAR(500) NOT NULL,
    "EncryptionIV" VARCHAR(500) NOT NULL,
    "Status" VARCHAR(20) NOT NULL DEFAULT 'Pending',
    "ApprovedByUserId" INTEGER,
    "ApprovedAt" TIMESTAMP WITH TIME ZONE,
    "RejectionReason" VARCHAR(500),
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FK_SickNotes_Learners_LearnerId" FOREIGN KEY ("LearnerId") REFERENCES "Learners" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_SickNotes_Users_ApprovedByUserId" FOREIGN KEY ("ApprovedByUserId") REFERENCES "Users" ("Id") ON DELETE SET NULL
);

-- Index for performance
CREATE INDEX IF NOT EXISTS "IX_SickNotes_LearnerId" ON "SickNotes" ("LearnerId");
CREATE INDEX IF NOT EXISTS "IX_SickNotes_ApprovedByUserId" ON "SickNotes" ("ApprovedByUserId");
