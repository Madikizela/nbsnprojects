# 📱 Mobile App Connection Troubleshooting

## Current Setup
- Computer IP: `192.168.31.166`
- Expo Server: `exp://192.168.31.166:8081`
- Backend API: `http://192.168.31.166:5213`

## ✅ Quick Fixes (Try These First)

### 1. Use Tunnel Mode (RECOMMENDED - Works Around Firewall)

Stop the current server and restart with tunnel mode:

```bash
cd mobile
npm start -- --tunnel
```

This will give you a different URL like `exp://abc-123.tunnel.exp.direct:80` that works through Expo's servers and bypasses local network issues.

**Advantages:**
- Works even if phone and computer are on different networks
- Bypasses firewall issues
- More reliable connection

### 2. Check Same WiFi Network

**On your phone:**
- Go to Settings → WiFi
- Make sure you're connected to the SAME WiFi network as your computer
- Note: Guest networks often block device-to-device communication

**On your computer:**
- Your WiFi IP is: `192.168.31.166`
- Make sure you're not using VPN

### 3. Allow Firewall Access

Windows Firewall might be blocking the connection. Run this command:

```powershell
# Allow Node.js through firewall
netsh advfirewall firewall add rule name="Expo Metro" dir=in action=allow protocol=TCP localport=8081
netsh advfirewall firewall add rule name="Expo Metro" dir=in action=allow protocol=TCP localport=19000-19001
```

### 4. Try LAN Mode

In the terminal where Expo is running, press:
- `Shift + M` → Select "LAN" connection type

## 🔧 Alternative Connection Methods

### Method 1: Use Tunnel (Easiest)
1. Stop current server (Ctrl+C in terminal)
2. Run: `npm start -- --tunnel`
3. Scan the new QR code or use the tunnel URL

### Method 2: Use Localhost Tunnel (ngrok)
If you have ngrok installed:
```bash
ngrok http 8081
```
Then use the ngrok URL in Expo Go

### Method 3: Use Android Emulator (No Network Issues)
If you have Android Studio installed:
```bash
npm run android
```

## 🐛 Common Issues & Solutions

### "Could not connect to development server"

**Solution 1: Restart Metro Bundler**
1. In terminal, press `R` to reload
2. Or stop (Ctrl+C) and restart: `npm start`

**Solution 2: Clear Cache**
```bash
npm start -- --clear
```

**Solution 3: Check if port 8081 is available**
```powershell
netstat -ano | findstr :8081
```
If something is using it, kill that process or use a different port:
```bash
npm start -- --port 8082
```

### "Network response timed out"

This means your phone can't reach your computer. Try:

1. **Disable Windows Firewall temporarily** (for testing):
   - Windows Security → Firewall & network protection
   - Turn off for Private network
   - Try connecting
   - Turn back on after testing

2. **Use tunnel mode** (see above)

3. **Check antivirus software** - it might be blocking connections

### "Unable to resolve host"

The IP address might be wrong. Get your correct IP:

```powershell
ipconfig | findstr IPv4
```

Look for the WiFi adapter IP (should be 192.168.x.x)

## 📋 Step-by-Step Connection Guide

### Using Tunnel Mode (Recommended)

1. **Stop current server:**
   - Go to terminal running Expo
   - Press `Ctrl+C`

2. **Start with tunnel:**
   ```bash
   cd mobile
   npm start -- --tunnel
   ```

3. **Wait for tunnel URL:**
   - It will show: "Tunnel ready" with a URL
   - Scan the new QR code

4. **Connect from phone:**
   - Open Expo Go
   - Scan QR code
   - Wait for app to load (first time takes longer with tunnel)

### Using Manual URL Entry

1. **In Expo Go app:**
   - Tap "Enter URL manually"

2. **Try these URLs in order:**
   - `exp://192.168.23.166:8081` (current)
   - `exp://192.168.23.166:19000` (alternative port)
   - Or use the tunnel URL if you started with `--tunnel`

3. **Tap "Connect"**

## 🔍 Verify Connection

### Check if Expo server is accessible from phone

1. **Open browser on your phone**
2. **Go to:** `http://192.168.23.166:8081`
3. **You should see:** Expo Metro Bundler page

If you can't access this page, it's a network/firewall issue.

## 💡 Best Solution for Your Situation

Since manual connection isn't working, I recommend:

1. **Use Tunnel Mode** - This is the most reliable:
   ```bash
   npm start -- --tunnel
   ```

2. **Or check Windows Firewall:**
   - Temporarily disable it to test
   - If it works, add firewall rules (see above)

3. **Make sure both devices are on same WiFi:**
   - Not guest network
   - Not using VPN
   - Same network name

## 🎯 Quick Test

Run this to test if your phone can reach your computer:

1. **On your phone's browser, visit:**
   ```
   http://192.168.23.166:5213/api/projects
   ```

2. **Expected result:**
   - Should show "Unauthorized" or JSON response
   - This means network is working

3. **If you get "Can't reach this page":**
   - Network/firewall issue
   - Use tunnel mode instead

## 📞 Need More Help?

If none of these work, provide:
- Error message you see in Expo Go
- Whether you can access `http://192.168.23.166:8081` in phone browser
- Your phone's OS (Android/iOS) and version
