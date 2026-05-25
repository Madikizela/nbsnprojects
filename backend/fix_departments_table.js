const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'rlms',
  password: '12345',
  port: 5432,
});

async function fixDepartmentsTable() {
  try {
    console.log('Adding missing manager columns to Departments table...');
    
    // Add the missing manager columns
    await pool.query(`
      ALTER TABLE "Departments" 
      ADD COLUMN IF NOT EXISTS "ManagerFirstName" VARCHAR(100),
      ADD COLUMN IF NOT EXISTS "ManagerSurname" VARCHAR(100),
      ADD COLUMN IF NOT EXISTS "ManagerEmail" VARCHAR(255);
    `);
    
    console.log('✅ Successfully added manager columns to Departments table');
    
    // Verify the updated structure
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'Departments' 
      ORDER BY ordinal_position;
    `);
    
    console.log('Updated Departments table structure:');
    console.table(result.rows);
    
  } catch (error) {
    console.error('❌ Error updating Departments table:', error.message);
  } finally {
    await pool.end();
  }
}

fixDepartmentsTable();