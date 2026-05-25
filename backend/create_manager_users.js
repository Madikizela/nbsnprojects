const { Client } = require('pg');
const bcrypt = require('bcrypt');

const client = new Client({
  host: 'localhost',
  database: 'rlms',
  user: 'postgres',
  password: '12345'
});

async function createManagerUsers() {
  try {
    await client.connect();
    
    // Hash password for all test users
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const managers = [
      {
        firstName: 'John',
        lastName: 'Finance',
        email: 'finance.manager@masakhane.com',
        role: 4, // SDPFinance
        departmentType: 3 // Financial Manager
      },
      {
        firstName: 'Sarah',
        lastName: 'Logistics',
        email: 'logistics.manager@masakhane.com',
        role: 5, // SDPLogistics
        departmentType: 2 // Logistic Manager
      },
      {
        firstName: 'Mike',
        lastName: 'Quality',
        email: 'qa.manager@masakhane.com',
        role: 7, // SDPModerator (Quality Assurance)
        departmentType: 4 // Quality Assurance Manager
      },
      {
        firstName: 'Lisa',
        lastName: 'Admin',
        email: 'admin.manager@masakhane.com',
        role: 3, // SDPAdministrator (but as department manager)
        departmentType: 1 // Administrator Manager
      }
    ];
    
    console.log('Creating manager users...');
    
    for (const manager of managers) {
      // Check if user already exists
      const existingUser = await client.query(
        'SELECT "Id" FROM "Users" WHERE "Email" = $1',
        [manager.email]
      );
      
      if (existingUser.rows.length > 0) {
        console.log(`User ${manager.email} already exists, skipping...`);
        continue;
      }
      
      // Create department first
      const departmentResult = await client.query(`
        INSERT INTO "Departments" ("Name", "Description", "Type", "Status", "ManagerFirstName", "ManagerSurname", "ManagerEmail", "SkillsDevelopmentProviderId", "CreatedAt", "UpdatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING "Id"
      `, [
        manager.firstName + ' Department',
        `${manager.firstName} ${manager.lastName} Department`,
        manager.departmentType,
        1, // Active status
        manager.firstName,
        manager.lastName,
        manager.email,
        14 // Masakhane SDP ID
      ]);
      
      const departmentId = departmentResult.rows[0].Id;
      
      // Create user
      const userResult = await client.query(`
        INSERT INTO "Users" ("FirstName", "LastName", "Username", "Email", "PasswordHash", "Role", "Status", "SkillsDevelopmentProviderId", "DepartmentId", "CreatedAt", "UpdatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        RETURNING "Id"
      `, [
        manager.firstName,
        manager.lastName,
        manager.email,
        manager.email,
        hashedPassword,
        manager.role,
        1, // Active status
        14, // Masakhane SDP ID
        departmentId
      ]);
      
      console.log(`✅ Created ${manager.firstName} ${manager.lastName} (${manager.email}) - User ID: ${userResult.rows[0].Id}, Department ID: ${departmentId}`);
    }
    
    console.log('\n=== VERIFICATION ===');
    const allUsers = await client.query(`
      SELECT u."Id", u."Email", u."Role", u."SkillsDevelopmentProviderId", u."DepartmentId", d."Name" as "DepartmentName"
      FROM "Users" u
      LEFT JOIN "Departments" d ON u."DepartmentId" = d."Id"
      WHERE u."SkillsDevelopmentProviderId" = 14
    `);
    
    console.log('SDP Users:');
    allUsers.rows.forEach(user => {
      const roleNames = {
        3: 'SDPAdministrator',
        4: 'SDPFinance', 
        5: 'SDPLogistics',
        6: 'SDPIT',
        7: 'SDPModerator'
      };
      console.log(`- ${user.Email} | Role: ${roleNames[user.Role]} | Department: ${user.DepartmentName || 'None'}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

createManagerUsers();