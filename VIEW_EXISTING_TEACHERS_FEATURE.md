# View Existing Teachers Feature

## Overview

Updated the "Add Teacher" button to intelligently show different content based on whether the class already has teachers assigned.

## New Behavior

### When Class Has NO Teachers
- Shows the create teacher form (First Name, Last Name, Email)
- Same as before

### When Class HAS Teachers
- Shows a list of all assigned teachers with their information
- Each teacher card displays:
  - Teacher name (with person icon)
  - Email address (with email icon)
  - Assignment date (with calendar icon)
  - "Remove Teacher" button (red)
- Bottom of dialog has "Add Another Teacher" button
- Allows multiple teachers per class

## Teacher Information Card

Each teacher is displayed in a card with:
- **Purple border** to match app theme
- **Dark background** (Color: 0xFF334155)
- **Teacher details**:
  - Name (bold, white text)
  - Email (gray text with icon)
  - Assignment date (small gray text)
- **Remove button** (red, full width)

## Features

### 1. View Teachers
- Tap "Add Teacher" button
- If teachers exist, see their information
- Multiple teachers shown in scrollable list

### 2. Remove Teacher
- Tap "Remove Teacher" button on any teacher card
- Confirmation via API call
- Success message shown
- Dialog closes automatically

### 3. Add Another Teacher
- Tap "Add Another Teacher" button at bottom
- Opens the create teacher form
- Allows assigning multiple teachers to one class

### 4. Close Dialog
- "Close" button at bottom
- Returns to classes screen

## User Flow

```
Tap "Add Teacher" Button
    ↓
Check if class has teachers
    ↓
┌─────────────────────┬──────────────────────┐
│   Has Teachers      │   No Teachers        │
├─────────────────────┼──────────────────────┤
│ Show teacher list   │ Show create form     │
│ with details        │ (First Name, etc.)   │
│                     │                      │
│ Options:            │ Options:             │
│ - Remove teacher    │ - Create & assign    │
│ - Add another       │ - Cancel             │
│ - Close             │                      │
└─────────────────────┴──────────────────────┘
```

## API Endpoints Used

### 1. Get Class Teachers
```
GET /api/Attendance/class/{classId}/teachers
```
Returns list of teachers assigned to the class.

### 2. Remove Teacher
```
DELETE /api/Attendance/class-teacher/{assignmentId}
```
Removes teacher assignment from class.

### 3. Create and Assign Teacher
```
POST /api/Attendance/create-and-assign-teacher
```
Creates new teacher and assigns to class (existing endpoint).

## UI Components

### Teacher List Dialog
- Title: "Teachers for [Class Name]"
- Dark theme background
- Scrollable content
- Purple accent colors

### Teacher Card
- Purple border (1px)
- Dark gray background
- Icon + text layout
- Full-width remove button

### Action Buttons
- "Add Another Teacher" - Purple, with person_add icon
- "Remove Teacher" - Red, with delete icon
- "Close" - Text button, gray

## Error Handling

### Loading Teachers
- Shows error snackbar if API fails
- Falls back to create form if error occurs

### Removing Teacher
- Shows success message on successful removal
- Shows error message if removal fails
- Dialog closes on success

## Multiple Teachers Support

The system now supports multiple teachers per class:
- Each teacher has their own assignment record
- All teachers can see the class in their dashboard
- All teachers can track attendance for the class
- Teachers can be added/removed independently

## Files Modified

### Mobile App
- `mobile_flutter/lib/screens/classes_screen.dart`
  - Added `_showAddTeacherDialog` - checks for existing teachers
  - Added `_showCreateTeacherForm` - shows create form
  - Added `_removeTeacher` - removes teacher assignment
  - Updated UI to show teacher information cards

### Backend
- No changes needed - endpoints already exist

## Testing

### To Test:
1. Open mobile app
2. Navigate to a class
3. Tap "Add Teacher" button

**If class has no teachers:**
- Should show create form

**If class has teachers:**
- Should show list of teachers
- Should show teacher details (name, email, date)
- Should have "Remove Teacher" button for each
- Should have "Add Another Teacher" button at bottom

4. Try removing a teacher
5. Try adding another teacher
6. Verify multiple teachers can be assigned

## Current Status

✅ View existing teachers implemented
✅ Remove teacher functionality added
✅ Add another teacher option added
✅ Multiple teachers per class supported
✅ Mobile app rebuilt and installed
✅ Ready to test on device

## Next Steps

Future enhancements could include:
- Edit teacher information
- Set primary/secondary teacher roles
- Teacher permissions per class
- Bulk teacher assignment
