const bcrypt = require('bcryptjs');
const { Client } = require('pg');

async function checkAndCreateUser() {
    const client = new Client({
        host: 'localhost',
        database: 'nbsnproject',
        user: 'postgres',
        password: 'postgres',
        port: 5432,
    });

    try {
        await client.connect();
        console.log('✅ Connected to PostgreSQL database: nbsnproject\n');

        const email = 'maphangolwemihla5@gmail.com';
        const password = 'yrtmA42UBqSG';

        // Check if user exists
        const checkResult = await client.query(
            'SELECT "Id", "Email", "FirstName", "LastName", "Role" FROM "Users" WHERE "Email" = $1',
            [email]
        );

        if (checkResult.rowCount > 0) {
            // User exists, update password
            console.log(`✅ User found: ${email}`);
            console.log(`   Name: ${checkResult.rows[0].FirstName} ${checkResult.rows[0].LastName}`);
            console.log(`\n🔐 Updating password to: ${password}`);
            
            const passwordHash = await bcrypt.hash(password, 12);
            
            await client.query(
                'UPDATE "Users" SET "PasswordHash" = $1 WHERE "Email" = $2',
                [passwordHash, email]
            );
            
            // Verify
            const verifyResult = await client.query(
                'SELECT "PasswordHash" FROM "Users" WHERE "Email" = $1',
                [email]
            );
            
            const isValid = await bcrypt.compare(password, verifyResult.rows[0].PasswordHash);
            console.log(`\n✅ Password updated and verified: ${isValid ? 'SUCCESS' : 'FAILED'}`);
        } else {
            console.log(`❌ User with email ${email} does NOT exist in the database.`);
            console.log(`\nℹ️  Note: The existing user is "maphangolwemihla@gmail.com" (without "5")`);
            console.log(`\n❓ Would you like to:`);
            console.log(`   1. Use the password for "maphangolwemihla@gmail.com" instead?`);
            console.log(`   2. Create a new user with email "maphangolwemihla5@gmail.com"?`);
            console.log(`\n   To create a new user, you'll need to provide:`);
            console.log(`   - First Name`);
            console.log(`   - Last Name`);
            console.log(`   - Role (e.g., SDPAdmin=2, Manager=3, etc.)`);
            console.log(`   - ClientId or SkillsDevelopmentProviderId (if applicable)`);
        }

        await client.end();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (client) await client.end();
        process.exit(1);
    }
}

checkAndCreateUser();
