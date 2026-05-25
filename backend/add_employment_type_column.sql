-- Add EmploymentType column to ProjectQualifications table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'ProjectQualifications' 
        AND column_name = 'EmploymentType'
    ) THEN
        ALTER TABLE "ProjectQualifications" 
        ADD COLUMN "EmploymentType" character varying(50);
        
        RAISE NOTICE 'EmploymentType column added to ProjectQualifications table';
    ELSE
        RAISE NOTICE 'EmploymentType column already exists in ProjectQualifications table';
    END IF;
END $$;