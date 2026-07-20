# Learning Materials Web UI - Implementation Guide

## Quick Start Commands

### 1. Run Database Migration
```bash
# Connect to your PostgreSQL database
cd backend
psql -U postgres -d nbsn_db -f create_learning_materials_table.sql

# Or through your database client, execute the SQL file
```

### 2. Update Backend (Already Done ✓)
- ✅ Model: `backend/Models/LearningMaterial.cs`
- ✅ Controller: `backend/Controllers/LearningMaterialsController.cs`
- ✅ DbContext updated: `backend/Models/ApplicationDbContext.cs`

### 3. Test Backend API
```bash
# Start backend
cd backend
dotnet run

# Test endpoints with curl or Postman:
GET http://localhost:5000/api/LearningMaterials/unit-standard/1
GET http://localhost:5000/api/LearningMaterials/learner/1/materials
```

### 4. Update Mobile App (Already Done ✓)
- ✅ Screen: `mobile_flutter/lib/screens/learner_study_materials_screen.dart`
- ✅ API Service updated: `mobile_flutter/lib/services/api_service.dart`
- ✅ Routes added: `mobile_flutter/lib/main.dart`
- ✅ Dashboard tile added: `mobile_flutter/lib/screens/learner_dashboard_screen.dart`

```bash
# Test mobile app
cd mobile_flutter
flutter pub get
flutter run
```

## Web UI Components to Add

### Component 1: Learning Materials Upload Modal (Training Manager)

**Location:** `frontend/src/components/SDPManagerDashboard.tsx`

**Add after the Summative Assessment Modal (around line 11200):**

```tsx
{/* Learning Materials Modal */}
{showLearningMaterialsModal && (
  <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
    <div className="modal-dialog modal-dialog-centered modal-lg">
      <div className="modal-content bg-dark text-light">
        <div className="modal-header border-secondary">
          <h5 className="modal-title">📚 Add Learning Material</h5>
          <button type="button" className="btn-close btn-close-white" onClick={() => {
            setShowLearningMaterialsModal(false);
            setLearningMaterialForm({
              title: '',
              description: '',
              materialType: 'PDF',
              file: null,
              externalUrl: '',
              displayOrder: 0
            });
          }}></button>
        </div>
        <form onSubmit={handleUploadLearningMaterial}>
          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label">Title *</label>
              <input 
                type="text" 
                className="form-control bg-secondary text-light border-0" 
                placeholder="e.g., Introduction to Health and Safety"
                value={learningMaterialForm.title}
                onChange={(e) => setLearningMaterialForm({...learningMaterialForm, title: e.target.value})}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Description</label>
              <textarea 
                className="form-control bg-secondary text-light border-0" 
                placeholder="Brief description of what learners will learn from this material"
                value={learningMaterialForm.description}
                onChange={(e) => setLearningMaterialForm({...learningMaterialForm, description: e.target.value})}
                rows={3}
              />
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Material Type *</label>
                <select 
                  className="form-select bg-secondary text-light border-0"
                  value={learningMaterialForm.materialType}
                  onChange={(e) => setLearningMaterialForm({
                    ...learningMaterialForm, 
                    materialType: e.target.value,
                    file: null,
                    externalUrl: ''
                  })}
                  required
                >
                  <option value="PDF">PDF Document</option>
                  <option value="Video">Video File</option>
                  <option value="Document">Document (Word/PowerPoint)</option>
                  <option value="Link">External Link (YouTube, etc.)</option>
                </select>
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">Display Order</label>
                <input 
                  type="number" 
                  className="form-control bg-secondary text-light border-0"
                  placeholder="0"
                  value={learningMaterialForm.displayOrder}
                  onChange={(e) => setLearningMaterialForm({
                    ...learningMaterialForm, 
                    displayOrder: parseInt(e.target.value) || 0
                  })}
                  min="0"
                />
                <small className="text-muted">Lower numbers appear first</small>
              </div>
            </div>

            {learningMaterialForm.materialType === 'Link' ? (
              <div className="mb-3">
                <label className="form-label">External URL *</label>
                <input 
                  type="url" 
                  className="form-control bg-secondary text-light border-0" 
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={learningMaterialForm.externalUrl}
                  onChange={(e) => setLearningMaterialForm({...learningMaterialForm, externalUrl: e.target.value})}
                  required
                />
                <small className="text-muted">YouTube, Vimeo, or any educational link</small>
              </div>
            ) : (
              <div className="mb-3">
                <label className="form-label">Upload File *</label>
                <input 
                  type="file" 
                  className="form-control bg-secondary text-light border-0"
                  accept={
                    learningMaterialForm.materialType === 'PDF' ? '.pdf' :
                    learningMaterialForm.materialType === 'Video' ? '.mp4,.webm,.ogg' :
                    '.doc,.docx,.ppt,.pptx'
                  }
                  onChange={(e) => setLearningMaterialForm({
                    ...learningMaterialForm, 
                    file: e.target.files?.[0] || null
                  })}
                  required
                />
                <small className="text-muted">
                  {learningMaterialForm.materialType === 'PDF' && 'Accepted: PDF files'}
                  {learningMaterialForm.materialType === 'Video' && 'Accepted: MP4, WebM, OGG (max 100 MB)'}
                  {learningMaterialForm.materialType === 'Document' && 'Accepted: Word, PowerPoint'}
                </small>
              </div>
            )}

            <div className="alert alert-info">
              <small>
                <strong>💡 Tip:</strong> Materials will be available to all learners enrolled in this unit standard. 
                They can access them on both web and mobile apps.
              </small>
            </div>
          </div>
          <div className="modal-footer border-secondary">
            <button type="button" className="btn btn-secondary" onClick={() => {
              setShowLearningMaterialsModal(false);
            }}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={uploadingMaterial}>
              {uploadingMaterial ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Uploading...
                </>
              ) : (
                '📤 Upload Material'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
)}
```

**Add State Variables (around line 200):**

```tsx
const [showLearningMaterialsModal, setShowLearningMaterialsModal] = useState(false);
const [learningMaterialForm, setLearningMaterialForm] = useState({
  title: '',
  description: '',
  materialType: 'PDF',
  file: null as File | null,
  externalUrl: '',
  displayOrder: 0
});
const [uploadingMaterial, setUploadingMaterial] = useState(false);
const [learningMaterials, setLearningMaterials] = useState<any[]>([]);
const [loadingMaterials, setLoadingMaterials] = useState(false);
```

**Add Handler Functions (after assessment handlers):**

```tsx
const handleUploadLearningMaterial = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!selectedUnitStandardId) return;
  
  setUploadingMaterial(true);
  
  try {
    const formData = new FormData();
    formData.append('UnitStandardId', selectedUnitStandardId.toString());
    formData.append('Title', learningMaterialForm.title);
    formData.append('Description', learningMaterialForm.description || '');
    formData.append('MaterialType', learningMaterialForm.materialType);
    formData.append('DisplayOrder', learningMaterialForm.displayOrder.toString());
    
    if (learningMaterialForm.materialType === 'Link') {
      formData.append('ExternalUrl', learningMaterialForm.externalUrl);
    } else if (learningMaterialForm.file) {
      formData.append('File', learningMaterialForm.file);
    }
    
    const response = await fetchWithAuth('/api/LearningMaterials/upload', {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header - browser will set it with boundary for FormData
    });
    
    if (response && response.ok) {
      alert('✅ Learning material uploaded successfully!');
      setShowLearningMaterialsModal(false);
      setLearningMaterialForm({
        title: '',
        description: '',
        materialType: 'PDF',
        file: null,
        externalUrl: '',
        displayOrder: 0
      });
      // Reload materials
      if (selectedUnitStandardId) {
        fetchLearningMaterials(selectedUnitStandardId);
      }
    } else {
      alert('❌ Failed to upload material');
    }
  } catch (error) {
    console.error('Error uploading material:', error);
    alert('❌ An error occurred while uploading');
  } finally {
    setUploadingMaterial(false);
  }
};

const fetchLearningMaterials = async (unitStandardId: number) => {
  setLoadingMaterials(true);
  try {
    const response = await fetchWithAuth(`/api/LearningMaterials/unit-standard/${unitStandardId}`);
    if (response && response.ok) {
      const data = await response.json();
      setLearningMaterials(data);
    }
  } catch (error) {
    console.error('Error fetching learning materials:', error);
  } finally {
    setLoadingMaterials(false);
  }
};

const handleDeleteMaterial = async (materialId: number) => {
  if (!confirm('Are you sure you want to delete this learning material?')) return;
  
  try {
    const response = await fetchWithAuth(`/api/LearningMaterials/${materialId}`, {
      method: 'DELETE'
    });
    
    if (response && response.ok) {
      alert('✅ Material deleted successfully');
      if (selectedUnitStandardId) {
        fetchLearningMaterials(selectedUnitStandardId);
      }
    }
  } catch (error) {
    console.error('Error deleting material:', error);
    alert('❌ Failed to delete material');
  }
};
```

**Add Button to Open Modal (in unit standard view, after assessment buttons):**

```tsx
<button
  className="btn btn-sm"
  style={{
    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    color: 'white',
    border: 'none'
  }}
  onClick={() => {
    setShowLearningMaterialsModal(true);
  }}
>
  📚 Add Study Material
</button>
```

**Add Materials List Display (after assessments section):**

```tsx
{/* Learning Materials Section */}
<div className="mt-4">
  <div className="d-flex justify-content-between align-items-center mb-3">
    <h6 className="mb-0">📚 Study Materials</h6>
    {loadingMaterials && <span className="spinner-border spinner-border-sm" />}
  </div>
  
  {learningMaterials.length === 0 ? (
    <div className="alert alert-secondary">
      <small>No study materials added yet. Click "Add Study Material" to upload resources.</small>
    </div>
  ) : (
    <div className="row g-3">
      {learningMaterials.map((material) => (
        <div key={material.id} className="col-md-6">
          <div className="card bg-secondary border-0">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div className="d-flex align-items-center gap-2">
                  <span style={{fontSize: '24px'}}>
                    {material.materialType === 'PDF' && '📄'}
                    {material.materialType === 'Video' && '🎥'}
                    {material.materialType === 'Document' && '📝'}
                    {material.materialType === 'Link' && '🔗'}
                  </span>
                  <div>
                    <h6 className="mb-0 text-light">{material.title}</h6>
                    <small className="text-muted">{material.materialType}</small>
                  </div>
                </div>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDeleteMaterial(material.id)}
                  title="Delete material"
                >
                  ×
                </button>
              </div>
              
              {material.description && (
                <p className="small text-light mb-2">{material.description}</p>
              )}
              
              <div className="d-flex justify-content-between align-items-center">
                <small className="text-muted">
                  {material.fileName && `${(material.fileSize / 1024 / 1024).toFixed(2)} MB`}
                  {material.externalUrl && 'External Link'}
                </small>
                {material.materialType === 'Link' ? (
                  <a
                    href={material.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-primary"
                  >
                    Open Link →
                  </a>
                ) : (
                  <a
                    href={`/api/LearningMaterials/${material.id}/download`}
                    download
                    className="btn btn-sm btn-primary"
                  >
                    Download ↓
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )}
</div>
```

### Component 2: Learner Web Portal Study Materials Page

**Create New File:** `frontend/src/components/LearnerStudyMaterials.tsx`

```tsx
import React, { useState, useEffect } from 'react';

interface LearningMaterial {
  id: number;
  title: string;
  description?: string;
  materialType: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  externalUrl?: string;
  unitStandardName?: string;
  qualificationName?: string;
}

export default function LearnerStudyMaterials() {
  const [materials, setMaterials] = useState<LearningMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      const learnerId = localStorage.getItem('learnerId');
      const response = await fetch(`/api/LearningMaterials/learner/${learnerId}/materials`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setMaterials(data);
    } catch (error) {
      console.error('Error loading materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMaterials = materials.filter(m =>
    m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'PDF': return '📄';
      case 'Video': return '🎥';
      case 'Link': return '🔗';
      case 'Document': return '📝';
      default: return '📚';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" />
        <p className="mt-3">Loading study materials...</p>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="row mb-4">
        <div className="col-md-8">
          <h2 className="mb-2">📚 Study Materials</h2>
          <p className="text-muted">Learning resources to help you prepare for assessments</p>
        </div>
        <div className="col-md-4">
          <input
            type="text"
            className="form-control"
            placeholder="🔍 Search materials..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredMaterials.length === 0 ? (
        <div className="alert alert-info">
          <h5>No study materials available yet</h5>
          <p className="mb-0">Your training manager will upload learning resources soon.</p>
        </div>
      ) : (
        <div className="row g-4">
          {filteredMaterials.map((material) => (
            <div key={material.id} className="col-md-6 col-lg-4">
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  <div className="d-flex align-items-start mb-3">
                    <span style={{fontSize: '36px', marginRight: '12px'}}>
                      {getMaterialIcon(material.materialType)}
                    </span>
                    <div className="flex-grow-1">
                      <h5 className="card-title mb-1">{material.title}</h5>
                      <span className="badge bg-primary">{material.materialType}</span>
                    </div>
                  </div>

                  {material.description && (
                    <p className="card-text text-muted small">{material.description}</p>
                  )}

                  <div className="mb-3">
                    {material.qualificationName && (
                      <div className="small text-muted mb-1">
                        <strong>Qualification:</strong> {material.qualificationName}
                      </div>
                    )}
                    {material.unitStandardName && (
                      <div className="small text-muted">
                        <strong>Unit Standard:</strong> {material.unitStandardName}
                      </div>
                    )}
                  </div>

                  {material.fileSize && (
                    <div className="small text-muted mb-3">
                      📦 Size: {formatFileSize(material.fileSize)}
                    </div>
                  )}

                  {material.materialType === 'Link' ? (
                    <a
                      href={material.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary w-100"
                    >
                      Open Link →
                    </a>
                  ) : (
                    <a
                      href={`/api/LearningMaterials/${material.id}/download`}
                      className="btn btn-primary w-100"
                      download
                    >
                      Download ↓
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Add Route to Learner Portal:**
In your learner portal routing, add:
```tsx
<Route path="/learner/study-materials" element={<LearnerStudyMaterials />} />
```

## Testing Steps

### 1. Test Backend API
```bash
# Upload a material
curl -X POST http://localhost:5000/api/LearningMaterials/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "UnitStandardId=1" \
  -F "Title=Test PDF" \
  -F "Description=Test description" \
  -F "MaterialType=PDF" \
  -F "File=@/path/to/test.pdf"

# Get materials for unit standard
curl http://localhost:5000/api/LearningMaterials/unit-standard/1 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get materials for learner
curl http://localhost:5000/api/LearningMaterials/learner/1/materials \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Test Mobile App
1. Login as learner
2. Tap "Study Materials" on dashboard
3. Verify materials load
4. Test download of PDF
5. Test opening external link

### 3. Test Web UI
1. Login as training manager
2. Navigate to unit standard
3. Click "Add Study Material"
4. Upload a PDF with title/description
5. Verify it appears in materials list
6. Login as learner
7. Navigate to study materials
8. Verify material appears
9. Test download

## Deployment Checklist

- [ ] Run database migration on production
- [ ] Deploy updated backend code
- [ ] Test API endpoints in production
- [ ] Deploy mobile app update
- [ ] Deploy web UI updates
- [ ] Test end-to-end workflow
- [ ] Create user guide/documentation
- [ ] Train training managers on the feature
- [ ] Announce feature to learners

## Support

If you encounter issues:
1. Check backend logs for API errors
2. Check database for LearningMaterials table
3. Verify file permissions on upload directory
4. Check network connectivity on mobile
5. Verify authentication tokens are valid
