const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('skills_development.db');

console.log('Converting qualification_id back to INTEGER to match controller parameter type...');

db.serialize(() => {
    // Convert occupational_unit_standards qualification_id to INTEGER
    console.log('Converting occupational_unit_standards.qualification_id to INTEGER...');
    
    db.run("BEGIN TRANSACTION;");
    
    // Create temporary table with INTEGER type
    db.run(`
        CREATE TABLE occupational_unit_standards_temp (
            id INTEGER PRIMARY KEY,
            qualification_id INTEGER,
            module_code TEXT,
            unit_standard_name TEXT,
            module_type TEXT,
            level TEXT,
            credits INTEGER
        )
    `);
    
    // Copy data converting qualification_id to INTEGER
    db.run(`
        INSERT INTO occupational_unit_standards_temp 
        (id, qualification_id, module_code, unit_standard_name, module_type, level, credits)
        SELECT 
            id,
            CAST(qualification_id AS INTEGER),
            module_code,
            unit_standard_name,
            module_type,
            level,
            credits
        FROM occupational_unit_standards
    `);
    
    // Drop original table and rename temp table
    db.run("DROP TABLE occupational_unit_standards;");
    db.run("ALTER TABLE occupational_unit_standards_temp RENAME TO occupational_unit_standards;");
    
    db.run("COMMIT;");
    
    console.log('Conversion completed!');
    
    // Test the conversion
    console.log('\nTesting converted data with qualification_id = 1660:');
    db.all(`
        SELECT 
            id,
            qualification_id,
            module_code,
            unit_standard_name,
            module_type,
            level,
            credits
        FROM occupational_unit_standards 
        WHERE qualification_id = 1660
        LIMIT 1
    `, (err, rows) => {
        if (err) {
            console.error('Error testing data:', err);
        } else {
            console.log(`Found ${rows.length} records`);
            if (rows.length > 0) {
                console.log('Sample record:', JSON.stringify(rows[0], null, 2));
                console.log('qualification_id type:', typeof rows[0].qualification_id);
            }
        }
        
        // Also convert legacy table
        console.log('\nConverting legacy_unit_standards.qualification_id to INTEGER...');
        
        db.run("BEGIN TRANSACTION;");
        
        // Create temporary table with INTEGER type for legacy
        db.run(`
            CREATE TABLE legacy_unit_standards_temp (
                id INTEGER PRIMARY KEY,
                unitstandard_id INTEGER,
                qualification_id INTEGER,
                unit_standard_name TEXT,
                level TEXT,
                credits INTEGER,
                synced INTEGER,
                module_code TEXT,
                module_type TEXT
            )
        `);
        
        // Copy legacy data converting qualification_id to INTEGER
        db.run(`
            INSERT INTO legacy_unit_standards_temp 
            (id, unitstandard_id, qualification_id, unit_standard_name, level, credits, synced, module_code, module_type)
            SELECT 
                id,
                unitstandard_id,
                CAST(qualification_id AS INTEGER),
                unit_standard_name,
                level,
                credits,
                synced,
                module_code,
                module_type
            FROM legacy_unit_standards
        `);
        
        // Drop original legacy table and rename temp table
        db.run("DROP TABLE legacy_unit_standards;");
        db.run("ALTER TABLE legacy_unit_standards_temp RENAME TO legacy_unit_standards;");
        
        db.run("COMMIT;");
        
        console.log('Legacy conversion completed!');
        
        // Test the legacy conversion
        console.log('\nTesting converted legacy data with qualification_id = 1660:');
        db.all(`
            SELECT 
                id,
                unitstandard_id,
                qualification_id,
                unit_standard_name,
                level,
                credits,
                module_code,
                module_type
            FROM legacy_unit_standards 
            WHERE qualification_id = 1660
            LIMIT 1
        `, (err, rows) => {
            if (err) {
                console.error('Error testing legacy data:', err);
            } else {
                console.log(`Found ${rows.length} legacy records`);
                if (rows.length > 0) {
                    console.log('Sample legacy record:', JSON.stringify(rows[0], null, 2));
                    console.log('legacy qualification_id type:', typeof rows[0].qualification_id);
                }
            }
            
            db.close();
            console.log('\nBoth tables converted to INTEGER type successfully!');
        });
    });
});

db.on('error', (err) => {
    console.error('Database error:', err);
    db.close();
});