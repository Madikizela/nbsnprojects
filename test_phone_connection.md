# 📱 Test Phone Connection

## Step 1: Test if Phone Can Reach Computer

Open your phone's web browser (Chrome, Safari, etc.) and try these URLs:

### Test 1: Backend API
```
http://192.168.23.166:5213/api/projects
```
**Expected:** Should show "Unauthorized" or JSON response
**If fails:** Network/firewall issue

### Test 2: Expo Metro Bundler
```
http://192.168.23.166:8081
```
**Expected:** Should show Expo Metro Bundler page
**If fails:** Firewall blocking port 8081

## Step 2: Fix Firewall (If Tests Failed)

Run this PowerShell command as Administrator:

```powershell
# Run the firewall fix script
powershell -ExecutionPolicy Bypass -File fix_firewall.ps1
```

Or manually add rules:
```powershell
netsh advfirewall firewall add rule name="Expo Metro" dir=in action=allow protocol=TCP localport=8081
netsh advfirewall firewall add rule name="Backend API" dir=in action=allow protocol=TCP localport=5213
```

## Step 3: Connect with Expo Go

### Option A: Scan QR Code
1. Open Expo Go app
2. Tap "Scan QR code"
3. Scan the QR code in your terminal

### Option B: Manual URL
1. Open Expo Go app
2. Tap "Enter URL manually"
3. Type: `exp://192.168.23.166:8081`
4. Tap "Connect"

## Step 4: If Still Not Working

### Quick Fix: Use Your Phone as Hotspot

1. **On your phone:**
   - Enable Mobile Hotspot
   - Note the WiFi name and password

2. **On your computer:**
   - Connect to your phone's hotspot
   - Get new IP: `ipconfig` (look for new WiFi IP)

3. **Update mobile app config:**
   - Edit `mobile/src/config/api.ts`
   - Change IP to your new computer IP

4. **Restart Expo:**
   - Stop current server (Ctrl+C)
   - Run: `npm start`
   - Scan new QR code

This bypasses all network/firewall issues!

## Common Issues

### "Could not connect to Metro"
- Firewall is blocking → Run fix_firewall.ps1
- Wrong network → Check both on same WiFi
- VPN active → Disable VPN

### "Network request failed"
- Backend not running → Check terminal with `dotnet run`
- Wrong IP in config → Verify IP matches

### "Timeout"
- Antivirus blocking → Temporarily disable
- Router blocking → Use phone hotspot method

## Current Configuration

- Computer IP: `192.168.23.166`
- Expo Server: `exp://192.168.23.166:8081`
- Backend API: `http://192.168.23.166:5213`
- Login: `admin@system.local` / `Admin@123`
