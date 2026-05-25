using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using backend.Models;
using backend.Models.DTOs;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProjectsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ProjectsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Projects
        [HttpGet]
        [Authorize]
        public async Task<ActionResult<IEnumerable<Project>>> GetProjects()
        {
            Console.WriteLine("=== GET /api/Projects called ===");
            
            try
            {
                // Get current user ID from JWT token
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                Console.WriteLine($"User ID from token: {userIdClaim}");
                
                if (int.TryParse(userIdClaim, out int userId))
                {
                    // Get user details to check their role and SDP association
                    var user = await _context.Users
                        .FirstOrDefaultAsync(u => u.Id == userId);

                    Console.WriteLine($"User found: Email={user?.Email}, Role={user?.Role}, SDPID={user?.SkillsDevelopmentProviderId}");

                    // If user is associated with an SDP, return only their SDP's projects
                    if (user != null && user.SkillsDevelopmentProviderId.HasValue)
                    {
                        Console.WriteLine($"Getting projects for SDP ID: {user.SkillsDevelopmentProviderId.Value}");
                        
                        var query = _context.Projects
                            .Where(p => p.SkillsDevelopmentProviderId == user.SkillsDevelopmentProviderId.Value)
                            .Include(p => p.Client)
                            .Include(p => p.SkillsDevelopmentProvider)
                            .Include(p => p.ProjectLearningPathways)
                                .ThenInclude(plp => plp.LearningPathway)
                            .Include(p => p.ProjectLearningPathways)
                                .ThenInclude(plp => plp.ProjectQualifications)
                                    .ThenInclude(pq => pq.QualificationType);

                        // If user is Assessor or Moderator, filter by assigned projects
                        if (user.Role == UserRole.SDPAssessor || user.Role == UserRole.SDPModerator)
                        {
                            var assignedProjectIds = await _context.ProjectAssignments
                                .Where(pa => pa.UserId == user.Id)
                                .Select(pa => pa.ProjectId)
                                .ToListAsync();
                            
                            var projects = await query
                                .Where(p => assignedProjectIds.Contains(p.Id))
                                .ToListAsync();
                                
                            return Ok(projects);
                        }

                        var allProjects = await query.ToListAsync();
                        return Ok(allProjects);
                    }
                }

                Console.WriteLine("Returning all projects (non-SDP user)");
                // For non-SDP users (like system admins), return all projects
                return await _context.Projects
                    .Include(p => p.Client)
                    .Include(p => p.SkillsDevelopmentProvider)
                    .Include(p => p.ProjectLearningPathways)
                        .ThenInclude(plp => plp.LearningPathway)
                    .Include(p => p.ProjectLearningPathways)
                        .ThenInclude(plp => plp.ProjectQualifications)
                            .ThenInclude(pq => pq.QualificationType)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetProjects: {ex.Message}");
                // Log error and return empty list
                return new List<Project>();
            }
        }
        // GET: api/Projects/{id}/details
        // Get project with full details including unit standards
        // GET: api/Projects/{id}/details
        // Get project with full details including unit standards
        [HttpGet("{id}/details")]
        public async Task<ActionResult<object>> GetProjectDetails(int id)
        {
            var project = await _context.Projects
                .Include(p => p.Client)
                .Include(p => p.SkillsDevelopmentProvider)
                .Include(p => p.ProjectLearningPathways)
                    .ThenInclude(plp => plp.LearningPathway)
                .Include(p => p.ProjectLearningPathways)
                    .ThenInclude(plp => plp.ProjectQualifications)
                        .ThenInclude(pq => pq.QualificationType)
                .Include(p => p.ProjectLearningPathways)
                    .ThenInclude(plp => plp.ProjectQualifications)
                        .ThenInclude(pq => pq.OccupationalQualification)
                .Include(p => p.ProjectLearningPathways)
                    .ThenInclude(plp => plp.ProjectQualifications)
                        .ThenInclude(pq => pq.LegacyQualification)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (project == null)
            {
                return NotFound();
            }

            // Get all qualification IDs first
            var qualificationIds = project.ProjectLearningPathways
                .SelectMany(plp => plp.ProjectQualifications)
                .Select(pq => pq.Id)
                .ToList();

            // Get all unit standards for these qualifications in one query
            var allUnitStandards = await _context.ProjectQualificationUnitStandards
                .Where(pqus => qualificationIds.Contains(pqus.ProjectQualificationId))
                .ToListAsync();

            // Get all legacy unit standard IDs
            var legacyUsIds = allUnitStandards
                .Where(us => us.UnitStandardType == "Legacy")
                .Select(us => us.UnitStandardId)
                .Distinct()
                .ToList();

            // Get all occupational unit standard IDs
            var occupationalUsIds = allUnitStandards
                .Where(us => us.UnitStandardType == "Occupational")
                .Select(us => us.UnitStandardId)
                .Distinct()
                .ToList();

            // Fetch all legacy unit standards in one query
            var legacyUnitStandards = await _context.LegacyUnitStandards
                .Where(lus => legacyUsIds.Contains(lus.Id))
                .ToListAsync();

            // Fetch all occupational unit standards in one query
            var occupationalUnitStandards = await _context.OccupationalUnitStandards
                .Where(ous => occupationalUsIds.Contains(ous.Id))
                .ToListAsync();

            // Build the response
            var projectDetails = new
            {
                project.Id,
                project.ProjectName,
                project.ContractNumber,
                project.FinancialYear,
                project.StartDate,
                project.EndDate,
                project.NumberOfBeneficiaries,
                project.Province,
                project.ProjectFunder,
                project.LeadEmployerPartner,
                project.BudgetAmount,
                project.HasPPE,
                project.HasLearningMaterial,
                project.HasToolkit,
                project.HasConsumables,
                Client = project.Client != null ? new { project.Client.Id, project.Client.Name } : null,
                SkillsDevelopmentProvider = project.SkillsDevelopmentProvider != null ? new { project.SkillsDevelopmentProvider.Id, project.SkillsDevelopmentProvider.Name } : null,
                LearningPathways = project.ProjectLearningPathways.Select(plp => new
                {
                    plp.Id,
                    plp.PathwayId,
                    Pathway = plp.LearningPathway != null ? new { plp.LearningPathway.PathwayId, plp.LearningPathway.Name } : null,
                    Qualifications = plp.ProjectQualifications.Select(pq =>
                    {
                        // Get unit standards for this qualification
                        var unitStandards = allUnitStandards.Where(us => us.ProjectQualificationId == pq.Id).ToList();

                        // Map unit standard details
                        var unitStandardDetails = unitStandards.Select(us =>
                        {
                            if (us.UnitStandardType == "Legacy")
                            {
                                var legacyUs = legacyUnitStandards.FirstOrDefault(lus => lus.Id == us.UnitStandardId);
                                return legacyUs != null ? new
                                {
                                    us.Id,
                                    us.UnitStandardId,
                                    us.UnitStandardType,
                                    UnitStandardName = legacyUs.UnitStandardName,
                                    Level = legacyUs.Level,
                                    Credits = legacyUs.Credits,
                                    Synced = legacyUs.Synced
                                } : null;
                            }
                            else // Occupational
                            {
                                var occUs = occupationalUnitStandards.FirstOrDefault(ous => ous.Id == us.UnitStandardId);
                                return occUs != null ? new
                                {
                                    us.Id,
                                    us.UnitStandardId,
                                    us.UnitStandardType,
                                    UnitStandardName = occUs.UnitStandardName,
                                    Level = occUs.Level,
                                    Credits = occUs.Credits,
                                    Synced = (int?)null
                                } : null;
                            }
                        }).Where(us => us != null).ToList();

                        return new
                        {
                            pq.Id,
                            pq.QualificationTypeId,
                            QualificationType = pq.QualificationType != null ? new { pq.QualificationType.Id, pq.QualificationType.Name } : null,
                            pq.OccupationalQualificationId,
                            OccupationalQualification = pq.OccupationalQualification != null ? new
                            {
                                pq.OccupationalQualification.QualificationId,
                                pq.OccupationalQualification.Name,
                                pq.OccupationalQualification.Level,
                                pq.OccupationalQualification.Credits
                            } : null,
                            pq.LegacyQualificationId,
                            LegacyQualification = pq.LegacyQualification != null ? new
                            {
                                pq.LegacyQualification.Id,
                                pq.LegacyQualification.QualificationId,
                                pq.LegacyQualification.Name,
                                pq.LegacyQualification.Level,
                                pq.LegacyQualification.Credits
                            } : null,
                            pq.EmploymentType,
                            pq.NumberOfBeneficiaries,
                            UnitStandards = unitStandardDetails
                        };
                    }).ToList()
                }).ToList()
            };

            return projectDetails;
        }

        // GET: api/Projects/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Project>> GetProject(int id)
        {
            var project = await _context.Projects
                .Include(p => p.Client)
                .Include(p => p.SkillsDevelopmentProvider)
                .Include(p => p.ProjectLearningPathways)
                    .ThenInclude(plp => plp.LearningPathway)
                .Include(p => p.ProjectLearningPathways)
                    .ThenInclude(plp => plp.ProjectQualifications)
                        .ThenInclude(pq => pq.QualificationType)
                .Include(p => p.ProjectLearningPathways)
                    .ThenInclude(plp => plp.ProjectQualifications)
                        .ThenInclude(pq => pq.OccupationalQualification)
                .Include(p => p.ProjectLearningPathways)
                    .ThenInclude(plp => plp.ProjectQualifications)
                        .ThenInclude(pq => pq.LegacyQualification)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (project == null)
            {
                return NotFound();
            }

            return project;
        }

        // GET: api/Projects/client/{clientId}/projects
        [HttpGet("client/{clientId}/projects")]
        public async Task<ActionResult<IEnumerable<Project>>> GetClientProjects(int clientId)
        {
            Console.WriteLine($"=== GET /api/Projects/client/{clientId}/projects called ===");
            
            var projects = await _context.Projects
                .Where(p => p.ClientId == clientId)
                .Include(p => p.Client)
                .Include(p => p.SkillsDevelopmentProvider)
                .Include(p => p.ProjectLearningPathways)
                    .ThenInclude(plp => plp.LearningPathway)
                .ToListAsync();

            Console.WriteLine($"Found {projects.Count} projects for client {clientId}");
            return projects;
        }

        // GET: api/Projects/client/{clientId}/sdps
        [HttpGet("client/{clientId}/sdps")]
        public async Task<ActionResult<IEnumerable<SkillsDevelopmentProvider>>> GetClientSDPs(int clientId)
        {
            var sdps = await _context.SkillsDevelopmentProviders
                .Where(s => s.ClientId == clientId)
                .ToListAsync();

            return sdps;
        }

        // GET: api/Projects/sdp/{sdpId}/projects
        [HttpGet("sdp/{sdpId}/projects")]
        public async Task<ActionResult<IEnumerable<Project>>> GetSDPProjects(int sdpId)
        {
            Console.WriteLine($"=== GET /api/Projects/sdp/{sdpId}/projects called ===");
            
            var projects = await _context.Projects
                .Where(p => p.SkillsDevelopmentProviderId == sdpId)
                .Include(p => p.Client)
                .Include(p => p.SkillsDevelopmentProvider)
                .Include(p => p.ProjectLearningPathways)
                    .ThenInclude(plp => plp.LearningPathway)
                .ToListAsync();

            Console.WriteLine($"Found {projects.Count} projects for SDP {sdpId}");
            return projects;
        }

        // GET: api/Projects/my-sdp-projects
        [HttpGet("my-sdp-projects")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<Project>>> GetMySDPProjects()
        {
            try
            {
                // Get current user ID from JWT token
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(userIdClaim, out int userId))
                {
                    return Unauthorized("User ID not found in token");
                }

                // Get user's SDP ID
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Id == userId);

                if (user == null || !user.SkillsDevelopmentProviderId.HasValue)
                {
                    return Ok(new List<Project>()); // Return empty list if user has no SDP
                }

                // Get projects for user's SDP
                var projects = await _context.Projects
                    .Where(p => p.SkillsDevelopmentProviderId == user.SkillsDevelopmentProviderId.Value)
                    .Include(p => p.Client)
                    .Include(p => p.SkillsDevelopmentProvider)
                    .Include(p => p.ProjectLearningPathways)
                        .ThenInclude(plp => plp.LearningPathway)
                    .ToListAsync();

                return projects;
            }
            catch (Exception ex)
            {
                // Log the error (you might want to inject ILogger here)
                Console.WriteLine($"Error retrieving SDP projects: {ex.Message}");
                return StatusCode(500, "An error occurred while retrieving SDP projects");
            }
        }

        // GET: api/Projects/learning-pathways
        [HttpGet("learning-pathways")]
        public async Task<ActionResult<IEnumerable<LearningPathway>>> GetLearningPathways()
        {
            return await _context.LearningPathways.ToListAsync();
        }

        // GET: api/Projects/qualification-types
        [HttpGet("qualification-types")]
        public async Task<ActionResult<IEnumerable<QualificationType>>> GetQualificationTypes()
        {
            return await _context.QualificationTypes.ToListAsync();
        }

        // GET: api/Projects/qualifications/occupational
        [HttpGet("qualifications/occupational")]
        public async Task<ActionResult<IEnumerable<OccupationalQualification>>> GetOccupationalQualifications()
        {
            return await _context.OccupationalQualifications.ToListAsync();
        }

        // GET: api/Projects/qualifications/legacy
        [HttpGet("qualifications/legacy")]
        public async Task<ActionResult<IEnumerable<LegacyQualification>>> GetLegacyQualifications()
        {
            return await _context.LegacyQualifications.ToListAsync();
        }

        // GET: api/Projects/unit-standards/occupational/{qualificationId}
        [HttpGet("unit-standards/occupational/{qualificationId}")]
        public async Task<ActionResult<IEnumerable<OccupationalUnitStandard>>> GetOccupationalUnitStandards(int qualificationId)
        {
            // Use LINQ query instead of raw SQL to avoid parameterization issues
            return await _context.OccupationalUnitStandards
                .Where(ous => ous.QualificationId == qualificationId)
                .ToListAsync();
        }

        // GET: api/Projects/unit-standards/legacy/{qualificationId}
        [HttpGet("unit-standards/legacy/{qualificationId}")]
        public async Task<ActionResult<IEnumerable<LegacyUnitStandard>>> GetLegacyUnitStandards(int qualificationId)
        {
            // Use LINQ query with proper nullable handling
            return await _context.LegacyUnitStandards
                .Where(lus => lus.QualificationId.HasValue && lus.QualificationId.Value == qualificationId)
                .ToListAsync();
        }

        // POST: api/Projects
        [HttpPost]
        public async Task<ActionResult<object>> PostProject([FromBody] CreateProjectDto createProjectDto)
        {
            try
            {
                Console.WriteLine("=== Creating Project with Learning Pathways ===");
                Console.WriteLine($"Project Name: {createProjectDto.ProjectName}");
                Console.WriteLine($"Learning Pathways Count: {createProjectDto.LearningPathways?.Count ?? 0}");

                // Get ClientId from SDP if not provided or to ensure correctness
                int effectiveClientId;
                if (createProjectDto.ClientId.HasValue && createProjectDto.ClientId.Value > 0)
                {
                    effectiveClientId = createProjectDto.ClientId.Value;
                }
                else
                {
                    var sdp = await _context.SkillsDevelopmentProviders
                        .FirstOrDefaultAsync(s => s.Id == createProjectDto.SkillsDevelopmentProviderId);
                    
                    if (sdp == null)
                    {
                        return BadRequest($"Skills Development Provider with ID {createProjectDto.SkillsDevelopmentProviderId} not found.");
                    }
                    effectiveClientId = sdp.ClientId;
                }

                // Create the main project
                var project = new Project
                {
                    ProjectName = createProjectDto.ProjectName,
                    ContractNumber = createProjectDto.ContractNumber,
                    FinancialYear = createProjectDto.FinancialYear,
                    StartDate = DateTime.SpecifyKind(createProjectDto.StartDate, DateTimeKind.Utc),
                    EndDate = DateTime.SpecifyKind(createProjectDto.EndDate, DateTimeKind.Utc),
                    NumberOfBeneficiaries = createProjectDto.NumberOfBeneficiaries,
                    HasPPE = createProjectDto.HasPPE,
                    HasLearningMaterial = createProjectDto.HasLearningMaterial,
                    HasToolkit = createProjectDto.HasToolkit,
                    HasConsumables = createProjectDto.HasConsumables,
                    Province = createProjectDto.Province,
                    ProjectFunder = createProjectDto.ProjectFunder,
                    LeadEmployerPartner = createProjectDto.LeadEmployerPartner,
                    SkillsDevelopmentProviderId = createProjectDto.SkillsDevelopmentProviderId,
                    BudgetAmount = createProjectDto.BudgetAmount,
                    ClientId = effectiveClientId,
                    CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc),
                    UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc)
                };

                _context.Projects.Add(project);
                
                // Save the project first to get the ID
                await _context.SaveChangesAsync();

                Console.WriteLine($"Project created with ID: {project.Id}");

                // Process Learning Pathways and Qualifications
                if (createProjectDto.LearningPathways != null && createProjectDto.LearningPathways.Any())
                {
                    foreach (var pathwayDto in createProjectDto.LearningPathways)
                    {
                        Console.WriteLine($"Processing pathway ID: {pathwayDto.PathwayId}");

                        // Create ProjectLearningPathway
                        var projectLearningPathway = new ProjectLearningPathway
                        {
                            ProjectId = project.Id,
                            PathwayId = pathwayDto.PathwayId
                        };

                        _context.ProjectLearningPathways.Add(projectLearningPathway);
                        
                        // Save to get the ProjectLearningPathway ID
                        await _context.SaveChangesAsync();

                        Console.WriteLine($"ProjectLearningPathway created with ID: {projectLearningPathway.Id}");

                        // Process Qualifications for this pathway
                        if (pathwayDto.Qualifications != null && pathwayDto.Qualifications.Any())
                        {
                            foreach (var qualificationDto in pathwayDto.Qualifications)
                            {
                                Console.WriteLine($"Processing qualification - Type: {qualificationDto.QualificationTypeId}, Employment: {qualificationDto.EmploymentType}");

                                var projectQualification = new ProjectQualification
                                {
                                    ProjectLearningPathwayId = projectLearningPathway.Id,
                                    QualificationTypeId = qualificationDto.QualificationTypeId,
                                    OccupationalQualificationId = qualificationDto.OccupationalQualificationId,
                                    LegacyQualificationId = qualificationDto.LegacyQualificationId,
                                    EmploymentType = qualificationDto.EmploymentType,
                                    NumberOfBeneficiaries = qualificationDto.NumberOfBeneficiaries
                                };

                                _context.ProjectQualifications.Add(projectQualification);
                                
                                // Save to get the ProjectQualification ID
                                await _context.SaveChangesAsync();

                                Console.WriteLine($"ProjectQualification created with ID: {projectQualification.Id}");

                                // Handle selected unit standards (if any)
                                if (qualificationDto.SelectedUnitStandards != null && qualificationDto.SelectedUnitStandards.Any())
                                {
                                    Console.WriteLine($"Processing {qualificationDto.SelectedUnitStandards.Count} selected unit standards");
                                    
                                    // Determine the unit standard type based on which qualification type is selected
                                    string unitStandardType = qualificationDto.OccupationalQualificationId.HasValue 
                                        ? "Occupational" 
                                        : "Legacy";
                                    
                                    foreach (var unitStandardId in qualificationDto.SelectedUnitStandards)
                                    {
                                        var projectQualificationUnitStandard = new ProjectQualificationUnitStandard
                                        {
                                            ProjectQualificationId = projectQualification.Id,
                                            UnitStandardId = unitStandardId,
                                            UnitStandardType = unitStandardType,
                                            CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc),
                                            UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc)
                                        };
                                        
                                        _context.ProjectQualificationUnitStandards.Add(projectQualificationUnitStandard);
                                        Console.WriteLine($"Added {unitStandardType} unit standard ID: {unitStandardId}");
                                    }
                                    
                                    // Save unit standards
                                    await _context.SaveChangesAsync();
                                    Console.WriteLine($"Saved {qualificationDto.SelectedUnitStandards.Count} unit standards");
                                }
                            }
                        }
                    }
                }

                // All changes have been saved incrementally

                Console.WriteLine($"Project saved with ID: {project.Id}");

                // Return the created project with full details
                var createdProject = await _context.Projects
                    .Include(p => p.Client)
                    .Include(p => p.SkillsDevelopmentProvider)
                    .Include(p => p.ProjectLearningPathways)
                        .ThenInclude(plp => plp.LearningPathway)
                    .Include(p => p.ProjectLearningPathways)
                        .ThenInclude(plp => plp.ProjectQualifications)
                            .ThenInclude(pq => pq.QualificationType)
                    .Include(p => p.ProjectLearningPathways)
                        .ThenInclude(plp => plp.ProjectQualifications)
                            .ThenInclude(pq => pq.OccupationalQualification)
                    .Include(p => p.ProjectLearningPathways)
                        .ThenInclude(plp => plp.ProjectQualifications)
                            .ThenInclude(pq => pq.LegacyQualification)
                    .FirstOrDefaultAsync(p => p.Id == project.Id);

                if (createdProject == null)
                {
                    Console.WriteLine($"Warning: Could not retrieve created project with ID {project.Id}");
                    
                    // Count manually from database
                    var pathwayCount = await _context.ProjectLearningPathways.CountAsync(plp => plp.ProjectId == project.Id);
                    var qualificationCount = await _context.ProjectQualifications
                        .Where(pq => _context.ProjectLearningPathways.Any(plp => plp.Id == pq.ProjectLearningPathwayId && plp.ProjectId == project.Id))
                        .CountAsync();
                    
                    return CreatedAtAction("GetProject", new { id = project.Id }, new
                    {
                        id = project.Id,
                        projectName = project.ProjectName,
                        contractNumber = project.ContractNumber,
                        message = "Project created successfully with learning pathways and qualifications",
                        createdAt = project.CreatedAt,
                        learningPathwaysCount = pathwayCount,
                        qualificationsCount = qualificationCount
                    });
                }

                Console.WriteLine("=== Project Creation Completed Successfully ===");

                return CreatedAtAction("GetProject", new { id = project.Id }, new
                {
                    id = createdProject.Id,
                    projectName = createdProject.ProjectName,
                    contractNumber = createdProject.ContractNumber,
                    message = "Project created successfully with learning pathways and qualifications",
                    createdAt = createdProject.CreatedAt,
                    learningPathwaysCount = createdProject.ProjectLearningPathways.Count,
                    qualificationsCount = createdProject.ProjectLearningPathways.Sum(plp => plp.ProjectQualifications.Count)
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error creating project: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { message = "Error creating project", error = ex.Message });
            }
        }

        // PUT: api/Projects/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutProject(int id, Project project)
        {
            if (id != project.Id)
            {
                return BadRequest(new { message = "Project ID mismatch" });
            }

            try
            {
                // Convert all DateTime fields to UTC to avoid PostgreSQL issues
                project.StartDate = DateTime.SpecifyKind(project.StartDate, DateTimeKind.Utc);
                project.EndDate = DateTime.SpecifyKind(project.EndDate, DateTimeKind.Utc);
                project.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
                
                if (project.CreatedAt == default)
                {
                    project.CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
                }
                else
                {
                    project.CreatedAt = DateTime.SpecifyKind(project.CreatedAt, DateTimeKind.Utc);
                }

                _context.Entry(project).State = EntityState.Modified;
                await _context.SaveChangesAsync();
                
                // Return the updated project with its relationships
                var updatedProject = await _context.Projects
                    .Include(p => p.Client)
                    .Include(p => p.SkillsDevelopmentProvider)
                    .Include(p => p.ProjectLearningPathways)
                        .ThenInclude(plp => plp.LearningPathway)
                    .Include(p => p.ProjectLearningPathways)
                        .ThenInclude(plp => plp.ProjectQualifications)
                            .ThenInclude(pq => pq.QualificationType)
                    .FirstOrDefaultAsync(p => p.Id == id);
                    
                return Ok(updatedProject);
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ProjectExists(id))
                {
                    return NotFound(new { message = "Project not found" });
                }
                else
                {
                    throw;
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating project", error = ex.Message });
            }
        }

        // DELETE: api/Projects/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProject(int id)
        {
            var project = await _context.Projects.FindAsync(id);
            if (project == null)
            {
                return NotFound();
            }

            _context.Projects.Remove(project);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool ProjectExists(int id)
        {
            return _context.Projects.Any(e => e.Id == id);
        }
    }
}