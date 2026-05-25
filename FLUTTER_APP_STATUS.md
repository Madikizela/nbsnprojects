# Flutter Mobile App - Current Status

## ✅ FIXED: Login Issue

### Root Cause
Your computer's IP address changed to `192.168.4.166`, causing the Flutter app to timeout when trying to reach the backend.

### Changes Made

1. **Updated API Service** (`mobile_flutter/lib/services/api_service.dart`)
   - New backend URL: `http://192.168.4.166:5213`

2. **Fixed Auth Service** (`mobile_flutter/lib/services/auth_service.dart`)
   - Properly parse lowercase `token` and `user` fields from backend response
   - Added null checking and type casting
   - Enhanced debug logging

3. **Verified Backend**
   - Backend is running and accessible on network ✅
   - Test script confirms both localhost and network IP work ✅

## 🚀 How to Run the App

### Quick Start
Double-click: `run_flutter_app.bat`

### Manual Start
```bash
cd mobile_flutter
flutter run --release
```

### If App is Already Running
Press `R` (capital R) in the terminal for hot restart

## 🔐 Login Credentials
- Email: `admin@system.local`
- Password: `Admin@123`

## 📱 Current Features

### ✅ Implemented
- Login screen with full form
- Authentication service with JWT token
- Document scanner screen (with cunning_document_scanner)
- Navigation routing (go_router)
- API client (Dio)
- Placeholder screens for:
  - Projects
  - Sites
  - Classes
  - Learners
  - Add Learner

### 🔄 Next Steps
1. **Test Login** - Verify credentials work
2. **Test Document Scanner** - Try scanning a document
3. **Implement Data Screens**:
   - Projects list (fetch from `/api/SDPProjects` or `/api/Projects`)
   - Sites list (fetch from `/api/ProjectSites/project/{projectId}`)
   - Classes list (fetch from `/api/SiteClasses/site/{siteId}`)
   - Learners list (fetch from `/api/Learners/class/{classId}`)
4. **Build Add Learner Form** - Full form matching web version
5. **Integrate Futronic SDK** - Fingerprint biometric clocking

## 🛠️ Troubleshooting

### Login Fails with Timeout
1. Check your IP: `ipconfig`
2. Update `mobile_flutter/lib/services/api_service.dart` line 5 with new IP
3. Hot restart the app (press `R`)

### Login Fails with "Invalid Credentials"
1. Verify backend is running: `node test_network_access.js`
2. Check credentials are correct
3. Review backend logs for errors

### Phone Can't Connect
1. Ensure phone and computer are on same WiFi
2. Run firewall script as Administrator: `.\update_firewall_5213.ps1`
3. Test backend: `node test_network_access.js`

### Build Errors
1. Clean build: `flutter clean`
2. Get dependencies: `flutter pub get`
3. Rebuild: `flutter run --release`

## 📂 Project Structure

```
mobile_flutter/
├── lib/
│   ├── main.dart                          # App entry point, routing
│   ├── services/
│   │   ├── api_service.dart              # HTTP client (Dio)
│   │   └── auth_service.dart             # Authentication logic
│   └── screens/
│       ├── login_screen.dart             # ✅ Full login form
│       ├── scan_document_screen.dart     # ✅ Document scanner
│       ├── projects_screen.dart          # 🔄 Placeholder
│       ├── sites_screen.dart             # 🔄 Placeholder
│       ├── classes_screen.dart           # 🔄 Placeholder
│       ├── learners_screen.dart          # 🔄 Placeholder
│       └── add_learner_screen.dart       # 🔄 Placeholder
├── android/                               # Android configuration
└── pubspec.yaml                          # Dependencies

Key Dependencies:
- cunning_document_scanner: Auto-capture document scanning
- dio: HTTP client
- go_router: Navigation
- provider: State management
- shared_preferences: Local storage
- pdf & printing: PDF generation
```

## 🔧 Configuration Files

### Backend Configuration
- URL: `http://192.168.0.62:5213`
- Port: `5213`
- Status: Running ✅

### Device Configuration
- Model: Samsung A155F
- Android: 16 (API 36)
- Device ID: RZ8X101VLSE

### Network Configuration
- Computer IP: `192.168.0.62`
- Backend listening on: `0.0.0.0:5213` (all interfaces)
- Firewall: Port 5213 open

## 📝 Helper Scripts

- `run_flutter_app.bat` - Launch Flutter app
- `test_network_access.js` - Test backend connectivity
- `update_firewall_5213.ps1` - Update firewall rules (run as Admin)

## 🎯 Why Flutter?

Switched from React Native to Flutter because:
1. **Better Document Scanning**: `cunning_document_scanner` has auto-capture and edge detection
2. **Native Performance**: Better for hardware-intensive features
3. **Easier SDK Integration**: Platform channels for Futronic fingerprint SDK
4. **Built-in PDF Support**: Native PDF generation

## 📞 Support

If you encounter issues:
1. Check `FLUTTER_LOGIN_FIX.md` for detailed troubleshooting
2. Run `node test_network_access.js` to verify backend
3. Check Flutter logs for error messages
4. Verify IP address hasn't changed: `ipconfig`
