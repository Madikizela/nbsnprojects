# Expo Development Build for Document Scanner

## Why You Need This

The `react-native-document-scanner-plugin` requires native modules that aren't available in Expo Go. You need to create a custom development build.

## What You Get

- **Edge Detection**: Automatic document boundary detection
- **Auto Capture**: Captures when document is detected
- **Perspective Correction**: Fixes document angle/skew
- **Image Enhancement**: Improves contrast and clarity
- **Manual Adjustment**: User can adjust crop area

## Setup Steps

### 1. Install EAS CLI
```powershell
powershell -ExecutionPolicy Bypass -Command "npm install -g eas-cli"
```

### 2. Login to Expo
```powershell
cd C:\Users\madik\Documents\New_version\mobile
npx eas login
```

### 3. Configure EAS Build
```powershell
npx eas build:configure
```

### 4. Create Development Build for Android
```powershell
# This creates a custom APK with native modules
npx eas build --profile development --platform android
```

This will:
- Build a custom APK with the document scanner plugin
- Take 10-20 minutes (builds in the cloud)
- Give you a download link when complete

### 5. Install on Your Phone
- Download the APK from the link
- Install it on your phone
- Run the app (it will connect to your dev server like Expo Go)

### 6. Start Development Server
```powershell
npx expo start --dev-client
```

## Cost
- Free tier: 30 builds/month
- Enough for development

## Alternative: Local Build (Free, No Limits)

If you have Android Studio installed:

```powershell
# Install Android SDK and tools first
npx expo run:android
```

This builds locally on your machine (no cloud, no limits).

## After Setup

The document scanner will work with:
- Automatic edge detection (green overlay on document)
- Auto-capture when document is stable
- Perspective correction
- Image enhancement filters
- Manual crop adjustment

## Current Status

Your app is configured with `react-native-document-scanner-plugin` in package.json.
The code in `ScanDocumentScreen.tsx` is ready.

You just need to create the development build to enable the native features.
