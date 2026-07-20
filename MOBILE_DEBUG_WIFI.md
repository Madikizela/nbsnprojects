# Mobile App - WiFi Debugging Started ✅

**Date:** July 15, 2026  
**Phone:** Samsung SM A155F (Android 16)  
**Connection:** WiFi (Wireless ADB)

## Current Status

✅ **Phone Connected**: `adb-RZ8X101VLSE-32cQQN._adb-tls-connect._tcp`  
✅ **Flutter Build**: In progress (Gradle assembleDebug)  
✅ **Backend Running**: http://192.168.0.53:5213  
✅ **Frontend Running**: http://192.168.0.53:5174

## Configuration

### Mobile App API Configuration

The mobile app is configured to connect to your backend via WiFi:

**File:** `mobile_flutter/lib/services/server_config_service.dart`
```dart
static const String defaultServerUrl = 'http://192.168.0.53:5213';
```

### Network Setup

- **Your PC IP**: 192.168.0.53
- **Backend Port**: 5213
- **Phone Connection**: WiFi (same network)
- **ADB Connection**: Wireless debugging enabled

## Build Process

The Flutter app is currently being built with:

```bash
flutter run -d adb-RZ8X101VLSE-32cQQN._adb-tls-connect._tcp --verbose
```

### Build Steps:
1. ✅ Phone detected via wireless ADB
2. 🔄 Gradle build running (assembleDebug)
3. ⏳ APK compilation in progress
4. ⏳ Installation to phone
5. ⏳ App launch and hot reload ready

**Estimated Time**: 3-7 minutes (first build)

## What's Running

| Service | Status | URL/Location |
|---------|--------|--------------|
| PostgreSQL 18 | ✅ Running | localhost:5432 |
| Backend API | ✅ Running | http://192.168.0.53:5213 |
| Frontend Web | ✅ Running | http://192.168.0.53:5174 |
| Flutter Mobile | 🔄 Building | Terminal ID: 7 |

## After Build Completes

Once the build finishes, you'll be able to:

### 1. **Test the App on Your Phone**
   - App will automatically install and launch
   - Backend is accessible via WiFi
   - All features available for testing

### 2. **Hot Reload Changes**
   - Make code changes in VS Code
   - Press `r` in the terminal to hot reload
   - Press `R` for hot restart
   - Changes appear instantly on your phone

### 3. **View Console Logs**
   - All app logs appear in Terminal ID: 7
   - Errors, debug messages, and network calls visible
   - Real-time debugging output

### 4. **Access Features**

The mobile app includes:
- Learner login (username/email + password)
- Admin login (email + password)
- Teacher attendance clocking
- Learner attendance history
- Document scanning and upload
- Assessment submission
- Fingerprint registration
- Profile management

## Troubleshooting

### If Build Fails:

1. **Check WiFi connection**:
   ```bash
   flutter devices
   ```
   Should show: `SM A155F (wireless)`

2. **Reconnect phone**:
   - Phone Settings → Developer Options → Wireless debugging
   - Pair again if needed

3. **Clean build**:
   ```bash
   cd mobile_flutter
   flutter clean
   flutter pub get
   flutter run
   ```

### If App Can't Connect to Backend:

1. **Verify backend is accessible**:
   ```powershell
   curl http://192.168.0.53:5213/api/health
   ```

2. **Check firewall**:
   - Ensure port 5213 is open
   - Windows Firewall may block incoming connections

3. **Test from phone browser**:
   - Open browser on phone
   - Navigate to: `http://192.168.0.53:5213/api/health`
   - Should see: `{"status":"healthy"}`

## Hot Reload Commands

Once the app is running on your phone:

| Key | Action |
|-----|--------|
| `r` | Hot reload (fastest, preserves state) |
| `R` | Hot restart (full restart, resets state) |
| `h` | Show help and available commands |
| `d` | Detach (app keeps running) |
| `q` | Quit (stops app) |

## Monitoring

### View Build Progress:
```powershell
# Get latest logs from Flutter build
Get-Process -Name "dart" | Out-String
```

### Check Backend Logs:
- Terminal ID: 6 (Backend .NET)
- Watch for API calls from mobile app
- See authentication attempts and errors

### Check Frontend Logs:
- Terminal ID: 3 (Frontend Vite)
- Web app continues running alongside mobile

## Testing Checklist

Once the app launches:

- [ ] Open app on phone
- [ ] See login screen
- [ ] Test learner login: `username` / `password`
- [ ] Test admin login: `admin@system.local` / `Admin@123!System`
- [ ] Navigate to attendance screen
- [ ] Test document scanning
- [ ] Check profile page
- [ ] Test network connectivity indicators

## Network Configuration

Your phone and PC must be on the same WiFi network:

- **Network**: Same WiFi (192.168.0.x subnet)
- **PC IP**: 192.168.0.53
- **Phone**: Connected via WiFi
- **Firewall**: Port 5213 must be accessible

## Next Steps

1. ✅ Wait for build to complete (~5 minutes)
2. ✅ App will auto-install on phone
3. ✅ App will auto-launch
4. ✅ Start testing features
5. ✅ Make changes and hot reload as needed

---

**Build Status**: 🔄 In Progress  
**Terminal**: ID 7  
**Action**: Wait for "Flutter run key commands" message
