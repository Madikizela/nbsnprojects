const { Client } = require('pg');

async function checkSDPUsers() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        database: 'rlms',
        user: 'postgres',
        password: '12345'
    });

    try {
        await client.connect();
        console.log('🔍 Checking SDP Users in Database...\n');

        // Check all users
        const usersResult = await client.query(`
            SELECT 
                "Id", 
                "Email", 
                "FirstName", 
                "LastName", 
                "Role", 
                "SkillsDevelopmentProviderId",
                "ClientId"
            FROM "Users" 
            ORDER BY "Id"
        `);
        
        console.log('📋 All Users:');
        usersResult.rows.forEach(user => {
            console.log(`   ID: ${user.Id}, Email: ${user.Email}, Role: ${user.Role}, SDP ID: ${user.SkillsDevelopmentProviderId}, Client ID: ${user.ClientId}`);
        });

        // Check SDP users specifically
        const sdpUsersResult = await client.query(`
            SELECT 
                "Id", 
                "Email", 
                "FirstName", 
                "LastName", 
                "Role", 
                "SkillsDevelopmentProviderId"
            FROM "Users" 
            WHERE "SkillsDevelopmentProviderId" IS NOT NULL
        `);
        
        console.log(`\n🏢 SDP Users (${sdpUsersResult.rows.length} found):`);
        sdpUsersResult.rows.forEach(user => {
            console.log(`   ${user.Email} - SDP ID: ${user.SkillsDevelopmentProviderId}, Role: ${user.Role}`);
        });

        // Check all SDPs
        const sdpsResult = await client.query(`
            SELECT 
                "Id", 
                "Name", 
                "Status", 
                "ClientId"
            FROM "SkillsDevelopmentProviders" 
            ORDER BY "Id"
        `);
        
        console.log(`\n🏭 Skills Development Providers (${sdpsResult.rows.length} found):`);
        sdpsResult.rows.forEach(sdp => {
            console.log(`   ID: ${sdp.Id}, Name: ${sdp.Name}, Status: ${sdp.Status}, Client ID: ${sdp.ClientId}`);
        });

        // Check projects linked to SDPs
        const projectsResult = await client.query(`
            SELECT 
                "Id", 
                "ProjectName", 
                "ContractNumber", 
                "SkillsDevelopmentProviderId"
            FROM "Projects" 
            WHERE "SkillsDevelopmentProviderId" IS NOT NULL
            ORDER BY "SkillsDevelopmentProviderId", "Id"
        `);
        
        console.log(`\n📋 Projects linked to SDPs (${projectsResult.rows.length} found):`);
        projectsResult.rows.forEach(project => {
            console.log(`   ${project.ProjectName} (${project.ContractNumber}) - SDP ID: ${project.SkillsDevelopmentProviderId}`);
        });

    } catch (error) {
        console.error('❌ Database error:', error.message);
    } finally {
        await client.end();
    }
}

checkSDPUsers();