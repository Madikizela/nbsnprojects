# Build CamScanner-Style Document Scanner App

## What You're Getting

After this setup, your app will have:
- ✅ **Automatic Edge Detection** - Green overlay on document boundaries
- ✅ **Auto-Capture** - Captures when document is detected and stable
- ✅ **Perspective Correction** - Automatically fixes document angle
- ✅ **Image Enhancement** - Improves contrast and clarity
- ✅ **Manual Crop Adjustment** - User can fine-tune the crop area
- ✅ **High Quality Scans** - Professional document quality

## Step-by-Step Setup

### Step 1: Install EAS CLI (5 minutes)

Open PowerShell and run:

```powershell
powershell -ExecutionPolicy Bypass -Command "npm install -g eas-cli"
```

Wait for installation to complete.

### Step 2: Login to Expo (2 minutes)

```powershell
cd C:\Users\madik\Documents\New_version\mobile
npx eas login
```

If you don't have an Expo account:
1. Go to https://expo.dev/signup
2. Create a free account
3. Come back and run `npx eas login` again
4. Enter your credentials

### Step 3: Configure Project (1 minute)

```powershell
npx eas build:configure
```

This will:
- Create `eas.json` (already created for you)
- Link your project to Expo

### Step 4: Build Development APK (15-20 minutes)

```powershell
npx eas build --profile development --platform android
```

What happens:
1. Uploads your code to Expo servers
2. Builds a custom APK with native document scanner
3. Shows progress in terminal
4. Gives you a download link when done

**Note**: This runs in the cloud, so you can close the terminal and check status at https://expo.dev

### Step 5: Install APK on Phone (2 minutes)

When build completes:
1. You'll get a download link in terminal
2. Open link on your phone's browser
3. Download the APK
4. Install it (you may need to allow "Install from unknown sources")
5. Open the app

### Step 6: Start Development Server

```powershell
npx expo start --dev-client
```

Your phone will connect to this server (just like Expo Go did).

## Testing the Document Scanner

1. Login with: `admin@system.local` / `Admin@123`
2. Navigate: Projects → Site → Class → Learners
3. Tap "📄 Scan Documents" on any learner
4. Tap "📄 Scan Document" button
5. Point camera at a document
6. Watch the magic:
   - Green overlay appears on document edges
   - Auto-captures when stable
   - Shows cropped, corrected image
   - You can adjust crop if needed
7. Select document type
8. Upload!

## Troubleshooting

### Build Failed?
- Check your internet connection
- Make sure you're logged in: `npx eas whoami`
- Try again: `npx eas build --profile development --platform android`

### APK Won't Install?
- Enable "Install from unknown sources" in phone settings
- Make sure you have enough storage space

### Scanner Shows Error?
- Make sure you installed the development build APK (not Expo Go)
- Check camera permissions in phone settings

### Can't Connect to Dev Server?
- Make sure phone and computer are on same network
- Backend should be running on `http://192.168.205.166:5213`
- Run: `npx expo start --dev-client`

## Cost

- **Free tier**: 30 builds per month
- **More than enough** for development
- No credit card required

## After First Build

You only need to rebuild when:
- Adding new native modules
- Updating Expo SDK version
- Changing native configuration

For regular code changes (like UI updates), just:
1. Save your files
2. App reloads automatically (like Expo Go)

## Current Status

✅ Code updated to use document scanner plugin
✅ EAS configuration created
✅ Package.json has the scanner library
⏳ Waiting for you to build the APK

## Next Command

Run this to start the build:

```powershell
cd C:\Users\madik\Documents\New_version\mobile
npx eas build --profile development --platform android
```

Then wait 15-20 minutes for the build to complete!
