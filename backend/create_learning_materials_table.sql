-- Create Learning Materials Table
CREATE TABLE IF NOT EXISTS "LearningMaterials" (
    "Id" SERIAL PRIMARY KEY,
    "ProjectQualificationUnitStandardId" INTEGER NOT NULL,
    "Title" VARCHAR(255) NOT NULL,
    "Description" TEXT,
    "MaterialType" VARCHAR(50) NOT NULL, -- 'PDF', 'Video', 'Document', 'Link'
    "FileName" VARCHAR(255),
    "EncryptedFilePath" VARCHAR(500),
    "FileSize" BIGINT,
    "MimeType" VARCHAR(100),
    "EncryptionIV" VARCHAR(500),
    "FileHash" VARCHAR(500),
    "ExternalUrl" VARCHAR(1000), -- For YouTube links or external resources
    "DisplayOrder" INTEGER NOT NULL DEFAULT 0,
    "UploadedByUserId" INTEGER,
    "IsActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT "FK_LearningMaterials_ProjectQualificationUnitStandards"
        FOREIGN KEY ("ProjectQualificationUnitStandardId")
        REFERENCES "ProjectQualificationUnitStandards"("Id")
        ON DELETE CASCADE,
    
    CONSTRAINT "FK_LearningMaterials_Users"
        FOREIGN KEY ("UploadedByUserId")
        REFERENCES "Users"("Id")
        ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "IX_LearningMaterials_UnitStandardId" 
    ON "LearningMaterials"("ProjectQualificationUnitStandardId");

CREATE INDEX IF NOT EXISTS "IX_LearningMaterials_IsActive" 
    ON "LearningMaterials"("IsActive");

CREATE INDEX IF NOT EXISTS "IX_LearningMaterials_MaterialType" 
    ON "LearningMaterials"("MaterialType");

-- Add comments
COMMENT ON TABLE "LearningMaterials" IS 'Stores learning content/study guides for qualifications that learners can access on web and mobile';
COMMENT ON COLUMN "LearningMaterials"."MaterialType" IS 'Type of learning material: PDF, Video, Document, Link';
COMMENT ON COLUMN "LearningMaterials"."EncryptedFilePath" IS 'Path to encrypted file on disk (if file-based)';
COMMENT ON COLUMN "LearningMaterials"."ExternalUrl" IS 'External URL for videos or web-based content';
COMMENT ON COLUMN "LearningMaterials"."DisplayOrder" IS 'Order in which materials should be displayed to learners';
