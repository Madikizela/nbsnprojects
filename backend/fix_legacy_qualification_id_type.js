const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('skills_development.db');

console.log('Fixing legacy_unit_standards qualification_id column type...');

db.serialize(() => {
    // First, let's check the current structure
    console.log('\nCurrent legacy_unit_standards structure:');
    db.all("PRAGMA table_info(legacy_unit_standards)", (err, rows) => {
        if (err) {
            console.error('Error checking table structure:', err);
            return;
        }
        rows.forEach(row => {
            console.log(`- ${row.name}: ${row.type}`);
        });
    });

    // Check current data
    console.log('\nSample qualification_id values in legacy_unit_standards:');
    db.all("SELECT DISTINCT qualification_id FROM legacy_unit_standards LIMIT 5", (err, rows) => {
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
        CREATE TABLE legacy_unit_standards_temp (
            id INTEGER PRIMARY KEY,
            unitstandard_id INTEGER,
            qualification_id TEXT,
            unit_standard_name TEXT,
            level TEXT,
            credits INTEGER,
            synced INTEGER
        )
    `);
    
    // Copy data with qualification_id as string
    db.run(`
        INSERT INTO legacy_unit_standards_temp 
        (id, unitstandard_id, qualification_id, unit_standard_name, level, credits, synced)
        SELECT 
            id,
            unitstandard_id,
            CAST(qualification_id AS TEXT),
            unit_standard_name,
            level,
            credits,
            synced
        FROM legacy_unit_standards
    `);
    
    // Drop original table and rename temp table
    db.run("DROP TABLE legacy_unit_standards;");
    db.run("ALTER TABLE legacy_unit_standards_temp RENAME TO legacy_unit_standards;");
    
    db.run("COMMIT;");
    
    console.log('\nConversion completed!');
    
    // Verify the changes
    console.log('\nUpdated legacy_unit_standards structure:');
    db.all("PRAGMA table_info(legacy_unit_standards)", (err, rows) => {
        if (err) {
            console.error('Error checking updated structure:', err);
            return;
        }
        rows.forEach(row => {
            console.log(`- ${row.name}: ${row.type}`);
        });
        
        // Test the API query
        console.log('\nTesting legacy API query with qualification_id = 1660:');
        db.all("SELECT * FROM legacy_unit_standards WHERE qualification_id = '1660'", (err, rows) => {
            if (err) {
                console.error('Error testing query:', err);
            } else {
                console.log(`Found ${rows.length} records`);
                if (rows.length > 0) {
                    console.log('Sample record:', JSON.stringify(rows[0], null, 2));
                }
            }
            
            db.close();
            console.log('\nLegacy table fix completed successfully!');
        });
    });
});

db.on('error', (err) => {
    console.error('Database error:', err);
    db.close();
});