const { Client } = require('pg');

async function cleanupDatabase() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        database: 'rlms',
        user: 'postgres',
        password: '12345'
    });

    try {
        await client.connect();
        console.log('🔍 Connected to database...\n');

        // Start transaction
        await client.query('BEGIN');

        // 1. Count what we're about to delete
        const projectCount = await client.query('SELECT COUNT(*) FROM "Projects"');
        const userCount = await client.query('SELECT COUNT(*) FROM "Users"');
        const adminCount = await client.query('SELECT COUNT(*) FROM "SystemAdmins"');

        console.log('📊 Current Database State:');
        console.log(`   Projects: ${projectCount.rows[0].count}`);
        console.log(`   Users: ${userCount.rows[0].count}`);
        console.log(`   System Admins: ${adminCount.rows[0].count} (will be preserved)`);
        console.log('');

        // 2. Delete project-related data (in correct order due to foreign keys)
        console.log('🗑️  Deleting project-related data...');
        
        // Delete tasks first (they reference projects)
        const tasksResult = await client.query('DELETE FROM "Tasks"');
        console.log(`   ✓ Deleted ${tasksResult.rowCount} tasks`);

        // Delete task reminders
        const taskRemindersResult = await client.query('DELETE FROM "TaskReminders"');
        console.log(`   ✓ Deleted ${taskRemindersResult.rowCount} task reminders`);

        // Delete project qualifications
        const qualificationsResult = await client.query('DELETE FROM "ProjectQualifications"');
        console.log(`   ✓ Deleted ${qualificationsResult.rowCount} project qualifications`);

        // Delete project learning pathways
        const projectLearningPathwaysResult = await client.query('DELETE FROM "ProjectLearningPathways"');
        console.log(`   ✓ Deleted ${projectLearningPathwaysResult.rowCount} project learning pathways`);

        // Delete projects
        const projectsResult = await client.query('DELETE FROM "Projects"');
        console.log(`   ✓ Deleted ${projectsResult.rowCount} projects`);

        console.log('');

        // 3. Delete users (but keep system admins)
        console.log('🗑️  Deleting users (keeping system admins)...');
        
        const usersResult = await client.query('DELETE FROM "Users"');
        console.log(`   ✓ Deleted ${usersResult.rowCount} users`);

        console.log('');

        // 4. Delete departments
        console.log('🗑️  Deleting departments...');
        
        const departmentsResult = await client.query('DELETE FROM "Departments"');
        console.log(`   ✓ Deleted ${departmentsResult.rowCount} departments`);

        console.log('');

        // 5. Delete SDPs
        console.log('🗑️  Deleting Skills Development Providers...');
        
        const sdpsResult = await client.query('DELETE FROM "SkillsDevelopmentProviders"');
        console.log(`   ✓ Deleted ${sdpsResult.rowCount} SDPs`);

        console.log('');

        // 6. Delete Clients
        console.log('🗑️  Deleting Clients...');
        
        const clientsResult = await client.query('DELETE FROM "Clients"');
        console.log(`   ✓ Deleted ${clientsResult.rowCount} clients`);

        console.log('');

        // 7. Reset sequences for auto-increment IDs
        console.log('🔄 Resetting ID sequences...');
        
        // Get all sequences
        const sequences = await client.query(`
            SELECT sequence_name 
            FROM information_schema.sequences 
            WHERE sequence_schema = 'public'
            AND sequence_name LIKE '%_seq'
        `);
        
        for (const seq of sequences.rows) {
            try {
                await client.query(`ALTER SEQUENCE "${seq.sequence_name}" RESTART WITH 1`);
                console.log(`   ✓ Reset ${seq.sequence_name}`);
            } catch (err) {
                console.log(`   ⚠️  Could not reset ${seq.sequence_name}`);
            }
        }

        console.log('');

        // Commit transaction
        await client.query('COMMIT');

        // 5. Verify cleanup
        console.log('✅ Cleanup completed successfully!\n');
        
        const finalProjectCount = await client.query('SELECT COUNT(*) FROM "Projects"');
        const finalUserCount = await client.query('SELECT COUNT(*) FROM "Users"');
        const finalAdminCount = await client.query('SELECT COUNT(*) FROM "SystemAdmins"');

        console.log('📊 Final Database State:');
        console.log(`   Projects: ${finalProjectCount.rows[0].count}`);
        console.log(`   Users: ${finalUserCount.rows[0].count}`);
        console.log(`   System Admins: ${finalAdminCount.rows[0].count} (preserved)`);
        console.log('');

        console.log('🎯 Database is now clean and ready for fresh data!');
        console.log('');
        console.log('📝 Next Steps:');
        console.log('1. Create new users (SDPs, managers, etc.)');
        console.log('2. Create projects with learning pathways and qualifications');
        console.log('3. Create phases for those projects');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error during cleanup:', error.message);
        console.error('   Transaction rolled back - no changes made');
    } finally {
        await client.end();
    }
}

// Run the cleanup
console.log('⚠️  WARNING: This will delete ALL projects and users (except system admins)!');
console.log('Press Ctrl+C within 3 seconds to cancel...\n');

setTimeout(() => {
    cleanupDatabase();
}, 3000);