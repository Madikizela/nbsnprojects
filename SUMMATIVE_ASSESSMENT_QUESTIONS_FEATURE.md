# Summative Assessment Questions Feature

## Overview
Implemented the ability to add multiple questions to summative assessments, matching the functionality of formative assessments. Each question includes a question number, question text, and allocated marks.

## Database Changes

### New Table: SummativeAssessmentQuestions
```sql
CREATE TABLE "SummativeAssessmentQuestions" (
    "Id" SERIAL PRIMARY KEY,
    "SummativeAssessmentId" INTEGER NOT NULL,
    "QuestionNumber" INTEGER NOT NULL,
    "QuestionText" TEXT NOT NULL,
    "AllocatedMarks" DECIMAL(5,2) NOT NULL,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT "FK_SummativeAssessmentQuestions_SummativeAssessments"
        FOREIGN KEY ("SummativeAssessmentId")
        REFERENCES "SummativeAssessments"("Id")
        ON DELETE CASCADE,
    
    CONSTRAINT "UQ_SummativeAssessment_QuestionNumber"
        UNIQUE ("SummativeAssessmentId", "QuestionNumber")
);
```

## Backend Changes

### 1. New Model: SummativeAssessmentQuestion.cs
- Located in: `backend/Models/SummativeAssessmentQuestion.cs`
- Maps to `SummativeAssessmentQuestions` table
- Properties:
  - Id
  - SummativeAssessmentId
  - QuestionNumber
  - QuestionText
  - AllocatedMarks
  - CreatedAt
  - UpdatedAt

### 2. Updated DTOs: AssessmentDTOs.cs
Updated `CreateSummativeAssessmentDto` to include:
- `List<AssessmentQuestionDto> Questions`

### 3. Updated Controller: AssessmentsController.cs
Modified `CreateSummativeAssessment` method to:
1. Save the summative assessment
2. Loop through the questions list
3. Create and save each `SummativeAssessmentQuestion` record
4. Link questions to the assessment via `SummativeAssessmentId`

### 4. Updated ApplicationDbContext.cs
- Added `DbSet<SummativeAssessmentQuestion> SummativeAssessmentQuestions`

## Frontend Changes

### 1. State Management (SDPManagerDashboard.tsx)
Added new state:
```typescript
const [summativeQuestions, setSummativeQuestions] = useState<Array<{
  questionNumber: number,
  questionText: string,
  allocatedMarks: string
}>>([]);
```

### 2. Questions UI in Summative Modal
Added dynamic question management section with same features as formative:
- "Add Question" button to add new questions
- Live total marks calculator
- Each question displays:
  - Question number (auto-numbered)
  - Textarea for question text
  - Number input for allocated marks
  - Remove button (×) to delete question
- Questions are automatically renumbered when one is removed
- Summary box showing total questions and marks

### 3. Form Submission
Updated `handleAddSummativeAssessment` to:
- Validate questions (text not empty, marks > 0)
- Include questions array in the API request
- Map questions to correct format with parsed marks
- Reset questions state after successful submission
- Show success message with question count and total marks

### 4. Modal Cleanup
Updated modal close handlers to reset questions:
- Close button (×)
- Cancel button
- After successful submission

## Testing

### Test Script: test_summative_with_questions.js
Created comprehensive test that:
1. Logs in as QA manager
2. Creates a summative assessment with 3 questions
3. Verifies questions were saved to database
4. Displays summary with status and total marks

### Test Results
```
✅ Test completed successfully!
Summary:
  - Assessment ID: 1
  - Status: Competent
  - Questions saved: 3
  - Total marks: 100
```

## Features

### Question Management
- Auto-numbering: Questions numbered sequentially (1, 2, 3...)
- Auto-renumbering: When a question is removed, remaining questions are renumbered
- Validation: Question text and marks are required fields
- Marks precision: Supports decimal marks (e.g., 12.5)
- Step increment: 0.5 for easier input
- Minimum value: 0 (prevents negative marks)

### Visual Enhancements
- Live total marks calculator at top
- Summary box at bottom showing total questions and marks
- Info alert when no questions added
- Textarea for longer question text (2 rows)
- Labels for each field with asterisk for required
- Better styling with borders and padding
- Success message shows question count and total marks

### Validation
- Ensures all questions have non-empty text
- Validates all marks are greater than 0
- Trims whitespace from question text before saving
- Shows helpful error message if validation fails

## Files Modified

### Backend
- `backend/create_summative_assessment_questions_table.sql` - Table creation script
- `backend/Models/SummativeAssessmentQuestion.cs` - New model
- `backend/Models/DTOs/AssessmentDTOs.cs` - Added questions to DTO
- `backend/Controllers/AssessmentsController.cs` - Save questions logic
- `backend/Models/ApplicationDbContext.cs` - Added DbSet

### Frontend
- `frontend/src/components/SDPManagerDashboard.tsx` - Questions UI and logic

### Test Scripts
- `backend/test_summative_with_questions.js` - Integration test
- `backend/create_summative_questions.js` - Table creation script

## Usage

### Adding Questions to Summative Assessment
1. Click "Add Summative Assessment" button on a unit standard
2. Fill in assessment details (date, scores, status, assessor, moderator, comments)
3. Click "+ Add Question" button in the Assessment Questions section
4. Enter question text and allocated marks
5. Repeat for additional questions
6. Questions are automatically numbered
7. Remove unwanted questions using the × button
8. View live total in the summary box
9. Submit the form

## Comparison with Formative Assessment

Both formative and summative assessments now have identical question functionality:
- Same UI/UX for adding questions
- Same validation rules
- Same total marks calculator
- Same auto-numbering and renumbering
- Same database structure pattern

## Data Integrity

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
- Question bank for reuse across assessments
- Rubrics and marking criteria per question
