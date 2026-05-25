# Stop Old React Native App and Run Flutter App

## Problem
The old React Native app is still running on your phone (showing sync attempts to `https://rlms.rlms.co.za/mobile`). We need to stop it and run the Flutter app with the latest document upload fixes.

## Steps to Fix

### 1. Stop the Old React Native App on Your Phone
On your Samsung phone:
1. Open the **Expo Go** app
2. Shake the phone to open the developer menu
3. Tap **"Stop Remote Debugging"** or **"Disconnect"**
4. Close the Expo Go app completely (swipe it away from recent apps)
5. OR simply uninstall Expo Go if you won't need it anymore

### 2. Verify Flutter App is Built with Latest Code
```powershell
# Navigate to Flutter project
cd mobile_flutter

# Clean previous builds
flutter clean

# Get dependencies
flutter pub get

# Build and install on connected device
flutter run
```

### 3. What to Expect
When the Flutter app starts:
- You'll see the login screen
- Login with: `admin@system.local` / `Admin@123`
- Navigate: Projects → Sites → Classes → Learners
- Click "Scan Documents" on any learner
- Scan or pick a document
- Select document type from the dialog
- The "Upload" button should be enabled when you select a type
- Click Upload

### 4. If Upload Still Fails
Check the error message on the phone screen. Common issues:
- **401 Unauthorized**: Token expired, logout and login again
- **404 Not Found**: Backend endpoint issue (unlikely, we tested it)
- **Network Error**: Check that backend is running on `http://192.168.0.62:5213`

## Latest Fixes Applied
✅ Document types match backend exactly
✅ Upload endpoint is `/api/LearnerDocuments/upload`
✅ Dialog state management fixed (Upload button enables when type selected)
✅ Backend has encryption at rest (AES-256)
✅ Backend tested and responding correctly

## Quick Test Command
To verify backend is ready:
```powershell
curl http://192.168.0.62:5213/api/LearnerDocuments/types
```
Should return: `["Bank Confirmation Letter","CV","ID Document","Proof of Residence","Qualifications"]`
