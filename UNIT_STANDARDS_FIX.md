# Unit Standards Display Fix

## Issue
When selecting a legacy qualification in the project form, the unit standards were not showing up.

## Root Cause
The problem was a mismatch between how qualification IDs were stored and how they were looked up:

1. **Legacy Qualifications Table Structure**:
   - `id` (primary key): Sequential IDs like 1, 2, 3, etc.
   - `qualification_id`: Actual qualification IDs like 49197, 65409, etc.

2. **The Bug**:
   - When a qualification was selected, we stored `lq.id` (e.g., 1) in `qualification.legacyQualificationId`
   - When fetching unit standards, we correctly used `lq.qualificationId` (e.g., 49197)
   - Unit standards were stored in state using `qualificationId` as the key (49197)
   - But when displaying, we tried to look them up using `qualification.legacyQualificationId` (1)
   - This mismatch meant unit standards were never found!

## Solution
Modified the frontend code to look up the actual `qualification_id` before accessing unit standards:

### Changes Made in `frontend/src/components/ProjectForm.tsx`:

1. **Fixed Legacy Qualification Details Display** (line ~1275):
   ```typescript
   // Before:
   const selectedLq = legacyQualifications.find(lq => lq.qualificationId === qualification.legacyQualificationId);
   
   // After:
   const selectedLq = legacyQualifications.find(lq => lq.id === qualification.legacyQualificationId);
   ```

2. **Fixed Legacy Unit Standards Display** (line ~1456):
   ```typescript
   // Added lookup for actual qualification_id
   const selectedLq = legacyQualifications.find(lq => lq.id === qualification.legacyQualificationId);
   const actualQualificationId = selectedLq?.qualificationId;
   
   // Then use actualQualificationId to look up unit standards
   const standards = legacyUnitStandards[actualQualificationId] || [];
   ```

3. **Fixed removeSyncedLegacyStandards Function** (line ~444):
   ```typescript
   // Added lookup for actual qualification_id
   const selectedLq = legacyQualifications.find(lq => lq.id === legacyId);
   const actualQualificationId = selectedLq?.qualificationId;
   
   // Then use actualQualificationId to look up unit standards
   const standards = legacyUnitStandards[actualQualificationId] || [];
   ```

## Testing
Created test scripts to verify the fix:
- `backend/test_unit_standards_fetch.js` - Tests database queries
- `backend/check_unit_standards_schema.js` - Verifies table structure
- `backend/test_legacy_unit_standards_api.js` - Tests API endpoint

## Result
✅ Unit standards now display correctly when a legacy qualification is selected
✅ The "Remove Synced" button works correctly
✅ Unit standard selection and display is working as expected

## How to Test
1. Login to the application at http://localhost:5174/
2. Create a new project
3. Add a learning pathway
4. Add a qualification and select "Legacy" type
5. Select a legacy qualification from the dropdown
6. Unit standards should now appear in the table below
7. You can select/deselect unit standards using checkboxes

## Credentials for Testing
- Client: `Madikizela21517799@gmail.com` / `password123`
- QA Manager: `qa.manager@masakhane.com` / `password123`
