const bcrypt = require('bcryptjs');
const { Client } = require('pg');

async function restoreAllUserPasswords() {
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

        // Define all users with their original passwords
        const userPasswords = [
            { email: 'ngidinokwe@gmail.com', password: '-2lP-0uK8NkP' },
            { email: 'maphangolwemihla5@gmail.com', password: 'yrtmA42UBqSG' },
            { email: 'sthembisomaphango@gmail.com', password: ')CtrqT,kQ*X4' },
            { email: 'nbsnprojects@gmail.com', password: 'B,.:x!:t6QXe' },
            { email: 'Madikizela21517799@gmail.com', password: 'Zb4,mMvjq*J$' },
            { email: 'maphangolwemihla@gmail.com', password: '4HiMiQcdwrcd' },
            { email: 'maphangosbusiso@gmail.com', password: '0;1qWqp..' }
        ];

        console.log('🔐 Restoring original passwords for all users...\n');

        let successCount = 0;
        let failCount = 0;

        for (const user of userPasswords) {
            try {
                // Generate hash for the password
                const passwordHash = await bcrypt.hash(user.password, 12);
                
                // Update the user's password
                const result = await client.query(
                    'UPDATE "Users" SET "PasswordHash" = $1 WHERE "Email" = $2 RETURNING "Email", "FirstName", "LastName", "Role"',
                    [passwordHash, user.email]
                );

                if (result.rowCount === 0) {
                    console.log(`❌ User not found: ${user.email}`);
                    failCount++;
                } else {
                    const userData = result.rows[0];
                    console.log(`✅ ${userData.Email}`);
                    console.log(`   Name: ${userData.FirstName} ${userData.LastName}`);
                    console.log(`   Password: ${user.password}`);
                    
                    // Verify the password works
                    const verifyResult = await client.query(
                        'SELECT "PasswordHash" FROM "Users" WHERE "Email" = $1',
                        [user.email]
                    );
                    
                    const isValid = await bcrypt.compare(user.password, verifyResult.rows[0].PasswordHash);
                    console.log(`   Verification: ${isValid ? '✅ SUCCESS' : '❌ FAILED'}\n`);
                    
                    if (isValid) {
                        successCount++;
                    } else {
                        failCount++;
                    }
                }
            } catch (error) {
                console.error(`❌ Error updating ${user.email}:`, error.message);
                failCount++;
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log(`📊 Summary: ${successCount} successful, ${failCount} failed`);
        console.log('='.repeat(60));
        
        if (successCount === userPasswords.length) {
            console.log('\n✅ All passwords have been restored successfully!');
        }

        await client.end();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (client) await client.end();
        process.exit(1);
    }
}

restoreAllUserPasswords();
