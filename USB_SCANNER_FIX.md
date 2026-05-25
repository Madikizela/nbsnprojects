# USB Fingerprint Scanner Crash Fix

## Problem
The app was crashing when connecting the Futronic USB fingerprint scanner instead of showing the permission dialog "Allow RLMSS v1 to access Futronic Fingerprint Scanner 2.0?"

## Root Cause
The AndroidManifest.xml was missing critical USB permissions and intent filters required for USB host mode.

## What Was Fixed

### 1. Created USB Device Filter
**File:** `mobile_flutter/AnsiSDKDemo_AndroidStudio/ftrAnsiSDKDemo_Android/src/main/res/xml/device_filter.xml`

This file defines which USB devices the app can access (Futronic scanners with vendor ID 1491).

### 2. Updated AndroidManifest.xml
Added three critical components:

**USB Permissions:**
```xml
<uses-permission android:name="android.permission.USB_PERMISSION" />
<uses-feature android:name="android.hardware.usb.host" android:required="true" />
```

**USB Device Attached Intent Filter:**
```xml
<intent-filter>
    <action android:name="android.hardware.usb.action.USB_DEVICE_ATTACHED" />
</intent-filter>

<meta-data
    android:name="android.hardware.usb.action.USB_DEVICE_ATTACHED"
    android:resource="@xml/device_filter" />
```

## How to Test

### Step 1: Clean and Rebuild
```bash
cd C:\Users\madik\Documents\New_version\mobile_flutter\AnsiSDKDemo_AndroidStudio
gradlew clean
gradlew assembleDebug
```

### Step 2: Install on Device
```bash
adb install -r ftrAnsiSDKDemo_Android/build/outputs/apk/debug/ftrAnsiSDKDemo_Android-debug.apk
```

### Step 3: Test USB Scanner
1. Open the app on your phone
2. Connect the Futronic USB fingerprint scanner via USB cable
3. You should now see the permission dialog: "Allow RLMSS v1 to access Futronic Fingerprint Scanner 2.0?"
4. Click "OK" to grant permission
5. Click "Register Left Thumb" or "Register Right Thumb"
6. The app should now work without crashing

## Expected Behavior
- Permission dialog appears when USB scanner is connected
- App no longer crashes when scanner is plugged in
- Fingerprint registration works properly after granting permission

## Notes
- The vendor ID 1491 is for Futronic devices
- If you have a different scanner model, you may need to adjust the vendor-id and product-id in device_filter.xml
- To find your device IDs, connect the scanner and run: `adb shell lsusb`
