const axios = require('axios');

async function demonstrateCompleteWorkflow() {
    console.log('🎯 COMPLETE WORKFLOW DEMONSTRATION');
    console.log('=====================================\n');

    try {
        // Step 1: Test Client Registration
        console.log('📋 STEP 1: Testing Client Registration');
        console.log('----------------------------------------');
        
        const clientData = {
            name: "Demo Company Ltd",
            email: "demo@company.com",
            address: "123 Demo Street, Demo City",
            description: "A demo company for testing",
            phoneNumber: "1234567890",
            contactPerson: "Demo Manager"
        };

        console.log('📝 Registering new client...');
        const regResponse = await axios.post('http://localhost:5173/api/clients/register', clientData, {
            timeout: 10000,
            headers: { 'Content-Type': 'application/json' }
        });

        console.log('✅ Client registration successful!');
        console.log(`   Client ID: ${regResponse.data.clientId}`);
        console.log(`   Admin Username: ${regResponse.data.adminCredentials.username}`);
        console.log(`   Admin Email: ${regResponse.data.adminCredentials.email}`);
        console.log(`   Admin Password: ${regResponse.data.adminCredentials.password}`);

        // Step 2: Test Login with New Admin Credentials
        console.log('\n🔐 STEP 2: Testing Login with New Admin Credentials');
        console.log('---------------------------------------------------');
        
        const loginData = {
            email: regResponse.data.adminCredentials.email,
            password: regResponse.data.adminCredentials.password
        };

        console.log('🔑 Logging in as admin...');
        const loginResponse = await axios.post('http://localhost:5173/api/auth/login', loginData, {
            timeout: 10000,
            headers: { 'Content-Type': 'application/json' }
        });

        console.log('✅ Login successful!');
        console.log(`   User: ${loginResponse.data.user.firstName} ${loginResponse.data.user.lastName}`);
        console.log(`   Email: ${loginResponse.data.user.email}`);
        console.log(`   User Type: ${loginResponse.data.user.userType}`);
        console.log(`   Access Level: ${loginResponse.data.user.accessLevel}`);
        console.log(`   JWT Token: ${loginResponse.data.token.substring(0, 50)}...`);

        // Step 3: Test Health Check
        console.log('\n🏥 STEP 3: Testing Health Check Endpoints');
        console.log('-----------------------------------------');
        
        const healthResponse = await axios.get('http://localhost:5001/health', {
            timeout: 5000
        });
        
        console.log('✅ PostgreSQL Proxy Server Health: ' + healthResponse.data.status);
        console.log('✅ Service: ' + healthResponse.data.service);

        console.log('\n🎉 WORKFLOW COMPLETE!');
        console.log('======================');
        console.log('✅ Client registration endpoint is working');
        console.log('✅ Login endpoint is working');
        console.log('✅ JWT token generation is working');
        console.log('✅ PostgreSQL proxy server is working');
        console.log('✅ Frontend-backend integration is working');
        console.log('\n🚀 The system is ready for use!');

    } catch (error) {
        console.error('❌ Workflow failed:', error.message);
        
        if (error.response) {
            console.error('📡 Server response:', error.response.status, error.response.data);
        } else if (error.code === 'ECONNREFUSED') {
            console.error('🔌 Connection refused - check if servers are running');
            console.error('   Make sure PostgreSQL proxy server is running on port 5001');
            console.error('   Make sure frontend server is running on port 5173');
        }
    }
}

demonstrateCompleteWorkflow();