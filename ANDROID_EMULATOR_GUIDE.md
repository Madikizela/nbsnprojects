# 📱 Running Mobile App on Android Emulator

## ✅ Setup Complete!

Your mobile app is now configured to run on Android emulator with:
- API URL: `http://10.0.2.2:5213` (special emulator IP for localhost)
- Emulator: `flutter_emulator`

## 🚀 Quick Start

### Option 1: Automatic (Easiest)
Double-click `run_on_emulator.bat` - it will:
1. Start the Android emulator
2. Wait for it to boot
3. Launch the app automatically

### Option 2: Manual Steps

#### Step 1: Start Emulator
```bash
# Set Android SDK path
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"

# Start emulator
& "$env:ANDROID_HOME\emulator\emulator.exe" -avd flutter_emulator
```

Or open Android Studio → Tools → AVD Manager → Click Play button

#### Step 2: Wait for Emulator to Boot
- Wait until you see the Android home screen
- Usually takes 30-60 seconds

#### Step 3: Launch App
```bash
cd mobile
npx expo start --android
```

This will:
- Start Metro bundler
- Build the app
- Install it on the emulator
- Launch automatically

## 🎯 What to Expect

1. **Emulator window opens** - Android device simulation
2. **Metro bundler starts** - Shows build progress
3. **App installs** - "Installing app..." message
4. **App launches** - NBSN login screen appears

## 🔐 Login Credentials

Once the app loads:
```
Email: admin@system.local
Password: Admin@123
```

## 🐛 Troubleshooting

### Emulator won't start
**Check if emulator exists:**
```bash
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
& "$env:ANDROID_HOME\emulator\emulator.exe" -list-avds
```

**Create new emulator:**
1. Open Android Studio
2. Tools → AVD Manager
3. Create Virtual Device
4. Select Pixel 5 or similar
5. Download system image (API 33 recommended)
6. Finish setup

### "Could not connect to development server"
**The API URL is already configured correctly for emulator!**
- Emulators use `10.0.2.2` to access host machine
- This is already set in `mobile/src/config/api.ts`

**Make sure backend is running:**
```bash
cd backend
dotnet run
```

### App builds but crashes
**Clear cache and rebuild:**
```bash
cd mobile
npx expo start --android --clear
```

### "SDK location not found"
**Set Android SDK path:**
```bash
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
```

Or set it permanently in System Environment Variables

### Emulator is slow
**Enable hardware acceleration:**
1. Open Android Studio
2. Tools → AVD Manager
3. Edit your emulator
4. Graphics: Hardware - GLES 2.0

**Or use a lighter emulator:**
- Create new AVD with lower resolution
- Use API 30 instead of 33
- Reduce RAM allocation

## 💡 Pro Tips

### Speed up development
- Keep emulator running (don't close it)
- Use `r` in terminal to reload app
- Shake emulator (Ctrl+Shift+Z) for dev menu

### Test camera features
- Emulator has virtual camera
- Can use webcam or virtual scene
- Settings → Extended controls → Camera

### Debug issues
- View logs: `npx react-native log-android`
- Chrome DevTools: Shake → Debug
- Check Metro bundler terminal for errors

## 🎮 Emulator Controls

- **Rotate**: Ctrl+Left/Right Arrow
- **Back button**: Esc
- **Home button**: Home key
- **Menu**: Ctrl+M or Ctrl+Shift+Z
- **Volume**: Ctrl+Up/Down
- **Power**: Power key

## 📊 Performance

Emulator advantages:
- No network issues
- No firewall problems
- Easy debugging
- Fast reload
- Virtual camera for testing

## 🔄 Switching Between Emulator and Physical Device

### For Emulator:
```typescript
// mobile/src/config/api.ts
export const API_BASE_URL = 'http://10.0.2.2:5213';
```

### For Physical Device:
```typescript
// mobile/src/config/api.ts
export const API_BASE_URL = 'http://192.168.23.166:5213';
```

Then restart Expo.

## ✅ Current Configuration

- ✅ API URL: `http://10.0.2.2:5213` (emulator-ready)
- ✅ Backend: Running on port 5213
- ✅ Emulator: `flutter_emulator` available
- ✅ Expo: Ready to launch

## 🚀 Ready to Go!

Just run:
```bash
cd mobile
npx expo start --android
```

Or double-click `run_on_emulator.bat`

The app will launch on your emulator automatically!
