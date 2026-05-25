const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('skills_development.db');

console.log('Testing corrected SQL queries...');

const testQualificationId = '1660';

// Test corrected occupational query
console.log(`\nTesting corrected occupational_unit_standards with qualification_id = ${testQualificationId}:`);

const correctedOccupationalQuery = `
    SELECT 
        id,
        qualification_id,
        module_code,
        unit_standard_name,
        module_type,
        level,
        credits
    FROM occupational_unit_standards 
    WHERE qualification_id = ?
`;

console.log('Corrected Occupational Query:', correctedOccupationalQuery);
db.all(correctedOccupationalQuery, [testQualificationId], (err, rows) => {
    if (err) {
        console.error('Corrected Occupational Error:', err);
    } else {
        console.log(`Corrected Occupational Result: ${rows.length} records`);
        if (rows.length > 0) {
            console.log('Sample:', JSON.stringify(rows[0], null, 2));
        }
    }
    
    // Test corrected legacy query (legacy table has different columns)
    console.log(`\nTesting corrected legacy_unit_standards with qualification_id = ${testQualificationId}:`);
    
    const correctedLegacyQuery = `
        SELECT 
            id,
            unitstandard_id,
            qualification_id,
            unit_standard_name,
            level,
            credits
        FROM legacy_unit_standards 
        WHERE qualification_id = ?
    `;
    
    console.log('Corrected Legacy Query:', correctedLegacyQuery);
    db.all(correctedLegacyQuery, [testQualificationId], (err, rows) => {
        if (err) {
            console.error('Corrected Legacy Error:', err);
        } else {
            console.log(`Corrected Legacy Result: ${rows.length} records`);
            if (rows.length > 0) {
                console.log('Sample:', JSON.stringify(rows[0], null, 2));
            }
        }
        
        db.close();
    });
});