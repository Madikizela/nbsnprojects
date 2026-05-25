-- SQL script to alter the occupational_unit_standards table
-- to make qualification_id an integer instead of varchar

-- First, let's create a backup of the data
CREATE TABLE occupational_unit_standards_backup AS 
SELECT id, qualification_id, module_code, unit_standard_name, module_type, level, credits 
FROM occupational_unit_standards;

-- Drop the existing table
DROP TABLE occupational_unit_standards;

-- Create the new table with integer qualification_id
CREATE TABLE occupational_unit_standards (
  id INTEGER PRIMARY KEY,
  qualification_id INTEGER,
  module_code TEXT,
  unit_standard_name TEXT,
  module_type TEXT,
  level TEXT,
  credits INTEGER
);

-- Insert the data back, converting qualification_id to integer
INSERT INTO occupational_unit_standards (id, qualification_id, module_code, unit_standard_name, module_type, level, credits)
SELECT id, 
       CAST(qualification_id AS INTEGER), 
       module_code, 
       unit_standard_name, 
       module_type, 
       level, 
       credits
FROM occupational_unit_standards_backup;

-- Drop the backup table
DROP TABLE occupational_unit_standards_backup;