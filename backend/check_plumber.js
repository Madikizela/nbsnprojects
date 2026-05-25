const { Client } = require('pg');

async function checkPlumber() {
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

        // Check occupational_qualifications table
        const qualResult = await client.query("SELECT qualification_id, name FROM occupational_qualifications WHERE name ILIKE '%plumber%' OR name ILIKE '%91782%'");
        console.log('Plumber qualifications:', qualResult.rows);

        // Check if 91782 exists in occupational_qualifications
        const idResult = await client.query('SELECT qualification_id, name FROM occupational_qualifications WHERE qualification_id = $1', [91782]);
        console.log('Qualification 91782:', idResult.rows);

        // List some available qualifications
        const availableResult = await client.query('SELECT qualification_id, name FROM occupational_qualifications LIMIT 10');
        console.log('Available qualifications:');
        availableResult.rows.forEach(row => {
            console.log(`- ${row.qualification_id}: ${row.name}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.end();
    }
}

checkPlumber();
