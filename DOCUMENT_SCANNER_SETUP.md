# Professional Document Scanner Setup

## What Changed

Updated `ScanDocumentScreen.tsx` to use `react-native-document-scanner-plugin` which provides:

- **Edge Detection**: Automatically detects document edges
- **Auto Crop**: Crops to document boundaries
- **Perspective Correction**: Fixes document angle/perspective
- **Manual Adjustment**: User can adjust crop area before capture
- **High Quality**: 100% quality scanned images

## Installation Steps

1. **Install the package** (run in PowerShell):
```powershell
powershell -ExecutionPolicy Bypass -Command "cd C:\Users\madik\Documents\New_version\mobile; npm install"
```

2. **Restart Expo** (if already running):
```powershell
# Press Ctrl+C to stop current Expo server, then:
powershell -ExecutionPolicy Bypass -Command "cd C:\Users\madik\Documents\New_version\mobile; npx expo start"
```

3. **Reload app on phone**:
   - Press `r` in the Expo terminal, OR
   - Shake your phone and tap "Reload"

## Features

### Scan Document Button
- Opens professional document scanner
- Automatically detects document edges
- Shows crop overlay that you can adjust
- Applies perspective correction
- Returns high-quality scanned image

### Preview Screen
- Review scanned document before uploading
- Retake if not satisfied
- Confirm to proceed to document type selection

### From Gallery Button
- Still available as alternative option
- Pick existing photos from gallery

## How It Works

1. Tap "📄 Scan Document"
2. Point camera at document
3. Scanner auto-detects edges (green overlay)
4. Tap capture button
5. Adjust crop area if needed
6. Confirm crop
7. Review scanned image
8. Tap "✓ Use This" or "🔄 Retake"
9. Select document type
10. Upload to backend

## Document Types

- ID Copy
- Matric Certificate
- Bank Confirmation Letter
- CV

Each type can only be uploaded once per learner.
