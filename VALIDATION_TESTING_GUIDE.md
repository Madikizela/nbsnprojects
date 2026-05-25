# Form Validation - Visual Testing Guide

## Quick Test (5 minutes)

### Setup
1. Navigate to: Projects → Site → Class → "Add Learner"
2. Have this guide open for reference

### Test 1: Contact Number Validation (1 min)

**Valid Input:**
- Type: `0821234567`
- ✅ Should accept without error

**Invalid Input:**
- Type: `1234567890` (doesn't start with 0)
- ❌ Should show: "Invalid phone number. Must be 10 digits starting with 0"
- Red border should appear

**Too Short:**
- Type: `082123456` (only 9 digits)
- ❌ Should show error

**Clear and Leave Empty:**
- Delete all text
- ✅ Should accept (optional field)

---

### Test 2: Email Validation (1 min)

**Valid Email:**
- Type: `test@example.com`
- ✅ Should accept without error

**Invalid Email:**
- Type: `notanemail`
- ❌ Should show: "Invalid email address"
- Red border should appear

**Invalid Format:**
- Type: `test@`
- ❌ Should show error

**Clear and Leave Empty:**
- Delete all text
- ✅ Should accept (optional field)

---

### Test 3: Postal Code Validation (1 min)

**Valid Code:**
- Type: `2000`
- ✅ Should accept
- Helper text: "4 digits"

**Too Short:**
- Type: `200`
- ❌ Should show: "Invalid postal code. Must be 4 digits"

**Try Letters:**
- Try typing: `ABCD`
- ✅ Should not allow letters (auto-filtered)

**Too Long:**
- Type: `20001`
- ✅ Should stop at 4 digits (maxLength enforced)

---

### Test 4: Year of Completion (1 min)

**Valid Year:**
- Type: `2020`
- ✅ Should accept
- Helper text shows range

**Future Year:**
- Type: `2027`
- ❌ Should show: "Invalid year. Must be between 1900 and 2026"

**Too Old:**
- Type: `1899`
- ❌ Should show error

**Current Year:**
- Type: `2026`
- ✅ Should accept

---

### Test 5: Bank Details (1 min)

**Account Number - Valid:**
- Type: `1234567890` (10 digits)
- ✅ Should accept
- Helper text: "6-11 digits"

**Account Number - Too Short:**
- Type: `12345` (5 digits)
- ❌ Should show: "Invalid account number. Must be 6-11 digits"

**Branch Code - Valid:**
- Type: `250655`
- ✅ Should accept
- Helper text: "6 digits"

**Branch Code - Wrong Length:**
- Type: `12345` (5 digits)
- ❌ Should show: "Invalid branch code. Must be 6 digits"

**Try Letters:**
- Try typing letters in either field
- ✅ Should not allow (auto-filtered)

---

## Complete Test Scenario (10 minutes)

### Scenario: Add a Complete Learner with Validation

**Step 1: Required Fields**
1. Title: Select `Mr`
2. First Name: `John`
3. Last Name: `Doe`
4. ID Number: `9001015800081`
   - ✅ Should auto-fill DOB, Age, Gender

**Step 2: Contact Info (Test Validation)**
1. Contact Number: Type `1234567890`
   - ❌ Should show error (doesn't start with 0)
2. Fix it: `0821234567`
   - ✅ Error should disappear
3. Email: Type `notanemail`
   - ❌ Should show error
4. Fix it: `john.doe@example.com`
   - ✅ Error should disappear

**Step 3: Address (Test Postal Code)**
1. Address Line 1: `123 Main Street`
2. Address Line 2: `Suburb`
3. Address Line 3: `Johannesburg`
4. Postal Code: Type `200`
   - ❌ Should show error (only 3 digits)
5. Fix it: `2000`
   - ✅ Error should disappear

**Step 4: Education (Test Year)**
1. High School Name: `Test High School`
2. Year of Completion: Type `2100`
   - ❌ Should show error (future year)
3. Fix it: `2020`
   - ✅ Error should disappear
4. School Location: `Johannesburg`
5. Highest Grade: `Grade 12`

**Step 5: Next of Kin (Test Contact)**
1. Name: `Mary Doe`
2. Relation: `Mother`
3. Contact: Type `123456789`
   - ❌ Should show error
4. Fix it: `0829876543`
   - ✅ Error should disappear

**Step 6: Bank Info (Test Both Fields)**
1. Bank Name: Select `FNB`
2. Account Type: Select `Savings`
3. Account Number: Type `12345`
   - ❌ Should show error (too short)
4. Fix it: `1234567890`
   - ✅ Error should disappear
5. Branch Code: Type `12345`
   - ❌ Should show error (only 5 digits)
6. Fix it: `250655`
   - ✅ Error should disappear

**Step 7: Submit**
1. Click "Add Learner"
2. ✅ Should submit successfully
3. ✅ Success message appears
4. ✅ Modal closes
5. ✅ Learner appears in table

---

## Error State Checklist

For each validated field, verify:
- [ ] Red border appears on invalid input
- [ ] Error message is clear and specific
- [ ] Error disappears when fixed
- [ ] Helper text is visible
- [ ] Numeric fields show numeric keyboard on mobile
- [ ] Max length is enforced
- [ ] Non-numeric characters are filtered
- [ ] Empty optional fields are accepted

---

## Visual Indicators Reference

### Success State
```
[Input Field with normal border]
💡 Helper text in gray
```

### Error State
```
[Input Field with RED border]
⚠️ Error message in red
```

### Valid Numeric Input
```
[Input Field with normal border]
💡 "6-11 digits" in gray
```

### Auto-Filled Field
```
[Input Field grayed out/disabled]
💡 "Auto-filled from ID" in gray
```

---

## Common Issues to Check

### Issue: Error doesn't appear
**Check**: Did you type enough characters to trigger validation?
**Solution**: Some fields validate only when complete (e.g., postal code needs 4 digits)

### Issue: Can't type letters in numeric field
**Expected**: This is correct behavior - numeric fields filter non-numeric input

### Issue: Field stops accepting input
**Check**: Have you reached maxLength?
**Solution**: This is correct - fields have character limits

### Issue: Error persists after fixing
**Check**: Is the format exactly correct?
**Solution**: Check helper text for exact requirements

---

## Mobile Testing

If testing on mobile device:
1. Numeric fields should show numeric keyboard
2. Email field should show email keyboard
3. All validations should work the same
4. Touch targets should be large enough
5. Error messages should be readable

---

## Browser Console Check

Open browser console (F12) and verify:
- [ ] No JavaScript errors
- [ ] No React warnings
- [ ] State updates smoothly
- [ ] No performance issues

---

## Success Criteria

✅ All valid inputs accepted
✅ All invalid inputs rejected with clear errors
✅ Error messages are helpful and specific
✅ Visual feedback is immediate
✅ Form submission validates all fields
✅ No console errors
✅ Mobile-friendly input methods
✅ Professional appearance

---

## Quick Reference: Valid Test Data

```
ID Number: 9001015800081
Contact: 0821234567
Email: test@example.com
Postal Code: 2000
Year: 2020
Next of Kin Contact: 0829876543
Account Number: 1234567890
Branch Code: 250655
```

## Quick Reference: Invalid Test Data

```
Contact: 1234567890 (no leading 0)
Email: notanemail (no @)
Postal Code: 123 (too short)
Year: 2100 (future)
Account: 12345 (too short)
Branch Code: 12345 (too short)
```

---

## Reporting Issues

If you find any validation issues, note:
1. Field name
2. Input value
3. Expected behavior
4. Actual behavior
5. Browser/device
6. Screenshot (if helpful)
