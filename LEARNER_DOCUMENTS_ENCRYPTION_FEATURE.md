# Learner Documents with Encryption Feature

## Overview
Implemented a complete document management system for learners with AES-256 encryption at rest and HTTPS encryption in transit. Documents are encrypted before being saved to disk and decrypted only when downloaded.

## Security Features

### Encryption at Rest
- **Algorithm**: AES-256 (Advanced Encryption Standard)
- **Key Management**: 256-bit encryption key stored in configuration
- **Initialization Vector (IV)**: Unique IV generated for each file
- **File Integrity**: SHA-256 hash verification to detect tampering

### Encryption in Transit
- **Protocol**: HTTPS (TLS/SSL)
- **Authentication**: JWT Bearer token required for all API calls
- **Authorization**: User must be authenticated to upload/download documents

### Security Best Practices
1. Encryption key should be stored in Azure Key Vault or similar secure storage
2. Files are encrypted immediately upon upload
3. Original files are never stored on disk
4. File integrity is verified on download using SHA-256 hash
5. Encrypted files are stored with unique GUIDs to prevent filename conflicts

## Database Schema

### LearnerDocuments Table
```sql
CREATE TABLE "LearnerDocuments" (
    "Id" SERIAL PRIMARY KEY,
    "LearnerId" INTEGER NOT NULL,
    "DocumentType" VARCHAR(100) NOT NULL,
    "FileName" VARCHAR(255) NOT NULL,
    "EncryptedFilePath" VARCHAR(500) NOT NULL,
    "FileSize" BIGINT NOT NULL,
    "MimeType" VARCHAR(100) NOT NULL,
    "EncryptionIV" VARCHAR(500) NOT NULL,
    "FileHash" VARCHAR(500) NOT NULL,
    "UploadedAt" TIMESTAMP NOT NULL,
    "UploadedByUserId" INTEGER,
    "CreatedAt" TIMESTAMP NOT NULL,
    "UpdatedAt" TIMESTAMP NOT NULL,
    FOREIGN KEY ("LearnerId") REFERENCES "Learners"("Id") ON DELETE CASCADE,
    FOREIGN KEY ("UploadedByUserId") REFERENCES "Users"("Id") ON DELETE SET NULL
);
```

## Allowed Document Types
1. Bank Confirmation Letter
2. CV
3. ID Document
4. Proof of Residence
5. Qualifications

## File Restrictions
- **Maximum Size**: 10 MB per file
- **Allowed Formats**: PDF, JPEG, JPG, PNG
- **MIME Types**: application/pdf, image/jpeg, image/jpg, image/png

## Backend Implementation

### Files Created

#### 1. Models
- `backend/Models/LearnerDocument.cs` - Entity model
- `backend/Models/DTOs/LearnerDocumentDTOs.cs` - Data transfer objects

#### 2. Services
- `backend/Services/Interfaces/ILearnerDocumentEncryptionService.cs` - Interface
- `backend/Services/LearnerDocumentEncryptionService.cs` - Encryption implementation

#### 3. Controller
- `backend/Controllers/LearnerDocumentsController.cs` - API endpoints

#### 4. Database
- `backend/create_learner_documents_table.sql` - Table creation script

### Service Registration
Added to `Program.cs`:
```csharp
builder.Services.AddScoped<ILearnerDocumentEncryptionService, LearnerDocumentEncryptionService>();
```

### Encryption Service Methods

#### EncryptAndSaveFileAsync
```csharp
Task<(string encryptedPath, string iv, string hash)> EncryptAndSaveFileAsync(
    byte[] fileContent, 
    string fileName
)
```
- Generates unique filename with GUID
- Calculates SHA-256 hash of original file
- Encrypts file using AES-256
- Saves encrypted file to disk
- Returns encrypted path, IV, and hash

#### DecryptFileAsync
```csharp
Task<byte[]> DecryptFileAsync(string encryptedPath, string iv)
```
- Reads encrypted file from disk
- Decrypts using stored IV
- Returns original file content

#### VerifyFileIntegrity
```csharp
bool VerifyFileIntegrity(byte[] fileContent, string expectedHash)
```
- Calculates SHA-256 hash of decrypted file
- Compares with stored hash
- Returns true if hashes match

#### DeleteEncryptedFileAsync
```csharp
Task DeleteEncryptedFileAsync(string encryptedPath)
```
- Deletes encrypted file from disk

## API Endpoints

### GET /api/LearnerDocuments/learner/{learnerId}
Get all documents for a specific learner.

**Response:**
```json
[
  {
    "id": 1,
    "learnerId": 4,
    "documentType": "ID Document",
    "fileName": "id_copy.pdf",
    "fileSize": 245678,
    "mimeType": "application/pdf",
    "uploadedAt": "2026-03-02T20:30:00",
    "uploadedByUserName": "John Doe"
  }
]
```

### POST /api/LearnerDocuments/upload
Upload a new document (multipart/form-data).

**Request:**
- `LearnerId` (int): Learner ID
- `DocumentType` (string): One of the allowed types
- `File` (file): The document file

**Response:**
```json
{
  "id": 1,
  "learnerId": 4,
  "documentType": "ID Document",
  "fileName": "id_copy.pdf",
  "fileSize": 245678,
  "mimeType": "application/pdf",
  "uploadedAt": "2026-03-02T20:30:00",
  "uploadedByUserName": "John Doe"
}
```

### GET /api/LearnerDocuments/{id}/download
Download and decrypt a document.

**Response:** File download with proper content type

### DELETE /api/LearnerDocuments/{id}
Delete a document (removes both database record and encrypted file).

**Response:** 204 No Content

### GET /api/LearnerDocuments/types
Get list of allowed document types.

**Response:**
```json
[
  "Bank Confirmation Letter",
  "CV",
  "ID Document",
  "Proof of Residence",
  "Qualifications"
]
```

## Frontend Implementation

### State Management
Added to `SDPManagerDashboard.tsx`:
```typescript
const [learnerDocuments, setLearnerDocuments] = useState<any[]>([]);
const [uploadingDocument, setUploadingDocument] = useState(false);
const [selectedFile, setSelectedFile] = useState<File | null>(null);
const [selectedDocumentType, setSelectedDocumentType] = useState<string>('');
const [documentTypes, setDocumentTypes] = useState<string[]>([...]);
```

### Functions

#### fetchLearnerDocuments
Fetches all documents for a learner when the modal opens.

#### handleUploadDocument
- Creates FormData with learner ID, document type, and file
- Sends POST request to upload endpoint
- Updates document list on success
- Resets form

#### handleDownloadDocument
- Fetches encrypted document from API
- API decrypts and returns original file
- Creates blob and triggers browser download

#### handleDeleteDocument
- Confirms deletion with user
- Sends DELETE request
- Removes document from list

### UI Components

#### Documents Tab
Located in the learner view/edit modal:

1. **Upload Form**
   - Document type dropdown (5 types)
   - File input (PDF, JPG, PNG only)
   - Upload button with loading state
   - File size limit displayed (10 MB)

2. **Documents List**
   - Shows all uploaded documents
   - Displays: document type, filename, file size, upload date/time, uploader name
   - Download button for each document
   - Delete button for each document
   - Empty state when no documents exist

## Configuration

### appsettings.json
Add these settings:
```json
{
  "FileStorage": {
    "LearnerDocumentsPath": "uploads/learner_documents"
  },
  "Encryption": {
    "LearnerDocumentKey": "YourSecure256BitEncryptionKeyHere!!"
  }
}
```

**IMPORTANT**: In production, store the encryption key in Azure Key Vault or similar secure storage, not in appsettings.json.

## File Storage

### Directory Structure
```
backend/
  uploads/
    learner_documents/
      {guid}_{original_filename}
      {guid}_{original_filename}
      ...
```

### File Naming
Files are stored with format: `{GUID}_{OriginalFileName}`
Example: `a1b2c3d4-e5f6-7890-abcd-ef1234567890_id_document.pdf`

## Security Considerations

### Current Implementation
✅ AES-256 encryption at rest
✅ HTTPS encryption in transit
✅ SHA-256 file integrity verification
✅ JWT authentication required
✅ File size limits (10 MB)
✅ File type restrictions (PDF, JPG, PNG)
✅ Unique file naming to prevent conflicts
✅ Cascade delete (documents deleted when learner deleted)

### Production Recommendations
1. **Key Management**
   - Store encryption key in Azure Key Vault
   - Rotate keys periodically
   - Use different keys for different environments

2. **Access Control**
   - Implement role-based access (only authorized users can view documents)
   - Add audit logging for document access
   - Implement document expiration policies

3. **Backup & Recovery**
   - Regular backups of encrypted files
   - Secure backup of encryption keys
   - Disaster recovery plan

4. **Compliance**
   - POPIA (Protection of Personal Information Act) compliance
   - GDPR compliance if applicable
   - Data retention policies

5. **Monitoring**
   - Log all document access
   - Monitor for suspicious activity
   - Alert on failed integrity checks

## Testing

### Manual Testing Steps
1. Open the application and navigate to a learner
2. Click "View" button on a learner
3. Click "Documents" tab
4. Select a document type
5. Choose a file (PDF, JPG, or PNG under 10 MB)
6. Click "Upload Document"
7. Verify document appears in the list
8. Click "Download" to download the document
9. Verify the downloaded file is correct
10. Click delete button and confirm
11. Verify document is removed

### Test Cases
- ✅ Upload PDF document
- ✅ Upload JPG/PNG image
- ✅ Reject files over 10 MB
- ✅ Reject unsupported file types
- ✅ Download and verify file integrity
- ✅ Delete document
- ✅ View multiple documents
- ✅ Upload same document type multiple times
- ✅ Encryption/decryption works correctly
- ✅ File hash verification works

## Files Modified/Created

### Backend
- ✅ `backend/Models/LearnerDocument.cs` (new)
- ✅ `backend/Models/DTOs/LearnerDocumentDTOs.cs` (new)
- ✅ `backend/Services/Interfaces/ILearnerDocumentEncryptionService.cs` (new)
- ✅ `backend/Services/LearnerDocumentEncryptionService.cs` (new)
- ✅ `backend/Controllers/LearnerDocumentsController.cs` (new)
- ✅ `backend/create_learner_documents_table.sql` (new)
- ✅ `backend/Models/ApplicationDbContext.cs` (modified)
- ✅ `backend/Program.cs` (modified)

### Frontend
- ✅ `frontend/src/components/SDPManagerDashboard.tsx` (modified)

### Documentation
- ✅ `LEARNER_DOCUMENTS_ENCRYPTION_FEATURE.md` (this file)

## Encryption Flow

### Upload Flow
```
1. User selects file in browser
2. Frontend sends file via FormData to API
3. API reads file content into memory
4. Calculate SHA-256 hash of original file
5. Generate unique IV for AES encryption
6. Encrypt file content using AES-256
7. Save encrypted file to disk with GUID filename
8. Store metadata in database (path, IV, hash)
9. Return success response to frontend
```

### Download Flow
```
1. User clicks download button
2. Frontend requests file from API
3. API retrieves document metadata from database
4. Read encrypted file from disk
5. Decrypt file using stored IV
6. Verify file integrity using stored hash
7. Return decrypted file to browser
8. Browser triggers download
```

## Error Handling

### Backend
- File not found errors
- Encryption/decryption errors
- File integrity verification failures
- Database errors
- File size limit exceeded
- Invalid file types

### Frontend
- Upload failures
- Download failures
- Network errors
- File selection errors
- User-friendly error messages

## Performance Considerations

1. **File Size Limit**: 10 MB prevents memory issues
2. **Streaming**: Large files could be streamed instead of loaded into memory
3. **Async Operations**: All file operations are async
4. **Database Indexing**: Indexes on LearnerId and DocumentType for fast queries

## Future Enhancements

1. **Document Preview**: Show PDF/image preview in modal
2. **Bulk Upload**: Upload multiple documents at once
3. **Document Versioning**: Keep history of document changes
4. **OCR**: Extract text from scanned documents
5. **Document Expiration**: Auto-delete old documents
6. **Virus Scanning**: Scan files before encryption
7. **Compression**: Compress files before encryption
8. **Cloud Storage**: Store encrypted files in Azure Blob Storage
9. **Document Templates**: Pre-fill forms from uploaded documents
10. **Digital Signatures**: Sign documents digitally
