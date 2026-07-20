const { Client } = require('pg');
const bcrypt = require('bcrypt');

async function resetPassword() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        database: 'nbsnproject',
        user: 'postgres',
        password: 'postgres'
    });

    try {
        await client.connect();
        console.log('✅ Connected to database\n');

        const newPassword = 'Learner123!';
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        await client.query(
            `UPDATE "Learners" 
             SET "PasswordHash" = $1, "MustChangePassword" = false
             WHERE "Email" = $2`,
            [hashedPassword, 'nbsnprojects@gmail.com']
        );

        console.log('✅ Password reset successful!');
        console.log(`   Email: nbsnprojects@gmail.com`);
        console.log(`   New Password: ${newPassword}`);
        console.log(`   MustChangePassword: false`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
    }
}

resetPassword();
