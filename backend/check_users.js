const { Client } = require('pg');

async function checkUsers() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        database: 'rlms',
        user: 'postgres',
        password: '12345'
    });

    try {
        await client.connect();
        console.log('🔍 Checking available users...');

        const result = await client.query(`
            SELECT "Id", "Email", "Role", "SkillsDevelopmentProviderId" 
            FROM "Users" 
            WHERE "Email" LIKE '%sdp%' OR "Email" LIKE '%manager%' 
            LIMIT 10
        `);

        console.log('📋 Available users:');
        result.rows.forEach(row => {
            console.log(`   ID: ${row.Id}, Email: ${row.Email}, Role: ${row.Role}, SDP: ${row.SkillsDevelopmentProviderId}`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
    }
}

checkUsers();