# Unit Standards Save Feature

## Overview
This feature allows users to select and save unit standards when creating projects with qualifications. The selected unit standards are stored in the database and linked to the project qualifications.

## Database Schema

### New Table: ProjectQualificationUnitStandards
```sql
CREATE TABLE "ProjectQualificationUnitStandards" (
    "Id" SERIAL PRIMARY KEY,
    "ProjectQualificationId" INTEGER NOT NULL,
    "UnitStandardId" INTEGER NOT NULL,
    "UnitStandardType" VARCHAR(50) NOT NULL, -- 'Occupational' or 'Legacy'
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    
    FOREIGN KEY ("ProjectQualificationId") 
        REFERENCES "ProjectQualifications"("Id") ON DELETE CASCADE,
    
    UNIQUE ("ProjectQualificationId", "UnitStandardId", "UnitStandardType")
);
```

## Backend Implementation

### 1. Model: ProjectQualificationUnitStandard.cs
- Located in: `backend/Models/ProjectQualificationUnitStandard.cs`
- Properties:
  - `Id`: Primary key
  - `ProjectQualificationId`: Foreign key to ProjectQualifications
  - `UnitStandardId`: ID of the selected unit standard
  - `UnitStandardType`: "Occupational" or "Legacy"
  - `CreatedAt`, `UpdatedAt`: Timestamps

### 2. ApplicationDbContext
- Added `DbSet<ProjectQualificationUnitStandard>` to context
- Located in: `backend/Models/ApplicationDbContext.cs`

### 3. ProjectsController
- Updated `PostProject` method to save unit standards
- Located in: `backend/Controllers/ProjectsController.cs`
- Logic:
  1. Determines unit standard type based on qualification type
  2. Creates `ProjectQualificationUnitStandard` records for each selected unit standard
  3. Saves to database after creating the project qualification

### 4. DTO: CreateProjectQualificationDto
- Already includes `SelectedUnitStandards` property (List<int>)
- Located in: `backend/Models/DTOs/ProjectDTOs.cs`

## Frontend Implementation

### ProjectForm.tsx
- Users can select multiple unit standards using checkboxes
- Selected unit standards are stored in `qualification.selectedUnitStandards` array
- When form is submitted, the array is sent to the backend as part of the project data

## How It Works

### 1. User Flow
1. User creates a new project
2. Adds a learning pathway
3. Adds a qualification (Legacy or Occupational)
4. Selects qualification from dropdown
5. Unit standards automatically load and display
6. User selects desired unit standards using checkboxes
7. User submits the form
8. Backend saves project, qualifications, and selected unit standards

### 2. Data Flow
```
Frontend (ProjectForm.tsx)
  ↓ selectedUnitStandards: [5794, 5795, 5796]
Backend (ProjectsController.PostProject)
  ↓ Creates ProjectQualification
  ↓ For each selected unit standard:
    ↓ Creates ProjectQualificationUnitStandard
Database (ProjectQualificationUnitStandards table)
  ✓ Stores: ProjectQualificationId, UnitStandardId, UnitStandardType
```

## Testing

### Test Scripts Created
1. `backend/test_unit_standards_save.js`
   - Creates a test project with unit standards
   - Verifies they are saved to database

2. `backend/verify_unit_standards_retrieval.js`
   - Retrieves projects with their unit standards
   - Displays unit standard details

### Running Tests
```bash
cd backend
node test_unit_standards_save.js
node verify_unit_standards_retrieval.js
```

## Example Data

### Request Payload
```json
{
  "projectName": "Test Project",
  "learningPathways": [
    {
      "pathwayId": 1,
      "qualifications": [
        {
          "qualificationTypeId": 1,
          "legacyQualificationId": 1,
          "employmentType": "Full-time",
          "numberOfBeneficiaries": 25,
          "selectedUnitStandards": [5794, 5795, 5796]
        }
      ]
    }
  ]
}
```

### Database Result
```
ProjectQualificationUnitStandards:
- Id: 1, ProjectQualificationId: 2, UnitStandardId: 5794, Type: Legacy
- Id: 2, ProjectQualificationId: 2, UnitStandardId: 5795, Type: Legacy
- Id: 3, ProjectQualificationId: 2, UnitStandardId: 5796, Type: Legacy
```

## Retrieval Query Example
```sql
SELECT 
    p."ProjectName",
    pq."EmploymentType",
    lus.unit_standard_name,
    lus.credits
FROM "Projects" p
INNER JOIN "ProjectLearningPathways" plp ON p."Id" = plp."ProjectId"
INNER JOIN "ProjectQualifications" pq ON plp."Id" = pq."ProjectLearningPathwayId"
INNER JOIN "ProjectQualificationUnitStandards" pqus ON pq."Id" = pqus."ProjectQualificationId"
LEFT JOIN legacy_unit_standards lus ON pqus."UnitStandardId" = lus.id 
    AND pqus."UnitStandardType" = 'Legacy'
WHERE p."Id" = 2;
```

## Features
✅ Save multiple unit standards per qualification
✅ Support for both Legacy and Occupational unit standards
✅ Automatic type detection based on qualification type
✅ Cascade delete (when qualification is deleted, unit standards are also deleted)
✅ Unique constraint prevents duplicate unit standards
✅ Timestamps for audit trail

## Future Enhancements
- Add API endpoint to retrieve unit standards for a project
- Add ability to update selected unit standards
- Display selected unit standards in project details view
- Add validation to ensure unit standards belong to the selected qualification
