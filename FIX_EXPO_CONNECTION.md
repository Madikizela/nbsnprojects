# 🔧 Fix "Something Went Wrong" Error in Expo Go

## The Problem

You're getting "Something went wrong" in Expo Go because your phone can't connect to the Metro bundler on your computer. This is almost always a network/firewall issue.

## ✅ SOLUTION 1: Phone Hotspot (EASIEST & GUARANTEED TO WORK)

This is the fastest way to get it working:

### 1. Enable Phone Hotspot
- Android: Settings → Network & Internet → Hotspot & tethering → Enable
- iOS: Settings → Personal Hotspot → Enable

### 2. Connect Computer to Phone Hotspot
- Click WiFi on computer
- Connect to your phone's hotspot

### 3. Get New IP Address
```powershell
ipconfig | findstr IPv4
```
Note the new IP (e.g., 192.168.43.1)

### 4. Update API Config
Edit `mobile/src/config/api.ts`:
```typescript
export const API_BASE_URL = 'http://192.168.43.1:5213'; // Use your new IP
```

### 5. Restart Servers
Stop both servers (Ctrl+C), then:
```bash
# Terminal 1
cd backend
dotnet run

# Terminal 2  
cd mobile
npm start
```

### 6. Scan QR Code Again
Open Expo Go and scan the new QR code. It will work!

---

## ✅ SOLUTION 2: Fix Windows Firewall

If you want to use your regular WiFi:

### 1. Run PowerShell as Administrator
Right-click Start → Windows PowerShell (Admin)

### 2. Add Firewall Rules
```powershell
netsh advfirewall firewall add rule name="Expo Metro" dir=in action=allow protocol=TCP localport=8081
netsh advfirewall firewall add rule name="Expo Dev" dir=in action=allow protocol=TCP localport=19000-19001
netsh advfirewall firewall add rule name="Backend API" dir=in action=allow protocol=TCP localport=5213
```

### 3. Restart Expo
```bash
cd mobile
npm start -- --clear
```

### 4. Try Connecting Again
Scan QR code in Expo Go

---

## ✅ SOLUTION 3: Clear Expo Cache

Sometimes cached data causes issues:

```bash
cd mobile
npm start -- --clear
```

Then scan QR code again.

---

## ✅ SOLUTION 4: Check Network Connection

### Test 1: Can phone reach computer?
Open phone browser, go to:
```
http://192.168.23.166:8081
```

If you see "Unable to connect" → Network/firewall issue (use Solution 1 or 2)

### Test 2: Are both on same WiFi?
- Check phone WiFi settings
- Check computer WiFi settings
- Must be SAME network name
- NOT guest network

---

## 🎯 Recommended Approach

1. **Try Solution 1 (Phone Hotspot)** - Takes 2 minutes, guaranteed to work
2. If you need regular WiFi, then fix firewall with Solution 2
3. For future development, keep using hotspot or fixed firewall

---

## 📱 After It Works

Once connected, you'll see:
1. Login screen with NBSN logo
2. Login with: `admin@system.local` / `Admin@123`
3. Projects list
4. Full app functionality

---

## 🐛 Still Not Working?

### Check Metro Bundler Logs
Look at the terminal where `npm start` is running. Any errors there?

### Try Reloading
In Expo Go, shake phone → tap "Reload"

### Check Expo Go Version
Make sure you have latest Expo Go from app store

### View Error Log
In Expo Go error screen, tap "View error log" at bottom

---

## 💡 Why Phone Hotspot Works Best

- Direct connection between phone and computer
- No router blocking communication
- No firewall issues
- No network configuration needed
- Works 100% of the time

Try the phone hotspot method first - it's the fastest way to get your app running!
