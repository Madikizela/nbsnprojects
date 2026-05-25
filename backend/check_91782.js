const { Client } = require('pg');

async function check91782() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        database: 'rlms',
        user: 'postgres',
        password: '12345'
    });

    try {
        await client.connect();
        console.log('✅ Connected to PostgreSQL database');

        // Check if 91782 exists in any form
        const result = await client.query("SELECT qualification_id FROM occupational_unit_standards WHERE qualification_id LIKE '%91782%'");
        console.log('Found 91782 variants:', result.rows);

        // Check if it exists as integer
        const intResult = await client.query('SELECT qualification_id FROM occupational_unit_standards WHERE qualification_id = $1', [91782]);
        console.log('Found as integer 91782:', intResult.rows);

        // Check occupational_qualifications table
        const qualResult = await client.query('SELECT qualification_id, name FROM occupational_qualifications WHERE qualification_id = $1 OR name LIKE $2', [91782, '%Plumber%']);
        console.log('In occupational_qualifications:', qualResult.rows);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.end();
    }
}

check91782();
