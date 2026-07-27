import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

// Stress test configuration - push system to its limits
export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up to 100 users
    { duration: '5m', target: 200 },   // Increase to 200 users
    { duration: '2m', target: 300 },   // Push to 300 users
    { duration: '5m', target: 400 },   // Maximum load at 400 users
    { duration: '5m', target: 200 },   // Scale down to 200
    { duration: '2m', target: 0 },     // Recovery
  ],
  thresholds: {
    http_req_duration: ['p(99)<3000'],  // 99% of requests should be below 3s under stress
    http_req_failed: ['rate<0.2'],      // Allow up to 20% failure rate under extreme stress
    errors: ['rate<0.25'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:5000';

export default function () {
  // Simulate realistic user behavior with various endpoints
  const scenarios = [
    () => testHealthCheck(),
    () => testAuthentication(),
    () => testProjectsAPI(),
    () => testLearnersAPI(),
    () => testAttendanceAPI(),
  ];

  // Randomly execute one scenario
  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  scenario();

  sleep(Math.random() * 3 + 1); // Random sleep between 1-4 seconds
}

function testHealthCheck() {
  const res = http.get(`${BASE_URL}/api/health`);
  check(res, {
    'health check responsive': (r) => r.status < 500,
  }) || errorRate.add(1);
}

function testAuthentication() {
  const payload = JSON.stringify({
    username: `user${Math.floor(Math.random() * 1000)}@test.com`,
    password: 'password123',
  });

  const res = http.post(`${BASE_URL}/api/auth/login`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(res, {
    'auth endpoint available': (r) => r.status < 500,
  }) || errorRate.add(1);
}

function testProjectsAPI() {
  const res = http.get(`${BASE_URL}/api/projects`);
  check(res, {
    'projects API responsive': (r) => r.status < 500,
  }) || errorRate.add(1);
}

function testLearnersAPI() {
  const res = http.get(`${BASE_URL}/api/learners`);
  check(res, {
    'learners API responsive': (r) => r.status < 500,
  }) || errorRate.add(1);
}

function testAttendanceAPI() {
  const res = http.get(`${BASE_URL}/api/attendance`);
  check(res, {
    'attendance API responsive': (r) => r.status < 500,
  }) || errorRate.add(1);
}

export function setup() {
  console.log('🔥 Starting STRESS TEST - pushing system to limits!');
  console.log(`Target: ${BASE_URL}`);
}

export function teardown() {
  console.log('✅ Stress test completed');
}
