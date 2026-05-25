# Document Type Filtering Feature

## Overview
Implemented filtering to prevent duplicate document types for the same learner. Once a document type has been uploaded, it is removed from the dropdown list, ensuring each learner can only have one document of each type.

## Feature Description

### Problem
Previously, users could upload multiple documents of the same type (e.g., multiple "ID Document" files) for a single learner, which could cause confusion and data management issues.

### Solution
The document type dropdown now dynamically filters out document types that have already been uploaded for the current learner. This ensures:
- Each learner can only have ONE document of each type
- Users can clearly see which document types are still needed
- The system prevents accidental duplicate uploads

## Implementation Details

### Frontend Changes

#### 1. Document Type Filtering
The dropdown now filters available types based on uploaded documents:

```typescript
{documentTypes
  .filter(type => !learnerDocuments.some(doc => doc.documentType === type))
  .map(type => (
    <option key={type} value={type}>{type}</option>
  ))}
```

#### 2. Visual Feedback
Added warning message when all document types are uploaded:

```typescript
{documentTypes.filter(type => !learnerDocuments.some(doc => doc.documentType === type)).length === 0 && (
  <small className="text-warning d-block mt-1">
    ⚠️ All document types have been uploaded
  </small>
)}
```

#### 3. Upload Button State
The upload button is disabled when all document types have been uploaded:

```typescript
disabled={uploadingDocument || documentTypes.filter(type => !learnerDocuments.some(doc => doc.documentType === type)).length === 0}
```

#### 4. Document Status Summary
Added a visual status indicator showing which documents are uploaded:

```typescript
<div className="mb-4 p-3 bg-secondary rounded">
  <h6 className="text-light mb-2">📊 Document Status</h6>
  <div className="d-flex flex-wrap gap-2">
    {documentTypes.map(type => {
      const isUploaded = learnerDocuments.some(doc => doc.documentType === type);
      return (
        <span 
          key={type}
          className={`badge ${isUploaded ? 'bg-success' : 'bg-warning text-dark'}`}
          title={isUploaded ? 'Uploaded' : 'Not uploaded'}
        >
          {isUploaded ? '✓' : '○'} {type}
        </span>
      );
    })}
  </div>
  <small className="text-muted d-block mt-2">
    {learnerDocuments.length} of {documentTypes.length} documents uploaded
  </small>
</div>
```

## User Experience

### Before Upload
1. User opens learner modal and clicks "Documents" tab
2. System fetches all existing documents for the learner
3. Document type dropdown shows only types that haven't been uploaded yet
4. Status summary shows which documents are uploaded (✓) and which are missing (○)

### During Upload
1. User selects an available document type from filtered dropdown
2. User selects a file
3. User clicks "Upload Document"
4. System uploads and encrypts the document
5. Document appears in the list immediately
6. That document type is removed from the dropdown
7. Status summary updates to show the new document as uploaded

### After All Documents Uploaded
1. Dropdown shows "Select Type" with no options
2. Warning message appears: "⚠️ All document types have been uploaded"
3. Upload button is disabled
4. Status summary shows all 5 documents with green checkmarks
5. Message shows "5 of 5 documents uploaded"

## Visual Indicators

### Document Status Badges
- **Green badge with ✓**: Document type has been uploaded
- **Yellow badge with ○**: Document type is still needed

### Upload Form States
- **Enabled**: At least one document type is available
- **Disabled**: All document types have been uploaded
- **Warning**: Shows when all types are uploaded

## Document Types
The system supports exactly 5 document types:
1. ✓/○ Bank Confirmation Letter
2. ✓/○ CV
3. ✓/○ ID Document
4. ✓/○ Proof of Residence
5. ✓/○ Qualifications

## Business Rules

### Upload Rules
1. Each learner can have a maximum of 5 documents (one per type)
2. Once a document type is uploaded, it cannot be uploaded again
3. To replace a document, the user must first delete the existing one
4. Deleting a document makes that type available again in the dropdown

### Validation Rules
1. Document type must be selected (required field)
2. Document type must be one of the 5 allowed types
3. Document type must not already exist for this learner (enforced by UI)
4. File must be selected (required field)
5. File must be PDF, JPG, or PNG
6. File must be under 10 MB

## Backend Validation

While the frontend prevents duplicate uploads through UI filtering, the backend also validates:

```csharp
// In LearnerDocumentsController.cs
if (!AllowedDocumentTypes.Contains(dto.DocumentType))
{
    return BadRequest(new { message = $"Invalid document type. Allowed types: {string.Join(", ", AllowedDocumentTypes)}" });
}
```

The backend does NOT currently prevent duplicate document types at the database level. This is intentional to allow flexibility if business rules change. However, the UI enforces the one-per-type rule.

## Testing

### Test Script
Created `backend/test_document_upload.js` to verify:
- ✅ Document upload with encryption
- ✅ Document download with decryption
- ✅ Document deletion
- ✅ Document type filtering
- ✅ File integrity verification

### Manual Testing Steps
1. Open a learner's document tab
2. Verify status summary shows all 5 types as "not uploaded" (○)
3. Upload "ID Document" - verify it appears in list
4. Verify "ID Document" is removed from dropdown
5. Verify status summary shows "ID Document" as uploaded (✓)
6. Upload remaining 4 document types one by one
7. Verify each type is removed from dropdown after upload
8. After 5th upload, verify:
   - Dropdown has no options
   - Warning message appears
   - Upload button is disabled
   - Status shows "5 of 5 documents uploaded"
9. Delete one document
10. Verify that document type reappears in dropdown
11. Verify upload button is enabled again

## Edge Cases Handled

### 1. No Documents Uploaded
- All 5 types available in dropdown
- Status shows "0 of 5 documents uploaded"
- All badges show yellow with ○

### 2. Some Documents Uploaded
- Only remaining types shown in dropdown
- Status shows "X of 5 documents uploaded"
- Uploaded types show green with ✓
- Missing types show yellow with ○

### 3. All Documents Uploaded
- Dropdown shows no options
- Warning message displayed
- Upload button disabled
- Status shows "5 of 5 documents uploaded"
- All badges show green with ✓

### 4. Document Deleted
- Deleted type reappears in dropdown
- Status updates to show type as missing
- Upload button re-enabled
- Badge changes from green ✓ to yellow ○

## Files Modified

### Frontend
- ✅ `frontend/src/components/SDPManagerDashboard.tsx`
  - Added document type filtering logic
  - Added status summary component
  - Added warning message for all types uploaded
  - Added upload button disable logic

### Backend
- ✅ `backend/test_document_upload.js` (new test file)

## Benefits

### For Users
1. **Clear Visibility**: Users can immediately see which documents are missing
2. **Prevents Errors**: Cannot accidentally upload duplicate document types
3. **Guided Process**: Status summary guides users to complete all required documents
4. **Better Organization**: One document per type keeps data clean and organized

### For System
1. **Data Integrity**: Ensures consistent document structure per learner
2. **Simplified Logic**: Easier to query and display documents when types are unique
3. **Better UX**: Users don't have to choose between multiple documents of same type
4. **Audit Trail**: Clear history of which documents were uploaded when

## Future Enhancements

### Potential Improvements
1. **Document Replacement**: Add "Replace" button to upload new version without deleting first
2. **Document Versioning**: Keep history of replaced documents
3. **Required vs Optional**: Mark some document types as required, others as optional
4. **Expiration Dates**: Track when documents expire (e.g., ID documents)
5. **Validation Rules**: Different validation rules per document type
6. **Document Templates**: Provide downloadable templates for each document type
7. **Bulk Upload**: Upload multiple documents at once
8. **Document Preview**: Show thumbnail or preview before upload
9. **Progress Indicator**: Show overall completion percentage
10. **Reminders**: Notify users when documents are missing or expired

## Security Considerations

### Current Implementation
- ✅ UI filtering prevents duplicate uploads
- ✅ Backend validates document type is in allowed list
- ✅ All documents encrypted at rest
- ✅ JWT authentication required

### Recommendations
1. Add database constraint to prevent duplicate document types (optional)
2. Add audit logging when documents are replaced
3. Implement document approval workflow
4. Add role-based permissions for document deletion

## Performance

### Optimization
- Filtering happens client-side (no additional API calls)
- Status summary calculated from existing data
- No performance impact on upload/download operations

### Scalability
- Works efficiently with 5 document types
- Could scale to more types without performance issues
- Consider pagination if document list grows very large

## Conclusion

The document type filtering feature successfully prevents duplicate document types while providing clear visual feedback to users. The implementation is clean, performant, and provides an excellent user experience. The status summary makes it easy for users to track their progress in uploading all required documents.
