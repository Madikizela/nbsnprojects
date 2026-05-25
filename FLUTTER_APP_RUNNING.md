# Flutter Mobile App - Running Status

## Current Status
✅ Backend is running on `http://192.168.0.62:5213`
🔄 Flutter app is building and will launch on Samsung A155F

## What's Happening
The Flutter app is currently building via Gradle. This process can take 2-5 minutes depending on:
- Whether it's a clean build or incremental
- Your computer's performance
- Network speed (if downloading dependencies)

## What to Expect

### When Build Completes:
1. You'll see: `✓ Built build\app\outputs\flutter-apk\app-debug.apk`
2. App will install on your phone
3. App will launch automatically
4. You'll see the login screen

### Login Credentials:
- Email: `admin@system.local`
- Password: `Admin@123`

## New Features Available

### 1. Document Upload
- Navigate: Projects → Sites → Classes → Learners
- Tap "Scan Documents" on any learner
- Scan or pick a document
- Select document type
- Upload successfully

### 2. Learner Detail & Edit
- Navigate: Projects → Sites → Classes → Learners
- **Tap any learner card** to view details
- Tap Edit icon (top right) to edit
- All fields are editable
- Save changes

### 3. Profile Photo Capture
- On learner detail screen, tap Edit icon
- Tap the profile photo circle
- Choose Camera or Gallery
- Photo uploads automatically
- Photo displays immediately

## Backend Features
- ✅ Profile photo upload endpoint
- ✅ Profile photo retrieval endpoint
- ✅ Document encryption at rest (AES-256)
- ✅ CORS configured for mobile app
- ✅ All learner fields editable

## Monitoring the Build

To check build progress, the terminal will show:
- `Running Gradle task 'assembleDebug'...` (current stage)
- Progress spinner while building
- `✓ Built build\app\outputs\flutter-apk\app-debug.apk` (when done)
- `Installing...` (installing on phone)
- `Syncing files to device...` (transferring files)
- Flutter DevTools information (when running)

## If Build Takes Too Long (>10 minutes)

1. Check your internet connection
2. Check if phone is still connected: `flutter devices`
3. Try stopping and restarting:
   - Stop the current build
   - Run: `flutter clean`
   - Run: `flutter pub get`
   - Run: `flutter run`

## Hot Reload Available
Once the app is running, you can make code changes and:
- Press `r` in the terminal for hot reload
- Press `R` for hot restart
- Changes apply instantly without full rebuild

## Troubleshooting

### Phone Disconnected
- Check USB cable
- Check USB debugging is enabled
- Run: `flutter devices` to verify connection

### Build Errors
- Check the terminal output for specific errors
- Common issues: Missing dependencies, SDK version mismatch
- Solution: `flutter clean` then `flutter pub get`

### App Crashes on Launch
- Check backend is running on port 5213
- Check phone can reach `http://192.168.0.62:5213`
- Check firewall rules allow port 5213

## Next Steps After Launch
1. Test login
2. Navigate through Projects → Sites → Classes → Learners
3. Test tapping a learner to view details
4. Test editing learner information
5. Test capturing profile photo
6. Test document scanning and upload

## Process IDs
- Backend: Terminal 8 (dotnet run)
- Flutter: Terminal 10 (flutter run)

Both processes are running in the background and can be monitored or stopped as needed.
