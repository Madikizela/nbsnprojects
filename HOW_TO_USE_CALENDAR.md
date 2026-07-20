# How to Use the Attendance Calendar Feature

## 📍 Quick Access Guide

### Step 1: Login to Admin Dashboard
```
URL: http://192.168.0.53:5174
Login with your administrator credentials
```

### Step 2: Navigate to Attendance Tracking
```
Left Sidebar → Click "📊 Attendance Tracking"
```

### Step 3: Select Time Period (Optional)
```
Choose: Today | This Week | This Month | Custom Range
```

### Step 4: Select a Project
```
Click on any project card showing:
- Project name
- Present today / Absent today
- Attendance rate
- Total learners
```

### Step 5: View Class Details
```
Scroll down to "Class Breakdown"
Click on any class card
```

### Step 6: Open Learner Calendar

**Option A: Daily View**
```
1. Make sure "Daily" tab is selected at top
2. Find learner in the table
3. Look for "Actions" column (far right)
4. Click "📅 View Attendance" button
```

**Option B: Weekly View**
```
1. Click "📊 Weekly" tab at top
2. Find learner card
3. Look for button next to statistics (top right of card)
4. Click "📅 Calendar" button
```

---

## 🗓️ Using the Calendar

### What You'll See

**Top Section - Learner Info**
```
┌─────────────────────────────────────────────────┐
│ LEARNER DETAILS                                 │
│ Name: John Doe                                  │
│ ID Number: 9001010000000                        │
│ Project: Plumbing Skills Programme              │
│ Class: Class A                                  │
│                                                 │
│ [18] Present  [2] Absent                        │
│ [90%] Rate    [148.5h] Total Hours              │
└─────────────────────────────────────────────────┘
```

**Month Navigation**
```
[← Previous Month]    July 2026    [Next Month →]
```

**Calendar Grid**
```
Mon | Tue | Wed | Thu | Fri | Sat | Sun
----|-----|-----|-----|-----|-----|----
    |     | 1   | 2   | 3   | 4   | 5
    |     | P   | P   | P   | W   | W
6   | 7   | 8   | 9   | 10  | 11  | 12
P   | P   | A   | P   | L   | W   | W
...

Legend:
P = Present (Green)
A = Absent (Red)
L = Late (Orange)
W = Weekend (Dark Gray)
```

### Reading a Calendar Day

**Present Day Example:**
```
┌─────────────┐
│ 1      [P]  │ ← Day number and status badge
│             │
│ 🟢 08:15 AM │ ← Clock in time
│ 🔴 04:30 PM │ ← Clock out time
│ ⏱️ 8.25h    │ ← Contact hours
│             │
│ [signature] │ ← Learner's signature
│ ✍️ Signed   │
└─────────────┘
```

**Absent Day Example:**
```
┌─────────────┐
│ 8      [A]  │ ← Red background
│             │
│ No Record   │
└─────────────┘
```

**Weekend Example:**
```
┌─────────────┐
│ 4           │ ← Dark gray background
│             │
│ Weekend     │
└─────────────┘
```

---

## 🎯 Common Actions

### View Different Month
1. Click "← Previous Month" to go back
2. Click "Next Month →" to go forward
3. Month/year updates automatically
4. Calendar reloads with new data

### Check Specific Learner
1. Close current calendar
2. Find different learner in list
3. Click their "View Attendance" button
4. New calendar opens

### View Multiple Learners
1. Open calendar for first learner
2. Note their attendance pattern
3. Close modal
4. Open calendar for second learner
5. Compare patterns

### Verify Signatures
1. Look for days marked "Present"
2. Check for signature image in the day cell
3. Look for "✍️ Signed" indicator
4. If missing, learner may not have uploaded signature

---

## 📊 Understanding the Calendar

### Color Meanings

🟢 **Green Background - Present**
- Learner clocked in and out
- Signature should be present
- Contact hours calculated

🔴 **Red Background - Absent**
- No clock in record
- No signature
- Marked as absent

🟡 **Orange Background - Late**
- Clocked in after expected time
- May have signature
- Contact hours may be reduced

⚫ **Dark Gray - Weekend**
- Saturday or Sunday
- No attendance expected
- No records shown

⬜ **Light Dark - No Record**
- Weekday with no attendance data
- May be future date
- May be before enrollment

### Statistics Boxes

**Present Days (Green)**
- Count of days marked "Present"
- Includes late arrivals

**Absent Days (Red)**
- Count of days marked "Absent"
- Excludes weekends

**Attendance Rate % (Blue)**
- Calculated as: Present ÷ (Present + Absent) × 100
- Higher is better

**Total Hours (Purple)**
- Sum of all contact hours for the month
- Calculated from clock in/out times

---

## 🔍 Troubleshooting

### Calendar Won't Open
**Problem:** Button clicks but nothing happens  
**Solution:**
- Check browser console for errors (F12)
- Refresh the page
- Verify backend is running
- Check network connection

### No Data Showing
**Problem:** Calendar is empty or shows "No Record" everywhere  
**Solution:**
- Check if learner has attendance for this month
- Try different month (previous/next)
- Verify learner is enrolled in the class
- Check if attendance records exist in database

### Signatures Not Visible
**Problem:** Days marked "Present" but no signature  
**Solution:**
- Learner may not have uploaded signature yet
- Signature file may be missing on server
- Check learner's profile for signature upload
- Verify attendance record has `SignaturePath` in database

### Wrong Learner Data
**Problem:** Calendar shows incorrect learner  
**Solution:**
- Close and reopen calendar
- Verify correct learner was clicked
- Check learner ID in modal header

### Month Navigation Not Working
**Problem:** Previous/Next buttons don't change month  
**Solution:**
- Check if API is responding (Network tab)
- Look for JavaScript errors (Console)
- Try refreshing the page

---

## ✅ Best Practices

### For Administrators

1. **Review Attendance Regularly**
   - Check calendars weekly
   - Identify patterns (frequent absences)
   - Verify signature compliance

2. **Compare Learners**
   - View calendars for multiple learners
   - Identify high/low performers
   - Track attendance trends

3. **Document Issues**
   - Screenshot calendar for records
   - Note missing signatures
   - Report inconsistencies

4. **Use with Reports**
   - Calendar for visual overview
   - Reports for detailed analysis
   - Export for external sharing

### For Accuracy

1. **Verify Signatures**
   - Check present days have signatures
   - Report missing signatures
   - Ensure signature quality

2. **Cross-Reference Data**
   - Compare with exported reports
   - Verify clock in/out times
   - Check contact hour calculations

3. **Monitor Compliance**
   - Track signature upload rates
   - Identify learners without signatures
   - Follow up on missing documentation

---

## 📞 Support

If you encounter issues:

1. **Check Documentation**
   - ATTENDANCE_CALENDAR_FEATURE.md (technical details)
   - TEST_ATTENDANCE_CALENDAR.md (testing guide)

2. **Browser Console**
   - Press F12 to open developer tools
   - Check Console tab for errors
   - Check Network tab for failed requests

3. **Report Issues**
   - Include learner ID
   - Include month/year being viewed
   - Include screenshot
   - Include error messages from console

---

## 🎉 Tips & Tricks

**Keyboard Shortcuts:**
- `Esc` key closes the modal
- Arrow keys could navigate months (if implemented)

**Quick Checks:**
- Present days should be green with times
- Signatures should be visible on present days
- Weekends are always dark gray
- Statistics should match visual count

**Performance:**
- Calendar loads per month (not entire year)
- Data is cached during session
- Month changes are fast
- Multiple opens don't slow down

---

## 📚 Related Features

This calendar works alongside:
- **Daily Attendance View** - See today's attendance
- **Weekly Attendance View** - See 5-day breakdown
- **Attendance Reports** - Export detailed reports
- **Monthly Export** - Excel export with signatures
- **Stipend Schedule** - Payment calculations

---

**Enjoy using the Attendance Calendar!** 📅✨

For any questions or issues, refer to the technical documentation or contact IT support.
