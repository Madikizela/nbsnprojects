# SDP Project Management Enhancement - Design Document

## Overview

This design document outlines the architecture and implementation approach for enhancing Skills Development Provider (SDP) project management capabilities. The solution builds upon the existing RLMS infrastructure, extending the current SDP and Project controllers with new endpoints and frontend components to provide comprehensive project management functionality for SDP users.

## Architecture

### Backend Architecture

The solution extends the existing ASP.NET Core Web API with new endpoints and enhanced authorization:

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                         │
├─────────────────────────────────────────────────────────────┤
│                    API Gateway Layer                        │
├─────────────────────────────────────────────────────────────┤
│  Controllers:                                               │
│  • ProjectsController (Enhanced)                            │
│  • SDPProjectsController (New)                              │
│  • BeneficiariesController (New)                            │
├─────────────────────────────────────────────────────────────┤
│  Services:                                                  │
│  • ProjectManagementService                                 │
│  • AuthorizationService (Enhanced)                          │
│  • AuditService                                             │
├─────────────────────────────────────────────────────────────┤
│  Data Layer:                                                │
│  • ApplicationDbContext (Enhanced)                          │
│  • Project, SDP, User Models (Enhanced)                     │
└─────────────────────────────────────────────────────────────┘
```

### Frontend Architecture

The React frontend will be enhanced with new components and pages:

```
src/
├── components/
│   ├── sdp/
│   │   ├── SDPDashboard.tsx
│   │   ├── ProjectList.tsx
│   │   ├── ProjectDetails.tsx
│   │   ├── BeneficiaryManagement.tsx
│   │   └── ResourceManagement.tsx
│   └── shared/
│       ├── ProjectCard.tsx
│       └── ProgressIndicator.tsx
├── pages/
│   └── SDP/
│       ├── Dashboard.tsx
│       ├── ProjectManagement.tsx
│       └── Reports.tsx
└── services/
    ├── sdpProjectService.ts
    └── beneficiaryService.ts
```

## Components and Interfaces

### 1. Enhanced ProjectsController

**New Endpoints:**
- `PUT /api/Projects/{id}/sdp-update` - Allow SDP-specific project updates
- `GET /api/Projects/{id}/beneficiaries` - Get project beneficiaries
- `PUT /api/Projects/{id}/beneficiaries` - Update beneficiary information
- `GET /api/Projects/{id}/resources` - Get project resource status
- `PUT /api/Projects/{id}/resources` - Update resource availability

### 2. New SDPProjectsController

**Purpose:** Dedicated controller for SDP-specific project operations with proper authorization

**Key Endpoints:**
```csharp
[Route("api/sdp/projects")]
[Authorize(Roles = "SDPAdministrator")]
public class SDPProjectsController : ControllerBase
{
    [HttpGet("dashboard")]
    public async Task<ActionResult<SDPDashboardData>> GetDashboard()
    
    [HttpGet("{projectId}/details")]
    public async Task<ActionResult<ProjectDetailsDto>> GetProjectDetails(int projectId)
    
    [HttpPut("{projectId}/status")]
    public async Task<IActionResult> UpdateProjectStatus(int projectId, ProjectStatusUpdateDto dto)
    
    [HttpGet("{projectId}/qualifications")]
    public async Task<ActionResult<List<QualificationProgressDto>>> GetQualificationProgress(int projectId)
    
    [HttpPut("{projectId}/qualifications/{qualificationId}")]
    public async Task<IActionResult> UpdateQualificationProgress(int projectId, int qualificationId, QualificationUpdateDto dto)
}
```

### 3. Authorization Enhancement

**SDP Access Control Service:**
```csharp
public interface ISDPAuthorizationService
{
    Task<bool> CanAccessProject(int userId, int projectId);
    Task<bool> CanUpdateProject(int userId, int projectId);
    Task<List<int>> GetAuthorizedProjectIds(int userId);
}
```

### 4. Data Transfer Objects

**SDPDashboardData:**
```csharp
public class SDPDashboardData
{
    public int TotalProjects { get; set; }
    public int ActiveProjects { get; set; }
    public int CompletedProjects { get; set; }
    public int TotalBeneficiaries { get; set; }
    public List<ProjectSummaryDto> RecentProjects { get; set; }
    public List<ProjectMetricDto> ProjectMetrics { get; set; }
}
```

**ProjectDetailsDto:**
```csharp
public class ProjectDetailsDto
{
    public int Id { get; set; }
    public string ProjectName { get; set; }
    public string ContractNumber { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int PlannedBeneficiaries { get; set; }
    public int ActualBeneficiaries { get; set; }
    public ProjectStatus Status { get; set; }
    public List<LearningPathwayDto> LearningPathways { get; set; }
    public ProjectResourcesDto Resources { get; set; }
    public bool CanEdit { get; set; }
}
```

## Data Models

### Enhanced Project Model

Add new properties for SDP management:
```csharp
public class Project
{
    // Existing properties...
    
    // New properties for SDP management
    public ProjectStatus Status { get; set; } = ProjectStatus.Planning;
    public int ActualBeneficiaries { get; set; }
    public string? ProgressNotes { get; set; }
    public DateTime? LastUpdatedBySDPAt { get; set; }
    public int? LastUpdatedBySDPUserId { get; set; }
    
    // Navigation properties
    public virtual User? LastUpdatedBySDPUser { get; set; }
    public virtual ICollection<ProjectAuditLog> AuditLogs { get; set; }
}

public enum ProjectStatus
{
    Planning = 1,
    InProgress = 2,
    OnHold = 3,
    Completed = 4,
    Cancelled = 5
}
```

### New ProjectAuditLog Model

```csharp
public class ProjectAuditLog
{
    public int Id { get; set; }
    public int ProjectId { get; set; }
    public int UserId { get; set; }
    public string Action { get; set; }
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public DateTime CreatedAt { get; set; }
    
    public virtual Project Project { get; set; }
    public virtual User User { get; set; }
}
```

### Enhanced ProjectLearningPathway Model

```csharp
public class ProjectLearningPathway
{
    // Existing properties...
    
    // New properties for progress tracking
    public int CompletedBeneficiaries { get; set; }
    public decimal CompletionPercentage { get; set; }
    public DateTime? LastUpdated { get; set; }
}
```

## Error Handling

### Authorization Errors
- **403 Forbidden:** When SDP user attempts to access projects not assigned to their organization
- **401 Unauthorized:** When user lacks proper SDP role or authentication

### Validation Errors
- **400 Bad Request:** Invalid project updates (e.g., beneficiaries exceeding capacity)
- **409 Conflict:** Concurrent modification conflicts

### Business Logic Errors
- **422 Unprocessable Entity:** Business rule violations (e.g., marking project complete with incomplete qualifications)

## Testing Strategy

### Unit Tests
- **Controller Tests:** Verify endpoint behavior, authorization, and response formats
- **Service Tests:** Test business logic, validation rules, and data transformations
- **Authorization Tests:** Ensure proper access control enforcement

### Integration Tests
- **API Integration:** End-to-end testing of SDP project management workflows
- **Database Integration:** Verify data persistence and retrieval accuracy
- **Authentication Integration:** Test role-based access control

### Frontend Tests
- **Component Tests:** React component rendering and user interactions
- **Service Tests:** API communication and error handling
- **E2E Tests:** Complete user workflows from login to project updates

## Security Considerations

### Access Control
- **Role-Based Authorization:** Enforce SDPAdministrator role requirements
- **Resource-Level Security:** Ensure SDPs can only access their assigned projects
- **Audit Logging:** Track all project modifications for compliance

### Data Validation
- **Input Sanitization:** Prevent injection attacks and malformed data
- **Business Rule Enforcement:** Validate updates against project constraints
- **Concurrent Access:** Handle simultaneous updates with optimistic locking

### API Security
- **Rate Limiting:** Prevent abuse of project update endpoints
- **CORS Configuration:** Restrict cross-origin requests appropriately
- **HTTPS Enforcement:** Ensure encrypted communication for sensitive project data