# Implementation Plan

- [x] 1. Enhance data models and database schema


  - Add ProjectStatus enum and new properties to Project model
  - Create ProjectAuditLog model for tracking changes
  - Enhance ProjectLearningPathway model with progress tracking
  - Generate and apply Entity Framework migrations
  - _Requirements: 1.1, 2.4, 3.5_







- [x] 2. Implement SDP authorization service

  - [ ] 2.1 Create ISDPAuthorizationService interface
    - Define methods for project access validation


    - Include authorization for project updates and viewing
    - _Requirements: 1.1, 2.1, 2.5_

  - [ ] 2.2 Implement SDPAuthorizationService class
    - Write logic to verify SDP user can access specific projects
    - Implement GetAuthorizedProjectIds method for filtering
    - Add caching for performance optimization
    - _Requirements: 1.1, 2.1, 2.5_

- [ ] 3. Create Data Transfer Objects (DTOs)
  - [ ] 3.1 Implement dashboard and project DTOs
    - Create SDPDashboardData DTO with project metrics
    - Implement ProjectDetailsDto with SDP-specific fields
    - Add ProjectSummaryDto for list views
    - _Requirements: 1.1, 1.2, 2.1_

  - [ ] 3.2 Create update and progress DTOs
    - Implement ProjectStatusUpdateDto for status changes
    - Create QualificationProgressDto for tracking completion
    - Add BeneficiaryUpdateDto for enrollment management
    - _Requirements: 2.2, 3.3, 4.2_

- [ ] 4. Enhance ProjectsController with SDP functionality
  - [ ] 4.1 Add SDP-specific project update endpoints
    - Implement PUT endpoint for SDP project updates
    - Add authorization checks using SDPAuthorizationService
    - Include audit logging for all changes
    - _Requirements: 2.1, 2.2, 2.4_

  - [ ] 4.2 Create beneficiary management endpoints
    - Add GET endpoint for project beneficiaries
    - Implement PUT endpoint for beneficiary updates
    - Include validation against project capacity limits
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ] 4.3 Implement resource management endpoints
    - Create GET endpoint for project resource status



    - Add PUT endpoint for resource availability updates
    - Include business logic for resource requirements
    - _Requirements: 5.1, 5.2, 5.4, 5.5_

- [ ] 5. Create dedicated SDPProjectsController
  - [ ] 5.1 Implement dashboard and project listing endpoints
    - Create GET dashboard endpoint with project metrics
    - Add GET endpoint for SDP project details
    - Include filtering and sorting capabilities
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ] 5.2 Add qualification management endpoints
    - Implement GET endpoint for qualification progress
    - Create PUT endpoint for qualification updates
    - Include automatic completion metric calculation
    - _Requirements: 3.1, 3.2, 3.3, 3.5_

  - [ ]* 5.3 Write unit tests for SDPProjectsController
    - Test authorization enforcement for all endpoints
    - Verify proper DTO mapping and response formats
    - Test error handling and validation scenarios
    - _Requirements: 1.1, 2.1, 3.1_

- [ ] 6. Implement audit logging service
  - [ ] 6.1 Create ProjectAuditService
    - Implement audit log creation for project changes
    - Add methods for tracking user actions and timestamps
    - Include serialization of old and new values
    - _Requirements: 2.4_




  - [ ] 6.2 Integrate audit logging into controllers
    - Add audit calls to all project update operations
    - Include user context and change details
    - Ensure audit logs are created before database commits
    - _Requirements: 2.4_

- [ ] 7. Create React components for SDP dashboard
  - [ ] 7.1 Implement SDPDashboard component
    - Create dashboard layout with project metrics


    - Add project summary cards and progress indicators
    - Include navigation to detailed project views
    - _Requirements: 1.1, 1.4_

  - [ ] 7.2 Build ProjectList component
    - Implement filterable and sortable project list
    - Add search functionality for project names
    - Include status indicators and quick actions
    - _Requirements: 1.2, 1.3_

- [ ] 8. Create project management components
  - [ ] 8.1 Implement ProjectDetails component
    - Create detailed project view with editable fields
    - Add form validation and error handling
    - Include save/cancel functionality with confirmation
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 8.2 Build BeneficiaryManagement component
    - Create beneficiary enrollment tracking interface
    - Add progress visualization and completion metrics
    - Include capacity validation and warnings
    - _Requirements: 4.1, 4.2, 4.4_

  - [ ] 8.3 Implement ResourceManagement component
    - Create resource status tracking interface
    - Add resource availability toggle controls
    - Include resource requirement validation
    - _Requirements: 5.1, 5.2, 5.4_

- [ ] 9. Create API service layer for frontend
  - [ ] 9.1 Implement sdpProjectService
    - Create service methods for all SDP project endpoints
    - Add error handling and response transformation
    - Include authentication token management
    - _Requirements: 1.1, 2.1, 3.1_

  - [ ] 9.2 Create beneficiaryService
    - Implement beneficiary management API calls
    - Add validation helpers and data formatting
    - Include progress calculation utilities
    - _Requirements: 4.1, 4.2, 4.4_

- [ ] 10. Implement routing and navigation
  - [ ] 10.1 Add SDP-specific routes
    - Create protected routes for SDP users
    - Add navigation guards for role-based access
    - Include breadcrumb navigation for project hierarchy
    - _Requirements: 1.1, 2.1_

  - [ ] 10.2 Enhance navigation menu
    - Add SDP dashboard and project management links
    - Include role-based menu item visibility
    - Add active state indicators for current page
    - _Requirements: 1.1_

- [ ]* 11. Create integration tests
  - Write end-to-end tests for SDP project workflows
  - Test complete user journeys from login to project updates
  - Verify authorization and data persistence
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1_

- [ ]* 12. Add frontend component tests
  - Test React component rendering and user interactions
  - Verify form validation and error display
  - Test API service integration and error handling
  - _Requirements: 1.1, 2.1, 4.1, 5.1_