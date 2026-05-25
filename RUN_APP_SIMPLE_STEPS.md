# 🚀 Simple Steps to Run Mobile App on Emulator

## ✅ Configuration Done!

Your app is already configured to work with Android emulator:
- API URL set to `http://10.0.2.2:5213` (emulator localhost)
- Backend running on port 5213
- Ready to launch!

## 📱 Step-by-Step Instructions

### STEP 1: Start Android Emulator

**Option A: Using Android Studio (Recommended)**
1. Open **Android Studio**
2. Click **Tools** → **AVD Manager** (or click device icon in toolbar)
3. Find your emulator (flutter_emulator or any other)
4. Click the **▶ Play** button
5. Wait for Android home screen to appear (30-60 seconds)

**Option B: Using Command Line**
```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
& "$env:ANDROID_HOME\emulator\emulator.exe" -avd flutter_emulator
```

### STEP 2: Launch the App

Once emulator is running, open a new terminal and run:

```bash
cd mobile
npx expo start --android
```

This will:
- Start Metro bundler
- Build the app
- Install on emulator
- Launch automatically

### STEP 3: Login

When app opens:
```
Email: admin@system.local
Password: Admin@123
```

## 🎯 What You'll See

1. **Terminal**: Metro bundler starts, shows build progress
2. **Emulator**: App installs and launches
3. **App**: NBSN login screen with blue background
4. **After login**: Projects list

## ⚡ Quick Commands

```bash
# Start app on emulator
cd mobile
npx expo start --android

# Reload app (in terminal where expo is running)
Press 'r'

# Clear cache and restart
npx expo start --android --clear

# View Android logs
npx react-native log-android
```

## 🐛 Troubleshooting

### "No Android device found"
- Make sure emulator is fully booted (see Android home screen)
- Check devices: `adb devices` (should show emulator)
- Restart emulator from Android Studio

### Emulator crashes or won't start
**Fix graphics settings:**
1. Android Studio → AVD Manager
2. Click ✏️ (Edit) on your emulator
3. Show Advanced Settings
4. Graphics: Change to "Software - GLES 2.0"
5. Click Finish
6. Start emulator again

### App builds but crashes
```bash
cd mobile
npx expo start --android --clear
```

### "Could not connect to backend"
- Backend should be running: `cd backend && dotnet run`
- API URL is already set to `http://10.0.2.2:5213` (correct for emulator)

## 💡 Pro Tips

- **Keep emulator running** - Don't close it between tests
- **Fast reload** - Press `r` in terminal instead of rebuilding
- **Dev menu** - Press Ctrl+M in emulator or shake (Ctrl+Shift+Z)
- **Debug** - Shake emulator → "Debug" → Opens Chrome DevTools

## 🎮 Emulator Shortcuts

- **Back**: Esc
- **Home**: Home key  
- **Menu**: Ctrl+M
- **Rotate**: Ctrl+Left/Right Arrow
- **Volume**: Ctrl+Up/Down

## ✅ Current Setup

- ✅ Backend: Running on `localhost:5213`
- ✅ Mobile API: Configured for emulator (`10.0.2.2:5213`)
- ✅ Emulator: `flutter_emulator` available
- ✅ Expo: Ready to launch

## 🚀 Ready!

Just:
1. Start emulator from Android Studio
2. Run: `cd mobile && npx expo start --android`
3. Login and test!

No network issues, no firewall problems - it just works! 🎉
