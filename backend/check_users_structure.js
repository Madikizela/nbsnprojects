const { Client } = require('pg');

async function checkUsersTableStructure() {
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
        
        // Check Users table structure
        console.log('\n📋 Checking Users table structure:');
        const result = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'Users'
            ORDER BY ordinal_position;
        `);
        
        console.log('Users table columns:');
        result.rows.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable})`);
        });
        
        // Check SystemAdmins table structure
        console.log('\n📋 Checking SystemAdmins table structure:');
        const adminResult = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'SystemAdmins'
            ORDER BY ordinal_position;
        `);
        
        console.log('SystemAdmins table columns:');
        adminResult.rows.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable})`);
        });
        
        await client.end();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (client) await client.end();
    }
}

checkUsersTableStructure();