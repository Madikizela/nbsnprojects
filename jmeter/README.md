# Apache JMeter Test Plan

## Installation

1. Download JMeter from: https://jmeter.apache.org/download_jmeter.cgi
2. Extract to a directory
3. Run `bin/jmeter.bat` (Windows) or `bin/jmeter.sh` (Linux/Mac)

## Creating a Test Plan

### 1. Add Thread Group
- Right-click Test Plan → Add → Threads → Thread Group
- Configure:
  - Number of Threads: 100 (users)
  - Ramp-up Period: 60 seconds
  - Loop Count: 10

### 2. Add HTTP Request Defaults
- Right-click Thread Group → Add → Config Element → HTTP Request Defaults
- Configure:
  - Server Name: your-api-url.com
  - Protocol: https
  - Port: 443

### 3. Add HTTP Header Manager
- Right-click Thread Group → Add → Config Element → HTTP Header Manager
- Add header:
  - Name: Content-Type
  - Value: application/json

### 4. Add Login Request
- Right-click Thread Group → Add → Sampler → HTTP Request
- Configure:
  - Name: Login
  - Method: POST
  - Path: /api/auth/login
  - Body Data:
    ```json
    {
      "username": "test@example.com",
      "password": "TestPassword123!"
    }
    ```

### 5. Extract Auth Token
- Right-click Login → Add → Post Processors → JSON Extractor
- Configure:
  - Names of created variables: authToken
  - JSON Path expressions: $.token
  - Default Values: NOT_FOUND

### 6. Add Projects Request
- Right-click Thread Group → Add → Sampler → HTTP Request
- Configure:
  - Name: Get Projects
  - Method: GET
  - Path: /api/projects
  - Add Header:
    - Name: Authorization
    - Value: Bearer ${authToken}

### 7. Add Response Assertions
- Right-click HTTP Request → Add → Assertions → Response Assertion
- Configure:
  - Response Code: 200
  - Response Time (ms): 1000

### 8. Add Listeners
- Right-click Thread Group → Add → Listener → View Results Tree
- Right-click Thread Group → Add → Listener → Summary Report
- Right-click Thread Group → Add → Listener → Aggregate Report
- Right-click Thread Group → Add → Listener → Response Time Graph

## Running Tests

### GUI Mode (for test creation)
```bash
jmeter
```

### CLI Mode (for actual load testing)
```bash
jmeter -n -t test-plan.jmx -l results.jtl -e -o report/
```

Parameters:
- `-n`: Non-GUI mode
- `-t`: Test plan file
- `-l`: Results file
- `-e`: Generate report dashboard
- `-o`: Output folder for report

### Distributed Testing (Multiple machines)
```bash
# On remote machines (slaves)
jmeter-server

# On master machine
jmeter -n -t test.jmx -R server1,server2,server3 -l results.jtl
```

## Best Practices

1. **Use Variables**: Store API URL, credentials in User Defined Variables
2. **Add Think Time**: Add Timer → Uniform Random Timer between requests
3. **CSV Data**: Use CSV Data Set Config for multiple test users
4. **Parameterization**: Use ${variable} syntax for dynamic data
5. **Assertions**: Add assertions to validate responses
6. **Listeners**: Remove listeners in CLI mode for better performance

## Sample Test Scenarios

### Scenario 1: Login Load Test
- 100 users
- Login → View Dashboard → Logout
- Duration: 5 minutes

### Scenario 2: API Stress Test
- 500 users
- Continuous API calls to all endpoints
- Duration: 15 minutes

### Scenario 3: Spike Test
- Ramp from 0 to 1000 users in 30 seconds
- Hold for 2 minutes
- Ramp down

## Monitoring

Monitor these metrics:
- **Throughput**: Requests/second
- **Response Time**: Average, p95, p99
- **Error Rate**: % of failed requests
- **Active Threads**: Number of concurrent users

## Integration with CI/CD

Add to GitHub Actions:
```yaml
- name: Run JMeter Test
  run: |
    wget https://archive.apache.org/dist/jmeter/binaries/apache-jmeter-5.6.3.tgz
    tar -xzf apache-jmeter-5.6.3.tgz
    cd apache-jmeter-5.6.3/bin
    ./jmeter -n -t ../../test-plan.jmx -l results.jtl -e -o report/
```
