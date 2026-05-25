const { Client } = require('pg');
const bcrypt = require('bcrypt');

async function setupFreshData() {
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

        await client.query('BEGIN');

        // 1. Create Client
        console.log('1️⃣ Creating Client...');
        const clientResult = await client.query(`
            INSERT INTO "Clients" ("Name", "Email", "PhoneNumber", "Address", "ContactPerson", "Status", "CreatedAt", "UpdatedAt", "Description")
            VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), $7)
            RETURNING "Id"
        `, ['Masakhane Training Institute', 'info@masakhane.com', '011-123-4567', '123 Main St, Johannesburg', 'John Doe', 1, 'Leading training provider']);
        const clientId = clientResult.rows[0].Id;
        console.log(`   ✓ Created Client (ID: ${clientId})`);

        // 2. Create SDP
        console.log('2️⃣ Creating Skills Development Provider...');
        const sdpResult = await client.query(`
            INSERT INTO "SkillsDevelopmentProviders" ("Name", "ClientId", "ContactPerson", "Address", "Status", "CreatedAt", "UpdatedAt", "Description")
            VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), $6)
            RETURNING "Id"
        `, ['Masakhane SDP', clientId, 'Jane Smith', '456 Training Ave, Johannesburg', 1, 'Accredited skills development provider']);
        const sdpId = sdpResult.rows[0].Id;
        console.log(`   ✓ Created SDP (ID: ${sdpId})`);

        // 3. Create Departments
        console.log('3️⃣ Creating Departments...');
        const departments = [
            { name: 'Quality Assurance', type: 7, manager: 'Mike Quality', email: 'qa@masakhane.com' },
            { name: 'Finance', type: 4, manager: 'Sarah Finance', email: 'finance@masakhane.com' },
            { name: 'Logistics', type: 5, manager: 'Tom Logistics', email: 'logistics@masakhane.com' },
            { name: 'Administration', type: 3, manager: 'Lisa Admin', email: 'admin@masakhane.com' }
        ];

        const departmentIds = {};
        for (const dept of departments) {
            const deptResult = await client.query(`
                INSERT INTO "Departments" ("Name", "Type", "SkillsDevelopmentProviderId", "ManagerFirstName", "ManagerSurname", "ManagerEmail", "Status", "CreatedAt", "UpdatedAt")
                VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
                RETURNING "Id"
            `, [dept.name, dept.type, sdpId, dept.manager.split(' ')[0], dept.manager.split(' ')[1], dept.email, 1]);
            departmentIds[dept.name] = deptResult.rows[0].Id;
            console.log(`   ✓ Created ${dept.name} Department (ID: ${deptResult.rows[0].Id})`);
        }

        // 4. Create Users
        console.log('4️⃣ Creating Users...');
        const hashedPassword = await bcrypt.hash('password123', 10);
        
        const users = [
            { firstName: 'Mike', surname: 'Quality', email: 'qa.manager@masakhane.com', role: 7, dept: 'Quality Assurance' },
            { firstName: 'Sarah', surname: 'Finance', email: 'finance.manager@masakhane.com', role: 4, dept: 'Finance' },
            { firstName: 'Tom', surname: 'Logistics', email: 'logistics.manager@masakhane.com', role: 5, dept: 'Logistics' },
            { firstName: 'Lisa', surname: 'Admin', email: 'admin.manager@masakhane.com', role: 3, dept: 'Administration' }
        ];

        for (const user of users) {
            const username = user.email.split('@')[0]; // Use email prefix as username
            await client.query(`
                INSERT INTO "Users" ("FirstName", "LastName", "Email", "Username", "PasswordHash", "Role", "ClientId", "SkillsDevelopmentProviderId", "DepartmentId", "Status", "CreatedAt", "UpdatedAt")
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
            `, [user.firstName, user.surname, user.email, username, hashedPassword, user.role, clientId, sdpId, departmentIds[user.dept], 1]);
            console.log(`   ✓ Created ${user.firstName} ${user.surname} (${user.email})`);
        }

        await client.query('COMMIT');

        console.log('\n✅ Fresh data setup completed successfully!\n');
        console.log('📊 Summary:');
        console.log(`   Client ID: ${clientId}`);
        console.log(`   SDP ID: ${sdpId}`);
        console.log(`   Departments: ${Object.keys(departmentIds).length}`);
        console.log(`   Users: ${users.length}`);
        console.log('');
        console.log('🔐 Login Credentials:');
        console.log('   Email: qa.manager@masakhane.com');
        console.log('   Password: password123');
        console.log('');
        console.log('🎯 Next Steps:');
        console.log('1. Login to the application');
        console.log('2. Create a new project with learning pathways and qualifications');
        console.log('3. Create phases for that project');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error during setup:', error.message);
        console.error('   Transaction rolled back');
    } finally {
        await client.end();
    }
}

setupFreshData();