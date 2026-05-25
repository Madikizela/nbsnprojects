# Test Teacher Dashboard - Quick Guide

## ✅ Build Complete!
The app has been successfully built and installed on device **RZ8X101VLSE**.

---

## 🧪 Testing Steps

### Step 1: Create a Teacher Account (if you don't have one)

#### Option A: Using Mobile App (as SDP Manager)
1. Open the app on your device
2. Login as SDP Manager
3. Navigate: Projects → Site → Classes
4. Tap the purple teacher icon (👨‍🏫) on any class
5. Fill in teacher details:
   - First Name: Test
   - Last Name: Teacher
   - Email: teacher@test.com
6. Tap "Add Teacher"
7. Check the email for login credentials

#### Option B: Using Web App
1. Open web browser: http://localhost:5173
2. Login as SDP Manager
3. Navigate to a project's classes
4. Click the teacher icon (👨‍🏫) next to any class
5. Create new teacher with same details as above

### Step 2: Test Teacher Login
1. **Logout** from the current account (if logged in)
2. On login screen, enter:
   - Email: teacher@test.com
   - Password: [from email]
3. Tap "Login"
4. **Expected**: You should be redirected to **Teacher Dashboard** (NOT Projects screen)

### Step 3: Verify Dashboard Display
Check that you see:
- ✅ "Teacher Dashboard" title in app bar
- ✅ Teacher name below title
- ✅ Logout button (top right)
- ✅ Purple summary card showing:
  - Number of classes assigned
  - Total learners count
  - Number of sites
- ✅ "My Classes" section below

### Step 4: Test Class Expansion
1. Tap on a class card
2. **Expected**: Card expands to show learners
3. Check that you see:
   - ✅ List of learners with names
   - ✅ Learner ID numbers
   - ✅ Avatar with initials
   - ✅ "Take Attendance" button (shows "coming soon" message)

### Step 5: Test Learner Navigation
1. Tap on any learner in the list
2. **Expected**: Navigate to learner detail screen
3. Verify learner information displays
4. Tap back button
5. **Expected**: Return to teacher dashboard

### Step 6: Test Pull to Refresh
1. Pull down on the class list
2. **Expected**: Loading indicator appears
3. Data refreshes

### Step 7: Test Logout
1. Tap logout button (top right)
2. **Expected**: Return to login screen
3. Login again as teacher
4. **Expected**: Return to teacher dashboard

---

## 🎯 What to Look For

### ✅ Success Indicators
- Teacher redirected to dashboard (not projects)
- All assigned classes visible
- Learner counts accurate
- Smooth navigation
- No crashes or errors

### ❌ Potential Issues
- If redirected to projects screen → Role check not working
- If no classes show → Teacher not assigned to any classes
- If learners don't load → API connection issue
- If app crashes → Check logs with `flutter logs`

---

## 🐛 Troubleshooting

### Issue: Teacher redirected to Projects screen
**Cause**: User role might not be "Teacher"
**Solution**: Check user role in database:
```sql
SELECT Id, Name, Email, Role FROM Users WHERE Email = 'teacher@test.com';
```
Should show: `Role = 'Teacher'`

### Issue: No classes showing
**Cause**: Teacher not assigned to any classes
**Solution**: 
1. Login as SDP Manager
2. Assign teacher to at least one class
3. Logout and login as teacher again

### Issue: Learners not loading
**Cause**: API connection problem
**Solution**:
1. Check backend is running: http://localhost:5213
2. Check mobile IP is correct in `api_service.dart`
3. Current IP: `192.168.209.166:5213`

### Issue: App crashes on login
**Solution**: Check logs:
```powershell
flutter logs
```

---

## 📱 Device Info
- Device: SM A155F
- Serial: RZ8X101VLSE
- Android: 16 (API 36)
- APK Location: `mobile_flutter/build/app/outputs/flutter-apk/app-release.apk`

---

## 🔄 Rebuild if Needed
```powershell
cd mobile_flutter
flutter clean
flutter pub get
flutter build apk --release
flutter install
```

---

## 📊 Expected Results

### Teacher Dashboard Screen
```
┌─────────────────────────────────┐
│ Teacher Dashboard               │
│ Test Teacher              [🚪]  │
├─────────────────────────────────┤
│                                 │
│  ┌───────────────────────────┐ │
│  │         🎓                │ │
│  │          2                │ │
│  │   Classes Assigned        │ │
│  │                           │ │
│  │  👥 25      📍 2          │ │
│  │  Learners   Sites         │ │
│  └───────────────────────────┘ │
│                                 │
│  My Classes                     │
│                                 │
│  ┌───────────────────────────┐ │
│  │ Class A              [▼]  │ │
│  │ 📍 Main Site              │ │
│  │ 👥 12 Learners            │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │ Class B              [▼]  │ │
│  │ 📍 Branch Site            │ │
│  │ 👥 13 Learners            │ │
│  └───────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

---

## ✅ Test Checklist

- [ ] Teacher account created
- [ ] Teacher login successful
- [ ] Redirected to Teacher Dashboard (not Projects)
- [ ] Dashboard shows correct class count
- [ ] Dashboard shows correct learner count
- [ ] Dashboard shows correct site count
- [ ] Can expand class to view learners
- [ ] Learner list displays correctly
- [ ] Can tap learner to view details
- [ ] Back navigation works
- [ ] Pull to refresh works
- [ ] Logout works
- [ ] Re-login returns to dashboard

---

## 🎉 Success!
If all tests pass, the Teacher Dashboard is working perfectly!

**Next Steps**: Test fingerprint attendance marking (future feature)
