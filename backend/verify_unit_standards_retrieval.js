const { Client } = require('pg');

async function verifyRetrieval() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        database: 'rlms',
        user: 'postgres',
        password: '12345'
    });

    try {
        await client.connect();
        console.log('🔍 Verifying Unit Standards Retrieval...\n');

        // Get all projects with their qualifications and unit standards
        const result = await client.query(`
            SELECT 
                p."Id" as project_id,
                p."ProjectName" as project_name,
                pq."Id" as qualification_id,
                pq."EmploymentType" as employment_type,
                lq.name as qualification_name,
                COUNT(pqus."Id") as unit_standards_count
            FROM "Projects" p
            INNER JOIN "ProjectLearningPathways" plp ON p."Id" = plp."ProjectId"
            INNER JOIN "ProjectQualifications" pq ON plp."Id" = pq."ProjectLearningPathwayId"
            LEFT JOIN legacy_qualifications lq ON pq."LegacyQualificationId" = lq.id
            LEFT JOIN "ProjectQualificationUnitStandards" pqus ON pq."Id" = pqus."ProjectQualificationId"
            GROUP BY p."Id", p."ProjectName", pq."Id", pq."EmploymentType", lq.name
            ORDER BY p."Id" DESC
            LIMIT 5
        `);

        console.log('📊 Recent Projects with Unit Standards:\n');
        
        for (const row of result.rows) {
            console.log(`Project: ${row.project_name} (ID: ${row.project_id})`);
            console.log(`  Qualification: ${row.qualification_name || 'N/A'} (ID: ${row.qualification_id})`);
            console.log(`  Employment Type: ${row.employment_type || 'N/A'}`);
            console.log(`  Unit Standards: ${row.unit_standards_count}`);
            
            if (row.unit_standards_count > 0) {
                // Get detailed unit standards info
                const usResult = await client.query(`
                    SELECT 
                        pqus."UnitStandardId",
                        pqus."UnitStandardType",
                        CASE 
                            WHEN pqus."UnitStandardType" = 'Legacy' THEN lus.unit_standard_name
                            WHEN pqus."UnitStandardType" = 'Occupational' THEN ous.unit_standard_name
                        END as unit_standard_name,
                        CASE 
                            WHEN pqus."UnitStandardType" = 'Legacy' THEN lus.credits
                            WHEN pqus."UnitStandardType" = 'Occupational' THEN ous.credits
                        END as credits
                    FROM "ProjectQualificationUnitStandards" pqus
                    LEFT JOIN legacy_unit_standards lus ON pqus."UnitStandardId" = lus.id AND pqus."UnitStandardType" = 'Legacy'
                    LEFT JOIN occupational_unit_standards ous ON pqus."UnitStandardId" = ous.id AND pqus."UnitStandardType" = 'Occupational'
                    WHERE pqus."ProjectQualificationId" = $1
                    ORDER BY pqus."UnitStandardId"
                `, [row.qualification_id]);

                console.log('  Selected Unit Standards:');
                usResult.rows.forEach(us => {
                    console.log(`    - ${us.unit_standard_name} (${us.credits} credits) [${us.UnitStandardType}]`);
                });
            }
            console.log('');
        }

        console.log('✅ Verification complete!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
    }
}

verifyRetrieval();
