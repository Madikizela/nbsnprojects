# Mobile Debug Setup - Network Configuration

## Your Network Configuration

### Your PC IP Address: **192.168.0.68**
- Network: Wi-Fi
- This is your local network IP that your mobile device will use to connect

## Changes Made

### Updated Mobile App API Configuration

**File: `mobile_flutter/lib/services/server_config_service.dart`**

Changed default server URL from:
```dart
'http://192.168.148.166:5213'
```

To:
```dart
'http://192.168.0.68:5213'
```

Also updated the old subnet detection to reset both old IP ranges:
- `192.168.4.*` (old subnet)
- `192.168.148.*` (old subnet)

## System Status

### ✅ Running Services:
1. **Frontend**: http://localhost:5174 (also accessible at http://192.168.0.68:5174)
2. **Backend**: http://localhost:5213 (also accessible at http://192.168.0.68:5213)
3. **PostgreSQL**: Running on port 5432

### 🌐 Browser Access:
- Local: http://localhost:5174
- Network: http://192.168.0.68:5174
- Browser should already be open

## Mobile Debugging Instructions

### Prerequisites:
1. ✅ Your PC and mobile device must be on the **same Wi-Fi network**
2. ✅ Backend is running on port 5213
3. ✅ Frontend is running on port 5174

### Step 1: Connect Your Mobile Device
Ensure your phone/tablet is connected to the same Wi-Fi network as your PC.

### Step 2: Run the Flutter App

**For Android:**
```bash
cd mobile_flutter
flutter run
```

**For iOS (Mac only):**
```bash
cd mobile_flutter
flutter run
```

**For Android Emulator:**
```bash
cd mobile_flutter
flutter run
```
Note: Emulator uses `10.0.2.2` to access host machine, but physical device needs `192.168.0.68`

### Step 3: Configure Server URL (If Needed)

The app should automatically use `http://192.168.0.68:5213`, but if you need to change it:

1. Open the app
2. Go to **Settings** screen
3. Update **Server URL** to: `http://192.168.0.68:5213`
4. Save and restart the app

### Step 4: Test Connection

Once the app launches:
1. Try logging in
2. If you get connection errors, check:
   - Both devices are on same Wi-Fi
   - PC firewall allows port 5213
   - Backend is running

## Firewall Configuration

If the mobile app can't connect, you may need to allow the ports through Windows Firewall:

### Allow Backend Port:
```powershell
netsh advfirewall firewall add rule name="NBSN Backend" dir=in action=allow protocol=TCP localport=5213
```

### Allow Frontend Port (for mobile web access):
```powershell
netsh advfirewall firewall add rule name="NBSN Frontend" dir=in action=allow protocol=TCP localport=5174
```

## Testing URLs

### From Mobile Device Browser:
- Frontend: http://192.168.0.68:5174
- Backend API Test: http://192.168.0.68:5213/api/

### From Mobile App:
- The app will automatically use: http://192.168.0.68:5213
- All API calls will go to this address

## Troubleshooting

### Problem: "Cannot reach server"
**Solutions:**
1. Verify PC IP hasn't changed: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. Check both devices are on same Wi-Fi network
3. Ping PC from mobile to verify connection
4. Check Windows Firewall settings
5. Restart backend service

### Problem: "Connection Timeout"
**Solutions:**
1. Backend might not be running - check terminal
2. Port 5213 might be blocked by firewall
3. Network might have AP isolation enabled (corporate networks)

### Problem: Old IP Address Being Used
**Solution:**
The app now automatically resets old IP addresses. If still having issues:
1. Uninstall and reinstall the app
2. Or manually clear app data (Android Settings > Apps > NBSN > Storage > Clear Data)

## IP Address Changes

**When your PC IP changes** (after router restart, network switch, etc.):

1. Check new IP:
   ```powershell
   ipconfig
   ```
   Look for "IPv4 Address" under your active network adapter

2. Update the config file:
   ```dart
   // mobile_flutter/lib/services/server_config_service.dart
   static const String defaultServerUrl = 'http://YOUR_NEW_IP:5213';
   ```

3. Rebuild the Flutter app

## Current Configuration Summary

| Service | Local URL | Network URL (Mobile) |
|---------|-----------|---------------------|
| Frontend | http://localhost:5174 | http://192.168.0.68:5174 |
| Backend API | http://localhost:5213 | http://192.168.0.68:5213 |
| PostgreSQL | localhost:5432 | Not accessible from mobile |

## Mobile App Features Ready to Test

- ✅ Login/Authentication
- ✅ Profile Photo Upload
- ✅ Face Registration
- ✅ Fingerprint Registration
- ✅ Document Scanning & Upload
- ✅ Attendance Clocking
- ✅ Learner Portal Access
- ✅ Assessments
- ✅ Document Management

## Next Steps

1. ✅ Browser is already open at http://localhost:5174
2. Connect your mobile device to the same Wi-Fi
3. Run Flutter app: `flutter run` from mobile_flutter directory
4. Test mobile app functionality
5. Check both mobile and web interfaces work correctly

## Notes

- The backend serves static files (profile photos, documents) at `/uploads`
- Mobile app will automatically download and display profile photos
- All network requests go through the same IP (192.168.0.68)
- Ensure firewall allows incoming connections on ports 5213 and 5174
