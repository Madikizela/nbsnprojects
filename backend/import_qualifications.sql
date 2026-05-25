-- PostgreSQL compatible import script for qualifications and unit standards

-- Create occupational_qualifications table
CREATE TABLE IF NOT EXISTS occupational_qualifications (
    qualification_id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    level VARCHAR(255) NOT NULL,
    credits INTEGER NOT NULL,
    qualification_type VARCHAR(255) NOT NULL,
    description VARCHAR(255),
    quality_partner VARCHAR(255) NOT NULL,
    trade VARCHAR(255) NOT NULL,
    has_cat VARCHAR(3) DEFAULT 'NO' CHECK (has_cat IN ('YES', 'NO'))
);

-- Create legacy qualifications table
CREATE TABLE IF NOT EXISTS legacy_qualifications (
    id SERIAL PRIMARY KEY,
    qualification_id INTEGER,
    name VARCHAR(255),
    description TEXT,
    level VARCHAR(26),
    credits INTEGER,
    qualification_type VARCHAR(255) NOT NULL,
    has_cat VARCHAR(3) DEFAULT 'NO' CHECK (has_cat IN ('YES', 'NO'))
);

-- Create occupational_unit_standards table
CREATE TABLE IF NOT EXISTS occupational_unit_standards (
    id SERIAL PRIMARY KEY,
    qualification_id VARCHAR(50),
    module_code VARCHAR(100),
    unit_standard_name VARCHAR(255),
    module_type VARCHAR(50) CHECK (module_type IN ('Knowledge Modules', 'Practical Skill Modules', 'Work Experience Modules')),
    level VARCHAR(27),
    credits INTEGER
);

-- Create legacy unit standards table
CREATE TABLE IF NOT EXISTS legacy_unit_standards (
    id SERIAL PRIMARY KEY,
    unitstandard_id INTEGER,
    qualification_id INTEGER,
    unit_standard_name VARCHAR(255),
    level VARCHAR(27),
    credits INTEGER,
    synced INTEGER DEFAULT 0
);

-- Create learning pathways table
CREATE TABLE IF NOT EXISTS learning_pathways (
    pathway_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    synced INTEGER DEFAULT 0
);

-- Insert learning pathways data
INSERT INTO learning_pathways (pathway_id, name, synced) VALUES
(1, 'Internship', 0),
(2, 'Apprenticeship (Artisans)', 0),
(3, 'Learnership', 0),
(4, 'Short Skills Programme', 0),
(5, 'ARPL', 0),
(6, 'RPL', 0),
(7, 'Bursary', 0),
(8, 'University Student Placement', 0),
(9, 'Work Integrated Learning', 0)
ON CONFLICT (pathway_id) DO NOTHING;

-- Create qualification types table
CREATE TABLE IF NOT EXISTS qualification_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

-- Insert qualification types
INSERT INTO qualification_types (name, description) VALUES
('Legacy', 'Legacy qualifications from previous system'),
('Occupational', 'Occupational qualifications')
ON CONFLICT (name) DO NOTHING;