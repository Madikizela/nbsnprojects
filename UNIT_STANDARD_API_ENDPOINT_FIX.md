# Unit Standard API Endpoint Fix

## Issue Description
When trying to scan answers for summative assessments, the mobile app showed the error:
**"Unable to determine unit standard. Please try again."**

## Root Cause Analysis
The mobile app was calling the wrong API endpoint format:
- **Wrong**: `/api/Assessments/summative/unit-standard/2` (where 2 is assessmentId)
- **Correct**: `/api/Assessments/summative/2/unit-standard` (where 2 is assessmentId)

The wrong endpoint was expecting a `unitStandardId` parameter but receiving an `assessmentId`, causing the API call to fail.

## Fix Applied

### Mobile App Fix
**File**: `mobile_flutter/lib/screens/scan_question_answer_screen.dart`
**Method**: `_getProjectQualificationUnitStandardId()`

**Before**:
```dart
if (widget.assessmentType.toLowerCase() == 'formative') {
  endpoint = '/api/Assessments/formative/unit-standard/${widget.assessmentId}';
} else {
  endpoint = '/api/Assessments/summative/unit-standard/${widget.assessmentId}';
}

final response = await apiService.get(endpoint);
if (response.data != null && response.data.isNotEmpty) {
  setState(() {
    projectQualificationUnitStandardId = response.data[0]['projectQualificationUnitStandardId'];
  });
}
```

**After**:
```dart
if (widget.assessmentType.toLowerCase() == 'formative') {
  endpoint = '/api/Assessments/formative/${widget.assessmentId}/unit-standard';
} else {
  endpoint = '/api/Assessments/summative/${widget.assessmentId}/unit-standard';
}

final response = await apiService.get(endpoint);
if (response.data != null) {
  setState(() {
    projectQualificationUnitStandardId = response.data['projectQualificationUnitStandardId'];
  });
}
```

### Backend Endpoints (Already Existed)
The correct endpoints were already implemented in `backend/Controllers/AssessmentsController.cs`:

```csharp
// GET: api/Assessments/formative/{id}/unit-standard
[HttpGet("formative/{id}/unit-standard")]
public async Task<ActionResult<object>> GetFormativeAssessmentUnitStandard(int id)

// GET: api/Assessments/summative/{id}/unit-standard  
[HttpGet("summative/{id}/unit-standard")]
public async Task<ActionResult<object>> GetSummativeAssessmentUnitStandard(int id)
```

## Verification Results

### API Endpoint Testing:
```
✅ GET /api/Assessments/formative/5/unit-standard
   Response: { id: 5, projectQualificationUnitStandardId: 4 }

✅ GET /api/Assessments/summative/2/unit-standard  
   Response: { id: 2, projectQualificationUnitStandardId: 4 }
```

### Expected Mobile App Behavior:
- ✅ Formative Assessment 5 → PQUS 4 (correct)
- ✅ Summative Assessment 2 → PQUS 4 (correct)
- ✅ No more "Unable to determine unit standard" error
- ✅ Answer scanning should work for both formative and summative assessments

## Files Modified
1. `mobile_flutter/lib/screens/scan_question_answer_screen.dart` - Fixed API endpoint format
2. Mobile app rebuilt and installed with fix

## Testing Instructions
1. **Login**: azolamaphango@gmail.com / Teacher123!
2. **Navigate**: Class 4 → Ntsika Maphango → POE → Qualification → Unit Standard 1
3. **Test Formative**: Should work (already completed)
4. **Test Summative**: Should now work without "Unable to determine unit standard" error
5. **Scan Answer**: Should successfully upload and save

## Technical Notes
- The fix ensures the mobile app calls the correct REST endpoint format
- Backend endpoints return single objects, not arrays
- Data structure changed from `response.data[0]['field']` to `response.data['field']`
- Both formative and summative assessments now use consistent endpoint patterns