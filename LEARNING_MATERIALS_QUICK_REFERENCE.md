# Learning Materials - Quick Reference Card

## 🚀 Quick Deploy

```bash
# 1. Database
psql -U postgres -d nbsn_db -f backend/create_learning_materials_table.sql

# 2. Backend
cd backend
dotnet build
dotnet run

# 3. Mobile
cd mobile_flutter
flutter pub get
flutter run
```

## 📱 Mobile App Usage

**For Learners:**
1. Login → Dashboard
2. Tap "📚 Study Materials"
3. Browse and download

**Features:**
- Download PDFs, videos, documents
- Open YouTube/external links
- Progress indicators
- Offline access after download

## 🖥️ Web UI (To Implement)

**Location:** `frontend/src/components/SDPManagerDashboard.tsx`

**Add These:**
```typescript
// 1. State (line ~200)
const [showLearningMaterialsModal, setShowLearningMaterialsModal] = useState(false);
const [learningMaterialForm, setLearningMaterialForm] = useState({...});
const [learningMaterials, setLearningMaterials] = useState([]);

// 2. Handler (line ~3500)
const handleUploadLearningMaterial = async (e) => {
  const formData = new FormData();
  formData.append('UnitStandardId', selectedUnitStandardId);
  formData.append('Title', learningMaterialForm.title);
  formData.append('MaterialType', learningMaterialForm.materialType);
  if (materialType === 'Link') {
    formData.append('ExternalUrl', learningMaterialForm.externalUrl);
  } else {
    formData.append('File', learningMaterialForm.file);
  }
  await fetchWithAuth('/api/LearningMaterials/upload', {
    method: 'POST',
    body: formData
  });
};

// 3. Button (in unit standard view)
<button onClick={() => setShowLearningMaterialsModal(true)}>
  📚 Add Study Material
</button>

// 4. Modal (line ~11000, after summative modal)
{showLearningMaterialsModal && <div className="modal">...</div>}
```

**Full code in:** `LEARNING_MATERIALS_WEB_UI_TODO.md`

## 🔌 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/LearningMaterials/unit-standard/{id}` | Get by unit standard |
| GET | `/api/LearningMaterials/learner/{id}/materials` | Get for learner |
| POST | `/api/LearningMaterials/upload` | Upload material |
| GET | `/api/LearningMaterials/{id}/download` | Download file |
| PUT | `/api/LearningMaterials/{id}` | Update metadata |
| DELETE | `/api/LearningMaterials/{id}` | Delete (soft) |

## 📊 Material Types

| Type | Icon | Accepts | Use Case |
|------|------|---------|----------|
| PDF | 📄 | .pdf | Study guides, manuals |
| Video | 🎥 | .mp4, .webm | Tutorial videos |
| Document | 📝 | .doc, .ppt | Worksheets, slides |
| Link | 🔗 | URLs | YouTube, websites |

## 🧪 Quick Test

```bash
# Upload test material
curl -X POST http://localhost:5000/api/LearningMaterials/upload \
  -H "Authorization: Bearer TOKEN" \
  -F "UnitStandardId=1" \
  -F "Title=Test Guide" \
  -F "MaterialType=PDF" \
  -F "File=@test.pdf"

# Get materials
curl http://localhost:5000/api/LearningMaterials/unit-standard/1 \
  -H "Authorization: Bearer TOKEN"
```

## 📁 Files Created

### Backend
- ✅ `backend/create_learning_materials_table.sql`
- ✅ `backend/Models/LearningMaterial.cs`
- ✅ `backend/Controllers/LearningMaterialsController.cs`
- ✅ `backend/Models/ApplicationDbContext.cs` (updated)

### Mobile
- ✅ `mobile_flutter/lib/screens/learner_study_materials_screen.dart`
- ✅ `mobile_flutter/lib/services/api_service.dart` (updated)
- ✅ `mobile_flutter/lib/main.dart` (updated)
- ✅ `mobile_flutter/lib/screens/learner_dashboard_screen.dart` (updated)

### Docs
- ✅ `LEARNING_MATERIALS_FEATURE.md`
- ✅ `LEARNING_MATERIALS_WEB_UI_TODO.md`
- ✅ `LEARNING_MATERIALS_IMPLEMENTATION_COMPLETE.md`
- ✅ `LEARNING_MATERIALS_QUICK_REFERENCE.md` (this file)
- ✅ `deploy_learning_materials.ps1`

## 🎯 Status

| Component | Status | Time |
|-----------|--------|------|
| Database | ✅ Complete | Ready |
| Backend | ✅ Complete | Ready |
| Mobile | ✅ Complete | Ready |
| Web Upload | ⏳ Pending | 2-3 hours |
| Web Learner | ⏳ Pending | 1 hour |
| Testing | ⏳ Pending | 1 hour |

## 🔐 Security

- ✅ AES-256 encryption
- ✅ Unique IV per file
- ✅ SHA256 hash verification
- ✅ 100 MB size limit
- ✅ MIME type validation
- ✅ Authentication required
- ✅ Project-based access control

## 💡 Key Features

**Training Managers:**
- Upload PDFs, videos, documents
- Add YouTube/external links
- Set display order
- Edit/delete materials
- Preview before publishing

**Learners:**
- Browse by qualification
- Download for offline
- Progress indicators
- Search materials
- View in-app (web)

## 📞 Support

**Issues?**
1. Check backend logs
2. Verify database table exists
3. Check file permissions
4. Test API with Postman
5. Check mobile network

**Web UI Help:**
- Full code: `LEARNING_MATERIALS_WEB_UI_TODO.md`
- Copy-paste ready components
- Step-by-step guide

## 🎉 Ready to Deploy!

1. Run: `.\deploy_learning_materials.ps1`
2. Test mobile app
3. Implement web UI (code provided)
4. Deploy to production

**Estimated Total Time: 3-5 hours**

---

**Need Help?**
- Feature overview: `LEARNING_MATERIALS_FEATURE.md`
- Implementation status: `LEARNING_MATERIALS_IMPLEMENTATION_COMPLETE.md`
- Web UI guide: `LEARNING_MATERIALS_WEB_UI_TODO.md`
