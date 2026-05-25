const axios = require('axios');
const crypto = require('crypto');

// Frontend encryption key (base64 encoded)
const ENCRYPTION_KEY = 'GQbHycf1uFOsWncLBQokFZD2yKJHlwl1MmxvxXkNx2I=';

// Simple encryption function to match frontend
function encryptData(data) {
    try {
        const jsonString = JSON.stringify(data);
        
        // Convert base64 key to buffer (32 bytes for AES-256)
        const keyBuffer = Buffer.from(ENCRYPTION_KEY, 'base64');
        
        // Generate random IV (16 bytes for AES)
        const iv = crypto.randomBytes(16);
        
        // Create cipher
        const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, iv);
        
        // Encrypt
        let encrypted = cipher.update(jsonString, 'utf8', 'binary');
        encrypted += cipher.final('binary');
        
        // Combine IV + encrypted data and convert to base64
        const combined = Buffer.concat([iv, Buffer.from(encrypted, 'binary')]);
        return combined.toString('base64');
    } catch (error) {
        console.error('Encryption error:', error);
        throw new Error('Failed to encrypt data');
    }
}

// Test client registration with unique data
const uniqueTimestamp = Date.now();
const testClientData = {
    name: `Test Company ${uniqueTimestamp}`,
    email: `testcompany${uniqueTimestamp}@example.com`,
    address: '123 Test Street, Test City, 12345',
    description: 'A test company for registration validation',
    phoneNumber: '123-456-7890',
    contactPerson: 'Test Contact Person'
};

async function testEncryptedRegistration() {
    console.log('🧪 Testing Encrypted Client Registration...');
    console.log('📋 Test data:', testClientData);
    
    try {
        // Encrypt the data
        console.log('🔐 Encrypting client data...');
        const encryptedData = encryptData(testClientData);
        console.log('✅ Data encrypted successfully');
        
        // Test registration through frontend proxy
        console.log('🌐 Registering through frontend proxy with encrypted data...');
        const registerResponse = await axios.post('http://localhost:5173/api/clients/register', {
            encryptedClientData: encryptedData
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Registration successful!');
        console.log('📊 Response:', registerResponse.data);
        
        // Test login with new credentials
        console.log('\n🔐 Testing login with new admin credentials...');
        const loginResponse = await axios.post('http://localhost:5173/api/auth/login', {
            email: testClientData.email,
            password: registerResponse.data.adminCredentials.password
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Login successful!');
        console.log('🔑 Token received:', loginResponse.data.token.substring(0, 50) + '...');
        console.log('👤 User info:', loginResponse.data.user);
        
        console.log('\n🎉 SUCCESS: Encrypted client registration and login are working correctly!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('📡 Server response:', error.response.status, error.response.data);
        }
        process.exit(1);
    }
}

testEncryptedRegistration();