import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 },   // Ramp up to 10 users
    { duration: '5m', target: 50 },   // Stay at 50 users for 5 minutes
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users for 5 minutes
    { duration: '2m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    errors: ['rate<0.1'],              // Error rate should be less than 10%
  },
};

// Base URL - update this to your actual API URL
const BASE_URL = __ENV.API_URL || 'http://localhost:5000';

// Test scenarios
export default function () {
  // Test 1: Homepage/Health check
  let res = http.get(`${BASE_URL}/api/health`);
  check(res, {
    'health check status is 200': (r) => r.status === 200,
    'health check response time < 200ms': (r) => r.timings.duration < 200,
  }) || errorRate.add(1);

  sleep(1);

  // Test 2: Login endpoint
  const loginPayload = JSON.stringify({
    username: 'test@example.com',
    password: 'testpassword123',
  });

  const loginParams = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  res = http.post(`${BASE_URL}/api/auth/login`, loginPayload, loginParams);
  check(res, {
    'login status is 200 or 401': (r) => r.status === 200 || r.status === 401,
    'login response time < 500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);

  sleep(1);

  // Test 3: Get projects (if login succeeded)
  if (res.status === 200) {
    const authToken = res.json('token');
    
    const authParams = {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    };

    res = http.get(`${BASE_URL}/api/projects`, authParams);
    check(res, {
      'projects status is 200': (r) => r.status === 200,
      'projects response time < 1000ms': (r) => r.timings.duration < 1000,
    }) || errorRate.add(1);

    sleep(2);
  }

  // Test 4: Public endpoints
  res = http.get(`${BASE_URL}/api/public/stats`);
  check(res, {
    'stats endpoint accessible': (r) => r.status === 200 || r.status === 404,
  });

  sleep(1);
}

// Setup function - runs once before the test
export function setup() {
  console.log(`Starting load test against: ${BASE_URL}`);
  console.log('Test will simulate user traffic with gradual ramp-up');
}

// Teardown function - runs once after the test
export function teardown(data) {
  console.log('Load test completed');
}
