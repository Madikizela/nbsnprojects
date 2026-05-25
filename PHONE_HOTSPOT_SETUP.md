# 📱 Phone Hotspot Method (100% Works!)

This method bypasses ALL network and firewall issues by connecting your computer directly to your phone.

## Step 1: Enable Hotspot on Your Phone

### Android:
1. Go to **Settings**
2. Tap **Network & Internet** (or **Connections**)
3. Tap **Hotspot & tethering**
4. Enable **Wi-Fi hotspot**
5. Note the **Network name** and **Password**

### iOS:
1. Go to **Settings**
2. Tap **Personal Hotspot**
3. Enable **Allow Others to Join**
4. Note the **Wi-Fi Password**

## Step 2: Connect Computer to Phone Hotspot

1. On your computer, click WiFi icon
2. Find your phone's hotspot name
3. Connect using the password
4. Wait for connection to establish

## Step 3: Get Your New IP Address

Run this command:
```powershell
ipconfig | findstr IPv4
```

Look for the WiFi adapter - it will show a new IP (probably 192.168.x.x or 172.x.x.x)

Example output:
```
IPv4 Address. . . . . . . . . . . : 192.168.43.1
```

## Step 4: Update Mobile App Configuration

Edit the file: `mobile/src/config/api.ts`

Change the IP address to your NEW computer IP:
```typescript
export const API_BASE_URL = 'http://YOUR_NEW_IP:5213';
```

Example:
```typescript
export const API_BASE_URL = 'http://192.168.43.1:5213';
```

## Step 5: Restart Everything

### Stop current servers:
In the terminals, press `Ctrl+C` to stop both backend and mobile app

### Start backend:
```bash
cd backend
dotnet run
```

### Start mobile app:
```bash
cd mobile
npm start
```

## Step 6: Connect with Expo Go

1. Open **Expo Go** app on your phone
2. Scan the **new QR code** from terminal
3. App should load successfully!

## Why This Works

- Your phone and computer are on the SAME network (your phone's hotspot)
- No firewall issues (direct connection)
- No router blocking device-to-device communication
- Guaranteed to work!

## After Testing

Once you confirm the app works with hotspot:
- You can switch back to regular WiFi
- But you'll need to fix the firewall on regular WiFi
- Or just use hotspot when developing

## Troubleshooting

### "Can't find hotspot"
- Make sure hotspot is enabled on phone
- Check if computer WiFi is turned on
- Try restarting phone hotspot

### "Connected but no internet"
- This is normal - you don't need internet
- The app only needs to reach your computer
- Internet is only needed for initial Expo Go download

### "Still getting error"
- Make sure you updated the IP in `mobile/src/config/api.ts`
- Restart both backend and mobile app
- Clear Expo cache: `npm start -- --clear`
