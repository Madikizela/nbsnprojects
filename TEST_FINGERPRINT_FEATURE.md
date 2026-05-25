# Testing Fingerprint Registration Feature

## Prerequisites

### 1. Install Futronic Demo App
First, install the Futronic SDK demo app on your phone:

```bash
adb install mobile_flutter/ftrAnsiSDKDemo_Android-debug.apk
```

Verify installation:
```bash
adb shell pm list packages | grep futronic
# Should show: package:com.futronictech.ftrAnsiSDKDemo
```

### 2. Connect Futronic Scanner
- Connect the Futronic fingerprint scanner to your phone via USB OTG cable
- The scanner LED should light up when connected
- Test the scanner by opening the Futronic demo app manually

## Testing Steps

### Step 1: Launch the App
Once the Flutter build completes, the app will automatically install and launch on your phone.

### Step 2: Navigate to Learner
1. Login with `admin@system.local` / `Admin@123`
2. Navigate: Projects → Sites → Classes → Learners
3. Tap any learner card to view details

### Step 3: Open Fingerprint Registration
- Look for the **fingerprint icon** in the top right of the app bar
- Tap the fingerprint icon
- You'll see the "Fingerprint Registration" screen

### Step 4: Register Left Thumb
1. Tap the "Register" button under "Left Thumb"
2. The Futronic demo app will launch automatically
3. Place your left thumb on the scanner
4. Keep it steady until the capture completes
5. The app will return to the registration screen
6. You should see "Registered ✓" status for left thumb

### Step 5: Register Right Thumb
1. Tap the "Register" button under "Right Thumb"
2. Follow the same process
3. Both thumbs should now show "Registered ✓"

### Step 6: Verify in Database
Check that the fingerprints were saved:

```bash
# In PowerShell
node -e "
const { Client } = require('pg');
const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'rlms',
  user: 'postgres',
  password: '12345'
});

client.connect()
  .then(() => client.query('SELECT \"Id\", \"FirstName\", \"LastName\", LENGTH(\"LeftThumbTemplate\") as left_size, LENGTH(\"RightThumbTemplate\") as right_size FROM \"Learners\" WHERE \"LeftThumbTemplate\" IS NOT NULL OR \"RightThumbTemplate\" IS NOT NULL'))
  .then(result => {
    console.log('Learners with fingerprints:');
    console.table(result.rows);
    return client.end();
  })
  .catch(err => {
    console.error('Error:', err.message);
    client.end();
  });
"
```

## Expected Behavior

### Registration Screen UI:
- Header with learner name
- Blue info banner with instructions
- Two cards: "Left Thumb" and "Right Thumb"
- Each card shows:
  - Large fingerprint icon
  - Registration status
  - Register/Re-register button
- Status summary at bottom

### During Capture:
- Button shows "Capturing..." with spinner
- Futronic app opens in new window
- Scanner LED may blink during capture
- Success/failure message appears

### After Registration:
- Card border turns green
- Status shows "Registered ✓"
- Button changes to "Re-register"
- Status summary updates

## Troubleshooting

### "Fingerprint scanner not available"
**Problem:** Futronic demo app not installed
**Solution:** 
```bash
adb install mobile_flutter/ftrAnsiSDKDemo_Android-debug.apk
```

### "Failed to capture fingerprint"
**Possible causes:**
- Scanner not connected properly
- Finger placement too light/heavy
- Scanner surface dirty
- Timeout occurred

**Solutions:**
- Check USB OTG connection
- Clean scanner surface with soft cloth
- Press finger firmly but not too hard
- Try again with better placement

### Futronic app doesn't launch
**Problem:** Android can't find the app
**Solution:** 
- Verify app is installed: `adb shell pm list packages | grep futronic`
- Try launching manually first to test
- Check AndroidManifest.xml has the package query

### "Registration failed: [error]"
**Possible causes:**
- Network issue
- Backend not running
- Invalid JWT token

**Solutions:**
- Check backend is running on port 5213
- Verify phone can reach `http://192.168.0.62:5213`
- Try logging out and back in to refresh token

## API Testing

You can also test the API directly:

```bash
# Get auth token first
$token = "YOUR_JWT_TOKEN_HERE"

# Check fingerprint status
curl http://192.168.0.62:5213/api/Learners/1/fingerprints `
  -H "Authorization: Bearer $token"

# Register fingerprint (with dummy data for testing)
curl -X POST http://192.168.0.62:5213/api/Learners/1/fingerprint `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $token" `
  -d '{
    "FingerprintType": "LeftThumb",
    "TemplateData": "DUMMY_BASE64_TEMPLATE_FOR_TESTING"
  }'
```

## Success Criteria

✅ Fingerprint icon appears in learner detail screen
✅ Tapping icon opens registration screen
✅ Registration screen shows both thumbs
✅ Tapping "Register" launches Futronic app
✅ Captured template is uploaded to backend
✅ Status updates to "Registered ✓"
✅ Templates are stored in database
✅ Can re-register to update templates

## Next Steps After Testing

Once fingerprint registration works:
1. Test with multiple learners
2. Verify templates are unique per learner
3. Test re-registration (overwriting existing)
4. Plan fingerprint verification feature for attendance
5. Consider adding fingerprint quality scoring

## Notes

- ANSI 378 templates are typically 500-1000 bytes
- Templates are stored as Base64 strings (adds ~33% size)
- Templates cannot be reverse-engineered to images
- Each capture may produce slightly different template
- Verification compares templates using matching algorithm
