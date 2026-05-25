const { Client } = require('pg');

async function checkUserRoles() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        database: 'rlms',
        user: 'postgres',
        password: '12345'
    });

    try {
        await client.connect();
        console.log('🔍 Checking user roles...\n');

        const usersResult = await client.query(`
            SELECT 
                "Id",
                "FirstName",
                "LastName",
                "Email",
                "Role",
                "DepartmentId",
                "SkillsDevelopmentProviderId"
            FROM "Users"
            ORDER BY "Id"
        `);

        console.log('📋 All Users:\n');
        
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

        usersResult.rows.forEach(user => {
            console.log(`ID: ${user.Id}`);
            console.log(`   Name: ${user.FirstName} ${user.LastName}`);
            console.log(`   Email: ${user.Email}`);
            console.log(`   Role: ${user.Role} (${roleNames[user.Role] || 'Unknown'})`);
            console.log(`   Department ID: ${user.DepartmentId}`);
            console.log(`   SDP ID: ${user.SkillsDevelopmentProviderId}`);
            console.log('');
        });

        console.log('📝 Note:');
        console.log('   - Role 7 (SDPModerator) can see the "Add Phase" button');
        console.log('   - Other roles may not have access to phase management');
        console.log('');
        console.log('💡 To fix: Update the user role to 7 (SDPModerator) in the database');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
    }
}

checkUserRoles();