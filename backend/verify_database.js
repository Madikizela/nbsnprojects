const { Client } = require('pg');

async function verifyDatabase() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        database: 'rlms',
        user: 'postgres',
        password: '12345'
    });

    try {
        await client.connect();
        
        const projects = await client.query('SELECT COUNT(*) FROM "Projects"');
        const users = await client.query('SELECT COUNT(*) FROM "Users"');
        const admins = await client.query('SELECT COUNT(*) FROM "SystemAdmins"');
        const sdps = await client.query('SELECT COUNT(*) FROM "SkillsDevelopmentProviders"');
        const clients = await client.query('SELECT COUNT(*) FROM "Clients"');
        
        console.log('📊 Database Status:');
        console.log(`   Projects: ${projects.rows[0].count}`);
        console.log(`   Users: ${users.rows[0].count}`);
        console.log(`   System Admins: ${admins.rows[0].count}`);
        console.log(`   SDPs: ${sdps.rows[0].count}`);
        console.log(`   Clients: ${clients.rows[0].count}`);
        console.log('');
        console.log('✅ Database is ready for testing!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
    }
}

verifyDatabase();