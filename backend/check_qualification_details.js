const { Client } = require('pg');

async function checkQualificationDetails() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        database: 'rlms',
        user: 'postgres',
        password: '12345'
    });

    try {
        await client.connect();
        console.log('🔍 Checking qualification details...\n');

        const result = await client.query(`
            SELECT 
                pq.*,
                lq.name as legacy_name,
                lq.qualification_id as legacy_qual_id,
                oq.name as occupational_name,
                oq.qualification_id as occupational_qual_id
            FROM "ProjectQualifications" pq
            LEFT JOIN legacy_qualifications lq ON pq."LegacyQualificationId" = lq.id
            LEFT JOIN occupational_qualifications oq ON pq."OccupationalQualificationId" = oq.qualification_id
            ORDER BY pq."Id" DESC
            LIMIT 5
        `);

        console.log('📋 Recent Qualifications:\n');
        result.rows.forEach(qual => {
            console.log(`Qualification ID: ${qual.Id}`);
            console.log(`   Pathway Link ID: ${qual.ProjectLearningPathwayId}`);
            console.log(`   Type ID: ${qual.QualificationTypeId}`);
            console.log(`   Legacy Qual ID: ${qual.LegacyQualificationId}`);
            console.log(`   Occupational Qual ID: ${qual.OccupationalQualificationId}`);
            console.log(`   Employment Type: ${qual.EmploymentType}`);
            console.log(`   Beneficiaries: ${qual.NumberOfBeneficiaries}`);
            console.log(`   Legacy Name: ${qual.legacy_name || 'N/A'}`);
            console.log(`   Occupational Name: ${qual.occupational_name || 'N/A'}`);
            console.log('');
        });

        // Check if the legacy qualification exists
        if (result.rows.length > 0 && result.rows[0].LegacyQualificationId) {
            const legacyId = result.rows[0].LegacyQualificationId;
            console.log(`🔍 Checking legacy qualification with ID: ${legacyId}\n`);
            
            const legacyCheck = await client.query(`
                SELECT * FROM legacy_qualifications WHERE id = $1
            `, [legacyId]);

            if (legacyCheck.rows.length > 0) {
                console.log('✅ Legacy qualification found:');
                console.log(legacyCheck.rows[0]);
            } else {
                console.log('❌ Legacy qualification NOT found in database');
                console.log('   This means the ID stored does not match any qualification');
            }
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
    }
}

checkQualificationDetails();