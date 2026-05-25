-- Check the actual schema of SkillsDevelopmentProviders table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'SkillsDevelopmentProviders' 
ORDER BY ordinal_position;

-- Check if the table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'SkillsDevelopmentProviders';