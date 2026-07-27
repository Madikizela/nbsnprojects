# Testing Guide - NBSN Projects

## 🔒 Security Testing

### 1. Snyk (Automated - Already Configured)

**What it does:**
- Scans dependencies for known vulnerabilities
- Monitors container security
- Checks Infrastructure as Code
- Static Application Security Testing (SAST)

**Run manually:**
```bash
# Frontend
cd frontend
npm install -g snyk
snyk test

# Backend
cd backend
snyk test --file=backend.csproj

# View results in dashboard
snyk monitor
```

**GitHub Actions:** Runs automatically on push to main/develop

---

### 2. SonarCloud (Code Quality & Security)

**Setup Steps:**
1. Go to [SonarCloud.io](https://sonarcloud.io)
2. Sign in with GitHub
3. Import your repository
4. Add `SONAR_TOKEN` to GitHub Secrets
5. Update `sonarcloud.yml` with your organization key

**What it analyzes:**
- Code smells and technical debt
- Security hotspots
- Code coverage
- Duplications
- Maintainability issues

**Run locally with SonarScanner:**
```bash
# Install SonarScanner
dotnet tool install --global dotnet-sonarscanner

# Run analysis
dotnet sonarscanner begin /k:"project-key" /d:sonar.token="YOUR_TOKEN"
dotnet build
dotnet sonarscanner end /d:sonar.token="YOUR_TOKEN"
```

---

### 3. OWASP Dependency-Check

**Install:**
```bash
# Using npm
npm install -g dependency-check

# Or download from: https://owasp.org/www-project-dependency-check/
```

**Run:**
```bash
dependency-check --project "NBSN Projects" --scan . --out ./dependency-check-report
```

---

### 4. Manual Security Testing Checklist

- [ ] SQL Injection testing
- [ ] XSS (Cross-Site Scripting) testing
- [ ] CSRF (Cross-Site Request Forgery) protection
- [ ] Authentication bypass attempts
- [ ] Authorization testing (role-based access)
- [ ] API rate limiting
- [ ] Input validation
- [ ] Sensitive data exposure
- [ ] Security headers (CSP, HSTS, X-Frame-Options)

---

## ⚡ Performance & Scalability Testing

### 1. k6 Load Testing

**Install k6:**
```bash
# Windows (using Chocolatey)
choco install k6

# macOS
brew install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

**Run Load Test:**
```bash
# Basic load test
k6 run k6/load-test.js

# With custom target
API_URL=https://your-api.com k6 run k6/load-test.js

# Generate HTML report
k6 run --out json=results.json k6/load-test.js
k6 report results.json --output report.html
```

**Run Stress Test:**
```bash
# Stress test - pushes system to limits
k6 run k6/stress-test.js

# With cloud output (k6 Cloud account required)
k6 run --out cloud k6/stress-test.js
```

**Test Scenarios:**
- `load-test.js` - Gradual ramp-up (10 → 100 users over 15 minutes)
- `stress-test.js` - Extreme load (100 → 400 users)

---

### 2. Apache JMeter (Alternative)

**Install:**
Download from [jmeter.apache.org](https://jmeter.apache.org/download_jmeter.cgi)

**Create Test Plan:**
1. Thread Group (number of users)
2. HTTP Request Samplers (API endpoints)
3. Listeners (View Results Tree, Summary Report)
4. Assertions (response time, status codes)

**Run:**
```bash
jmeter -n -t test-plan.jmx -l results.jtl -e -o report
```

---

### 3. Artillery (Node.js Load Testing)

**Install:**
```bash
npm install -g artillery
```

**Create config** (`artillery.yml`):
```yaml
config:
  target: "https://your-api.com"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 300
      arrivalRate: 50
      name: "Sustained load"

scenarios:
  - flow:
    - get:
        url: "/api/projects"
    - post:
        url: "/api/auth/login"
        json:
          username: "test@example.com"
          password: "password"
```

**Run:**
```bash
artillery run artillery.yml
```

---

### 4. Locust (Python Load Testing)

**Install:**
```bash
pip install locust
```

**Create locustfile.py:**
```python
from locust import HttpUser, task, between

class WebsiteUser(HttpUser):
    wait_time = between(1, 3)
    
    @task
    def load_homepage(self):
        self.client.get("/")
    
    @task(3)
    def view_projects(self):
        self.client.get("/api/projects")
    
    @task(2)
    def login(self):
        self.client.post("/api/auth/login", json={
            "username": "test@example.com",
            "password": "password"
        })
```

**Run:**
```bash
locust -f locustfile.py --host=https://your-api.com
# Open http://localhost:8089 for web interface
```

---

## 📊 Performance Metrics to Monitor

### Response Time Targets:
- **API endpoints:** < 500ms (p95)
- **Database queries:** < 100ms (p95)
- **Page load:** < 2s
- **Time to Interactive:** < 3s

### Scalability Targets:
- **Concurrent users:** 500+ without degradation
- **Requests per second:** 1000+ RPS
- **Database connections:** Monitor pool saturation
- **CPU usage:** < 70% under normal load
- **Memory usage:** < 80% under normal load
- **Error rate:** < 0.1%

---

## 🔍 Additional Tools

### Database Performance:
- **Query analysis:** Use `EXPLAIN ANALYZE` in PostgreSQL
- **Indexing:** Check slow query logs
- **Connection pooling:** Monitor connection usage

### Frontend Performance:
- **Lighthouse:** Chrome DevTools audits
- **WebPageTest:** [webpagetest.org](https://www.webpagetest.org/)
- **GTmetrix:** [gtmetrix.com](https://gtmetrix.com/)

### Monitoring (Production):
- **Application Performance Monitoring (APM):**
  - New Relic
  - Datadog
  - AppDynamics
- **Error tracking:**
  - Sentry
  - Rollbar
- **Uptime monitoring:**
  - UptimeRobot
  - Pingdom

---

## 🚀 Running Tests in CI/CD

### Automated (GitHub Actions):
1. **Security:** Snyk runs on every push
2. **Code Quality:** SonarCloud on PR
3. **Performance:** Manual trigger via workflow_dispatch

### Manual Trigger:
```bash
# Go to GitHub Actions → Performance & Load Testing → Run workflow
# Select test type: load or stress
# Enter target URL (optional)
```

---

## 📝 Test Reports

All test results are stored as artifacts in GitHub Actions:
- **Security:** Uploaded to GitHub Security tab
- **Performance:** JSON results in artifacts
- **Code Quality:** SonarCloud dashboard

---

## 🎯 Recommended Testing Schedule

- **Daily:** Automated Snyk scans (via cron)
- **Per PR:** SonarCloud analysis
- **Weekly:** Full load test on staging
- **Monthly:** Stress test & penetration testing review
- **Quarterly:** Full security audit

---

## 💡 Best Practices

1. **Test in staging first** before production load tests
2. **Gradually increase load** to identify breaking points
3. **Monitor system resources** during tests (CPU, memory, network)
4. **Set up alerts** for performance regressions
5. **Document findings** and remediation steps
6. **Re-test after fixes** to verify improvements

---

## 📞 Getting Help

- k6 Documentation: [k6.io/docs](https://k6.io/docs/)
- Snyk Documentation: [docs.snyk.io](https://docs.snyk.io/)
- SonarCloud Documentation: [docs.sonarcloud.io](https://docs.sonarcloud.io/)
