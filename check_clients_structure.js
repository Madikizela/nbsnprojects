const { Client } = require('pg');

async function checkClientsTableStructure() {
    const client = new Client({
        host: 'localhost',
        database: 'rlms',
        user: 'postgres',
        password: '12345',
        port: 5432,
    });

    try {
        await client.connect();
        console.log('✅ Connected to PostgreSQL');

        // Get Clients table structure
        const result = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'Clients'
            ORDER BY ordinal_position
        `);

        console.log('\n📊 Clients Table Structure:');
        console.log('Column Name | Data Type | Nullable | Default');
        console.log('-------------------------------------------');
        result.rows.forEach(row => {
            console.log(`${row.column_name.padEnd(12)} | ${row.data_type.padEnd(10)} | ${row.is_nullable.padEnd(8)} | ${row.column_default || 'NULL'}`);
        });

        // Also check if there are any existing clients
        const clientData = await client.query('SELECT * FROM "Clients" LIMIT 5');
        console.log(`\n📋 Existing Clients: ${clientData.rows.length} found`);
        if (clientData.rows.length > 0) {
            console.log('First client data:', JSON.stringify(clientData.rows[0], null, 2));
        }

    } catch (error) {
        console.error('❌ Error checking Clients table:', error);
    } finally {
        await client.end();
    }
}

checkClientsTableStructure();