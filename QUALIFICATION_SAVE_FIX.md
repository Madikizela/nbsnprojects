# Qualification Save Fix - Summary

## 🔍 Problem Identified

When creating projects, qualifications were being saved but:
1. ✅ Employment Type was saved correctly
2. ✅ Number of Beneficiaries was saved correctly
3. ❌ Qualification names showed as "Unknown"
4. ❌ Unit standards might not load correctly

## 🐛 Root Cause

The `legacy_qualifications` table has two ID fields:
- `id` (primary key) - e.g., 1, 2, 3...
- `qualification_id` (actual qualification ID) - e.g., 49197, 65409...

**The Problem:**
- Frontend dropdown was sending `qualification_id` (49197)
- Backend was storing it in `LegacyQualificationId` column
- But the foreign key expects `id` (1), not `qualification_id` (49197)
- This caused the JOIN to fail, showing "Unknown" for qualification names

## ✅ Solution Applied

### Fixed Legacy Qualification Dropdown

**Before:**
```typescript
<option key={lq.id} value={lq.qualificationId}>
```
This sent `qualification_id` (49197) which didn't match the foreign key.

**After:**
```typescript
<option key={lq.id} value={lq.id}>
```
Now sends `id` (1) which correctly matches the foreign key.

### Fixed Unit Standards Fetching

Since the unit standards API expects `qualification_id` (not `id`), we updated the onChange handler to:
1. Save `lq.id` to the qualification
2. Find the selected qualification's `qualification_id`
3. Fetch unit standards using the correct `qualification_id`

**Code:**
```typescript
onChange={(e) => {
  const selectedId = e.target.value ? parseInt(e.target.value) : undefined;
  updateQualification(pathwayIndex, qualIndex, 'legacyQualificationId', selectedId);
  if (selectedId) {
    const selectedQual = filteredLegacyQualifications.find(lq => lq.id === selectedId);
    if (selectedQual?.qualificationId) {
      fetchLegacyUnitStandards(selectedQual.qualificationId);
    }
  }
}}
```

## 📊 Database Structure Reference

### legacy_qualifications Table:
| Column | Type | Example | Purpose |
|--------|------|---------|---------|
| id | integer (PK) | 1 | Primary key for foreign keys |
| qualification_id | integer | 49197 | Actual qualification ID |
| name | varchar | "FET Certificate..." | Qualification name |

### ProjectQualifications Table:
| Column | Type | Links To |
|--------|------|----------|
| Id | integer (PK) | - |
| LegacyQualificationId | integer (FK) | legacy_qualifications.id |
| EmploymentType | varchar | - |
| NumberOfBeneficiaries | integer | - |

## 🧪 Testing

### To Verify the Fix:

1. **Create a new project**:
   - Login at http://localhost:5173
   - Go to Projects → Add New Project
   - Add a learning pathway
   - Add a Legacy qualification
   - Set employment type and beneficiaries
   - Save the project

2. **Check the database**:
   ```bash
   cd backend
   node check_all_projects.js
   ```

3. **Expected Result**:
   - ✅ Qualification name should show correctly (not "Unknown")
   - ✅ Employment type should be saved
   - ✅ Number of beneficiaries should be saved
   - ✅ Unit standards should load when qualification is selected

## 📝 Note on Occupational Qualifications

Occupational qualifications don't have this issue because:
- The `occupational_qualifications` table uses `qualification_id` as the primary key
- So there's no mismatch between the dropdown value and the foreign key

## ✅ Status

- **Frontend Updated**: ✅ Yes
- **Fix Applied**: ✅ Yes
- **Services Restarted**: ✅ Yes
- **Ready to Test**: ✅ Yes

## 🎯 Next Steps

1. **Test creating a new project** with legacy qualifications
2. **Verify qualification names** appear correctly
3. **Check unit standards** load properly
4. **Create phases** for the project to ensure qualifications are selectable

---

**Fix Applied**: ✅ Complete
**Frontend Restarted**: ✅ Yes
**Ready for Testing**: ✅ Yes
