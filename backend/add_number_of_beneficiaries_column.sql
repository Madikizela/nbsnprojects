-- Add NumberOfBeneficiaries column to ProjectQualifications table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'ProjectQualifications' 
        AND column_name = 'NumberOfBeneficiaries'
    ) THEN
        ALTER TABLE "ProjectQualifications" 
        ADD COLUMN "NumberOfBeneficiaries" integer NOT NULL DEFAULT 0;
        
        RAISE NOTICE 'NumberOfBeneficiaries column added to ProjectQualifications table';
    ELSE
        RAISE NOTICE 'NumberOfBeneficiaries column already exists in ProjectQualifications table';
    END IF;
END $$;