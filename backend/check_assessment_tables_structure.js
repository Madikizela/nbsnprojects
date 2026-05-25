const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'rlms',
  password: '12345',
  port: 5432,
});

async function checkAssessmentTablesStructure() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL database');

    // Check FormativeAssessments table structure
    console.log('\n=== FORMATIVE ASSESSMENTS TABLE STRUCTURE ===');
    const formativeStructure = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'FormativeAssessments' 
      ORDER BY ordinal_position;
    `);
    formativeStructure.rows.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type} (${row.is_nullable})`);
    });

    // Check SummativeAssessments table structure
    console.log('\n=== SUMMATIVE ASSESSMENTS TABLE STRUCTURE ===');
    const summativeStructure = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'SummativeAssessments' 
      ORDER BY ordinal_position;
    `);
    summativeStructure.rows.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type} (${row.is_nullable})`);
    });

    // Check FormativeAssessmentQuestions table structure
    console.log('\n=== FORMATIVE ASSESSMENT QUESTIONS TABLE STRUCTURE ===');
    const formativeQStructure = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'FormativeAssessmentQuestions' 
      ORDER BY ordinal_position;
    `);
    formativeQStructure.rows.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type} (${row.is_nullable})`);
    });

    // Check SummativeAssessmentQuestions table structure
    console.log('\n=== SUMMATIVE ASSESSMENT QUESTIONS TABLE STRUCTURE ===');
    const summativeQStructure = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'SummativeAssessmentQuestions' 
      ORDER BY ordinal_position;
    `);
    summativeQStructure.rows.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type} (${row.is_nullable})`);
    });

    // Check legacy_unit_standards table structure
    console.log('\n=== LEGACY UNIT STANDARDS TABLE STRUCTURE ===');
    const legacyUSStructure = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'legacy_unit_standards' 
      ORDER BY ordinal_position;
    `);
    legacyUSStructure.rows.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type} (${row.is_nullable})`);
    });

    // Sample data from each table
    console.log('\n=== SAMPLE DATA ===');
    
    const formativeCount = await client.query('SELECT COUNT(*) FROM "FormativeAssessments"');
    console.log(`FormativeAssessments: ${formativeCount.rows[0].count} records`);
    
    const summativeCount = await client.query('SELECT COUNT(*) FROM "SummativeAssessments"');
    console.log(`SummativeAssessments: ${summativeCount.rows[0].count} records`);
    
    const formativeQCount = await client.query('SELECT COUNT(*) FROM "FormativeAssessmentQuestions"');
    console.log(`FormativeAssessmentQuestions: ${formativeQCount.rows[0].count} records`);
    
    const summativeQCount = await client.query('SELECT COUNT(*) FROM "SummativeAssessmentQuestions"');
    console.log(`SummativeAssessmentQuestions: ${summativeQCount.rows[0].count} records`);
    
    const legacyUSCount = await client.query('SELECT COUNT(*) FROM legacy_unit_standards');
    console.log(`legacy_unit_standards: ${legacyUSCount.rows[0].count} records`);

  } catch (error) {
    console.error('Error checking assessment tables structure:', error);
  } finally {
    await client.end();
  }
}

checkAssessmentTablesStructure();