const bcrypt = require('bcryptjs');
const { Client } = require('pg');

async function restoreNtikayePassword() {
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

        // Restore the specific password for Ntikaye
        const email = 'ntikayezwenxasana@gmail.com';
        const originalPassword = 'gkoJ}4J0Pq=@';
        const passwordHash = await bcrypt.hash(originalPassword, 12);
        
        console.log(`🔐 Restoring password for: ${email}`);
        console.log(`Password: ${originalPassword}`);
        console.log(`Generated hash: ${passwordHash}`);

        // Update the specific user's password
        const result = await client.query(
            'UPDATE "Users" SET "PasswordHash" = $1 WHERE "Email" = $2 RETURNING "Email", "FirstName", "LastName", "Role"',
            [passwordHash, email]
        );

        if (result.rowCount === 0) {
            console.log(`\n❌ User with email ${email} not found!`);
        } else {
            console.log(`\n✅ Password restored successfully for:`);
            console.log(`   Email: ${result.rows[0].Email}`);
            console.log(`   Name: ${result.rows[0].FirstName} ${result.rows[0].LastName}`);
            console.log(`   Role: ${result.rows[0].Role}`);
            
            // Verify the password works
            const verifyResult = await client.query(
                'SELECT "PasswordHash" FROM "Users" WHERE "Email" = $1',
                [email]
            );
            
            const isValid = await bcrypt.compare(originalPassword, verifyResult.rows[0].PasswordHash);
            console.log(`\n🔍 Password verification: ${isValid ? '✅ SUCCESS' : '❌ FAILED'}`);
        }

        await client.end();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (client) await client.end();
        process.exit(1);
    }
}

restoreNtikayePassword();
