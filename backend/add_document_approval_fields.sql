-- Add approval fields to LearnerDocuments table
ALTER TABLE "LearnerDocuments" 
ADD COLUMN "ApprovalStatus" VARCHAR(20) DEFAULT 'Pending' NOT NULL,
ADD COLUMN "ApprovedByUserId" INTEGER,
ADD COLUMN "ApprovedAt" TIMESTAMP,
ADD COLUMN "DeclineReason" VARCHAR(500);

-- Add foreign key constraint for ApprovedByUserId
ALTER TABLE "LearnerDocuments" 
ADD CONSTRAINT "FK_LearnerDocuments_ApprovedByUser" 
FOREIGN KEY ("ApprovedByUserId") REFERENCES "Users"("Id");

-- Create index for approval status queries
CREATE INDEX "IX_LearnerDocuments_ApprovalStatus" ON "LearnerDocuments"("ApprovalStatus");

-- Update existing documents to have 'Pending' status
UPDATE "LearnerDocuments" SET "ApprovalStatus" = 'Pending' WHERE "ApprovalStatus" IS NULL;

COMMIT;