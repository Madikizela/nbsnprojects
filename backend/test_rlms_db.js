
const { Client } = require('pg');

async function testRLMS() {
    const client = new Client({
        host: 'localhost',
        database: 'rlms',
        user: 'postgres',
        password: '12345',
        port: 5432,
    });

    try {
        await client.connect();
        console.log('✅ Connected to rlms database!');
        
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        
        console.log('\n📊 Tables in rlms database:');
        tablesResult.rows.forEach(row => console.log(`   - ${row.table_name}`));
        
        await client.end();
        
        // Now try to list all databases by connecting to template1
        const templateClient = new Client({
            host: 'localhost',
            database: 'template1',
            user: 'postgres',
            password: '12345',
            port: 5432,
        });
        
        await templateClient.connect();
        const dbsResult = await templateClient.query('SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname');
        console.log('\n📦 All PostgreSQL databases:');
        dbsResult.rows.forEach(row => console.log(`   - ${row.datname}`));
        
        await templateClient.end();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
    }
}

testRLMS();
