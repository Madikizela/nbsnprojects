# Test Attendance Calendar - Quick Guide

## 🚀 Quick Start

### Access the Feature

1. **Login to Admin Dashboard**
   - URL: http://192.168.0.53:5174
   - Use your admin credentials

2. **Navigate to Attendance Tracking**
   - Click "📊 Attendance Tracking" in the left sidebar

3. **Select a Project**
   - Choose any project with learners
   - Wait for project attendance stats to load

4. **Select a Class**
   - Click on any class card in the "Class Breakdown" section
   - Learner list will appear

5. **Open Calendar**
   - **Option A:** In daily view table, click "📅 View Attendance" button
   - **Option B:** In weekly view card, click "📅 Calendar" button

---

## ✅ What You Should See

### Calendar Modal

**Header:**
```
📅 Attendance Calendar - [Learner Name]
```

**Learner Info Card:**
- Name, ID Number
- Project, Class
- 4 colored boxes showing:
  - Present days (green)
  - Absent days (red)
  - Attendance rate % (blue)
  - Total contact hours (purple)

**Month Navigation:**
```
[← Previous Month]    July 2026    [Next Month →]
```

**Calendar Grid:**
- 7 columns (Mon-Sun)
- Days with attendance records show:
  - Status badge (Present/Absent/Late)
  - 🟢 Clock in time
  - 🔴 Clock out time
  - ⏱️ Contact hours
  - **✍️ Signature image (if present)**

**Legend at Bottom:**
- Color boxes showing what each status means
- Signature indicator

---

## 🧪 Test Scenarios

### Scenario 1: View Current Month
1. Open calendar for any learner
2. ✅ Current month should load automatically
3. ✅ Present days should be green
4. ✅ Absent days should be red
5. ✅ Weekends should be darker gray
6. ✅ Signatures should appear on present days

### Scenario 2: Navigate Between Months
1. Click "← Previous Month"
2. ✅ Calendar updates to show previous month
3. ✅ Month/year display changes
4. ✅ Data loads correctly
5. Click "Next Month →"
6. ✅ Returns to current month
7. ✅ Can navigate forward if data exists

### Scenario 3: Check Day Details
1. Find a day marked as "Present"
2. ✅ Should show green background
3. ✅ Clock in time displayed
4. ✅ Clock out time displayed
5. ✅ Contact hours calculated
6. ✅ Signature image visible (if signed)

### Scenario 4: Weekend Display
1. Find Saturday or Sunday
2. ✅ Should show dark background
3. ✅ Shows "Weekend" text
4. ✅ No attendance data displayed

### Scenario 5: Signature Verification
1. Find a present day with signature
2. ✅ Signature image loads and displays
3. ✅ Image is properly sized
4. ✅ "✍️ Signed" text appears below
5. ✅ White background with border

---

## 🔍 What to Check

### Visual Checks
- [ ] Colors match: Green = Present, Red = Absent, Orange = Late
- [ ] All days of month are shown
- [ ] Empty cells before month starts
- [ ] Statistics at top are accurate
- [ ] Signatures are visible and clear
- [ ] Month name and year display correctly

### Functional Checks
- [ ] Modal opens when clicking button
- [ ] Loading spinner appears during fetch
- [ ] Calendar displays after loading
- [ ] Month navigation works both directions
- [ ] Multiple learners can be viewed
- [ ] Modal closes cleanly
- [ ] No console errors

### Data Accuracy
- [ ] Present days count matches records
- [ ] Absent days count matches records
- [ ] Attendance rate calculated correctly
- [ ] Total contact hours sum is accurate
- [ ] Clock times match database records

---

## 🐛 Common Issues & Solutions

### Issue: Modal won't open
**Solution:** Check browser console for errors, verify backend is running

### Issue: Calendar is empty
**Solution:** Check if learner has attendance records for the selected month

### Issue: Signatures not showing
**Solution:**
1. Check if learner has uploaded signature in profile
2. Verify signature file exists on server
3. Check console for image load errors
4. Verify API path is correct

### Issue: Wrong data displayed
**Solution:** Verify correct learner ID is being passed to API

### Issue: Month navigation not working
**Solution:** Check if API calls are succeeding in Network tab

---

## 📊 Test Data Requirements

To properly test this feature, you need:

1. **Learners with attendance records**
   - At least one learner with present days
   - At least one learner with absent days
   - Records spanning multiple months

2. **Signatures uploaded**
   - Some learners with signatures in their profile
   - Attendance records with `SignaturePath` populated

3. **Different scenarios**
   - Full month of attendance
   - Partial month (mid-month enrollment)
   - Mix of present/absent/late statuses

---

## 🧪 Test Checklist

### Setup
- [ ] Backend running on port 5213
- [ ] Frontend running on port 5174
- [ ] Admin user logged in
- [ ] Test learners with attendance data exist

### Daily View Test
- [ ] Navigate to Attendance Tracking
- [ ] Select project
- [ ] Select class
- [ ] Switch to Daily view
- [ ] Click "View Attendance" button on learner row
- [ ] Calendar modal opens
- [ ] Data loads correctly

### Weekly View Test
- [ ] Switch to Weekly view
- [ ] Click "Calendar" button on learner card
- [ ] Calendar modal opens
- [ ] Same learner data displays

### Calendar Functionality
- [ ] Correct month and year shown
- [ ] All days of month displayed
- [ ] Attendance status colored correctly
- [ ] Clock in/out times visible
- [ ] Contact hours calculated
- [ ] Signatures displayed on present days
- [ ] Weekends marked differently
- [ ] Legend shows correctly

### Navigation
- [ ] "Previous Month" button works
- [ ] "Next Month" button works
- [ ] Month/year updates on navigation
- [ ] Data reloads for new month
- [ ] Loading indicator shows during fetch

### Statistics
- [ ] Present days count is accurate
- [ ] Absent days count is accurate
- [ ] Attendance rate % is correct
- [ ] Total contact hours sum is accurate

### Edge Cases
- [ ] First day of month is not Monday
- [ ] Month with 31 days displays correctly
- [ ] Month with 28/29 days displays correctly
- [ ] Future months show no records
- [ ] Past months show historical data

---

## 📝 Reporting Issues

If you find issues, please report with:

1. **User details** - Which admin account
2. **Learner ID** - Which learner's calendar
3. **Month/Year** - Which month was being viewed
4. **Expected behavior** - What should happen
5. **Actual behavior** - What actually happened
6. **Screenshot** - If visual issue
7. **Console errors** - From browser developer tools
8. **Network response** - From browser Network tab

---

## ✅ Success Criteria

The feature is working correctly if:

1. ✅ Calendar modal opens without errors
2. ✅ All days of the month are displayed
3. ✅ Attendance statuses are color-coded correctly
4. ✅ **Signatures are visible on present dates**
5. ✅ Clock in/out times are shown
6. ✅ Contact hours are calculated
7. ✅ Month navigation works smoothly
8. ✅ Statistics match actual records
9. ✅ Weekends are identified correctly
10. ✅ Modal can be opened for different learners

---

## 🎯 Quick Test (2 minutes)

1. Login → Attendance Tracking
2. Select any project
3. Click any class
4. Click "View Attendance" on first learner
5. ✅ Calendar opens with data
6. ✅ Signatures visible on present days
7. Click "Previous Month"
8. ✅ Data loads for previous month
9. Click "Close"
10. ✅ Modal closes cleanly

**If all checks pass: Feature is working!** ✅

---

**Ready to test!** Open the admin dashboard and try the new calendar feature.
