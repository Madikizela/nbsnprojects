const axios = require('axios');

async function registerAndVerifyClient() {
  try {
    const ts = Date.now();
    const clientName = `Test Client ${ts}`;
    const clientEmail = `testclient+${ts}@example.com`;

    const clientData = {
      name: clientName,
      email: clientEmail,
      address: '123 Test Street, Test City',
      description: 'Automated test client for clientId linkage',
      phoneNumber: '+27123456789',
      contactPerson: 'Test Manager'
    };

    console.log('🧪 Registering client via frontend proxy (5173)...');
    console.log('📋 Registration payload:', JSON.stringify(clientData, null, 2));
    const registerUrl = 'http://localhost:5173/api/clients/register';
    const regRes = await axios.post(registerUrl, clientData, {
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('✅ Client registration response:');
    console.log(JSON.stringify(regRes.data, null, 2));

    if (!regRes.data.adminCredentials) {
      console.error('❌ No admin credentials returned. Cannot proceed to login test.');
      return;
    }

    const adminEmail = regRes.data.adminCredentials.email;
    const adminPassword = regRes.data.adminCredentials.password;
    const clientId = regRes.data.clientId;

    console.log('\n🔑 Admin credentials issued:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   ClientId: ${clientId}`);

    console.log('\n🔐 Testing login via proxy server (5001)...');
    const loginUrl = 'http://localhost:5001/api/auth/login';
    const loginRes = await axios.post(loginUrl, { email: adminEmail, password: adminPassword }, {
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('✅ Login response:');
    console.log(JSON.stringify(loginRes.data, null, 2));

    const linkedClientId = loginRes.data?.user?.clientId ?? null;
    if (linkedClientId && Number(linkedClientId) > 0) {
      console.log(`\n🎉 Success: Logged-in user is linked to clientId=${linkedClientId}`);
    } else {
      console.error('\n⚠️  Warning: Logged-in user does not show a valid clientId.');
    }

    console.log('\n➡️ Next steps:');
    console.log('- Open http://localhost:5173 in your browser');
    console.log('- Log out if already logged in');
    console.log(`- Log in with: ${adminEmail} / ${adminPassword}`);
    console.log('- Navigate to Client Dashboard and add an SDP');
  } catch (err) {
    console.error('❌ Error during client registration and verification:', err.message);
    if (err.response) {
      console.error('📡 Server response:', err.response.status, err.response.data);
    }
  }
}

registerAndVerifyClient();