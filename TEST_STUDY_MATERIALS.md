# Test Study Materials Feature

## ✅ Changes Made

### 1. Backend API
- ✅ Learning materials endpoint implemented: `GET /api/LearningMaterials/learner/{id}/materials`
- ✅ Returns materials grouped by qualification for the learner's enrolled project
- ✅ Download endpoint working: `GET /api/LearningMaterials/{id}/download`
- ✅ All database relationships verified

### 2. Frontend Web Portal
- ✅ Added "Study Materials" navigation item
- ✅ Added "📚 Study Materials" dashboard card
- ✅ Implemented `LearnerMaterials` component with:
  - Material listing with icons and metadata
  - Download functionality
  - Empty state handling
  - Loading states
- ✅ **FIXED API URL** from `localhost` to `192.168.0.53` for network access

### 3. Mobile Flutter App
- ✅ Screen already exists: `learner_study_materials_screen.dart`
- ✅ Route configured: `/learner/study-materials`
- ✅ Dashboard tile present
- ✅ Download progress indicator implemented
- ✅ API service configured with authentication

---

## 🧪 Testing Instructions

### Test Credentials
**Email:** nbsnprojects@gmail.com  
**Password:** Learner123!  
**Learner ID:** 4  
**Expected Materials:** 1 (Plumbing study guide - 3.17 MB PDF)

---

## 📱 Test Web Portal

### Prerequisites
- Frontend running on: http://192.168.0.53:5174
- Backend running on: http://192.168.0.53:5213

### Steps
1. Open browser and navigate to: **http://192.168.0.53:5174/learner**

2. Login with credentials:
   - Email: `nbsnprojects@gmail.com`
   - Password: `Learner123!`

3. On the dashboard, look for the **"📚 Study Materials"** card (purple/violet color)

4. Click on the card OR click **"Study Materials"** in the top navigation

5. **Expected Result:**
   - Should show 1 material: "Plumbing study guide"
   - Material should display:
     - Title: Plumbing study guide
     - Type: LearningMaterial
     - Qualification: 🎓 Plumber
     - File: 📕 Plumbing_Study_Guide.pdf
     - Size: 📦 3.17 MB
     - Download button

6. Click the **"⬇️ Download"** button

7. **Expected Result:**
   - PDF file should download (3.17 MB)
   - File name: `Plumbing_Study_Guide.pdf`

### Troubleshooting Web Portal

If materials don't show:

1. **Check Browser Console (F12)**
   - Look for network errors
   - Look for JavaScript errors
   - Check if API requests are being made to `http://192.168.0.53:5213`

2. **Check Network Tab**
   - Look for request to `/api/LearningMaterials/learner/4/materials`
   - Verify response status is 200
   - Check response body contains the material data

3. **Check Authentication**
   - Verify token is present in request headers
   - Look for `Authorization: Bearer ...` header

4. **Common Issues:**
   - **Empty screen:** Check if loading state is stuck
   - **"No materials" message:** API might be returning empty array
   - **Network error:** Check if backend is running on port 5213
   - **401 Unauthorized:** Token might be expired, try logging out and back in

---

## 📱 Test Mobile App

### Prerequisites
- Mobile app deployed to device/emulator
- Device connected to same WiFi network as backend
- Backend running on: http://192.168.0.53:5213

### Steps
1. **Open the NBSN mobile app**

2. **Login as learner:**
   - Email: `nbsnprojects@gmail.com`
   - Password: `Learner123!`

3. On the **Learner Dashboard**, look for the **"📚 Study Materials"** tile

4. **Tap on "Study Materials"**

5. **Expected Result:**
   - Should show 1 material: "Plumbing study guide"
   - Material card should display:
     - Icon: 📄 (colored icon based on material type)
     - Title: Plumbing study guide
     - Type badge: LearningMaterial
     - Qualification: 🎓 Plumber
     - File size: 📦 3.17 MB
     - Download icon

6. **Tap on the material card** to download

7. **Expected Result:**
   - Progress bar should appear
   - Shows "Downloading... X%" message
   - Download completes
   - Shows "✅ Download complete" message

8. **Pull down to refresh** to test refresh functionality

### Troubleshooting Mobile App

If materials don't show:

1. **Check API Configuration**
   - Open app settings
   - Verify server URL is set to `http://192.168.0.53:5213`
   - If using emulator, might need `http://10.0.2.2:5213` (Android) or localhost (iOS)

2. **Check Authentication**
   - Try logging out and back in
   - Verify token is being saved in SharedPreferences
   - Check app logs for authentication errors

3. **Check Network Connectivity**
   - Verify device is on same WiFi network
   - Try accessing `http://192.168.0.53:5213/api/health` in mobile browser
   - Check if firewall is blocking the connection

4. **Common Issues:**
   - **"No study materials available yet":** API might be returning empty array
   - **"Failed to load materials":** Network error or authentication issue
   - **Stuck on loading:** Timeout or network issue
   - **Download fails:** File encryption/decryption issue or storage permission

5. **Debug Commands:**
   ```bash
   # Check Flutter logs
   flutter logs
   
   # Check if device can reach backend
   adb shell ping 192.168.0.53
   ```

---

## 🔍 API Testing (Verification)

If you need to verify the API independently:

### PowerShell
```powershell
# Login
$login = @{Login='nbsnprojects@gmail.com'; Password='Learner123!'} | ConvertTo-Json
$response = Invoke-RestMethod -Uri 'http://192.168.0.53:5213/api/Auth/learner-login' -Method POST -Body $login -ContentType 'application/json'

# Get materials
$headers = @{Authorization="Bearer $($response.token)"}
$materials = Invoke-RestMethod -Uri 'http://192.168.0.53:5213/api/LearningMaterials/learner/4/materials' -Headers $headers

# Display
$materials | ConvertTo-Json -Depth 5
```

### cURL (Git Bash / Linux / Mac)
```bash
# Login
TOKEN=$(curl -s -X POST http://192.168.0.53:5213/api/Auth/learner-login \
  -H "Content-Type: application/json" \
  -d '{"Login":"nbsnprojects@gmail.com","Password":"Learner123!"}' \
  | jq -r '.token')

# Get materials
curl -H "Authorization: Bearer $TOKEN" \
  http://192.168.0.53:5213/api/LearningMaterials/learner/4/materials | jq
```

---

## 📊 Expected API Response

```json
[
  {
    "id": 1,
    "title": "Plumbing study guide",
    "description": null,
    "materialType": "LearningMaterial",
    "fileName": "Plumbing_Study_Guide.pdf",
    "fileSize": 3322015,
    "mimeType": "application/pdf",
    "externalUrl": null,
    "unitStandardName": null,
    "qualificationName": "Plumber"
  }
]
```

---

## ✅ Checklist

### Web Portal
- [ ] Login successful
- [ ] Dashboard shows "📚 Study Materials" card
- [ ] Navigation includes "Study Materials" button
- [ ] Clicking card/button shows materials page
- [ ] 1 material is displayed with correct details
- [ ] Download button works
- [ ] PDF downloads successfully

### Mobile App  
- [ ] Login successful
- [ ] Dashboard shows "📚 Study Materials" tile
- [ ] Tapping tile navigates to materials screen
- [ ] 1 material is displayed with correct details
- [ ] Tapping material initiates download
- [ ] Progress bar shows during download
- [ ] Download completes successfully
- [ ] Pull-to-refresh works

### API
- [ ] Login endpoint returns valid token
- [ ] Materials endpoint returns 1 material
- [ ] Material has correct qualification name
- [ ] Download endpoint returns PDF file

---

## 🐛 Known Issues

None currently. If you encounter any issues:

1. **Check logs** (browser console / mobile logs / backend logs)
2. **Verify services are running** (backend port 5213, frontend port 5174)
3. **Check network connectivity** (same WiFi, firewall rules)
4. **Try refreshing** (logout and login again)

---

## 📝 Test Results

### Web Portal
Date tested: ___________  
Tester: ___________  
Result: ☐ Pass  ☐ Fail  
Notes:

### Mobile App
Date tested: ___________  
Tester: ___________  
Device: ___________  
Result: ☐ Pass  ☐ Fail  
Notes:

---

## 🎯 Summary

The Study Materials feature is **fully implemented and tested at the API level**. The backend is confirmed working and returning correct data. The frontend and mobile apps have been configured to consume this API. 

**Next step:** Test the actual UI on web and mobile to ensure proper display and user interaction.
