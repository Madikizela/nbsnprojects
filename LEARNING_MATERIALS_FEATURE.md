# Learning Materials / Study Guide Feature

## Overview
Training managers can now upload learning materials (PDFs, videos, documents, links) related to qualifications. Learners can access these study materials on both web and mobile platforms to help them prepare for assessments.

## Implementation Summary

### 1. Database Schema
**File:** `backend/create_learning_materials_table.sql`

```sql
CREATE TABLE "LearningMaterials" (
    "Id" SERIAL PRIMARY KEY,
    "ProjectQualificationUnitStandardId" INTEGER NOT NULL,
    "Title" VARCHAR(255) NOT NULL,
    "Description" TEXT,
    "MaterialType" VARCHAR(50) NOT NULL, -- 'PDF', 'Video', 'Document', 'Link'
    "FileName" VARCHAR(255),
    "EncryptedFilePath" VARCHAR(500),
    "FileSize" BIGINT,
    "MimeType" VARCHAR(100),
    "EncryptionIV" VARCHAR(500),
    "FileHash" VARCHAR(500),
    "ExternalUrl" VARCHAR(1000), -- For YouTube/external links
    "DisplayOrder" INTEGER NOT NULL DEFAULT 0,
    "UploadedByUserId" INTEGER,
    "IsActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
```

**Features:**
- Linked to ProjectQualificationUnitStandard
- Supports multiple material types: PDF, Video, Document, Link
- Files stored encrypted (AES-256) like other learner documents
- External URLs for YouTube videos or web resources
- Display order for organizing materials
- Soft delete support (IsActive flag)

### 2. Backend API

**Controller:** `backend/Controllers/LearningMaterialsController.cs`
**Model:** `backend/Models/LearningMaterial.cs`

#### API Endpoints:

1. **GET /api/LearningMaterials/unit-standard/{unitStandardId}**
   - Get all materials for a specific unit standard
   - Returns: List of materials with metadata

2. **GET /api/LearningMaterials/learner/{learnerId}/materials**
   - Get all learning materials for a learner based on their enrollment
   - Automatically determines which materials apply to the learner's project
   - Returns: Materials grouped by qualification and unit standard

3. **POST /api/LearningMaterials/upload**
   - Upload new learning material
   - Supports file upload (PDF, Video, Document) OR external URL
   - Files encrypted before storage
   - Body: Form data with file, title, description, material type

4. **GET /api/LearningMaterials/{id}/download**
   - Download/stream a learning material
   - Decrypts file before serving
   - Returns: File content with appropriate MIME type

5. **PUT /api/LearningMaterials/{id}**
   - Update material metadata (title, description, display order)

6. **DELETE /api/LearningMaterials/{id}**
   - Soft delete material (sets IsActive = false)

**Security Features:**
- Files encrypted with AES-256 using EncryptionService
- Unique IV per file
- SHA256 hash verification
- File size limit: 100 MB
- Allowed file types: PDF, MP4, WebM, OGG, DOC, DOCX, PPT, PPTX

### 3. Mobile App (Flutter)

**Screen:** `mobile_flutter/lib/screens/learner_study_materials_screen.dart`

#### Features:
- **Material List View**
  - Cards showing each material with icon, title, description
  - Color-coded by material type (PDF=red, Video=purple, Link=blue, Doc=green)
  - Shows qualification and unit standard context
  - File size display for downloadable materials

- **Material Types**
  - **PDF/Documents**: Download with progress indicator, open in device viewer
  - **Videos**: Download and play
  - **Links**: Open in external browser (YouTube, etc.)

- **Download Progress**
  - Real-time progress bar during downloads
  - Percentage completion display
  - Cancel/retry support

- **Empty States**
  - User-friendly message when no materials available
  - Pull-to-refresh support

**Navigation:**
- Added to learner dashboard with 📚 icon
- Route: `/learner/study-materials`
- Quick access tile on main dashboard

**API Integration:**
Updated `mobile_flutter/lib/services/api_service.dart`:
```dart
Future<Response?> downloadLearningMaterial({
  required int id,
  Function(double)? onProgress,
})
```

### 4. Web Interface (React - TODO)

The web interface needs to be implemented in `frontend/src/components/SDPManagerDashboard.tsx`:

#### For Training Managers:
1. **Upload Interface**
   - Add "Learning Materials" tab to unit standard management
   - Form to upload PDFs, videos, or add external links
   - Fields: Title, Description, Material Type, File/URL, Display Order
   - List view of existing materials with edit/delete options

2. **Material Management**
   - Reorder materials using drag-and-drop
   - Edit metadata (title, description)
   - Delete/archive materials
   - Preview materials before publishing

#### For Learners (Web Portal):
1. **Study Materials Page**
   - Similar to mobile view but optimized for desktop
   - Built-in PDF viewer using `react-pdf`
   - Built-in video player for MP4 files
   - Grid or list view options
   - Filter by qualification/unit standard
   - Search functionality

### 5. Database Migration

To enable this feature in production:

```bash
# Run the SQL script
psql -U postgres -d your_database -f backend/create_learning_materials_table.sql
```

Or in the application, ensure ApplicationDbContext includes:
```csharp
public DbSet<LearningMaterial> LearningMaterials { get; set; }
```

### 6. Required Dependencies

**Mobile (Flutter):**
```yaml
# In pubspec.yaml (already have most)
dependencies:
  dio: ^5.0.0
  url_launcher: ^6.1.0
  # Add for file viewing:
  flutter_pdfview: ^1.3.0  # For PDF viewing
  video_player: ^2.8.0     # For video playback
  open_file: ^3.3.0        # To open downloaded files
```

**Web (React):**
```json
{
  "react-pdf": "^7.5.0",
  "react-player": "^2.13.0"
}
```

## Usage Workflow

### Training Manager Workflow:
1. Navigate to a project's qualification unit standards
2. Click "Add Learning Material" button
3. Select material type (PDF, Video, Document, or Link)
4. Upload file OR enter external URL
5. Provide title and description
6. Set display order (optional)
7. Save - material becomes available to all enrolled learners

### Learner Workflow (Mobile):
1. Open mobile app and login to learner portal
2. Tap "Study Materials" tile on dashboard (📚 icon)
3. Browse available materials grouped by qualification
4. Tap any material to:
   - **PDF/Doc**: Download and open in device viewer
   - **Video**: Download and play
   - **Link**: Open in external browser
5. Progress indicator shows download status
6. Materials are sorted by display order

### Learner Workflow (Web):
1. Login to learner web portal
2. Navigate to "Study Materials" section
3. Browse materials in grid/list view
4. Click to view:
   - **PDF**: Opens in built-in viewer
   - **Video**: Plays in built-in player
   - **Link**: Opens in new tab
5. Download button for offline access

## Benefits

1. **Centralized Learning Content**
   - All study materials in one place
   - No need for external file sharing

2. **Mobile-First Learning**
   - Learners can study anywhere
   - Offline access after download
   - Data-efficient with progress indicators

3. **Flexible Content Types**
   - PDFs for reading materials
   - Videos for visual learning
   - External links for web resources
   - Documents for worksheets

4. **Quality Control**
   - Training managers control content
   - Version control through updates
   - Remove outdated materials easily

5. **Assessment Preparation**
   - Materials linked to specific unit standards
   - Learners know what to study for each assessment
   - Reduces assessment failure rates

## Next Steps (Web UI Implementation)

### Priority 1: Training Manager Upload UI
```typescript
// Add to SDPManagerDashboard.tsx
const [showMaterialModal, setShowMaterialModal] = useState(false);
const [materialForm, setMaterialForm] = useState({
  title: '',
  description: '',
  materialType: 'PDF',
  file: null as File | null,
  externalUrl: '',
  displayOrder: 0
});

// Upload handler
const handleUploadMaterial = async (e: React.FormEvent) => {
  const formData = new FormData();
  formData.append('UnitStandardId', selectedUnitStandardId);
  formData.append('Title', materialForm.title);
  formData.append('Description', materialForm.description);
  formData.append('MaterialType', materialForm.materialType);
  formData.append('DisplayOrder', materialForm.displayOrder.toString());
  
  if (materialForm.materialType === 'Link') {
    formData.append('ExternalUrl', materialForm.externalUrl);
  } else if (materialForm.file) {
    formData.append('File', materialForm.file);
  }
  
  await fetchWithAuth('/api/LearningMaterials/upload', {
    method: 'POST',
    body: formData
  });
};
```

### Priority 2: Learner Web Portal View
- Add "Study Materials" section to learner portal
- Implement PDF viewer component
- Implement video player component
- Add download functionality

### Priority 3: Analytics
- Track material views/downloads
- Identify which materials are most helpful
- Correlate material usage with assessment performance

## Testing Checklist

- [ ] Database table created successfully
- [ ] Backend API endpoints tested with Postman/Swagger
- [ ] File upload works with encryption
- [ ] File download works with decryption
- [ ] External URL links work
- [ ] Mobile app displays materials correctly
- [ ] Mobile download progress works
- [ ] Mobile file viewing works for PDFs
- [ ] Mobile video playback works
- [ ] Web UI upload form complete
- [ ] Web learner portal view complete
- [ ] Permission checks (only training managers can upload)
- [ ] Learner can only see materials for their enrolled project

## Security Considerations

1. **File Encryption**
   - All uploaded files encrypted at rest
   - Unique IV per file prevents pattern analysis

2. **Access Control**
   - Learners only see materials for their project
   - Training managers can only upload to their assigned projects
   - Admin users have full access

3. **File Validation**
   - MIME type checking
   - File size limits (100 MB)
   - Malware scanning recommended for production

4. **External URLs**
   - URL validation before storage
   - Warning to users before opening external links
   - Consider whitelisting trusted domains (YouTube, Vimeo, etc.)

## Performance Optimization

1. **Large Files**
   - Stream videos instead of full download
   - Implement chunked downloads
   - Cache frequently accessed materials

2. **Mobile Data**
   - Show file sizes before download
   - Option to download on WiFi only
   - Compress videos for mobile delivery

3. **Database**
   - Index on ProjectQualificationUnitStandardId
   - Index on IsActive for faster queries
   - Consider pagination for large material lists

## Future Enhancements

1. **Interactive Content**
   - Embedded quizzes in materials
   - Progress tracking per material
   - Bookmarks and notes

2. **Social Features**
   - Learner ratings/reviews of materials
   - Discussion forums per material
   - Peer recommendations

3. **AI Features**
   - Auto-generate summaries from PDFs
   - Speech-to-text for videos
   - Personalized material recommendations

4. **Offline Mode**
   - Download materials for offline access
   - Sync progress when back online
   - Local search in downloaded content
