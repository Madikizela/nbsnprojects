-- Create LearnerDocuments table with encryption support
CREATE TABLE IF NOT EXISTS "LearnerDocuments" (
    "Id" SERIAL PRIMARY KEY,
    "LearnerId" INTEGER NOT NULL,
    "DocumentType" VARCHAR(100) NOT NULL,
    "FileName" VARCHAR(255) NOT NULL,
    "EncryptedFilePath" VARCHAR(500) NOT NULL,
    "FileSize" BIGINT NOT NULL,
    "MimeType" VARCHAR(100) NOT NULL,
    "EncryptionIV" VARCHAR(500) NOT NULL, -- Initialization Vector for AES encryption
    "FileHash" VARCHAR(500) NOT NULL, -- SHA256 hash for integrity verification
    "UploadedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UploadedByUserId" INTEGER,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FK_LearnerDocuments_Learners" FOREIGN KEY ("LearnerId") REFERENCES "Learners"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_LearnerDocuments_Users" FOREIGN KEY ("UploadedByUserId") REFERENCES "Users"("Id") ON DELETE SET NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS "IX_LearnerDocuments_LearnerId" ON "LearnerDocuments"("LearnerId");
CREATE INDEX IF NOT EXISTS "IX_LearnerDocuments_DocumentType" ON "LearnerDocuments"("DocumentType");

-- Add comment
COMMENT ON TABLE "LearnerDocuments" IS 'Stores encrypted learner documents with AES-256 encryption';
COMMENT ON COLUMN "LearnerDocuments"."EncryptedFilePath" IS 'Path to encrypted file on disk';
COMMENT ON COLUMN "LearnerDocuments"."EncryptionIV" IS 'Initialization Vector used for AES encryption';
COMMENT ON COLUMN "LearnerDocuments"."FileHash" IS 'SHA256 hash of original file for integrity verification';
