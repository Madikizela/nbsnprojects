const { Client } = require('pg');

async function checkDepartmentUsers() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        database: 'rlms',
        user: 'postgres',
        password: '12345'
    });

    try {
        await client.connect();
        console.log('🔍 Checking Department Users...\n');

        // Check all departments and their users
        const departmentsResult = await client.query(`
            SELECT 
                d."Id" as dept_id,
                d."Name" as dept_name,
                d."Type" as dept_type,
                d."ManagerFirstName" || ' ' || d."ManagerSurname" as manager_name,
                d."ManagerEmail" as manager_email,
                COUNT(u."Id") as user_count
            FROM "Departments" d
            LEFT JOIN "Users" u ON u."DepartmentId" = d."Id"
            GROUP BY d."Id", d."Name", d."Type", d."ManagerFirstName", d."ManagerSurname", d."ManagerEmail"
            ORDER BY d."Id"
        `);
        
        console.log('📋 Departments and User Counts:');
        departmentsResult.rows.forEach(dept => {
            console.log(`   Dept ${dept.dept_id}: ${dept.dept_name} (Type: ${dept.dept_type})`);
            console.log(`     Manager: ${dept.manager_name} (${dept.manager_email})`);
            console.log(`     Users in department: ${dept.user_count}`);
            console.log('');
        });

        // Check detailed user assignments
        const usersResult = await client.query(`
            SELECT 
                u."Id",
                u."FirstName" || ' ' || u."LastName" as full_name,
                u."Email",
                u."Role",
                u."DepartmentId",
                d."Name" as dept_name,
                u."SkillsDevelopmentProviderId"
            FROM "Users" u
            LEFT JOIN "Departments" d ON d."Id" = u."DepartmentId"
            WHERE u."SkillsDevelopmentProviderId" = 14
            ORDER BY u."DepartmentId", u."Id"
        `);
        
        console.log('👥 All SDP Users by Department:');
        let currentDeptId = null;
        usersResult.rows.forEach(user => {
            if (user.DepartmentId !== currentDeptId) {
                currentDeptId = user.DepartmentId;
                console.log(`\n   Department ${user.DepartmentId || 'None'}: ${user.dept_name || 'No Department'}`);
            }
            console.log(`     - ${user.full_name} (${user.email}) - Role: ${user.role}`);
        });

    } catch (error) {
        console.error('❌ Database error:', error.message);
    } finally {
        await client.end();
    }
}

checkDepartmentUsers();