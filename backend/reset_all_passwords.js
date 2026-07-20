const bcrypt = require('bcryptjs');
const { Client } = require('pg');

async function resetAllPasswords() {
    const client = new Client({
        host: 'localhost',
        database: 'nbsnproject',
        user: 'postgres',
        password: 'postgres',
        port: 5432,
    });

    try {
        await client.connect();
        console.log('✅ Connected to PostgreSQL database: nbsnproject');

        // Password to set for all accounts
        const defaultPassword = 'Admin@123!System';
        const passwordHash = await bcrypt.hash(defaultPassword, 12);
        
        console.log('\n🔐 Resetting all passwords to:', defaultPassword);
        console.log('Generated hash:', passwordHash);

        // Update all SystemAdmins passwords
        const adminResult = await client.query('UPDATE "SystemAdmins" SET "PasswordHash" = $1', [passwordHash]);
        console.log(`\n✅ Updated ${adminResult.rowCount} SystemAdmin account(s)`);

        // Update all Users passwords
        const userResult = await client.query('UPDATE "Users" SET "PasswordHash" = $1', [passwordHash]);
        console.log(`✅ Updated ${userResult.rowCount} User account(s)`);

        // Update all Learners passwords (if they have password-based login)
        try {
            const learnerResult = await client.query('UPDATE "Learners" SET "PasswordHash" = $1 WHERE "PasswordHash" IS NOT NULL', [passwordHash]);
            console.log(`✅ Updated ${learnerResult.rowCount} Learner account(s)`);
        } catch (err) {
            console.log('ℹ️  No learner passwords to update or Learners table does not have PasswordHash column');
        }

        // Verify the changes
        console.log('\n🔍 Verifying password reset...');
        
        const adminCheck = await client.query('SELECT "Email", "FirstName", "LastName" FROM "SystemAdmins" LIMIT 5');
        console.log('\nSystemAdmins:');
        adminCheck.rows.forEach(admin => {
            console.log(`  - ${admin.Email} (${admin.FirstName} ${admin.LastName})`);
        });

        const userCheck = await client.query('SELECT "Email", "FirstName", "LastName", "Role" FROM "Users" LIMIT 10');
        console.log('\nUsers:');
        userCheck.rows.forEach(user => {
            console.log(`  - ${user.Email} (${user.FirstName} ${user.LastName}) - Role: ${user.Role}`);
        });

        console.log('\n✅ All passwords have been reset successfully!');
        console.log('\n📝 Default credentials for all accounts:');
        console.log('   Password: Admin@123!System');
        console.log('\n⚠️  Users should change their passwords after logging in.');

        await client.end();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (client) await client.end();
        process.exit(1);
    }
}

resetAllPasswords();
