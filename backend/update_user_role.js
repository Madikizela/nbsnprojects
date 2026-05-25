const { Client } = require('pg');

async function updateUserRole() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        database: 'rlms',
        user: 'postgres',
        password: '12345'
    });

    try {
        await client.connect();
        console.log('🔍 Updating user role...\n');

        // Update Sandile Zondi's role to SDPModerator (7)
        const email = 'zondis411@gmail.com';
        
        // Check current role
        const beforeResult = await client.query(`
            SELECT "Id", "FirstName", "LastName", "Email", "Role"
            FROM "Users"
            WHERE "Email" = $1
        `, [email]);

        if (beforeResult.rows.length === 0) {
            console.log('❌ User not found with email:', email);
            return;
        }

        const user = beforeResult.rows[0];
        console.log('📋 Current User Info:');
        console.log(`   Name: ${user.FirstName} ${user.LastName}`);
        console.log(`   Email: ${user.Email}`);
        console.log(`   Current Role: ${user.Role} (${getRoleName(user.Role)})`);
        console.log('');

        // Update to SDPModerator (7)
        await client.query(`
            UPDATE "Users"
            SET "Role" = 7
            WHERE "Email" = $1
        `, [email]);

        console.log('✅ Role updated successfully!');
        console.log('');

        // Verify the update
        const afterResult = await client.query(`
            SELECT "Id", "FirstName", "LastName", "Email", "Role"
            FROM "Users"
            WHERE "Email" = $1
        `, [email]);

        const updatedUser = afterResult.rows[0];
        console.log('📋 Updated User Info:');
        console.log(`   Name: ${updatedUser.FirstName} ${updatedUser.LastName}`);
        console.log(`   Email: ${updatedUser.Email}`);
        console.log(`   New Role: ${updatedUser.Role} (${getRoleName(updatedUser.Role)})`);
        console.log('');
        console.log('🎯 The user can now see the "Add Phase" button!');
        console.log('   Please logout and login again to see the changes.');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
    }
}

function getRoleName(roleId) {
    const roleNames = {
        1: 'SystemAdmin',
        2: 'ClientAdmin',
        3: 'SDPAdministrator',
        4: 'SDPFinance',
        5: 'SDPLogistics',
        6: 'SDPIT',
        7: 'SDPModerator (QA Manager)',
        8: 'SDPAssessor',
        9: 'SDPFacilitator',
        10: 'Learner',
        11: 'FinanceSupport',
        12: 'LogisticsSupport',
        13: 'ITSupport',
        14: 'QualityAssuranceSupport',
        15: 'AdministrationSupport'
    };
    return roleNames[roleId] || 'Unknown';
}

updateUserRole();