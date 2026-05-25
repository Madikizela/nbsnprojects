# Project Details View Feature

## Overview
Quality Assurance Managers can now expand projects to view qualifications and their associated unit standards directly from the SDPManagerDashboard.

## Implementation

### Backend Changes

#### New API Endpoint: GET /api/projects/{id}/details
- **Location**: `backend/Controllers/ProjectsController.cs`
- **Purpose**: Retrieves complete project details including qualifications and unit standards
- **Features**:
  - Fetches project with all learning pathways
  - Includes qualifications (both Legacy and Occupational)
  - Retrieves selected unit standards for each qualification
  - Joins with unit standard details (name, level, credits)
  - Optimized to avoid DbContext threading issues

#### Response Structure
```json
{
  "id": 2,
  "projectName": "Test Project",
  "contractNumber": "TEST-001",
  "learningPathways": [
    {
      "id": 1,
      "pathway": { "name": "Internship" },
      "qualifications": [
        {
          "id": 2,
          "qualificationType": { "name": "Legacy" },
          "legacyQualification": {
            "name": "FET Certificate: Social Housing",
            "level": "Level: 4",
            "credits": 146
          },
          "employmentType": "Full-time",
          "numberOfBeneficiaries": 25,
          "unitStandards": [
            {
              "unitStandardName": "Apply inter-personal skills...",
              "level": "NQF Level 04",
              "credits": 8,
              "unitStandardType": "Legacy"
            }
          ]
        }
      ]
    }
  ]
}
```

### Frontend Changes

#### SDPManagerDashboard.tsx Updates
- **Location**: `frontend/src/components/SDPManagerDashboard.tsx`

#### New State Variables
```typescript
const [expandedProjects, setExpandedProjects] = useState<{[key: number]: boolean}>({});
const [projectDetails, setProjectDetails] = useState<{[key: number]: any}>({});
```

#### New Function: toggleProjectExpansion
```typescript
const toggleProjectExpansion = async (projectId: number) => {
  // Toggle expansion state
  // Fetch project details if not already loaded
  // Store details in state
}
```

#### UI Changes
1. **Project Cards**:
   - Changed from 3-column grid to full-width cards
   - Added "Show Details" / "Hide Details" button
   - Displays basic project info when collapsed

2. **Expanded View**:
   - Shows learning pathways
   - Lists qualifications with full details
   - Displays unit standards in a table format
   - Shows loading spinner while fetching details

3. **Unit Standards Table**:
   - Columns: Unit Standard Name, Level, Credits, Type
   - Styled with dark theme to match card background
   - Responsive design

## User Flow

1. **QA Manager logs in** at http://localhost:5174/
2. **Navigates to Projects tab**
3. **Sees list of projects** (collapsed by default)
4. **Clicks "Show Details"** on a project
5. **System fetches project details** from API
6. **Displays qualifications** grouped by learning pathway
7. **Shows unit standards** for each qualification in a table
8. **Can collapse** the project by clicking "Hide Details"

## Features

✅ Expandable project cards
✅ Lazy loading of project details (only fetched when expanded)
✅ Caching of loaded details (no re-fetch on collapse/expand)
✅ Display of qualifications with full information
✅ Unit standards table with name, level, credits, and type
✅ Support for both Legacy and Occupational qualifications
✅ Responsive design
✅ Loading indicators

## Testing

### Test the Feature
1. Login as QA Manager: `qa.manager@masakhane.com` / `password123`
2. Go to Projects tab
3. Click "Show Details" on "Test Project with Unit Standards"
4. Verify:
   - Learning pathway is displayed
   - Qualification details are shown
   - Unit standards table appears with 3 standards
   - All information is correctly formatted

### Test API Endpoint
```bash
cd backend
node test_project_details_endpoint.js
```

Expected output:
- Project details with learning pathways
- Qualifications with names and levels
- Unit standards with names, levels, and credits

## Files Modified

### Backend
- `backend/Controllers/ProjectsController.cs` - Added GetProjectDetails endpoint

### Frontend
- `frontend/src/components/SDPManagerDashboard.tsx` - Added expandable project view

### Test Files
- `backend/test_project_details_endpoint.js` - API endpoint test

## Technical Notes

### DbContext Threading Issue
The initial implementation caused a threading error because nested async operations were using the same DbContext instance. Fixed by:
1. Fetching all data upfront in separate queries
2. Using LINQ operations on in-memory collections
3. Avoiding nested async database calls

### Performance Optimization
- Details are only fetched when a project is expanded
- Once fetched, details are cached in state
- No unnecessary re-fetching on collapse/expand

### UI/UX Considerations
- Full-width cards provide more space for detailed information
- Collapsible design keeps the interface clean
- Loading indicators provide feedback during data fetch
- Table format makes unit standards easy to scan

## Future Enhancements
- Add filtering/search for unit standards
- Export project details to PDF
- Add edit functionality for qualifications
- Show learner progress against unit standards
- Add unit standard completion tracking
