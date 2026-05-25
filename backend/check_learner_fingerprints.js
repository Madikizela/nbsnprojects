const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'rlms',
  user: 'postgres',
  password: '12345'
});

async function checkFingerprints() {
  try {
    await client.connect();
    console.log('Connected to database\n');

    // Get learners in class 4 with their fingerprints
    const result = await client.query(`
      SELECT 
        l."Id",
        l."FirstName",
        l."LastName",
        l."IdNumber",
        LENGTH(l."LeftThumbTemplate") as left_length,
        LENGTH(l."RightThumbTemplate") as right_length,
        LEFT(l."LeftThumbTemplate", 50) as left_preview,
        LEFT(l."RightThumbTemplate", 50) as right_preview,
        ce."SiteClassId"
      FROM "Learners" l
      INNER JOIN "ClassEnrollments" ce ON l."Id" = ce."LearnerId"
      WHERE ce."SiteClassId" = 4 AND ce."Status" = 'Active'
      ORDER BY l."LastName", l."FirstName"
    `);

    console.log(`Found ${result.rows.length} learners in class 4:\n`);
    
    result.rows.forEach(learner => {
      console.log(`Learner ID: ${learner.Id}`);
      console.log(`Name: ${learner.FirstName} ${learner.LastName}`);
      console.log(`ID Number: ${learner.IdNumber}`);
      console.log(`Left Thumb Template Length: ${learner.left_length || 'NULL'}`);
      console.log(`Right Thumb Template Length: ${learner.right_length || 'NULL'}`);
      if (learner.left_preview) {
        console.log(`Left Thumb Preview: ${learner.left_preview}...`);
      }
      if (learner.right_preview) {
        console.log(`Right Thumb Preview: ${learner.right_preview}...`);
      }
      console.log('---\n');
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkFingerprints();
