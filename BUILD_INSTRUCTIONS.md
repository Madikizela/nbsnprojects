# Build Instructions for Teacher Dashboard

## Current Location Issue
You're currently in: `C:\Users\madik\Documents\New_version\mobile_flutter`
The build script is in: `C:\Users\madik\Documents\New_version\`

## Option 1: Navigate to Root and Run Script
```powershell
cd ..
.\build_and_install_flutter.ps1
```

## Option 2: Run Script from Current Location
```powershell
..\build_and_install_flutter.ps1
```

## Option 3: Manual Build (Recommended if script fails)
```powershell
# You're already in mobile_flutter directory, so just run:
flutter clean
flutter pub get
flutter build apk --release
flutter install
```

## Quick Build Commands (From mobile_flutter directory)
```powershell
# Clean and build
flutter clean; flutter pub get; flutter build apk --release

# Install on connected device
flutter install

# Or install APK manually
adb install build/app/outputs/flutter-apk/app-release.apk
```

## Check Connected Device
```powershell
flutter devices
```

Should show: `RZ8X101VLSE`

## Build Output Location
After successful build, APK will be at:
```
mobile_flutter/build/app/outputs/flutter-apk/app-release.apk
```

## Common Issues

### Issue: "flutter not recognized"
**Solution**: Make sure Flutter is in your PATH

### Issue: "No devices found"
**Solution**: 
1. Connect your phone via USB
2. Enable USB debugging on phone
3. Run `adb devices` to verify connection

### Issue: Build fails
**Solution**:
1. Run `flutter doctor` to check setup
2. Run `flutter clean` then try again
3. Check error messages for specific issues

## Testing the Teacher Dashboard

### Test User
You'll need a teacher account. If you don't have one:
1. Login as SDP Manager on web or mobile
2. Navigate to a class
3. Click the teacher icon (👨‍🏫)
4. Create a new teacher account
5. Check the teacher's email for login credentials

### Expected Behavior
1. Teacher logs in with email/password
2. Redirected to Teacher Dashboard (NOT projects screen)
3. See summary card with classes count
4. See list of assigned classes
5. Tap class to expand and view learners
6. Tap learner to view details
7. Logout button works

## Quick Test
```powershell
# From mobile_flutter directory
flutter run --release
```

This will build and run directly on connected device.
