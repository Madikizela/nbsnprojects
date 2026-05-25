const axios = require('axios');

async function run() {
  try {
    // 1) Register a new client via frontend proxy
    const ts = Date.now();
    const clientEmail = `sdptest+${ts}@example.com`;
    const registerClientUrl = 'http://localhost:5173/api/clients/register';
    const clientData = {
      name: `SDP Test Client ${ts}`,
      email: clientEmail,
      address: '456 Test Ave, Test City',
      description: 'Client for SDP registration test',
      phoneNumber: '+27123456789',
      contactPerson: 'SDP Tester'
    };

    console.log('🧪 Registering client...');
    const regClientRes = await axios.post(registerClientUrl, clientData, {
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('✅ Client registered:', regClientRes.data);

    const adminEmail = regClientRes.data.adminCredentials.email;
    const adminPassword = regClientRes.data.adminCredentials.password;
    const clientId = regClientRes.data.clientId;

    // 2) Login via proxy server to get token
    console.log('\n🔐 Logging in as client admin...');
    const loginUrl = 'http://localhost:5001/api/auth/login';
    const loginRes = await axios.post(loginUrl, { email: adminEmail, password: adminPassword }, {
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('✅ Login OK, user:', loginRes.data.user);

    const token = loginRes.data.token;

    // 3) Register SDP using the token
    console.log('\n🏫 Registering an SDP for this client...');
    const sdpUrl = 'http://localhost:5001/api/SkillsDevelopmentProviders/register';
    const sdpPayload = {
      sdpName: `Automated SDP ${ts}`,
      registrationNumber: 'REG-AUTO-1',
      businessDescription: 'Automated test SDP',
      beneficiaries: 50,
      province: 'Gauteng',
      district: 'City of Johannesburg',
      municipality: 'Johannesburg',
      physicalAddress: '100 SDP Road, Johannesburg',
      emailAddress: 'sdp-contact@example.com', // optional; ignored by backend
      phoneNumber: '+27110000000',
      contactPerson: 'SDP Owner',
      website: 'https://example.com',
      clientId
    };

    const sdpRes = await axios.post(sdpUrl, sdpPayload, {
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ SDP registration response:', sdpRes.data);
    console.log('\n🎉 End-to-end SDP registration succeeded.');
  } catch (err) {
    console.error('❌ SDP registration test failed:', err.message);
    if (err.response) {
      console.error('📡 Server response:', err.response.status, err.response.data);
    }
  }
}

run();