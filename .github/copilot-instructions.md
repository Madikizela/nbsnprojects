# Copilot Instructions for RLMS Codebase

## Architecture Overview
- **Monorepo**: Contains `backend` (.NET API), `frontend` (React/Vite), and scripts for data and infra.
- **Backend**: .NET Core API with services for document upload, encryption, audit logging, and user management. Uses PostgreSQL for data, supports file encryption (AES-256-CBC), and role-based access.
- **Frontend**: React (Vite, TypeScript) app for user interaction, communicates with backend via REST APIs.
- **Security**: Strong focus on encryption (see `ENCRYPTION_DOCUMENTATION.md`), JWT auth, and secure file handling.

## Key Workflows
- **Build Backend**: Use `build_and_run.ps1` in `backend/` for local dev. Docker support via `docker-compose.yml`.
- **Run Frontend**: Standard Vite/React workflow (`npm install && npm run dev` in `frontend/`).
- **Database**: Uses PostgreSQL (prod/dev) and SQLite (for some scripts/tests). Data import scripts in `backend/`.
- **Testing**: Node.js test scripts for API and DB in root and `backend/`. PowerShell scripts for data migration/testing.

## Project-Specific Patterns
- **File Encryption**: All sensitive uploads are encrypted at rest using `FileEncryptionService` (AES-256-CBC). See `backend/Services/FileEncryptionService.cs` and `ENCRYPTION_DOCUMENTATION.md`.
- **Document Upload**: Follows strict validation, malware scan (mock/placeholder), and secure filename generation. See `backend/Services/DocumentUploadService.cs`.
- **Audit Logging**: All document access and security events are logged. See `backend/Services/DocumentAuditService.cs`.
- **Role-Based Access**: Enforced in backend controllers and services. Roles: `SystemAdmin`, `ClientAdmin`.
- **Sensitive Data**: Never log or expose encryption keys, JWT secrets, or passwords. Use environment variables for secrets.

## Integration & Conventions
- **API**: RESTful, JSON payloads, JWT auth. See `backend/Controllers/` for endpoints.
- **Frontend-Backend Encryption**: Client registration and sensitive payloads use AES-256-CBC (see `ENCRYPTION_DOCUMENTATION.md`).
- **Scripts**: PowerShell for Windows automation, SQL for data import/export. See `backend/*.ps1` and `.sql` files.
- **Testing**: Use provided test scripts (e.g., `test_client_registration.js`, `test_login_simple.js`).

## Examples
- To add a new document type, update allowed types and size in `DocumentUploadService` and its interface.
- To change encryption, update both `FileEncryptionService` and frontend CryptoJS logic.
- For new API endpoints, follow controller/service pattern in `backend/Controllers/` and `backend/Services/`.

## References
- `SECURITY.md` — Security architecture and controls
- `ENCRYPTION_DOCUMENTATION.md` — Encryption formats and flows
- `backend/Services/` — Core backend logic
- `frontend/` — React app

---

**For AI agents:**
- Always validate file and data handling against security docs.
- Prefer existing service patterns for new features.
- Ask for clarification if workflow or integration is unclear.
