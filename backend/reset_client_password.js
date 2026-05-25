const { Client } = require('pg');
const bcrypt = require('bcrypt');

async function resetPassword() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        database: 'rlms',
        user: 'postgres',
        password: '12345'
    });

    try {
        await client.connect();
        console.log('🔍 Resetting password for Madikizela21517799@gmail.com...\n');

        // Hash the new password
        const newPassword = 'password123';
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the password
        const result = await client.query(`
            UPDATE "Users"
            SET "PasswordHash" = $1, "UpdatedAt" = NOW()
            WHERE "Email" = $2
            RETURNING "Id", "FirstName", "LastName", "Email", "Role"
        `, [hashedPassword, 'Madikizela21517799@gmail.com']);

        if (result.rows.length > 0) {
            const user = result.rows[0];
            console.log('✅ Password reset successfully!\n');
            console.log('👤 User Details:');
            console.log(`   ID: ${user.Id}`);
            console.log(`   Name: ${user.FirstName} ${user.LastName}`);
            console.log(`   Email: ${user.Email}`);
            console.log(`   Role: ${user.Role} (Client)`);
            console.log('');
            console.log('🔐 New Credentials:');
            console.log(`   Email: ${user.Email}`);
            console.log(`   Password: ${newPassword}`);
        } else {
            console.log('❌ User not found!');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
    }
}

resetPassword();
