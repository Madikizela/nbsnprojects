const { Client } = require('pg');

async function checkAllProjects() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        database: 'rlms',
        user: 'postgres',
        password: '12345'
    });

    try {
        await client.connect();
        console.log('🔍 Checking all projects...\n');

        // Get all projects
        const projectsResult = await client.query(`
            SELECT "Id", "ProjectName", "ContractNumber", "SkillsDevelopmentProviderId", "CreatedAt"
            FROM "Projects" 
            ORDER BY "Id" DESC
            LIMIT 10
        `);

        console.log(`📋 Found ${projectsResult.rows.length} recent projects:\n`);

        for (const project of projectsResult.rows) {
            console.log(`\n🎯 Project: ${project.ProjectName} (ID: ${project.Id})`);
            console.log(`   Contract: ${project.ContractNumber}`);
            console.log(`   SDP ID: ${project.SkillsDevelopmentProviderId}`);
            console.log(`   Created: ${project.CreatedAt}`);

            // Check learning pathways
            const pathwaysResult = await client.query(`
                SELECT plp."Id", lp."Name", lp."PathwayId"
                FROM "ProjectLearningPathways" plp
                JOIN "LearningPathways" lp ON plp."PathwayId" = lp."PathwayId"
                WHERE plp."ProjectId" = $1
            `, [project.Id]);

            console.log(`   📚 Learning Pathways: ${pathwaysResult.rows.length}`);
            if (pathwaysResult.rows.length > 0) {
                pathwaysResult.rows.forEach(pw => {
                    console.log(`      - ${pw.Name} (Pathway ID: ${pw.PathwayId}, Link ID: ${pw.Id})`);
                });
            }

            // Check qualifications
            const qualificationsResult = await client.query(`
                SELECT 
                    pq."Id",
                    pq."ProjectLearningPathwayId",
                    pq."QualificationTypeId",
                    pq."EmploymentType",
                    pq."NumberOfBeneficiaries",
                    pq."LegacyQualificationId",
                    pq."OccupationalQualificationId",
                    qt."Name" as "QualificationType",
                    COALESCE(lq.name, oq.name) as "QualificationName"
                FROM "ProjectQualifications" pq
                JOIN "ProjectLearningPathways" plp ON pq."ProjectLearningPathwayId" = plp."Id"
                JOIN "QualificationTypes" qt ON pq."QualificationTypeId" = qt."Id"
                LEFT JOIN legacy_qualifications lq ON pq."LegacyQualificationId" = lq.id
                LEFT JOIN occupational_qualifications oq ON pq."OccupationalQualificationId" = oq.qualification_id
                WHERE plp."ProjectId" = $1
            `, [project.Id]);

            console.log(`   🎓 Qualifications: ${qualificationsResult.rows.length}`);
            if (qualificationsResult.rows.length > 0) {
                qualificationsResult.rows.forEach((qual, index) => {
                    console.log(`      ${index + 1}. ${qual.QualificationName || 'Unknown'}`);
                    console.log(`         Type: ${qual.QualificationType}`);
                    console.log(`         Employment: ${qual.EmploymentType || 'Not set'}`);
                    console.log(`         Beneficiaries: ${qual.NumberOfBeneficiaries || 0}`);
                    console.log(`         Pathway Link ID: ${qual.ProjectLearningPathwayId}`);
                });
            } else {
                console.log(`      ⚠️  No qualifications found`);
            }
        }

        if (projectsResult.rows.length === 0) {
            console.log('❌ No projects found in the database');
            console.log('\n💡 Create a project through the web interface:');
            console.log('   1. Login at http://localhost:5173');
            console.log('   2. Go to Projects → Add New Project');
            console.log('   3. Fill in details and add qualifications');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
    }
}

checkAllProjects();