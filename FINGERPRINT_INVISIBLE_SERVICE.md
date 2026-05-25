# Fingerprint Scanner - Invisible Background Service

## Status: READY FOR TESTING

The demo app now runs completely invisibly in the background. Users will only see the Flutter app UI.

## What Changed

### 1. Transparent Theme
Added `AppTheme.Transparent` in `styles.xml`:
- Fully transparent background
- No title bar
- Floating window (doesn't cover Flutter app)
- No dimming effect

### 2. Activity Alias
Created `FingerprintService` activity alias in AndroidManifest:
- Points to MainActivity but uses transparent theme
- `excludeFromRecents="true"` - won't appear in recent apps
- `noHistory="true"` - won't stay in back stack
- Exported for other apps to call

### 3. No Animation
Added `FLAG_ACTIVITY_NO_ANIMATION` to Intent:
- No transition animation when launching
- Instant, seamless experience

## User Experience

1. User clicks "Register" button in Flutter app
2. **Nothing visible happens** - Flutter app stays on screen
3. USB permission dialog appears (only first time): "Allow RLMSS v1 to access Futronic Fingerprint Scanner 2.0?"
4. User grants permission
5. User places finger on scanner
6. Capture happens in background
7. Success message appears in Flutter app
8. Demo app closes automatically (invisible the whole time)

## Technical Flow

```
Flutter App (Visible)
    ↓
Launch FingerprintService (Transparent/Invisible)
    ↓
USB Permission Dialog (System Dialog - only first time)
    ↓
Fingerprint Capture (Background)
    ↓
Return Template to Flutter App
    ↓
Demo App Closes (Was never visible)
    ↓
Flutter App Shows Success (Still visible)
```

## Files Modified

1. `mobile_flutter/AnsiSDKDemo_AndroidStudio/ftrAnsiSDKDemo_Android/src/main/res/values/styles.xml`
   - Added `AppTheme.Transparent` style

2. `mobile_flutter/AnsiSDKDemo_AndroidStudio/ftrAnsiSDKDemo_Android/src/main/AndroidManifest.xml`
   - Added `FingerprintService` activity-alias with transparent theme

3. `mobile_flutter/android/app/src/main/kotlin/com/example/nbsn_mobile/MainActivity.kt`
   - Changed to launch `FingerprintService` instead of `MainActivity`
   - Added `FLAG_ACTIVITY_NO_ANIMATION` flag

## Testing

1. Connect USB scanner to phone
2. Open Flutter app
3. Navigate to fingerprint registration
4. Click "Register" for left or right thumb
5. **You should NOT see the demo app UI at all**
6. Only the USB permission dialog appears (first time only)
7. Place finger on scanner
8. Success message appears in Flutter app

## What You'll See

- ✅ Flutter app stays visible the entire time
- ✅ USB permission dialog (first capture only)
- ✅ Success/error messages in Flutter app
- ❌ NO demo app UI
- ❌ NO screen transitions
- ❌ NO app switching animation

## Advantages

1. **Seamless UX**: User never leaves Flutter app
2. **Professional**: Looks like native integration
3. **Clean**: No confusing app switches
4. **Fast**: No animation delays
5. **Invisible**: Demo app does its job silently

## Both Apps Installed

- Demo App: Installed with transparent service mode
- Flutter App: Installed with updated Intent launcher

Ready to test! The fingerprint capture will now happen completely in the background without showing any demo app UI.
