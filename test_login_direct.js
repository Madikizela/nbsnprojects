const axios = require('axios');

async function testLogin() {
    const loginData = {
        email: 'admin@example.com',
        password: 'admin123'
    };

    try {
        console.log('Testing login with:', loginData);
        console.log('Sending request to: http://localhost:5000/api/auth/login');
        
        const response = await axios.post('http://localhost:5000/api/auth/login', loginData, {
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Login Response:', response.data);
        console.log('Status Code:', response.status);
        
    } catch (error) {
        console.error('Login Error:', error.message);
        if (error.response) {
            console.error('Error Response:', error.response.data);
            console.error('Error Status:', error.response.status);
        } else if (error.request) {
            console.error('No response received from server');
            console.error('Request details:', error.request);
        } else {
            console.error('Error setting up request:', error.message);
        }
    }
}

testLogin();