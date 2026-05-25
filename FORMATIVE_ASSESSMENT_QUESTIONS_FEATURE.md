# Formative Assessment Questions Feature

## Overview
Implemented the ability to add multiple questions to formative assessments. Each question includes a question number, question text, and allocated marks.

## Database Changes

### New Table: FormativeAssessmentQuestions
```sql
CREATE TABLE "FormativeAssessmentQuestions" (
    "Id" SERIAL PRIMARY KEY,
    "FormativeAssessmentId" INTEGER NOT NULL,
    "QuestionNumber" INTEGER NOT NULL,
    "QuestionText" TEXT NOT NULL,
    "AllocatedMarks" DECIMAL(5,2) NOT NULL,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT "FK_FormativeAssessmentQuestions_FormativeAssessments"
        FOREIGN KEY ("FormativeAssessmentId")
        REFERENCES "FormativeAssessments"("Id")
        ON DELETE CASCADE,
    
    CONSTRAINT "UQ_FormativeAssessment_QuestionNumber"
        UNIQUE ("FormativeAssessmentId", "QuestionNumber")
);
```

### Legacy AssessmentQuestions Table
The existing `AssessmentQuestions` table is used by the legacy `UnitStandardAssessment` system and was preserved. Created a separate `FormativeAssessmentQuestions` table to avoid conflicts.

## Backend Changes

### 1. New Model: FormativeAssessmentQuestion.cs
- Located in: `backend/Models/FormativeAssessmentQuestion.cs`
- Maps to `FormativeAssessmentQuestions` table
- Properties:
  - Id
  - FormativeAssessmentId
  - QuestionNumber
  - QuestionText
  - AllocatedMarks
  - CreatedAt
  - UpdatedAt

### 2. Updated DTOs: AssessmentDTOs.cs
Added new DTO classes:
- `AssessmentQuestionDto`: For transferring question data
  - QuestionNumber (int)
  - QuestionText (string)
  - AllocatedMarks (decimal)

- Updated `CreateFormativeAssessmentDto` to include:
  - `List<AssessmentQuestionDto> Questions`

### 3. Updated Controller: AssessmentsController.cs
Modified `CreateFormativeAssessment` method to:
1. Save the formative assessment
2. Loop through the questions list
3. Create and save each `FormativeAssessmentQuestion` record
4. Link questions to the assessment via `FormativeAssessmentId`

### 4. Updated ApplicationDbContext.cs
- Added `DbSet<FormativeAssessmentQuestion> FormativeAssessmentQuestions`
- Added `DbSet<AssessmentQuestion> AssessmentQuestions` for legacy system

## Frontend Changes

### 1. State Management (SDPManagerDashboard.tsx)
Added new state:
```typescript
const [formativeQuestions, setFormativeQuestions] = useState<Array<{
  questionNumber: number,
  questionText: string,
  allocatedMarks: string
}>>([]);
```

### 2. Questions UI in Formative Modal
Added dynamic question management section:
- "Add Question" button to add new questions
- Each question displays:
  - Question number (auto-numbered)
  - Text input for question text
  - Number input for allocated marks
  - Remove button (×) to delete question
- Questions are automatically renumbered when one is removed

### 3. Form Submission
Updated `handleAddFormativeAssessment` to:
- Include questions array in the API request
- Map questions to correct format with parsed marks
- Reset questions state after successful submission

### 4. Modal Cleanup
Updated modal close handlers to reset questions:
- Close button (×)
- Cancel button
- After successful submission

## Testing

### Test Script: test_formative_with_questions.js
Created comprehensive test that:
1. Logs in as QA manager
2. Creates a formative assessment with 3 questions
3. Verifies questions were saved to database
4. Displays summary with total marks

### Test Results
```
✅ Test completed successfully!
Summary:
  - Assessment ID: 4
  - Questions saved: 3
  - Total marks: 100
```

## Usage

### Adding Questions to Formative Assessment
1. Click "Add Formative Assessment" button on a unit standard
2. Fill in assessment details (date, method, score, etc.)
3. Click "+ Add Question" button
4. Enter question text and allocated marks
5. Repeat for additional questions
6. Questions are automatically numbered
7. Remove unwanted questions using the × button
8. Submit the form

### Question Features
- Auto-numbering: Questions are numbered sequentially (1, 2, 3...)
- Auto-renumbering: When a question is removed, remaining questions are renumbered
- Validation: Question text and marks are required fields
- Marks precision: Supports decimal marks (e.g., 12.5)

## Files Modified

### Backend
- `backend/create_assessment_questions_table.sql` - Table creation script
- `backend/Models/FormativeAssessmentQuestion.cs` - New model
- `backend/Models/AssessmentQuestion.cs` - Legacy model (recreated)
- `backend/Models/DTOs/AssessmentDTOs.cs` - Added question DTOs
- `backend/Controllers/AssessmentsController.cs` - Save questions logic
- `backend/Models/ApplicationDbContext.cs` - Added DbSets

### Frontend
- `frontend/src/components/SDPManagerDashboard.tsx` - Questions UI and logic

### Test Scripts
- `backend/test_formative_with_questions.js` - Integration test
- `backend/recreate_assessment_questions.js` - Table recreation script
- `backend/check_assessment_tables.js` - Table verification script

## Notes

### Table Naming
- Used `FormativeAssessmentQuestions` instead of `AssessmentQuestions` to avoid conflict with legacy assessment system
- Legacy `AssessmentQuestions` table uses `UnitStandardAssessmentId`
- New `FormativeAssessmentQuestions` table uses `FormativeAssessmentId`

### Data Integrity
- Foreign key constraint ensures questions are deleted when assessment is deleted (CASCADE)
- Unique constraint prevents duplicate question numbers within same assessment
- Question numbers must be unique per assessment

## Future Enhancements
- Display saved questions when viewing assessment details
- Edit existing questions
- Reorder questions via drag-and-drop
- Question templates/library
- Import questions from previous assessments
- Export questions to PDF
