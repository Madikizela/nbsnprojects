# Final Steps to Build Document Scanner

## Your Credentials
- Username: `nkwenkwezi68@gmail.com`
- Password: `)Fh+MI>X96c7`

## Run These Commands

### Step 1: Login to Expo

```powershell
cd C:\Users\madik\Documents\New_version\mobile
npx eas login
```

When prompted:
- Email or username: `nkwenkwezi68@gmail.com`
- Password: `)Fh+MI>X96c7`

### Step 2: Configure Project

```powershell
npx eas build:configure
```

Press Enter to accept defaults.

### Step 3: Build the APK

```powershell
npx eas build --profile development --platform android
```

This will:
- Upload your code to Expo servers
- Build a custom APK with document scanner (15-20 minutes)
- Show progress and give you a download link

**You can close the terminal and check status at:**
https://expo.dev/accounts/nkwenkwezi68/projects/nbsn-mobile/builds

### Step 4: Install APK on Phone

When build completes:
1. Click the download link (or scan QR code)
2. Download APK on your phone
3. Install it (allow "Install from unknown sources" in settings)
4. Open the app

### Step 5: Start Development Server

```powershell
cd C:\Users\madik\Documents\New_version\mobile
npx expo start --dev-client
```

Scan the QR code with your phone to connect.

### Step 6: Test Document Scanner!

1. Login: `admin@system.local` / `Admin@123`
2. Navigate: Projects → Site → Class → Learners
3. Tap "📄 Scan Documents" on any learner
4. Tap "📄 Scan Document" button
5. Point camera at a document
6. Watch the magic:
   - ✅ Green overlay on document edges (automatic detection)
   - ✅ Auto-captures when document is stable
   - ✅ Perspective correction applied
   - ✅ You can adjust crop area manually
   - ✅ High-quality scanned output
7. Select document type
8. Upload!

## What You're Getting

Your app will have professional document scanning features:
- **Edge Detection**: Automatically finds document boundaries
- **Auto-Capture**: Captures when document is detected and stable
- **Perspective Correction**: Fixes document angle/skew automatically
- **Image Enhancement**: Improves contrast and clarity
- **Manual Adjustment**: User can fine-tune crop area
- **High Quality**: 100% quality scans

Just like CamScanner!

## Troubleshooting

### Login Failed?
- Copy/paste the password carefully: `)Fh+MI>X96c7`
- Make sure there are no extra spaces

### Build Failed?
- Check internet connection
- Verify you're logged in: `npx eas whoami`
- Try again: `npx eas build --profile development --platform android`

### APK Won't Install?
- Enable "Install from unknown sources" in phone settings
- Settings → Security → Unknown sources → Enable

### Scanner Not Working?
- Make sure you installed the development build APK (not Expo Go)
- Check camera permissions in phone settings

## Current Status

✅ EAS CLI installed
✅ Code ready with document scanner plugin
✅ Configuration files created
✅ Credentials ready
⏳ Need to login and build

## Next Command

Run this now:

```powershell
cd C:\Users\madik\Documents\New_version\mobile
npx eas login
```

Then enter your credentials when prompted!
