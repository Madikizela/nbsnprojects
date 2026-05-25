# Learner View/Edit Feature Implementation

## Overview
Replaced the delete button with a view/edit button that opens a modal with two tabs: Learner Information and Documents.

## Changes Made

### 1. State Management
Added new state variables for the learner modal:
- `showLearnerModal`: Controls modal visibility
- `selectedLearner`: Stores the currently selected learner
- `learnerModalTab`: Tracks active tab ('info' or 'documents')
- `editLearnerForm`: Form data for editing learner information
- `learnerDocuments`: Array of uploaded documents (placeholder)
- `uploadingDocument`: Loading state for document uploads

### 2. Functions

#### `handleViewLearner(learner: Learner)`
- Opens the modal with the selected learner's information
- Populates the edit form with current learner data
- Sets the active tab to 'info'

#### `handleUpdateLearner(e: React.FormEvent)`
- Submits updated learner information to the API
- Updates local state with new data
- Shows success/error messages
- Closes modal on success

#### `handleUploadDocument(e: React.FormEvent)`
- Placeholder for document upload functionality
- To be implemented with actual file upload logic

### 3. UI Changes

#### Learner Table
- Replaced delete button (🗑️) with view button (👁️ View)
- Button style changed from `btn-outline-danger` to `btn-outline-primary`
- Button text: "View/Edit learner"

#### Learner Modal
Two-tab interface:

**Tab 1: Learner Information**
- All learner fields are editable except:
  - ID Number (read-only, cannot be changed)
  - Date of Birth (read-only, derived from ID)
  - Age (read-only, calculated from DOB)
- Update button at the bottom
- Cancel button to close without saving

**Tab 2: Documents**
- Document upload form with:
  - Document type dropdown (ID Document, Matric Certificate, Proof of Address, Bank Statement, Other)
  - File input (accepts .pdf, .jpg, .jpeg, .png)
  - Upload button
- List of uploaded documents with:
  - Document type
  - File name
  - Upload date
  - View button to open document
- Empty state message when no documents exist

### 4. Form Sections in Info Tab

1. **Personal Information**
   - Title, First Name, Last Name
   - ID Number (read-only)
   - Contact Number, Email
   - Date of Birth (read-only), Age (read-only)
   - Gender, Race, Home Language

2. **Address Information**
   - Address Line 1, 2, 3
   - Postal Code

3. **Education Information**
   - High School Name
   - Year of Completion
   - School Location
   - Highest Grade Passed

4. **Next of Kin Information**
   - Name, Relation, Contact Number

5. **Bank Information**
   - Bank Name, Account Type
   - Account Number, Branch Code

## API Endpoints Used

### Update Learner
```
PUT /api/Learners/{id}
```
Updates learner information (excluding enrollment data).

## Future Enhancements

### Document Management
The document upload functionality is currently a placeholder. To implement:

1. **Backend Requirements**
   - Create `LearnerDocuments` table
   - Add document upload endpoint
   - Implement file storage (local or cloud)
   - Add document retrieval endpoint
   - Add document deletion endpoint

2. **Frontend Implementation**
   - Implement actual file upload with FormData
   - Add document preview/download functionality
   - Add document deletion capability
   - Show upload progress
   - Handle file size limits and validation

### Suggested Database Schema for Documents
```sql
CREATE TABLE "LearnerDocuments" (
    "Id" SERIAL PRIMARY KEY,
    "LearnerId" INTEGER NOT NULL REFERENCES "Learners"("Id"),
    "DocumentType" VARCHAR(100) NOT NULL,
    "FileName" VARCHAR(255) NOT NULL,
    "FilePath" VARCHAR(500) NOT NULL,
    "FileSize" BIGINT NOT NULL,
    "MimeType" VARCHAR(100) NOT NULL,
    "UploadedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UploadedByUserId" INTEGER REFERENCES "Users"("Id"),
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## Testing

### Manual Testing Steps
1. Navigate to a project with classes and learners
2. Expand a class to view learners
3. Click the "👁️ View" button on any learner
4. Verify the modal opens with learner information
5. Edit some fields and click "Update Learner"
6. Verify the changes are saved and reflected in the table
7. Click the "Documents" tab
8. Verify the upload form is displayed
9. Verify the empty state message appears

### Test Cases
- ✅ View button opens modal with correct learner data
- ✅ All editable fields can be modified
- ✅ Read-only fields (ID, DOB, Age) cannot be changed
- ✅ Update button saves changes successfully
- ✅ Cancel button closes modal without saving
- ✅ Tab switching works correctly
- ✅ Documents tab shows upload form
- ⏳ Document upload (to be implemented)
- ⏳ Document list display (to be implemented)
- ⏳ Document viewing (to be implemented)

## Files Modified
- `frontend/src/components/SDPManagerDashboard.tsx`
  - Added new state variables
  - Removed `handleDeleteLearner` function
  - Added `handleViewLearner` function
  - Added `handleUpdateLearner` function
  - Added `handleUploadDocument` placeholder
  - Replaced delete button with view button
  - Added learner view/edit modal with tabs

## Notes
- The delete functionality has been completely removed
- Learners can only be viewed and edited, not deleted
- Document management is a placeholder for future implementation
- All form validation from the add learner form is preserved in the edit form
- The modal uses the same styling as other modals in the application
