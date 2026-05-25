const CryptoJS = require('crypto-js');
const { default: fetch } = require('node-fetch');

// This should match the backend encryption key
const ENCRYPTION_KEY = 'GQbHycf1uFOsWncLBQokFZD2yKJHlwl1MmxvxXkNx2I=';

const encryptData = (data) => {
  try {
    const jsonString = JSON.stringify(data);
    
    // Convert base64 key to WordArray for CryptoJS
    const key = CryptoJS.enc.Base64.parse(ENCRYPTION_KEY);
    
    // Generate random IV (16 bytes for AES)
    const iv = CryptoJS.lib.WordArray.random(16);
    
    // Encrypt with AES-CBC
    const encrypted = CryptoJS.AES.encrypt(jsonString, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    // Combine IV + encrypted data and convert to base64
    const combined = iv.concat(encrypted.ciphertext);
    return CryptoJS.enc.Base64.stringify(combined);
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

async function registerTestClient() {
  try {
    // First, get system admin token
    const loginResponse = await fetch('http://localhost:5213/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@system.local',
        password: 'Admin@123!System'
      })
    });

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('Got system admin token');

    // Prepare client data
    const clientData = {
      name: "Test Company Ltd",
      description: "A test company for testing client dashboard",
      address: "123 Test Street, Test City",
      phoneNumber: "+1234567890",
      email: "testclient@example.com",
      contactPerson: "John Doe"
    };

    // Encrypt the client data
    const encryptedData = encryptData(clientData);
    console.log('Client data encrypted');

    // Register the client
    const registerResponse = await fetch('http://localhost:5213/api/clients/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        encryptedClientData: encryptedData
      })
    });

    if (registerResponse.ok) {
      const result = await registerResponse.json();
      console.log('Client registered successfully:', result);
      console.log('Client Admin Email:', clientData.email);
      console.log('Note: Password will be sent via email service');
    } else {
      const error = await registerResponse.text();
      console.error('Registration failed:', error);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

registerTestClient();