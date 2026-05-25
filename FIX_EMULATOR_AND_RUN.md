# 🔧 Fix Emulator Graphics Issue

## Problem
Your `flutter_emulator` crashed due to Vulkan graphics compatibility issues with your Intel Iris Xe Graphics.

## ✅ Solution: Fix Graphics Settings

### Option 1: Fix Existing Emulator (Recommended)

1. **Open Android Studio**

2. **Go to AVD Manager**
   - Click **Tools** → **AVD Manager**
   - Or click the device icon in the toolbar

3. **Edit the Emulator**
   - Find `flutter_emulator`
   - Click the **✏️ (Edit)** icon on the right

4. **Change Graphics Settings**
   - Click **"Show Advanced Settings"** at the bottom
   - Scroll down to **"Emulated Performance"** section
   - Find **"Graphics"** dropdown
   - Change from "Automatic" or "Hardware" to **"Software - GLES 2.0"**

5. **Save**
   - Click **"Finish"**

6. **Start Emulator**
   - Click the **▶ Play** button
   - Wait for Android home screen

7. **Launch App**
   ```bash
   cd mobile
   npx expo start --android
   ```

### Option 2: Create New Emulator

If editing doesn't work, create a fresh one:

1. **Open Android Studio** → **Tools** → **AVD Manager**

2. **Click "Create Virtual Device"**

3. **Select Device**
   - Choose **Pixel 5** or **Pixel 4**
   - Click **Next**

4. **Select System Image**
   - Click **"x86 Images"** tab
   - Select **API Level 33** (Android 13) or **API Level 30** (Android 11)
   - Click **Download** if needed
   - Click **Next**

5. **Configure AVD**
   - Name: `nbsn_emulator`
   - **IMPORTANT**: Click **"Show Advanced Settings"**
   - Graphics: Select **"Software - GLES 2.0"**
   - RAM: 2048 MB (or 4096 if you have enough)
   - Click **Finish**

6. **Start New Emulator**
   - Click **▶ Play** button on `nbsn_emulator`

7. **Launch App**
   ```bash
   cd mobile
   npx expo start --android
   ```

## 🎯 Why This Works

- **Software rendering** bypasses Vulkan/OpenGL hardware issues
- More compatible with various graphics cards
- Slightly slower but much more stable
- Perfect for development

## 🚀 After Fixing

Once emulator starts successfully:

1. **You'll see Android home screen**
2. **Run the app:**
   ```bash
   cd mobile
   npx expo start --android
   ```
3. **App will install and launch automatically**
4. **Login with:**
   - Email: `admin@system.local`
   - Password: `Admin@123`

## 💡 Alternative: Use Physical Device

If emulator keeps crashing, you can use your physical phone:

1. **Enable USB Debugging on phone:**
   - Settings → About Phone → Tap "Build Number" 7 times
   - Settings → Developer Options → Enable "USB Debugging"

2. **Connect phone via USB**

3. **Update API config:**
   Edit `mobile/src/config/api.ts`:
   ```typescript
   export const API_BASE_URL = 'http://192.168.23.166:5213';
   ```

4. **Run app:**
   ```bash
   cd mobile
   npx expo start --android
   ```

5. **Add firewall rules** (run as admin):
   ```powershell
   netsh advfirewall firewall add rule name="Expo Metro" dir=in action=allow protocol=TCP localport=8081
   netsh advfirewall firewall add rule name="Backend API" dir=in action=allow protocol=TCP localport=5213
   ```

## 📋 Quick Checklist

- [ ] Open Android Studio → AVD Manager
- [ ] Edit flutter_emulator → Show Advanced Settings
- [ ] Graphics: Change to "Software - GLES 2.0"
- [ ] Save and start emulator
- [ ] Wait for Android home screen
- [ ] Run: `cd mobile && npx expo start --android`
- [ ] Login and test!

## 🆘 Still Having Issues?

If emulator still won't start:
- Try creating a new emulator with API 30 (older, more stable)
- Use physical device with USB debugging
- Check Android Studio → Help → About → Copy system info and check for errors

The graphics setting change should fix it - Software rendering is more compatible!
