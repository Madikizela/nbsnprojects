# Testing SA ID Validation - Visual Guide

## How to Test the Feature

### Prerequisites
1. Backend running on http://localhost:5213
2. Frontend running on http://localhost:5173
3. Logged in as admin.manager@masakhane.com / password123

### Step-by-Step Testing

#### Test 1: Valid Male ID Number
1. Navigate to Projects section
2. Expand a project
3. Expand a site
4. Expand a class
5. Click "Add Learner" button
6. In the ID Number field, type: `9001015800081`
7. **Expected Results**:
   - ✅ Green success message appears: "✓ Valid ID - DOB and gender auto-filled"
   - Date of Birth field shows: `1990-01-01`
   - Age field shows: `36`
   - Gender dropdown shows: `Male` (disabled)
   - All three fields are read-only/disabled

#### Test 2: Valid Female ID Number
1. Clear the form or open a new learner modal
2. In the ID Number field, type: `9505124800082`
3. **Expected Results**:
   - ✅ Green success message appears
   - Date of Birth: `1995-05-12`
   - Age: `30`
   - Gender: `Female` (disabled)

#### Test 3: Invalid ID - Too Short
1. Clear the ID Number field
2. Type: `12345`
3. **Expected Results**:
   - No error yet (waiting for 13 digits)
   - Message shows: "Enter 13-digit SA ID number (numbers only)"
   - DOB, Age, Gender remain empty and editable

#### Test 4: Invalid ID - Contains Letters
1. Clear the ID Number field
2. Try to type: `ABC123`
3. **Expected Results**:
   - Only numbers appear: `123`
   - Letters are automatically filtered out
   - Cannot type non-numeric characters

#### Test 5: Invalid ID - Bad Month
1. Clear the ID Number field
2. Type: `9013015800081` (month = 13)
3. **Expected Results**:
   - ❌ Red error message: "⚠️ Invalid month in ID number"
   - Input field has red border
   - DOB, Age, Gender remain empty

#### Test 6: Invalid ID - Bad Day
1. Clear the ID Number field
2. Type: `9001325800081` (day = 32)
3. **Expected Results**:
   - ❌ Red error message: "⚠️ Invalid day in ID number"
   - Input field has red border
   - DOB, Age, Gender remain empty

#### Test 7: Form Submission with Invalid ID
1. Fill in required fields (Title, First Name, Last Name)
2. Enter invalid ID: `12345`
3. Click "Add Learner"
4. **Expected Results**:
   - Alert appears: "ID Number must be exactly 13 digits (numbers only)"
   - Form is not submitted
   - Modal remains open

#### Test 8: Form Submission with Valid ID
1. Fill in required fields:
   - Title: `Mr`
   - First Name: `John`
   - Last Name: `Doe`
   - ID Number: `9001015800081`
2. Click "Add Learner"
3. **Expected Results**:
   - Success alert: "Learner added successfully!"
   - Modal closes
   - Learner appears in the table with correct details

#### Test 9: Different Age Groups
Test these IDs to verify age calculation:

| ID Number | Expected DOB | Expected Age | Expected Gender |
|-----------|--------------|--------------|-----------------|
| 0501014800085 | 2005-01-01 | 21 | Female |
| 1506159000086 | 2015-06-15 | 10 | Male |
| 7508152400087 | 1975-08-15 | 50 | Female |
| 6211308500088 | 1962-11-30 | 63 | Male |

#### Test 10: Modal Close and Reset
1. Open "Add Learner" modal
2. Enter ID: `9001015800081`
3. Verify fields are auto-filled
4. Click "Cancel" or X button
5. Re-open modal
6. **Expected Results**:
   - All fields are empty
   - No error messages
   - Form is completely reset

## Visual Indicators to Look For

### Success State
- ✅ Green checkmark icon
- Green text: "✓ Valid ID - DOB and gender auto-filled"
- Date of Birth field filled and grayed out
- Age field filled and grayed out
- Gender dropdown filled and grayed out
- Small gray text under fields: "Auto-filled from ID"

### Error State
- ❌ Red warning icon
- Red text with error message
- Red border around ID Number input
- DOB, Age, Gender fields remain empty and editable

### Typing State
- Gray text: "Enter 13-digit SA ID number (numbers only)"
- No border color change
- Fields remain empty

## Common Issues and Solutions

### Issue: Letters appear in ID field
**Solution**: This shouldn't happen - the field filters non-numeric input. If it does, there's a bug.

### Issue: Age is off by 1
**Solution**: This is normal if the person's birthday hasn't occurred yet this year.

### Issue: Gender is wrong
**Solution**: Check the gender code (digits 7-10). Should be 0000-4999 for Female, 5000-9999 for Male.

### Issue: Fields don't auto-fill
**Solution**: 
1. Check browser console for errors
2. Verify ID is exactly 13 digits
3. Verify ID has valid month (01-12) and day (01-31)

## Browser Console Testing

Open browser console (F12) and check for:
- No JavaScript errors
- No React warnings
- Smooth state updates

## Test Data Set

Use these valid IDs for comprehensive testing:

```
Males:
9001015800081 - 36 years old
0012317000084 - 25 years old
1506159000086 - 10 years old
6211308500088 - 63 years old

Females:
9505124800082 - 30 years old
8803203200083 - 37 years old
0501014800085 - 21 years old
7508152400087 - 50 years old
```

## Success Criteria

✅ All valid IDs auto-fill DOB, Age, and Gender correctly
✅ All invalid IDs show appropriate error messages
✅ Non-numeric input is filtered out
✅ Form submission validates ID before sending to backend
✅ Modal reset clears all fields and errors
✅ Visual feedback is clear and helpful
✅ No console errors
✅ Smooth user experience

## Reporting Issues

If you find any issues, note:
1. ID number used
2. Expected behavior
3. Actual behavior
4. Browser console errors (if any)
5. Screenshots (if helpful)
