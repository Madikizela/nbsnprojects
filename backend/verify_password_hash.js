const bcrypt = require('bcryptjs');
const { Client } = require('pg');

async function verifyPasswordHash() {
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

        // Get the current admin password hash
        const result = await client.query('SELECT * FROM "SystemAdmins" WHERE "Email" = $1', ['admin@system.local']);
        const admin = result.rows[0];
        
        console.log('Current password hash in database:', admin.PasswordHash);
        
        // Generate hash for the expected password
        const expectedPassword = 'Admin@123!System';
        const generatedHash = await bcrypt.hash(expectedPassword, 12); // Using cost factor 12
        
        console.log('Generated hash for "Admin@123!System":', generatedHash);
        
        // Compare them
        const isMatch = await bcrypt.compare(expectedPassword, admin.PasswordHash);
        console.log('Does "Admin@123!System" match current hash?', isMatch);
        
        // Try with different cost factors
        console.log('\n🔍 Trying different cost factors:');
        for (let cost = 10; cost <= 14; cost++) {
            const hash = await bcrypt.hash(expectedPassword, cost);
            const matches = await bcrypt.compare(expectedPassword, admin.PasswordHash);
            console.log(`Cost ${cost}: ${matches ? '✅ MATCH' : '❌ No match'}`);
            if (matches) {
                console.log(`   Hash: ${hash}`);
                break;
            }
        }

        await client.end();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (client) await client.end();
    }
}

verifyPasswordHash();