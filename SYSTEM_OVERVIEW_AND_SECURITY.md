# System Overview and Security Documentation

This document provides a comprehensive overview of the Learner Management and Attendance System, detailing the architectures for both the Web and Mobile platforms, and the security standards implemented to protect sensitive biometric and personal data.

---

## 1. Web Platform (Administrative Dashboard)

The Web Platform serves as the central administrative hub for managing the entire ecosystem. It is designed for high-level management, data analysis, and document oversight.

### Core Technologies
- **Frontend**: React.js with Vite, TypeScript, Tailwind CSS.
- **Backend**: ASP.NET Core 9.0 (C#), Entity Framework Core.
- **Database**: PostgreSQL (relational data storage).

### Key Functionalities
- **Client & Project Management**: Multi-tenant structure allowing management of various skills development providers and their respective projects.
- **Learner Enrollment**: Centralized database of learners with detailed profiles and progress tracking.
- **Document Management System**: Secure upload, storage, and approval workflow for learner compliance documents.
- **Reporting & Analytics**: Real-time dashboards for attendance, project progress, and compliance status.

### Web Security Implementation
- **Authentication**: Stateless session management using **JSON Web Tokens (JWT)** with HS256 signing.
- **Authorization**: Granular **Role-Based Access Control (RBAC)** (SystemAdmin, ClientAdmin, Manager, etc.).
- **Data Encryption**: 
    - **In-Transit**: Mandatory HTTPS/TLS 1.2+ for all communications.
    - **At-Rest**: Sensitive data in the database is encrypted using AES-256.
- **Audit Trails**: Every access to a learner's document is logged with a timestamp, user ID, and action performed.

---

## 2. Mobile Platform (Field Attendance & Biometrics)

The Mobile Platform is a specialized tool for teachers and facilitators on-site to perform real-time attendance tracking and identity verification.

### Core Technologies
- **Framework**: Flutter (Dart).
- **Biometric Integration**: Native Android/iOS SDKs via MethodChannels.
- **Computer Vision**: Google ML Kit for face detection and liveness checking.

### Key Functionalities
- **Biometric Registration**: Capture of high-fidelity fingerprint templates and facial embeddings.
- **Attendance Tracking**: Multi-modal attendance marking (Fingerprint, Face, or Manual with reason).
- **Digital Signatures**: Capture and secure storage of learner signatures for compliance.
- **Profile Management**: On-the-go profile photo capture and learner information updates.

### Mobile Security Implementation
- **Secure Storage**: JWT tokens and sensitive session data are stored in encrypted local storage (Flutter Secure Storage).
- **Network Security**: Certificate pinning (planned) and mandatory HTTPS for all API interactions.
- **Session Timeout**: Automatic session expiration to protect data if a device is lost or stolen.

---

## 3. Data Protection & Security Standards

The system is built with a "Privacy by Design" approach, ensuring that sensitive data is protected at every layer.

### Fingerprint Security
- **Standard**: Uses the **ANSI 378-2004** industry standard for fingerprint minutiae templates.
- **Non-Reversible**: The system stores mathematical representations (minutiae points) rather than actual fingerprint images. These templates **cannot** be reverse-engineered to reconstruct the original fingerprint image.
- **Secure Transmission**: Fingerprint data is never sent in the clear; it is encrypted on the device before transmission to the backend.

### Facial Recognition Security
- **Face Embeddings**: Instead of raw images, the system generates and stores **Face Embeddings** (JSON-serialized 128-dimensional vectors). These are numerical representations used for comparison.
- **Liveness Detection**: The mobile app implements liveness checks (e.g., asking the user to smile or turn their head) to prevent "spoofing" attacks using photos or videos.
- **Encrypted Storage**: Original profile photos are stored in an encrypted file system on the server, accessible only through authenticated API calls.

### Personal Document Security
- **Encryption Algorithm**: **AES-256-CBC** (Advanced Encryption Standard) with unique Initialization Vectors (IVs) for every file.
- **Integrity Verification**: **SHA-256** hashing is used to ensure that documents have not been tampered with after upload.
- **Access Control**: Documents are served through a controller that verifies user permissions before decrypting and streaming the file.

### Compliance Standards
The system is architected to be compliant with major data protection regulations:
- **POPIA (South Africa)**: Compliant with the Protection of Personal Information Act regarding biometric data and personal identifiers.
- **GDPR (EU)**: Adheres to General Data Protection Regulation principles for data minimization, encryption, and the "right to be forgotten."
- **NIST Cybersecurity Framework**: Follows best practices for identification, protection, detection, and response.
- **ISO/IEC 27001**: Implementation of security controls aligned with international information security management standards.

---

## 4. Infrastructure Security

- **Database Security**: Parameterized SQL queries (Entity Framework) to prevent SQL Injection attacks.
- **Server Hardening**: Regular security patches and restricted port access (e.g., firewall rules for port 5213).
- **Secret Management**: API keys, encryption secrets, and database credentials are managed via environment variables and secure configuration providers, never hardcoded in the source.
