const { Client } = require('pg');

async function checkFunderReportAccess() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'nbsnproject',
    user: 'postgres',
    password: '12345'
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL\n');

    const query = `
      SELECT 
        u."Id" as id,
        u."FirstName" || ' ' || u."LastName" as name,
        u."Email" as email,
        u."Role" as role,
        u."DepartmentId" as department_id,
        d."Name" as department_name,
        u."SkillsDevelopmentProviderId" as sdp_id
      FROM "Users" u
      LEFT JOIN "Departments" d ON u."DepartmentId" = d."Id"
      ORDER BY u."Id"
    `;

    const result = await client.query(query);
    
    console.log('📊 FUNDER REPORT & COMPETENCY CERTIFICATE ACCESS\n');
    console.log('The Reports page (with Funder PDF and Competency Certificate downloads)');
    console.log('is available in the SDP Manager Dashboard.\n');
    console.log('Roles that can access:');
    console.log('  - Role 5 or 12: Logistics Manager/Support');
    console.log('  - Role 7, 14, or 8: QA Manager/Support (Moderators/Assessors)');
    console.log('  - Role 3 (with Department) or 15: Admin Manager/Support');
    console.log('  - Role 4 or 11: Finance Manager/Support');
    console.log('  - Role 6 or 13: IT Manager/Support\n');
    console.log('=' .repeat(80));
    
    if (result.rows.length === 0) {
      console.log('❌ No users found in database');
      return;
    }

    const roleNames = {
      1: 'SuperAdmin',
      2: 'ClientAdmin',
      3: 'SDPAdministrator',
      4: 'SDPFinanceManager',
      5: 'SDPLogisticsManager',
      6: 'SDPIT',
      7: 'SDPModerator',
      8: 'SDPAssessor',
      9: 'ProjectManager',
      10: 'TeamLead',
      11: 'SDPFinanceSupport',
      12: 'SDPLogisticsSupport',
      13: 'SDPITSupport',
      14: 'SDPQASupport',
      15: 'SDPAdminSupport',
      16: 'Teacher'
    };

    let usersWithAccess = [];
    let usersWithoutAccess = [];

    result.rows.forEach(user => {
      const role = user.role;
      const deptName = (user.department_name || '').toLowerCase();
      
      // Check access based on role and department
      const isLogistics = role === 5 || role === 12 || deptName.includes('logistic');
      const isQA = role === 7 || role === 14 || role === 8 || deptName.includes('quality') || deptName.includes('moderator') || deptName.includes('assessor');
      const isAdminManager = (role === 3 && user.department_id) || role === 15 || deptName.includes('admin');
      const isFinance = role === 4 || role === 11 || deptName.includes('finance');
      const isIT = role === 6 || role === 13 || deptName.includes('it');
      
      const hasAccess = isLogistics || isQA || isAdminManager || isFinance || isIT;
      
      const userInfo = {
        ...user,
        roleName: roleNames[role] || `Unknown (${role})`,
        hasAccess
      };
      
      if (hasAccess) {
        usersWithAccess.push(userInfo);
      } else {
        usersWithoutAccess.push(userInfo);
      }
    });

    console.log('\n✅ USERS WITH ACCESS TO FUNDER REPORTS:\n');
    if (usersWithAccess.length === 0) {
      console.log('   ❌ No users currently have access to the Reports page.');
    } else {
      usersWithAccess.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email})`);
        console.log(`   Role: ${user.roleName} (${user.role})`);
        console.log(`   Department: ${user.department_name || 'None'}`);
        console.log(`   SDP ID: ${user.sdp_id || 'None'}`);
        console.log();
      });
    }

    console.log('=' .repeat(80));
    console.log('\n❌ USERS WITHOUT ACCESS:\n');
    if (usersWithoutAccess.length === 0) {
      console.log('   All users have access!');
    } else {
      usersWithoutAccess.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email})`);
        console.log(`   Role: ${user.roleName} (${user.role})`);
        console.log(`   Department: ${user.department_name || 'None'}`);
        console.log();
      });
    }

    console.log('=' .repeat(80));
    console.log('\n💡 TO GRANT ACCESS:');
    console.log('   Update the user role to one of the manager roles listed above.');
    console.log('   Example SQL:');
    console.log('   UPDATE "Users" SET "Role" = 7 WHERE "Email" = \'user@example.com\';');
    console.log('   (Role 7 = SDPModerator - QA Manager with full access)\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkFunderReportAccess();
