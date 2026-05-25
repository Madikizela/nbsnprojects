const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'rlms',
  password: '12345',
  port: 5432,
});

async function runMigration() {
  try {
    console.log('🔄 Running document approval migration...\n');
    
    const sql = fs.readFileSync('add_document_approval_fields.sql', 'utf8');
    
    await pool.query(sql);
    
    console.log('✅ Migration completed successfully!');
    console.log('   - Added ApprovalStatus column (default: Pending)');
    console.log('   - Added ApprovedByUserId column');
    console.log('   - Added ApprovedAt column');
    console.log('   - Added DeclineReason column');
    console.log('   - Created foreign key constraint');
    console.log('   - Created index for ApprovalStatus');
    console.log('   - Updated existing documents to Pending status');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await pool.end();
  }
}

runMigration();