const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'rlms',
  password: '12345',
  port: 5432,
});

async function checkManagerEmails() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL database');

    // Query all manager users with their roles and emails
    const query = `
      SELECT 
        id,
        name,
        email,
        role,
        status,
        "skillsDevelopmentProviderName",
        "departmentName",
        "createdAt"
      FROM users 
      WHERE role IN ('SDPAdministrator', 'SDPLogistics', 'SDPModerator', 'SDPFinance', 'SDPIT')
      ORDER BY role, name;
    `;

    const result = await client.query(query);
    
    console.log('\n=== MANAGER USERS BY ROLE ===\n');
    
    if (result.rows.length === 0) {
      console.log('No manager users found in the database.');
      return;
    }

    // Group by role
    const managersByRole = {};
    result.rows.forEach(user => {
      if (!managersByRole[user.role]) {
        managersByRole[user.role] = [];
      }
      managersByRole[user.role].push(user);
    });

    // Display by role
    Object.keys(managersByRole).forEach(role => {
      const roleDisplayNames = {
        'SDPAdministrator': '👑 ADMINISTRATORS',
        'SDPLogistics': '🚚 LOGISTICS MANAGERS',
        'SDPModerator': '🎯 QUALITY ASSURANCE MANAGERS',
        'SDPFinance': '💰 FINANCIAL MANAGERS',
        'SDPIT': '💻 IT MANAGERS'
      };

      console.log(`${roleDisplayNames[role] || role}:`);
      console.log('─'.repeat(50));
      
      managersByRole[role].forEach(user => {
        console.log(`📧 ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Status: ${user.status}`);
        console.log(`   SDP: ${user.skillsDevelopmentProviderName || 'Not assigned'}`);
        console.log(`   Department: ${user.departmentName || 'Not assigned'}`);
        console.log(`   Created: ${new Date(user.createdAt).toLocaleDateString()}`);
        console.log('');
      });
      console.log('');
    });

    // Summary
    console.log('=== SUMMARY ===');
    Object.keys(managersByRole).forEach(role => {
      const roleDisplayNames = {
        'SDPAdministrator': 'Administrators',
        'SDPLogistics': 'Logistics Managers',
        'SDPModerator': 'Quality Assurance Managers',
        'SDPFinance': 'Financial Managers',
        'SDPIT': 'IT Managers'
      };
      console.log(`${roleDisplayNames[role] || role}: ${managersByRole[role].length} users`);
    });

  } catch (error) {
    console.error('Error checking manager emails:', error);
  } finally {
    await client.end();
  }
}

checkManagerEmails();