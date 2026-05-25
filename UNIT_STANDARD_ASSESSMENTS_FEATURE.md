# Unit Standard Assessments Feature

## Overview
Enhanced the unit standards display to make each unit standard expandable, revealing three assessment sections:
1. **Formative Assessment** - Track ongoing learning progress
2. **Summative Assessment** - Final evaluation of competence
3. **Logbook** - Record practical activities

## User Interface Changes

### Before
Unit standards were displayed in a simple table format:
```
Unit Standard | Level | Credits | Type
```

### After
Unit standards are now displayed as expandable accordion items. Each unit standard shows:
- **Header (Collapsed)**:
  - Unit standard name
  - Level badge
  - Credits badge
  - Type badge (Legacy/Occupational)

- **Expanded Content**:
  - Three cards side-by-side for:
    1. Formative Assessment (Blue header)
    2. Summative Assessment (Green header)
    3. Logbook (Yellow header)

## Implementation Details

### Frontend Changes
**File**: `frontend/src/components/SDPManagerDashboard.tsx`

**Changes Made**:
1. Replaced table display with Bootstrap accordion component
2. Each unit standard is an accordion item
3. Added three assessment cards in the expanded section
4. Used Bootstrap 5 accordion with dark theme styling

### Component Structure
```tsx
<div className="accordion">
  {unitStandards.map((us, index) => (
    <div className="accordion-item">
      <h2 className="accordion-header">
        <button className="accordion-button">
          {/* Unit Standard Name and Badges */}
        </button>
      </h2>
      <div className="accordion-collapse">
        <div className="accordion-body">
          <div className="row">
            {/* Formative Assessment Card */}
            {/* Summative Assessment Card */}
            {/* Logbook Card */}
          </div>
        </div>
      </div>
    </div>
  ))}
</div>
```

## Features

### Accordion Behavior
- ✅ Click to expand/collapse each unit standard
- ✅ Only one unit standard expanded at a time (accordion behavior)
- ✅ Smooth transitions
- ✅ Dark theme consistent with dashboard

### Assessment Cards
Each card includes:
- **Header** with icon and title
- **Description** of the assessment type
- **Add Button** to create new assessment/entry
- **Status** showing "No assessments yet" or "No entries yet"

### Color Coding
- **Formative Assessment**: Blue (Primary) - Ongoing learning
- **Summative Assessment**: Green (Success) - Final evaluation
- **Logbook**: Yellow (Warning) - Practical records

## User Flow

### For Quality Assurance Manager:
1. Login to the system
2. Navigate to "Projects" tab
3. Click on a project to expand details
4. View learning pathways and qualifications
5. See unit standards list with count
6. **Click on any unit standard** to expand it
7. View three assessment sections:
   - Formative Assessment
   - Summative Assessment
   - Logbook
8. Click "Add Assessment" or "Add Entry" buttons (functionality to be implemented)

## Next Steps (Future Implementation)

### 1. Formative Assessment
- Create modal/form to add formative assessments
- Fields:
  - Assessment date
  - Assessment method (observation, test, etc.)
  - Score/Result
  - Assessor name
  - Comments/Feedback
- List existing assessments
- Edit/Delete functionality

### 2. Summative Assessment
- Create modal/form to add summative assessments
- Fields:
  - Assessment date
  - Final score/grade
  - Competent/Not Yet Competent status
  - Assessor name
  - Moderator name (if applicable)
  - Comments
- Display assessment results
- Generate assessment reports

### 3. Logbook
- Create modal/form to add logbook entries
- Fields:
  - Date
  - Activity description
  - Hours spent
  - Supervisor/Mentor name
  - Signature/Approval
  - Evidence attached (photos, documents)
- List all logbook entries
- Filter by date range
- Export logbook as PDF

### 4. Backend Implementation
Create database tables:
```sql
-- Formative Assessments
CREATE TABLE "FormativeAssessments" (
    "Id" SERIAL PRIMARY KEY,
    "ProjectQualificationUnitStandardId" INTEGER NOT NULL,
    "AssessmentDate" TIMESTAMP NOT NULL,
    "AssessmentMethod" VARCHAR(100),
    "Score" DECIMAL(5,2),
    "AssessorName" VARCHAR(255),
    "Comments" TEXT,
    "CreatedAt" TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY ("ProjectQualificationUnitStandardId") 
        REFERENCES "ProjectQualificationUnitStandards"("Id")
);

-- Summative Assessments
CREATE TABLE "SummativeAssessments" (
    "Id" SERIAL PRIMARY KEY,
    "ProjectQualificationUnitStandardId" INTEGER NOT NULL,
    "AssessmentDate" TIMESTAMP NOT NULL,
    "FinalScore" DECIMAL(5,2),
    "Status" VARCHAR(50), -- 'Competent', 'Not Yet Competent'
    "AssessorName" VARCHAR(255),
    "ModeratorName" VARCHAR(255),
    "Comments" TEXT,
    "CreatedAt" TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY ("ProjectQualificationUnitStandardId") 
        REFERENCES "ProjectQualificationUnitStandards"("Id")
);

-- Logbook Entries
CREATE TABLE "LogbookEntries" (
    "Id" SERIAL PRIMARY KEY,
    "ProjectQualificationUnitStandardId" INTEGER NOT NULL,
    "EntryDate" TIMESTAMP NOT NULL,
    "ActivityDescription" TEXT,
    "HoursSpent" DECIMAL(5,2),
    "SupervisorName" VARCHAR(255),
    "Approved" BOOLEAN DEFAULT FALSE,
    "EvidenceUrl" TEXT,
    "CreatedAt" TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY ("ProjectQualificationUnitStandardId") 
        REFERENCES "ProjectQualificationUnitStandards"("Id")
);
```

### 5. API Endpoints
```
POST   /api/assessments/formative
GET    /api/assessments/formative/{unitStandardId}
PUT    /api/assessments/formative/{id}
DELETE /api/assessments/formative/{id}

POST   /api/assessments/summative
GET    /api/assessments/summative/{unitStandardId}
PUT    /api/assessments/summative/{id}
DELETE /api/assessments/summative/{id}

POST   /api/logbook/entries
GET    /api/logbook/entries/{unitStandardId}
PUT    /api/logbook/entries/{id}
DELETE /api/logbook/entries/{id}
```

## Testing

### Manual Testing Steps:
1. ✅ Login as QA Manager (`qa.manager@masakhane.com` / `password123`)
2. ✅ Navigate to Projects tab
3. ✅ Expand a project with unit standards
4. ✅ Verify unit standards are displayed as accordion items
5. ✅ Click on a unit standard to expand it
6. ✅ Verify three assessment cards are displayed
7. ✅ Verify accordion behavior (only one expanded at a time)
8. ✅ Verify styling and responsiveness

### Current Status:
- ✅ UI implemented and styled
- ✅ Accordion functionality working
- ✅ Assessment cards displayed
- ⏳ Add Assessment buttons (placeholders - functionality pending)
- ⏳ Backend API (to be implemented)
- ⏳ Database tables (to be created)

## Screenshots Description

### Collapsed View:
```
📋 Unit Standards (3)
▶ Apply health and safety to a work area [Level 02] [3 Credits] [Legacy]
▶ Apply quality principles on a construction site [Level 02] [12 Credits] [Legacy]
▶ Establish and prepare a work area [Level 02] [4 Credits] [Legacy]
```

### Expanded View:
```
▼ Apply health and safety to a work area [Level 02] [3 Credits] [Legacy]
  
  [📝 Formative Assessment]    [✅ Summative Assessment]    [📖 Logbook]
  Track ongoing learning       Final evaluation of          Record practical
  progress                     competence                   activities
  
  [+ Add Assessment]           [+ Add Assessment]           [+ Add Entry]
  No assessments yet           No assessments yet           No entries yet
```

## Benefits
1. **Better Organization** - Clear separation of assessment types
2. **Space Efficient** - Collapsed by default, expand on demand
3. **Visual Clarity** - Color-coded cards for different assessment types
4. **Scalability** - Easy to add more unit standards without cluttering the UI
5. **User-Friendly** - Intuitive accordion interface
6. **Professional** - Clean, modern design consistent with the application

## Related Files
- `frontend/src/components/SDPManagerDashboard.tsx` - Main component
- `UNIT_STANDARDS_SAVE_FEATURE.md` - Unit standards save functionality
- `UNIT_STANDARDS_FIX.md` - Unit standards display fix
