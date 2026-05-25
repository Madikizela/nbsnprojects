const { Client } = require('pg');

async function verifyProjectCreation() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        database: 'rlms',
        user: 'postgres',
        password: '12345'
    });

    try {
        await client.connect();
        console.log('🔍 Verifying project creation...');

        // Check the latest project
        const projectResult = await client.query(`
            SELECT "Id", "ProjectName", "ContractNumber", "CreatedAt"
            FROM "Projects" 
            ORDER BY "Id" DESC 
            LIMIT 1
        `);

        if (projectResult.rows.length > 0) {
            const project = projectResult.rows[0];
            console.log(`📋 Latest Project: ID=${project.Id}, Name=${project.ProjectName}, Contract=${project.ContractNumber}`);

            // Check learning pathways for this project
            const pathwayResult = await client.query(`
                SELECT plp."Id", plp."ProjectId", plp."PathwayId", lp."Name"
                FROM "ProjectLearningPathways" plp
                JOIN "LearningPathways" lp ON plp."PathwayId" = lp."PathwayId"
                WHERE plp."ProjectId" = $1
            `, [project.Id]);

            console.log(`📋 Learning Pathways: ${pathwayResult.rows.length}`);
            pathwayResult.rows.forEach(row => {
                console.log(`   - Pathway ID: ${row.Id}, Name: ${row.Name}, PathwayId: ${row.PathwayId}`);
            });

            // Check qualifications for this project
            const qualificationResult = await client.query(`
                SELECT pq."Id", pq."ProjectLearningPathwayId", pq."QualificationTypeId", 
                       pq."EmploymentType", pq."NumberOfBeneficiaries", pq."LegacyQualificationId"
                FROM "ProjectQualifications" pq
                JOIN "ProjectLearningPathways" plp ON pq."ProjectLearningPathwayId" = plp."Id"
                WHERE plp."ProjectId" = $1
            `, [project.Id]);

            console.log(`📋 Qualifications: ${qualificationResult.rows.length}`);
            qualificationResult.rows.forEach(row => {
                console.log(`   - Qualification ID: ${row.Id}, Type: ${row.QualificationTypeId}, Employment: ${row.EmploymentType}, Beneficiaries: ${row.NumberOfBeneficiaries}`);
            });

        } else {
            console.log('❌ No projects found');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
    }
}

verifyProjectCreation();