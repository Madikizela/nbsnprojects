const { Client } = require('pg');

const client = new Client({
    host: 'localhost',
    database: 'rlms',
    user: 'postgres',
    password: '12345',
    port: 5432,
});

async function checkSDPUsers() {
    try {
        await client.connect();
        console.log('✅ Connected to PostgreSQL');
        console.log('🔍 Checking for SDP users...\n');
        
        // Check for users with SkillsDevelopmentProviderId
        const result = await client.query(`
            SELECT "Email", "FirstName", "LastName", "SkillsDevelopmentProviderId", "ClientId", "Role" 
            FROM "Users" 
            WHERE "SkillsDevelopmentProviderId" IS NOT NULL AND "SkillsDevelopmentProviderId" > 0
        `);
        
        if (result.rows.length > 0) {
            console.log('📋 Found SDP users:');
            result.rows.forEach((user, index) => {
                console.log(`${index + 1}. ${user.Email}`);
                console.log(`   Name: ${user.FirstName} ${user.LastName}`);
                console.log(`   SDP ID: ${user.SkillsDevelopmentProviderId}`);
                console.log(`   Client ID: ${user.ClientId}`);
                console.log(`   Role: ${user.Role}`);
                console.log('');
            });
        } else {
            console.log('❌ No SDP users found in database');
            console.log('   All users have SkillsDevelopmentProviderId as NULL or 0');
        }
        
        // Also check the SkillsDevelopmentProviders table
        console.log('🔍 Checking SkillsDevelopmentProviders table...');
        const sdpResult = await client.query('SELECT "Id", "Name", "Email" FROM "SkillsDevelopmentProviders"');
        
        if (sdpResult.rows.length > 0) {
            console.log('📋 Found Skills Development Providers:');
            sdpResult.rows.forEach((sdp, index) => {
                console.log(`${index + 1}. ${sdp.Name} (${sdp.Email}) - ID: ${sdp.Id}`);
            });
        } else {
            console.log('❌ No Skills Development Providers found');
        }
        
        await client.end();
        
    } catch (error) {
        console.error('❌ Error:', error);
        if (client) await client.end();
    }
}

checkSDPUsers();