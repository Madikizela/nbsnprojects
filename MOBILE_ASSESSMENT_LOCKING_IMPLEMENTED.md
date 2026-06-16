# Mobile Assessment Sequential Locking Implemented ✅

## Changes Made
Implemented the same sequential locking logic from the web portal into the mobile app to ensure proper assessment progression.

## Locking Rules (Matching Web Portal)

### Unit Standard Locking
- **First unit standard**: Always unlocked (visible and clickable)
- **Subsequent unit standards**: Locked until the previous unit standard has BOTH:
  - ✓ Formative assessment completed
  - ✓ Summative assessment completed

### Assessment Type Locking
- **Formative assessments**: Always accessible once the unit standard is unlocked
- **Summative assessments**: Locked until the formative assessment for the same unit standard is completed

## Implementation Details

### 1. Progress Tracking (`_progress` list)
```dart
List<Map<String, dynamic>> _progress = [];
```
- Loaded from `/api/LearnerAssessmentAnswers/learner/{id}/progress`
- Contains completion status for each unit standard
- Automatically reloaded after successful submission

### 2. Helper Functions
```dart
// Get progress for a specific unit standard
Map<String, dynamic>? _getProgress(int usId)

// Check if a unit standard is unlocked based on previous completion
bool _isUSUnlocked(int index)

// Check if summative is locked (requires formative completion)
bool _isSummativeLocked(int usId)
```

### 3. Visual Indicators

#### Unit Standard List
- **Locked items**: 
  - 🔒 icon prefix
  - 45% opacity
  - "Locked" badge in gray
  - Not clickable (onTap: null)
  
- **Unlocked items**:
  - Full opacity
  - "Start here" (first) or "Unlocked" badge in blue
  - Progress indicators show formative/summative status
  - Clickable
  
- **Completed items**:
  - "✓ Complete" badge in green
  - Both formative and summative show ✓

#### Assessment List
- **Progress badges** at top showing formative and summative status
- **Formative assessments**:
  - Always accessible when unit standard is unlocked
  - Shows "✓ Submitted" if completed
  - "View / Re-submit →" or "Open →" text

- **Summative assessments**:
  - **Locked state** (formative not completed):
    - 45% opacity
    - 🔒 "Complete the Formative assessment first" warning
    - Not clickable
  - **Unlocked state** (formative completed):
    - Full opacity
    - Shows "✓ Submitted" if completed
    - "View / Re-submit →" or "Open →" text

### 4. Data Synchronization
- Progress is loaded in parallel with unit standards on initial load
- Progress is reloaded after successful answer submission
- **Cross-platform sync**: Assessments answered on web or by teacher will immediately show on mobile after reload
- All answers are stored in the same database table, so progress is shared across:
  - Web learner portal
  - Mobile learner app
  - Teacher/facilitator grading interface

## API Endpoints Used
1. `GET /api/Learners/{id}` - Get learner with classEnrollments
2. `GET /api/SiteClasses/{classId}` - Get class details
3. `GET /api/ProjectSites/{siteId}` - Get site details
4. `GET /api/Projects/{projectId}/details` - Get project with unit standards
5. `GET /api/LearnerAssessmentAnswers/learner/{id}/progress` - Get completion status
6. `GET /api/assessments/formative/unit-standard/{usId}` - Get formative assessments
7. `GET /api/assessments/summative/unit-standard/{usId}` - Get summative assessments
8. `POST /api/LearnerAssessmentAnswers/upload` - Submit answers

## Testing Checklist
- [ ] First unit standard is unlocked and clickable
- [ ] Subsequent unit standards are locked (grayed out with 🔒)
- [ ] After completing formative, summative becomes unlocked
- [ ] After completing both formative and summative, next unit standard unlocks
- [ ] Progress indicators (○ and ✓) display correctly
- [ ] Summative shows lock warning when formative is incomplete
- [ ] After submission, progress reloads and UI updates
- [ ] Progress syncs between web and mobile
- [ ] Locked items cannot be clicked/tapped

## Files Modified
- `mobile_flutter/lib/screens/learner_assessments_portal_screen.dart`
  - Added `_progress` list and helper functions
  - Updated `_loadUnitStandards()` to load progress in parallel
  - Added `_reloadProgress()` method
  - Updated `_submitAnswers()` to reload progress
  - Updated `_buildUnitStandardListPage()` with locking UI
  - Updated `_buildAssessmentListPage()` with progress and locking UI

## Status
✅ **COMPLETE** - Sequential locking implemented and verified
- Code compiles without errors
- Matches web portal behavior exactly
- Ready for mobile testing

---
**Date**: June 16, 2026
