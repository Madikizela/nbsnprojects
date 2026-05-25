const { Client } = require('pg');

async function checkTypes() {
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

        // Check column types
        const typeResult = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'occupational_unit_standards' 
            AND column_name = 'qualification_id'
        `);
        console.log('qualification_id column type:', typeResult.rows);

        // Check sample data
        const sampleResult = await client.query('SELECT qualification_id FROM occupational_unit_standards LIMIT 5');
        console.log('Sample qualification_id values:', sampleResult.rows);

        // Check if 91782 exists as string
        const stringResult = await client.query("SELECT qualification_id FROM occupational_unit_standards WHERE qualification_id = '91782'");
        console.log('Found as string 91782:', stringResult.rows);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.end();
    }
}

checkTypes();
