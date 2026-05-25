const { Client } = require('pg');

async function checkForeignKeys() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'rlms',
    password: '12345',
    port: 5432,
  });

  try {
    await client.connect();
    console.log('🔍 Checking foreign key constraints on LearnerDocuments...\n');

    // Check foreign key constraints
    const fkResult = await client.query(`
      SELECT
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        tc.constraint_name
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name='LearnerDocuments'
    `);
    
    console.log('🔗 Foreign key constraints on LearnerDocuments:');
    if (fkResult.rows.length === 0) {
      console.log('   No foreign key constraints found');
    } else {
      fkResult.rows.forEach(fk => {
        console.log(`   ${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name} (${fk.constraint_name})`);
      });
    }

    // Let's try a simple update to see what happens
    console.log('\n🧪 Testing direct database update...');
    try {
      const updateResult = await client.query(`
        UPDATE "LearnerDocuments" 
        SET "ApprovalStatus" = 'Approved', "ApprovedByUserId" = 44, "ApprovedAt" = NOW(), "UpdatedAt" = NOW()
        WHERE "Id" = 1
      `);
      console.log('✅ Direct update successful:', updateResult.rowCount, 'rows affected');
      
      // Check the result
      const checkResult = await client.query(`
        SELECT "Id", "ApprovalStatus", "ApprovedByUserId", "ApprovedAt" 
        FROM "LearnerDocuments" 
        WHERE "Id" = 1
      `);
      console.log('📄 Updated document:', checkResult.rows[0]);
      
    } catch (updateError) {
      console.error('❌ Direct update failed:', updateError.message);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkForeignKeys();