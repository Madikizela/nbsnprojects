const { Client } = require('pg');

const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'rlms',
    user: 'postgres',
    password: '12345'
});

async function checkAndEnroll() {
    try {
        await client.connect();
        console.log('Connected to database\n');

        // Check learners with fingerprints
        console.log('Learners with fingerprints registered:');
        const learnersResult = await client.query(`
            SELECT "Id", "FirstName", "LastName", "IdNumber",
                   CASE WHEN "LeftThumbTemplate" IS NOT NULL THEN 'Yes' ELSE 'No' END as has_left,
                   CASE WHEN "RightThumbTemplate" IS NOT NULL THEN 'Yes' ELSE 'No' END as has_right
            FROM "Learners"
            WHERE "LeftThumbTemplate" IS NOT NULL OR "RightThumbTemplate" IS NOT NULL
            ORDER BY "Id"
        `);

        if (learnersResult.rows.length === 0) {
            console.log('No learners with fingerprints found');
            return;
        }

        learnersResult.rows.forEach(l => {
            console.log(`  ID: ${l.Id}, Name: ${l.FirstName} ${l.LastName}, Left: ${l.has_left}, Right: ${l.has_right}`);
        });

        // Check class 2 enrollments
        console.log('\nClass 2 enrollments:');
        const enrollmentsResult = await client.query(`
            SELECT ce."Id", ce."LearnerId", l."FirstName", l."LastName", ce."Status"
            FROM "ClassEnrollments" ce
            JOIN "Learners" l ON ce."LearnerId" = l."Id"
            WHERE ce."SiteClassId" = 2
        `);

        if (enrollmentsResult.rows.length === 0) {
            console.log('  No enrollments found');
            
            // Enroll first learner with fingerprint
            const learnerToEnroll = learnersResult.rows[0];
            console.log(`\nEnrolling ${learnerToEnroll.FirstName} ${learnerToEnroll.LastName} to class 2...`);
            
            await client.query(`
                INSERT INTO "ClassEnrollments" ("SiteClassId", "LearnerId", "EnrollmentDate", "Status", "CreatedAt", "UpdatedAt")
                VALUES (2, $1, CURRENT_DATE, 'Active', NOW(), NOW())
            `, [learnerToEnroll.Id]);
            
            console.log('✓ Enrollment successful!');
        } else {
            console.log('  Existing enrollments:');
            enrollmentsResult.rows.forEach(e => {
                console.log(`    ${e.FirstName} ${e.LastName} (ID: ${e.LearnerId}) - ${e.Status}`);
            });
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await client.end();
    }
}

checkAndEnroll();
