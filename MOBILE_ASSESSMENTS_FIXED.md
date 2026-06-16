# Mobile Assessments Screen Fixed ✅

## Issue
The mobile app's assessments screen was showing "No unit standards found. Contact your facilitator" while the web portal displayed assessments correctly.

## Root Cause
The mobile app was attempting to call a **non-existent API endpoint**: `/api/Learners/{id}/classes`

The backend's `LearnersController` does NOT have this endpoint. Instead, it provides:
- `GET /api/Learners/{id}` - Returns learner with embedded `classEnrollments`

## Solution
Updated `learner_assessments_portal_screen.dart` to match the web portal's implementation:

### Before (Broken):
```dart
// Called non-existent endpoint
final classesR = await _api.get('/api/Learners/$id/classes');
final classes = classesR.data as List? ?? [];
final classId = classes[0]['siteClassId'];
```

### After (Fixed):
```dart
// Step 1: Get learner record with embedded classEnrollments
final learnerR = await _api.get('/api/Learners/$id');
final learner = learnerR.data as Map<String, dynamic>? ?? {};

final enrollments = learner['classEnrollments'] as List? ?? [];

// Step 2: Use the first active enrollment's siteClassId
final active = enrollments.firstWhere(
  (e) => e['status'] == 'Active',
  orElse: () => enrollments[0],
);
final classId = active['siteClassId'] ?? active['siteClass']?['id'];
```

## Data Flow (Now Correct)
1. **GET** `/api/Learners/{id}` → Learner with classEnrollments
2. Extract `siteClassId` from active enrollment
3. **GET** `/api/SiteClasses/{classId}` → projectSiteId
4. **GET** `/api/ProjectSites/{siteId}` → projectId
5. **GET** `/api/Projects/{projectId}/details` → learningPathways → qualifications → unitStandards

## Testing
- ✅ Flutter analyze passed with no issues
- Ready for mobile testing on device/emulator

## Files Modified
- `mobile_flutter/lib/screens/learner_assessments_portal_screen.dart` (lines 39-47)

## Next Steps
1. Rebuild the Flutter app
2. Test on mobile device/emulator
3. Verify unit standards now display correctly
4. Verify assessments can be opened and completed

---
**Status**: FIXED ✅
**Date**: June 16, 2026
