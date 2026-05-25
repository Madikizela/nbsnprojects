# Setup Expo Account & Build Document Scanner

## Step 1: Create/Login to Expo Account

### Option A: Create New Account
1. Go to: https://expo.dev/signup
2. Sign up with email: `nkwenkwezi68@gmail.com` (or any email)
3. Verify your email
4. Remember your password!

### Option B: Reset Password (if you have account)
1. Go to: https://expo.dev/forgot-password
2. Enter: `nkwenkwezi68@gmail.com`
3. Check email for reset link
4. Set new password

## Step 2: Login via Terminal

Open PowerShell and run:

```powershell
cd C:\Users\madik\Documents\New_version\mobile
npx eas login
```

Enter your email and password when prompted.

## Step 3: Configure Project

```powershell
npx eas build:configure
```

Press Enter to accept defaults.

## Step 4: Build the APK

```powershell
npx eas build --profile development --platform android
```

This will:
- Upload your code
- Build in the cloud (15-20 minutes)
- Give you a download link

You can check build status at: https://expo.dev/accounts/[your-username]/projects/nbsn-mobile/builds

## Step 5: Install APK on Phone

When build completes:
1. Click the download link (or scan QR code)
2. Download APK on your phone
3. Install it (allow "Install from unknown sources")
4. Open the app

## Step 6: Start Dev Server

```powershell
cd C:\Users\madik\Documents\New_version\mobile
npx expo start --dev-client
```

Scan the QR code with your phone to connect.

## Step 7: Test Document Scanner

1. Login: `admin@system.local` / `Admin@123`
2. Navigate to a learner
3. Tap "📄 Scan Documents"
4. Tap "📄 Scan Document"
5. Point at a document
6. Watch automatic edge detection!

## Troubleshooting

### Can't Login?
- Make sure you verified your email
- Try resetting password at https://expo.dev/forgot-password
- Or create a new account with different email

### Build Failed?
- Check internet connection
- Make sure you're logged in: `npx eas whoami`
- Try again: `npx eas build --profile development --platform android`

### Need Help?
- Expo docs: https://docs.expo.dev/build/setup/
- Support: https://expo.dev/support

## What You're Building

A custom APK with:
- ✅ Automatic edge detection
- ✅ Auto-capture when document is stable
- ✅ Perspective correction
- ✅ Image enhancement
- ✅ Manual crop adjustment

Just like CamScanner!

## Current Status

✅ EAS CLI installed
✅ Code ready for document scanner
✅ Configuration files created
⏳ Waiting for Expo login
⏳ Then build the APK

## Next Steps

1. Create/login to Expo account
2. Run: `npx eas login`
3. Run: `npx eas build:configure`
4. Run: `npx eas build --profile development --platform android`
5. Wait 15-20 minutes
6. Install APK on phone
7. Test document scanner!
