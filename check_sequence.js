const { Client } = require('pg');

async function checkNextClientId() {
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

        // Get max ID from Clients table
        const maxIdResult = await client.query('SELECT MAX("Id") as max_id FROM "Clients"');
        const maxId = maxIdResult.rows[0].max_id;
        console.log(`📊 Current max Client ID: ${maxId}`);
        console.log(`📈 Next available ID should be: ${maxId + 1}`);

        // Check if there's a sequence for the ID column
        const sequenceResult = await client.query(`
            SELECT column_default 
            FROM information_schema.columns 
            WHERE table_name = 'Clients' AND column_name = 'Id'
        `);
        
        console.log(`🔍 ID column default: ${sequenceResult.rows[0].column_default}`);

        // Check sequence current value
        if (sequenceResult.rows[0].column_default && sequenceResult.rows[0].column_default.includes('nextval')) {
            const sequenceName = sequenceResult.rows[0].column_default.match(/nextval\('([^']+)'/)[1];
            console.log(`🔄 Sequence name: ${sequenceName}`);
            
            const sequenceValue = await client.query(`SELECT last_value FROM ${sequenceName}`);
            if (sequenceValue.rows.length > 0) {
                console.log(`📊 Sequence current value: ${sequenceValue.rows[0].last_value}`);
            }
        }

    } catch (error) {
        console.error('❌ Error checking next ID:', error);
    } finally {
        await client.end();
    }
}

checkNextClientId();