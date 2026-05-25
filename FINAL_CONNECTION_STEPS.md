# 🎯 Final Steps to Connect Your Mobile App

## Current Status
- ✅ Backend running on: `http://192.168.23.166:5213`
- ✅ Expo Metro running on: `exp://192.168.23.166:8081`
- ✅ Mobile app code: Ready
- ⚠️ Issue: Windows Firewall blocking connection

## 🔥 STEP 1: Add Firewall Rules (REQUIRED)

### Option A: Use the Batch File (Easiest)
1. Find the file `add_firewall_rules.bat` in your project folder
2. **Right-click** on it
3. Select **"Run as administrator"**
4. Click **"Yes"** when prompted
5. Wait for "SUCCESS!" message

### Option B: Manual PowerShell Commands
1. **Right-click** Start menu
2. Select **"Windows PowerShell (Admin)"** or **"Terminal (Admin)"**
3. Click **"Yes"** when prompted
4. Paste these commands one by one:

```powershell
netsh advfirewall firewall add rule name="Expo Metro Bundler" dir=in action=allow protocol=TCP localport=8081

netsh advfirewall firewall add rule name="Expo Dev Tools" dir=in action=allow protocol=TCP localport=19000-19001

netsh advfirewall firewall add rule name="Backend API Server" dir=in action=allow protocol=TCP localport=5213
```

## 🔥 STEP 2: Test Connection from Phone

Before using Expo Go, test if your phone can reach your computer:

1. Open **Chrome** or **Safari** on your phone
2. Go to: `http://192.168.23.166:8081`
3. You should see the **Expo Metro Bundler** page

**If you see the page:** ✅ Connection works! Go to Step 3
**If you can't connect:** ⚠️ See troubleshooting below

## 🔥 STEP 3: Connect with Expo Go

### Method 1: Scan QR Code
1. Open **Expo Go** app on your phone
2. Tap **"Scan QR code"**
3. Point camera at the QR code in your terminal
4. Wait for app to load

### Method 2: Manual URL
1. Open **Expo Go** app
2. Tap **"Enter URL manually"**
3. Type: `exp://192.168.23.166:8081`
4. Tap **"Connect"**

## 🔥 STEP 4: Login

Once the app loads:
- Email: `admin@system.local`
- Password: `Admin@123`

## 🐛 Troubleshooting

### Still Getting "Something Went Wrong"?

#### 1. Check if both devices are on same WiFi
- Phone WiFi: Settings → WiFi → Check network name
- Computer WiFi: Click WiFi icon → Check network name
- Must be EXACTLY the same network

#### 2. Disable Windows Firewall temporarily (for testing)
- Windows Security → Firewall & network protection
- Turn off "Private network" firewall
- Try connecting
- Turn back on after testing
- If it works, the firewall was the issue

#### 3. Check antivirus software
- Some antivirus programs block local connections
- Temporarily disable and test
- Add exception for ports 8081, 19000-19001, 5213

#### 4. Restart everything
```bash
# Stop Expo (Ctrl+C in terminal)
# Stop Backend (Ctrl+C in terminal)

# Start Backend
cd backend
dotnet run

# Start Expo (in new terminal)
cd mobile
npx expo start --clear
```

#### 5. View error details
- In Expo Go error screen
- Tap "View error log" at bottom
- Take screenshot and check what it says

### Alternative: Use Phone Hotspot

If nothing works, use your phone as WiFi hotspot:

1. Enable hotspot on phone
2. Connect computer to phone's hotspot
3. Run: `ipconfig | findstr IPv4`
4. Update `mobile/src/config/api.ts` with new IP
5. Restart servers
6. Scan QR code

This bypasses all firewall/network issues!

## 📊 Connection Checklist

- [ ] Firewall rules added (Step 1)
- [ ] Can access `http://192.168.23.166:8081` in phone browser
- [ ] Both devices on same WiFi network
- [ ] Backend is running (check terminal)
- [ ] Expo is running (check terminal with QR code)
- [ ] Expo Go app installed on phone
- [ ] Scanned QR code or entered URL manually

## 🎉 Success Indicators

You'll know it's working when:
1. Expo Go shows "Opening project..."
2. Loading bar appears
3. NBSN login screen appears with blue background
4. You can login and see projects list

## 💡 Pro Tips

- Keep firewall rules - you only need to add them once
- Use `npx expo start --clear` if you get weird errors
- Shake phone to open developer menu
- Press `r` in terminal to reload app
- Check terminal for error messages

## 🆘 Still Need Help?

If you're still stuck:
1. Take screenshot of Expo Go error
2. Check terminal for error messages
3. Verify IP address: `ipconfig | findstr IPv4`
4. Make sure both devices are on same network

The most common issue is Windows Firewall - make sure you run the firewall commands as administrator!
