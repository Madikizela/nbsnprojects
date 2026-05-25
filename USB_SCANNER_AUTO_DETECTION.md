# USB Scanner Auto-Detection Implementation

## Status: ✅ COMPLETE

## What Was Implemented

The Flutter mobile app now automatically detects when a Futronic fingerprint scanner is connected via USB OTG cable and requests permission immediately.

## Changes Made

### MainActivity.kt Updates

1. **USB Device Attach/Detach Listener**
   - Added `UsbManager.ACTION_USB_DEVICE_ATTACHED` to BroadcastReceiver
   - Added `UsbManager.ACTION_USB_DEVICE_DETACHED` to BroadcastReceiver
   - Automatically detects when Futronic scanner (vendor ID 0x1491) is connected

2. **Automatic Permission Request**
   - When scanner is attached, automatically requests USB permission
   - Shows Android system dialog: "Allow RLMSS v1 to access Futronic Fingerprint Scanner 2.0?"
   - No need to click any button - permission dialog appears immediately on connection

3. **Startup Scanner Check**
   - Added `checkForConnectedScanner()` method
   - Runs when app starts to detect already-connected scanners
   - Requests permission if scanner is connected but permission not granted

4. **Improved Capture Flow**
   - When user clicks "Register" button, checks if permission already granted
   - If permission granted, launches Futronic app immediately
   - If not granted, requests permission first

## How It Works

### Flow 1: Scanner Connected While App Running
1. User connects Futronic scanner via USB OTG cable
2. Android broadcasts `ACTION_USB_DEVICE_ATTACHED` event
3. MainActivity receives event and checks vendor ID (0x1491)
4. If Futronic scanner detected, automatically requests USB permission
5. Android shows system permission dialog
6. User grants permission
7. Scanner is ready to use

### Flow 2: App Started With Scanner Already Connected
1. User opens app with scanner already connected
2. `checkForConnectedScanner()` runs in `configureFlutterEngine()`
3. Detects Futronic scanner in USB device list
4. Checks if permission already granted
5. If not granted, requests USB permission
6. Android shows system permission dialog

### Flow 3: User Clicks Register Button
1. User navigates to Fingerprint Registration screen
2. User clicks "Register Left Thumb" or "Register Right Thumb"
3. Confirmation dialog: "Do you have a fingerprint scanner available and connected?"
4. User clicks "Yes"
5. App checks if scanner has USB permission
6. If permission granted, launches Futronic app immediately
7. If not granted, requests permission (shows system dialog)
8. After permission granted, launches Futronic app

## Testing Instructions

1. **Test Auto-Detection on Connect:**
   - Open the Flutter app
   - Connect Futronic scanner via USB OTG cable
   - USB permission dialog should appear automatically
   - Grant permission
   - Scanner is ready to use

2. **Test Auto-Detection on App Start:**
   - Connect Futronic scanner via USB OTG cable
   - Open the Flutter app
   - USB permission dialog should appear automatically
   - Grant permission
   - Scanner is ready to use

3. **Test Fingerprint Registration:**
   - Login to app
   - Navigate to Projects → Sites → Classes → Learners
   - Click on a learner
   - Click fingerprint icon (top right)
   - Click "Register Left Thumb" or "Register Right Thumb"
   - Click "Yes" in confirmation dialog
   - If permission already granted, Futronic app launches immediately
   - If not granted, permission dialog appears first
   - Capture fingerprint in Futronic app
   - Fingerprint template uploaded to backend

## Technical Details

### Vendor ID
- Futronic scanners use vendor ID: `0x1491`
- This is used to identify the scanner in USB device list

### Permissions
- USB permission is device-specific and app-specific
- Permission persists until device is disconnected or app is uninstalled
- Permission dialog is shown by Android system, not the app

### BroadcastReceiver
- Registered in `configureFlutterEngine()` with `RECEIVER_NOT_EXPORTED` flag
- Listens for three actions:
  1. `ACTION_USB_PERMISSION` - Permission granted/denied
  2. `ACTION_USB_DEVICE_ATTACHED` - Device connected
  3. `ACTION_USB_DEVICE_DETACHED` - Device disconnected

## Files Modified

- `mobile_flutter/android/app/src/main/kotlin/com/example/nbsn_mobile/MainActivity.kt`

## Next Steps

1. Connect Futronic scanner via USB OTG cable
2. Verify USB permission dialog appears automatically
3. Grant permission
4. Test fingerprint registration flow
5. Verify fingerprint templates are saved to database

## Notes

- The app must be running or starting for auto-detection to work
- If app is closed, connect scanner then open app to trigger detection
- Permission is remembered until scanner is disconnected
- Futronic demo app must be installed: `mobile_flutter/ftrAnsiSDKDemo_Android-debug.apk`
