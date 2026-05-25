const { Client } = require('pg');

async function checkTableStructure() {
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

        // Check table structure
        const result = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'occupational_unit_standards' 
            ORDER BY ordinal_position
        `);
        console.log('Table structure:');
        result.rows.forEach(row => {
            console.log(`- ${row.column_name}: ${row.data_type}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.end();
    }
}

checkTableStructure();