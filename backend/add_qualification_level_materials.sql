-- Add ProjectQualificationId to LearningMaterials (qualification-level upload)
-- and make ProjectQualificationUnitStandardId nullable so it is optional

ALTER TABLE "LearningMaterials"
    ALTER COLUMN "ProjectQualificationUnitStandardId" DROP NOT NULL;

ALTER TABLE "LearningMaterials"
    ADD COLUMN IF NOT EXISTS "ProjectQualificationId" INTEGER NULL
    REFERENCES "ProjectQualifications"("Id") ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "IX_LearningMaterials_QualificationId"
    ON "LearningMaterials"("ProjectQualificationId");
