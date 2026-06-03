
-- Disable triggers to avoid issues
SET session_replication_role = 'replica';

-- Now include the converted data
\i 'c:/Users/madik/Documents/New_version/converted_data.sql'

-- Re-enable triggers
SET session_replication_role = 'origin';
