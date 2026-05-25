-- Create Formative Assessment Questions Table
CREATE TABLE IF NOT EXISTS "FormativeAssessmentQuestions" (
    "Id" SERIAL PRIMARY KEY,
    "FormativeAssessmentId" INTEGER NOT NULL,
    "QuestionNumber" INTEGER NOT NULL,
    "QuestionText" TEXT NOT NULL,
    "AllocatedMarks" DECIMAL(5,2) NOT NULL,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT "FK_FormativeAssessmentQuestions_FormativeAssessments"
        FOREIGN KEY ("FormativeAssessmentId")
        REFERENCES "FormativeAssessments"("Id")
        ON DELETE CASCADE,
    
    -- Ensure unique question numbers per assessment
    CONSTRAINT "UQ_FormativeAssessment_QuestionNumber"
        UNIQUE ("FormativeAssessmentId", "QuestionNumber")
);

-- Add comment
COMMENT ON TABLE "FormativeAssessmentQuestions" IS 'Stores questions for formative assessments with allocated marks';
