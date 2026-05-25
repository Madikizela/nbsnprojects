const axios = require('axios');

async function testClientRegistration() {
    try {
        console.log('🧪 Testing Client Registration Endpoint...');
        
        const clientData = {
            name: 'New Test Company',
            email: 'newtestcompany@example.com',
            address: '456 New Street, New City',
            description: 'Another test company for registration testing',
            phoneNumber: '0987654321',
            contactPerson: 'New Test Manager'
        };

        console.log('📋 Registration data:', JSON.stringify(clientData, null, 2));
        console.log('🌐 Endpoint: http://localhost:5173/api/clients/register');
        
        const response = await axios.post('http://localhost:5173/api/clients/register', clientData, {
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Client registration successful!');
        console.log('📊 Response data:');
        console.log(JSON.stringify(response.data, null, 2));

        if (response.data.adminCredentials) {
            console.log('\n🔑 Admin Credentials Created:');
            console.log(`   Username: ${response.data.adminCredentials.username}`);
            console.log(`   Password: ${response.data.adminCredentials.password}`);
            console.log(`   Email: ${response.data.adminCredentials.email}`);
        }

    } catch (error) {
        console.error('❌ Client registration failed:', error.message);
        
        if (error.response) {
            console.error('📡 Server response:', error.response.status, error.response.data);
        } else if (error.code === 'ECONNREFUSED') {
            console.error('🔌 Connection refused - server not running');
        } else if (error.code === 'ETIMEDOUT') {
            console.error('⏱️  Request timeout');
        }
    }
}

testClientRegistration();