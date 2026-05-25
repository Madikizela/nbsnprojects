# Security Documentation

This document outlines the security posture, practices, and controls for the Learning Management System (LMS) in this repository. It covers backend (.NET API), Node.js PostgreSQL proxy server, frontend (Vite/React), PostgreSQL, and email services used for notifications.

## 1. Overview
- Components: `backend` (.NET API), `backend/postgres_proxy_server.js` (Node proxy), `frontend` (Vite/React), `PostgreSQL` database, `SMTP` email.
- Authentication: Email + password; JWT (HS256) with 24h expiry.
- Authorization: Role-based (`SystemAdmin`, `ClientAdmin`), `AccessLevel`/`Role` enforced server-side.
- Passwords: Hashed with `bcrypt`.
- Sensitive payloads: Client registration supports AES-256-CBC encryption; see `ENCRYPTION_DOCUMENTATION.md`.

## 2. Data Classification
- PII: names, email addresses, phone numbers, physical addresses, client contact details.
- Authentication data: passwords (stored as bcrypt hashes), JWT tokens.
- Business data: Clients, Skills Development Providers (SDPs), courses, modules, projects.
- System secrets: `JWT_SECRET`, `ENCRYPTION_KEY`, database credentials, SMTP credentials.

## 3. Authentication & Authorization
- Login endpoints:
  - Node proxy: `POST /api/auth/login`
  - Backend API: see `Controllers/AuthController.cs` (if enabled in deployment)
- JWT:
  - Algorithm: HS256 (symmetric key via `JWT_SECRET`).
  - Claims: `id`, `email`, `name`, `userType`, `accessLevel`/`Role`, `clientId` (if available).
  - Expiry: `24h`.
- Roles:
  - `SystemAdmin`: Full platform administration.
  - `ClientAdmin`: Admin scoped to a specific client; should include `ClientId`.
- Storage:
  - Frontend stores token and user object in `localStorage`. XSS protections are essential (see Section 13).
- Recommendations:
  - Consider token rotation, short-lived access tokens, and refresh tokens.
  - Add Multi-Factor Authentication (MFA) for admins.
  - Enforce least-privilege access for each role and endpoint.

## 4. Passwords
- Hashing: `bcrypt` (`saltRounds=10` in Node proxy) for both `SystemAdmins` and `Users`.
- Initial admin credentials: Random password generated at client registration. Current implementation emails plaintext password; see Section 12 for safer alternatives.
- Policy (recommended):
  - Minimum length `12+`, mixed case, number, symbol.
  - Block common passwords; add breach checks (haveibeenpwned API or equivalent).
  - Enforce periodic rotation for admin accounts.
  - Implement account lockout and rate limiting on failed logins.

## 5. Cryptography
- Client registration encryption:
  - AES-256-CBC with base64 key (`ENCRYPTION_KEY`), IV prepended to the payload (`16` bytes).
  - See `ENCRYPTION_DOCUMENTATION.md` for exact format and interoperability details.
- JWT: HS256 (`JWT_SECRET`).
- At-rest encryption: Rely on PostgreSQL volume encryption (OS-level or disk-level). Consider Transparent Data Encryption if available.
- Recommendations:
  - Rotate `ENCRYPTION_KEY` and `JWT_SECRET` periodically with a planned key rotation procedure.
  - Use secure random generators for passwords and IVs.

## 6. API Security
- Input validation:
  - Email validation (basic regex) exists; expand validation for all fields.
  - Sanitize and validate strings, emails, phone numbers, and addresses server-side.
- SQL safety:
  - All queries use parameterized statements (`pg` placeholders `$1..$n`), mitigating SQL injection.
- Rate limiting:
  - Not currently implemented. Add per-IP and per-identity rate limits on `/api/auth/login` and other sensitive endpoints.
- Brute-force protection:
  - Add exponential backoff or lockouts after N failed attempts.
- CSRF:
  - APIs are stateless with `Bearer` tokens; CSRF risk is limited. Do not use cookies for auth without CSRF protections.
- Error handling:
  - Avoid leaking internal details. Return generic messages; log specifics server-side.
- Security headers:
  - Add `helmet` (Node) and appropriate headers in ASP.NET Core (HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, CSP).

## 7. Transport Security
- Development servers run over HTTP (localhost). For production:
  - Enforce HTTPS with strong ciphersuites and HSTS.
  - Redirect all HTTP to HTTPS.
  - Use TLS certificates from a trusted CA; automate renewal.

## 8. Secrets Management
- Required secrets:
  - `JWT_SECRET`, `ENCRYPTION_KEY` (base64), `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, SMTP credentials.
- Storage:
  - Use environment variables or secret managers (Azure Key Vault, AWS Secrets Manager, HashiCorp Vault).
  - Never commit secrets to source control.
- Rotation:
  - Establish rotation cadence; test rotation in staging.

## 9. CORS & Security Headers
- CORS:
  - Node proxy enables CORS globally. Restrict `origin` to known domains in production.
- Headers:
  - Add `helmet` in Node, and `UseHsts`, `UseHttpsRedirection`, `AddResponseHeaders` in ASP.NET.
- Content Security Policy (CSP):
  - Define strict CSP for the frontend to reduce XSS.

## 10. Logging & Monitoring
- Logging:
  - Log authentication successes/failures, admin actions, configuration changes, and data access events.
  - Redact sensitive data (passwords, full tokens, secrets).
- Monitoring:
  - Aggregate logs (ELK, Seq, Azure/AppInsights). Set alerts for anomalies and repeated failures.
- Audit:
  - Maintain audit trails for critical actions (client creation, credential changes, role changes).

## 11. Database Security
- Access:
  - Use a dedicated DB role with least privileges for the application.
  - Restrict network access to the DB (firewall, VPC). Disable public exposure.
- Schema integrity:
  - Ensure unique constraints (e.g., `Email` unique where applicable) and foreign keys (`ClientId`).
  - Validate `Status` fields; use enumerations and check constraints.
- Backups:
  - Regular encrypted backups; test restoration.
- Connection pooling:
  - Avoid prematurely closing pools. Use health checks and graceful shutdown.

## 12. Email Security
- Current state:
  - Sends plaintext login credentials to new client admins. This is a risk.
- Recommendations:
  - Replace plaintext credentials with a one-time password reset link or magic link, expiring within a short window.
  - Configure SPF/DKIM/DMARC to reduce spoofing and improve deliverability.
  - Use provider-specific app passwords and store them securely.

## 13. Frontend Security
- XSS prevention:
  - Avoid `dangerouslySetInnerHTML`. Sanitize any user-generated content.
  - Apply a strict CSP and subresource integrity.
- Token storage:
  - `localStorage` is vulnerable to XSS. Consider moving to HTTP-only secure cookies with CSRF protections or a secure in-memory store with short-lived tokens.
- Dependency hygiene:
  - Use vetted libraries; audit with `npm audit`/Snyk.

## 14. Dependency & Supply Chain Security
- Pin versions in `package-lock.json` and `.csproj`.
- Use automated dependency update tools (Dependabot/Renovate).
- Run SCA tools (Snyk, npm audit, `dotnet list package --vulnerable`).
- Verify Docker base images and keep them updated.

## 15. Deployment & Infrastructure
- Containers:
  - Run non-root containers. Limit capabilities. Set resource quotas.
- Network:
  - Segment services; restrict inbound/outbound traffic. Apply WAF where appropriate.
- Configuration:
  - Immutable infrastructure; use IaC (Terraform/Bicep) with code reviews.

## 16. Incident Response
- Immediate actions:
  - Revoke tokens, rotate secrets, enforce password resets, isolate affected services.
- Forensics:
  - Preserve logs, capture volatile data, analyze indicators of compromise.
- Communication:
  - Notify stakeholders/users as required by policy and regulation.

## 17. Testing & Hardening Checklist
- Authentication
  - [ ] Rate limiting and lockouts on failed logins
  - [ ] MFA for admin roles
- Authorization
  - [ ] Enforce role checks server-side; test privilege boundaries
- Input Validation
  - [ ] Validate and sanitize all inputs
- Transport & Headers
  - [ ] HTTPS everywhere; HSTS; security headers
- Secrets
  - [ ] Centralized secret management and rotation
- Logging
  - [ ] Redaction; central aggregation; alerting
- Database
  - [ ] Least privilege DB user; backups verified
- Email
  - [ ] Replace plaintext credentials with secure onboarding
- Frontend
  - [ ] CSP configured; XSS testing; token storage reviewed
- Dependencies
  - [ ] SCA reports clean; updates applied

## 18. Threat Model (High-Level)
- Credential stuffing and brute force on login.
- Token theft via XSS or localStorage compromise.
- SQL injection (mitigated via parameterization).
- Sensitive data exposure through misconfigured logs or emails.
- Supply chain vulnerabilities in third-party packages.
- Misconfigured CORS and open origins.

## 19. Known Gaps & Roadmap
- Implement rate limiting and account lockouts on login.
- Migrate onboarding to secure reset/magic links.
- Add helmet and security headers across servers.
- Restrict CORS to known origins.
- Introduce MFA for admin roles.
- Add audit logging for all admin actions.

## 20. Reporting Security Issues
- Please report suspected vulnerabilities privately to the maintainers. Include steps to reproduce and potential impact. Do not post full exploit details publicly until a fix is available.