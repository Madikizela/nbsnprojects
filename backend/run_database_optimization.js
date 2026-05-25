const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runDatabaseOptimization() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'rlms',
    password: '12345',
    port: 5432,
  });

  try {
    await client.connect();
    console.log('🔗 Connected to database');

    // Read the SQL file
    const sqlFile = path.join(__dirname, 'cleanup_and_optimize_database.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    console.log('🧹 Starting database cleanup and optimization...\n');

    // Split SQL into individual statements and execute them
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'));

    let successCount = 0;
    let skipCount = 0;

    for (const statement of statements) {
      try {
        // Skip comments and empty statements
        if (statement.startsWith('--') || statement.startsWith('/*') || statement.trim() === '') {
          continue;
        }

        // Execute the statement
        const result = await client.query(statement);
        
        // Log specific operations
        if (statement.toUpperCase().includes('DELETE FROM')) {
          console.log(`🗑️  Cleaned up test data: ${result.rowCount} rows affected`);
        } else if (statement.toUpperCase().includes('UPDATE')) {
          console.log(`🔄 Reset document statuses: ${result.rowCount} rows affected`);
        } else if (statement.toUpperCase().includes('CREATE INDEX')) {
          const indexName = statement.match(/CREATE INDEX[^"]*"([^"]+)"/i);
          if (indexName) {
            console.log(`📊 Created index: ${indexName[1]}`);
          } else {
            console.log(`📊 Created index`);
          }
        } else if (statement.toUpperCase().includes('ANALYZE')) {
          const tableName = statement.match(/ANALYZE "([^"]+)"/i);
          if (tableName) {
            console.log(`📈 Updated statistics for: ${tableName[1]}`);
          }
        }
        
        successCount++;
      } catch (error) {
        if (error.message.includes('already exists')) {
          skipCount++;
          // Skip already existing indexes silently
        } else {
          console.error(`❌ Error executing statement: ${error.message}`);
          console.error(`   Statement: ${statement.substring(0, 100)}...`);
        }
      }
    }

    console.log(`\n✅ Database optimization completed!`);
    console.log(`   📊 ${successCount} operations completed successfully`);
    console.log(`   ⏭️  ${skipCount} operations skipped (already exists)`);

    // Verify some key indexes were created
    console.log('\n🔍 Verifying key indexes...');
    const indexCheck = await client.query(`
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE tablename IN ('LearnerDocuments', 'ClassEnrollments', 'SiteClasses') 
        AND indexname LIKE 'IX_%'
      ORDER BY tablename, indexname
    `);

    console.log(`📋 Found ${indexCheck.rows.length} performance indexes:`);
    indexCheck.rows.forEach(row => {
      console.log(`   • ${row.tablename}.${row.indexname}`);
    });

    // Check document counts after cleanup
    console.log('\n📊 Document statistics after cleanup:');
    const docStats = await client.query(`
      SELECT 
        COUNT(*) as total_documents,
        COUNT(*) FILTER (WHERE "ApprovalStatus" = 'Pending') as pending,
        COUNT(*) FILTER (WHERE "ApprovalStatus" = 'Approved') as approved,
        COUNT(*) FILTER (WHERE "ApprovalStatus" = 'Declined') as declined
      FROM "LearnerDocuments"
    `);

    const stats = docStats.rows[0];
    console.log(`   📄 Total documents: ${stats.total_documents}`);
    console.log(`   ⏳ Pending: ${stats.pending}`);
    console.log(`   ✅ Approved: ${stats.approved}`);
    console.log(`   ❌ Declined: ${stats.declined}`);

    console.log('\n🎉 Database is now optimized for production use!');

  } catch (error) {
    console.error('❌ Error during database optimization:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runDatabaseOptimization();