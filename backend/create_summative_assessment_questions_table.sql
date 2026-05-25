-- Create Summative Assessment Questions Table
CREATE TABLE IF NOT EXISTS "SummativeAssessmentQuestions" (
    "Id" SERIAL PRIMARY KEY,
    "SummativeAssessmentId" INTEGER NOT NULL,
    "QuestionNumber" INTEGER NOT NULL,
    "QuestionText" TEXT NOT NULL,
    "AllocatedMarks" DECIMAL(5,2) NOT NULL,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT "FK_SummativeAssessmentQuestions_SummativeAssessments"
        FOREIGN KEY ("SummativeAssessmentId")
        REFERENCES "SummativeAssessments"("Id")
        ON DELETE CASCADE,
    
    -- Ensure unique question numbers per assessment
    CONSTRAINT "UQ_SummativeAssessment_QuestionNumber"
        UNIQUE ("SummativeAssessmentId", "QuestionNumber")
);

-- Add comment
COMMENT ON TABLE "SummativeAssessmentQuestions" IS 'Stores questions for summative assessments with allocated marks';
