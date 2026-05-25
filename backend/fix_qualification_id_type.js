const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('skills_development.db');

console.log('Fixing qualification_id column type to match model expectations...');

db.serialize(() => {
    // First, let's check the current structure
    console.log('\nCurrent occupational_unit_standards structure:');
    db.all("PRAGMA table_info(occupational_unit_standards)", (err, rows) => {
        if (err) {
            console.error('Error checking table structure:', err);
            return;
        }
        rows.forEach(row => {
            console.log(`- ${row.name}: ${row.type}`);
        });
    });

    // Check current data
    console.log('\nSample qualification_id values:');
    db.all("SELECT DISTINCT qualification_id FROM occupational_unit_standards LIMIT 5", (err, rows) => {
        if (err) {
            console.error('Error checking data:', err);
            return;
        }
        rows.forEach(row => {
            console.log(`- ${row.qualification_id} (${typeof row.qualification_id})`);
        });
    });

    // Convert qualification_id to string type by recreating the table
    console.log('\nConverting qualification_id to TEXT type...');
    
    db.run("BEGIN TRANSACTION;");
    
    // Create temporary table with correct structure
    db.run(`
        CREATE TABLE occupational_unit_standards_temp (
            id INTEGER PRIMARY KEY,
            qualification_id TEXT,
            module_code TEXT,
            unit_standard_name TEXT,
            module_type TEXT,
            level TEXT,
            credits INTEGER
        )
    `);
    
    // Copy data with qualification_id as string
    db.run(`
        INSERT INTO occupational_unit_standards_temp 
        (id, qualification_id, module_code, unit_standard_name, module_type, level, credits)
        SELECT 
            id,
            CAST(qualification_id AS TEXT),
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
    
    console.log('\nConversion completed!');
    
    // Verify the changes
    console.log('\nUpdated occupational_unit_standards structure:');
    db.all("PRAGMA table_info(occupational_unit_standards)", (err, rows) => {
        if (err) {
            console.error('Error checking updated structure:', err);
            return;
        }
        rows.forEach(row => {
            console.log(`- ${row.name}: ${row.type}`);
        });
        
        // Test the API query
        console.log('\nTesting API query with qualification_id = 1660:');
        db.all("SELECT * FROM occupational_unit_standards WHERE qualification_id = '1660'", (err, rows) => {
            if (err) {
                console.error('Error testing query:', err);
            } else {
                console.log(`Found ${rows.length} records`);
                if (rows.length > 0) {
                    console.log('Sample record:', JSON.stringify(rows[0], null, 2));
                }
            }
            
            db.close();
            console.log('\nFix completed successfully!');
        });
    });
});

db.on('error', (err) => {
    console.error('Database error:', err);
    db.close();
});