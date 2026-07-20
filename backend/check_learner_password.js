const { Client } = require('pg');

async function checkLearner() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        database: 'nbsnproject',
        user: 'postgres',
        password: 'postgres'
    });

    try {
        await client.connect();
        console.log('✅ Connected to database\n');

        const result = await client.query(
            `SELECT "Id", "FirstName", "LastName", "Email", "Username", 
                    SUBSTRING("PasswordHash", 1, 30) as "PasswordHashPreview"
             FROM "Learners" 
             WHERE "Email" = $1`,
            ['nbsnprojects@gmail.com']
        );

        if (result.rows.length > 0) {
            const learner = result.rows[0];
            console.log('👤 Learner Found:');
            console.log(JSON.stringify(learner, null, 2));
        } else {
            console.log('❌ No learner found with email: nbsnprojects@gmail.com');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
    }
}

checkLearner();
