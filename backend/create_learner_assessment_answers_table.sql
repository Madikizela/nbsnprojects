-- Create table to store learner assessment answers (scanned documents)
CREATE TABLE IF NOT EXISTS "LearnerAssessmentAnswers" (
    "Id" SERIAL PRIMARY KEY,
    "LearnerId" INTEGER NOT NULL,
    "AssessmentId" INTEGER NOT NULL,
    "AssessmentType" VARCHAR(20) NOT NULL CHECK ("AssessmentType" IN ('Formative', 'Summative')),
    "QuestionId" INTEGER NOT NULL,
    "QuestionNumber" INTEGER NOT NULL,
    "ScannedDocumentPath" TEXT NOT NULL,
    "ScannedDocumentName" VARCHAR(255) NOT NULL,
    "FileSize" BIGINT,
    "MimeType" VARCHAR(100),
    "ScannedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    "CreatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Ensure one answer per learner per question
    UNIQUE("LearnerId", "AssessmentId", "AssessmentType", "QuestionId"),
    
    -- Foreign key constraints
    FOREIGN KEY ("LearnerId") REFERENCES "Learners"("Id") ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_learner_assessment_answers_learner_id" ON "LearnerAssessmentAnswers"("LearnerId");
CREATE INDEX IF NOT EXISTS "idx_learner_assessment_answers_assessment" ON "LearnerAssessmentAnswers"("AssessmentId", "AssessmentType");
CREATE INDEX IF NOT EXISTS "idx_learner_assessment_answers_question" ON "LearnerAssessmentAnswers"("QuestionId");

-- Create table to track learner assessment progress
CREATE TABLE IF NOT EXISTS "LearnerAssessmentProgress" (
    "Id" SERIAL PRIMARY KEY,
    "LearnerId" INTEGER NOT NULL,
    "ProjectQualificationUnitStandardId" INTEGER NOT NULL,
    "FormativeAssessmentId" INTEGER,
    "SummativeAssessmentId" INTEGER,
    "FormativeCompleted" BOOLEAN NOT NULL DEFAULT FALSE,
    "FormativeCompletedAt" TIMESTAMP WITHOUT TIME ZONE,
    "SummativeCompleted" BOOLEAN NOT NULL DEFAULT FALSE,
    "SummativeCompletedAt" TIMESTAMP WITHOUT TIME ZONE,
    "CreatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Ensure one progress record per learner per unit standard
    UNIQUE("LearnerId", "ProjectQualificationUnitStandardId"),
    
    -- Foreign key constraints
    FOREIGN KEY ("LearnerId") REFERENCES "Learners"("Id") ON DELETE CASCADE,
    FOREIGN KEY ("ProjectQualificationUnitStandardId") REFERENCES "ProjectQualificationUnitStandards"("Id") ON DELETE CASCADE
);

-- Create indexes for progress tracking
CREATE INDEX IF NOT EXISTS "idx_learner_assessment_progress_learner_id" ON "LearnerAssessmentProgress"("LearnerId");
CREATE INDEX IF NOT EXISTS "idx_learner_assessment_progress_unit_standard" ON "LearnerAssessmentProgress"("ProjectQualificationUnitStandardId");

COMMENT ON TABLE "LearnerAssessmentAnswers" IS 'Stores scanned assessment answer documents for each learner question';
COMMENT ON TABLE "LearnerAssessmentProgress" IS 'Tracks learner progress through unit standard assessments';