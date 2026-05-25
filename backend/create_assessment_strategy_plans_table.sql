-- Create Assessment Strategy Plans Table
CREATE TABLE IF NOT EXISTS "AssessmentStrategyPlans" (
    "Id" SERIAL PRIMARY KEY,
    "ProjectQualificationUnitStandardId" INTEGER NOT NULL UNIQUE,
    "AssessmentDate" TIMESTAMP,
    "QuestionnaireTime" VARCHAR(255),
    "QuestionnairePeople" VARCHAR(255),
    "QuestionnaireLocation" VARCHAR(255),
    "QuestionnaireEquipment" TEXT,
    "PracticalTime" VARCHAR(255),
    "PracticalPeople" VARCHAR(255),
    "PracticalLocation" VARCHAR(255),
    "PracticalEquipment" TEXT,
    "AssessorName" VARCHAR(255),
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT "FK_AssessmentStrategyPlans_ProjectQualificationUnitStandards"
        FOREIGN KEY ("ProjectQualificationUnitStandardId")
        REFERENCES "ProjectQualificationUnitStandards"("Id")
        ON DELETE CASCADE
);

-- Create index
CREATE INDEX IF NOT EXISTS "IX_AssessmentStrategyPlans_ProjectQualificationUnitStandardId"
    ON "AssessmentStrategyPlans"("ProjectQualificationUnitStandardId");

-- Add comments
COMMENT ON TABLE "AssessmentStrategyPlans" IS 'Stores assessment strategy plans for unit standards - questionnaire and practical assignment strategies';
