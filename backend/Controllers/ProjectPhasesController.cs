using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using backend.Models.DTOs;
using backend.Services;
using System.Security.Claims;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProjectPhasesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ProjectPhasesController> _logger;

        public ProjectPhasesController(
            ApplicationDbContext context,
            ILogger<ProjectPhasesController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/ProjectPhases/Project/{projectId}
        [HttpGet("Project/{projectId}")]
        public async Task<ActionResult<IEnumerable<ProjectPhaseDto>>> GetProjectPhases(int projectId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (!currentUserId.HasValue)
                {
                    return Unauthorized("User ID not found in token");
                }

                // Check if user has access to this project
                var project = await _context.Projects
                    .Include(p => p.SkillsDevelopmentProvider)
                    .FirstOrDefaultAsync(p => p.Id == projectId);

                if (project == null)
                {
                    return NotFound(new { message = "Project not found" });
                }

                // Get current user to check access
                var currentUser = await _context.Users.FirstOrDefaultAsync(u => u.Id == currentUserId.Value);
                if (currentUser?.SkillsDevelopmentProviderId != project.SkillsDevelopmentProviderId)
                {
                    return Forbid("You don't have access to this project");
                }

                var phases = await _context.ProjectPhases
                    .Include(p => p.Project)
                    .Include(p => p.CreatedByUser)
                    .Include(p => p.PhaseQualifications)
                        .ThenInclude(pq => pq.ProjectQualification)
                            .ThenInclude(pq => pq.OccupationalQualification)
                    .Include(p => p.PhaseQualifications)
                        .ThenInclude(pq => pq.ProjectQualification)
                            .ThenInclude(pq => pq.LegacyQualification)
                    .Include(p => p.PhaseLearningPathways)
                        .ThenInclude(plp => plp.ProjectLearningPathway)
                            .ThenInclude(plp => plp.LearningPathway)
                    .Where(p => p.ProjectId == projectId)
                    .OrderBy(p => p.CreatedAt)
                    .ToListAsync();

                var phaseDtos = phases.Select(p => new ProjectPhaseDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description,
                    ProjectId = p.ProjectId,
                    ProjectName = p.Project.ProjectName,
                    StartDate = p.StartDate,
                    EndDate = p.EndDate,
                    Status = p.Status,
                    PlannedBeneficiaries = p.PlannedBeneficiaries,
                    ActualBeneficiaries = p.ActualBeneficiaries,
                    BudgetAllocation = p.BudgetAllocation,
                    ActualSpent = p.ActualSpent,
                    CreatedAt = p.CreatedAt,
                    UpdatedAt = p.UpdatedAt,
                    CreatedByUserName = p.CreatedByUser.FirstName + " " + p.CreatedByUser.LastName,
                    Qualifications = p.PhaseQualifications.Select(pq => new PhaseQualificationDetailDto
                    {
                        Id = pq.Id,
                        ProjectQualificationId = pq.ProjectQualificationId,
                        QualificationName = pq.ProjectQualification.OccupationalQualification?.Name ?? 
                                          pq.ProjectQualification.LegacyQualification?.Name ?? "Unknown",
                        QualificationCode = pq.ProjectQualification.OccupationalQualification?.QualificationId.ToString() ?? 
                                          pq.ProjectQualification.LegacyQualification?.QualificationId.ToString() ?? "N/A",
                        PlannedLearners = pq.PlannedLearners,
                        ActualLearners = pq.ActualLearners,
                        CompletedLearners = pq.CompletedLearners,
                        TotalCapacity = pq.ProjectQualification.NumberOfBeneficiaries,
                        RemainingCapacity = pq.ProjectQualification.NumberOfBeneficiaries - pq.ActualLearners
                    }).ToList(),
                    LearningPathways = p.PhaseLearningPathways.Select(plp => new PhaseLearningPathwayDetailDto
                    {
                        Id = plp.Id,
                        ProjectLearningPathwayId = plp.ProjectLearningPathwayId,
                        PathwayName = plp.ProjectLearningPathway.LearningPathway.Name,
                        PlannedLearners = plp.PlannedLearners,
                        ActualLearners = plp.ActualLearners
                    }).ToList()
                }).ToList();

                return Ok(phaseDtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting project phases for project {ProjectId}", projectId);
                return StatusCode(500, new { message = "Error occurred", error = ex.Message });
            }
        }

        // GET: api/ProjectPhases/{id}/Activities
        [HttpGet("{id}/Activities")]
        public async Task<ActionResult<IEnumerable<object>>> GetPhaseActivities(int id)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (!currentUserId.HasValue)
                {
                    return Unauthorized("User ID not found in token");
                }

                var phase = await _context.ProjectPhases
                    .Include(p => p.Project)
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (phase == null)
                {
                    return NotFound(new { message = "Phase not found" });
                }

                // Check access
                var currentUser = await _context.Users.FirstOrDefaultAsync(u => u.Id == currentUserId.Value);
                if (currentUser?.SkillsDevelopmentProviderId != phase.Project.SkillsDevelopmentProviderId)
                {
                    return Forbid("You don't have access to this phase");
                }

                var activities = await _context.PhaseActivities
                    .Include(a => a.AssignedToUser)
                    .Include(a => a.SubActivities)
                        .ThenInclude(sa => sa.AssignedToUser)
                    .Where(a => a.ProjectPhaseId == id)
                    .OrderBy(a => a.OrderIndex)
                    .Select(a => new {
                        Id = a.Id,
                        Name = a.Name,
                        Description = a.Description,
                        ActivityCode = a.ActivityCode,
                        OrderIndex = a.OrderIndex,
                        StartDate = a.StartDate,
                        EndDate = a.EndDate,
                        Status = a.Status.ToString(),
                        AssignedToUserName = a.AssignedToUser != null ? a.AssignedToUser.FirstName + " " + a.AssignedToUser.LastName : null,
                        SubActivities = a.SubActivities.OrderBy(sa => sa.OrderIndex).Select(sa => new {
                            Id = sa.Id,
                            Name = sa.Name,
                            Description = sa.Description,
                            ActivityCode = sa.ActivityCode,
                            OrderIndex = sa.OrderIndex,
                            StartDate = sa.StartDate,
                            EndDate = sa.EndDate,
                            Status = sa.Status.ToString(),
                            AssignedToUserName = sa.AssignedToUser != null ? sa.AssignedToUser.FirstName + " " + sa.AssignedToUser.LastName : null,
                            Notes = sa.Notes
                        }).ToList()
                    })
                    .ToListAsync();

                return Ok(activities);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting phase activities for phase {PhaseId}", id);
                return StatusCode(500, new { message = "Error occurred", error = ex.Message });
            }
        }

        // GET: api/ProjectPhases/Project/{projectId}/AvailableQualifications
        [HttpGet("Project/{projectId}/AvailableQualifications")]
        public async Task<ActionResult<IEnumerable<AvailableQualificationDto>>> GetAvailableQualifications(int projectId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (!currentUserId.HasValue)
                {
                    return Unauthorized("User ID not found in token");
                }

                var projectQualifications = await _context.ProjectQualifications
                    .Include(pq => pq.ProjectLearningPathway)
                        .ThenInclude(plp => plp.Project)
                    .Include(pq => pq.OccupationalQualification)
                    .Include(pq => pq.LegacyQualification)
                    .Where(pq => pq.ProjectLearningPathway.ProjectId == projectId)
                    .ToListAsync();

                // Calculate used capacity for each qualification across all phases
                var usedCapacities = await _context.ProjectPhaseQualifications
                    .Where(ppq => ppq.ProjectPhase.ProjectId == projectId)
                    .GroupBy(ppq => ppq.ProjectQualificationId)
                    .Select(g => new { ProjectQualificationId = g.Key, UsedCapacity = g.Sum(ppq => ppq.ActualLearners) })
                    .ToDictionaryAsync(x => x.ProjectQualificationId, x => x.UsedCapacity);

                var availableQualifications = projectQualifications.Select(pq => {
                    var usedCapacity = usedCapacities.GetValueOrDefault(pq.Id, 0);
                    var remainingCapacity = pq.NumberOfBeneficiaries - usedCapacity;
                    var qualificationName = pq.OccupationalQualification?.Name ?? pq.LegacyQualification?.Name ?? "Unknown";
                    var qualificationCode = pq.OccupationalQualification?.QualificationId.ToString() ?? 
                                          pq.LegacyQualification?.QualificationId.ToString() ?? "N/A";

                    return new AvailableQualificationDto
                    {
                        ProjectQualificationId = pq.Id,
                        QualificationName = qualificationName,
                        QualificationCode = qualificationCode,
                        QualificationType = pq.OccupationalQualification != null ? "Occupational" : "Legacy",
                        TotalCapacity = pq.NumberOfBeneficiaries,
                        UsedCapacity = usedCapacity,
                        RemainingCapacity = remainingCapacity,
                        DisplayText = $"{qualificationCode} - {qualificationName} ({usedCapacity}/{pq.NumberOfBeneficiaries} remaining)"
                    };
                }).ToList();

                return Ok(availableQualifications);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting available qualifications for project {ProjectId}", projectId);
                return StatusCode(500, new { message = "Error occurred", error = ex.Message });
            }
        }

        // GET: api/ProjectPhases/Project/{projectId}/AvailableLearningPathways
        [HttpGet("Project/{projectId}/AvailableLearningPathways")]
        public async Task<ActionResult<IEnumerable<AvailableLearningPathwayDto>>> GetAvailableLearningPathways(int projectId)
        {
            try
            {
                var projectLearningPathways = await _context.ProjectLearningPathways
                    .Include(plp => plp.LearningPathway)
                    .Where(plp => plp.ProjectId == projectId)
                    .Select(plp => new AvailableLearningPathwayDto
                    {
                        ProjectLearningPathwayId = plp.Id,
                        PathwayName = plp.LearningPathway.Name,
                        PathwayId = plp.LearningPathway.PathwayId
                    })
                    .ToListAsync();

                return Ok(projectLearningPathways);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting available learning pathways for project {ProjectId}", projectId);
                return StatusCode(500, new { message = "Error occurred", error = ex.Message });
            }
        }

        // POST: api/ProjectPhases
        [HttpPost]
        public async Task<ActionResult<ProjectPhaseDto>> CreateProjectPhase(CreateProjectPhaseDto createPhaseDto)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (!currentUserId.HasValue)
                {
                    return Unauthorized("User ID not found in token");
                }

                // Validate project access
                var project = await _context.Projects.FirstOrDefaultAsync(p => p.Id == createPhaseDto.ProjectId);
                if (project == null)
                {
                    return BadRequest(new { message = "Project not found" });
                }

                var currentUser = await _context.Users.FirstOrDefaultAsync(u => u.Id == currentUserId.Value);
                if (currentUser?.SkillsDevelopmentProviderId != project.SkillsDevelopmentProviderId)
                {
                    return Forbid("You don't have access to this project");
                }

                // Create the phase
                var phase = new ProjectPhase
                {
                    Name = createPhaseDto.Name,
                    Description = createPhaseDto.Description,
                    ProjectId = createPhaseDto.ProjectId,
                    StartDate = createPhaseDto.StartDate,
                    EndDate = createPhaseDto.EndDate,
                    PlannedBeneficiaries = createPhaseDto.PlannedBeneficiaries,
                    BudgetAllocation = createPhaseDto.BudgetAllocation,
                    CreatedByUserId = currentUserId.Value,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.ProjectPhases.Add(phase);
                await _context.SaveChangesAsync();

                // Add qualifications
                foreach (var qualDto in createPhaseDto.Qualifications)
                {
                    var phaseQual = new ProjectPhaseQualification
                    {
                        ProjectPhaseId = phase.Id,
                        ProjectQualificationId = qualDto.ProjectQualificationId,
                        PlannedLearners = qualDto.PlannedLearners,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    _context.ProjectPhaseQualifications.Add(phaseQual);
                }

                // Add learning pathways
                foreach (var pathwayDto in createPhaseDto.LearningPathways)
                {
                    var phasePathway = new ProjectPhaseLearningPathway
                    {
                        ProjectPhaseId = phase.Id,
                        ProjectLearningPathwayId = pathwayDto.ProjectLearningPathwayId,
                        PlannedLearners = pathwayDto.PlannedLearners,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    _context.ProjectPhaseLearningPathways.Add(phasePathway);
                }

                // Create default activities from template
                var activityTemplates = PhaseTemplateService.GetDefaultPhaseActivities();
                foreach (var activityTemplate in activityTemplates)
                {
                    var activity = new PhaseActivity
                    {
                        ProjectPhaseId = phase.Id,
                        Name = activityTemplate.Name,
                        ActivityCode = activityTemplate.ActivityCode,
                        OrderIndex = activityTemplate.OrderIndex,
                        Status = ActivityStatus.NotStarted,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    _context.PhaseActivities.Add(activity);
                    await _context.SaveChangesAsync(); // Save to get the activity ID

                    // Create sub-activities
                    foreach (var subActivityTemplate in activityTemplate.SubActivities)
                    {
                        var subActivity = new PhaseSubActivity
                        {
                            PhaseActivityId = activity.Id,
                            Name = subActivityTemplate.Name,
                            ActivityCode = subActivityTemplate.ActivityCode,
                            OrderIndex = subActivityTemplate.OrderIndex,
                            Status = ActivityStatus.NotStarted,
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow
                        };

                        _context.PhaseSubActivities.Add(subActivity);
                    }
                }

                await _context.SaveChangesAsync();

                // Return the created phase
                var createdPhase = await _context.ProjectPhases
                    .Include(p => p.Project)
                    .Include(p => p.CreatedByUser)
                    .Include(p => p.PhaseQualifications)
                        .ThenInclude(pq => pq.ProjectQualification)
                            .ThenInclude(pq => pq.OccupationalQualification)
                    .Include(p => p.PhaseQualifications)
                        .ThenInclude(pq => pq.ProjectQualification)
                            .ThenInclude(pq => pq.LegacyQualification)
                    .Include(p => p.PhaseLearningPathways)
                        .ThenInclude(plp => plp.ProjectLearningPathway)
                            .ThenInclude(plp => plp.LearningPathway)
                    .FirstOrDefaultAsync(p => p.Id == phase.Id);

                var phaseDto = new ProjectPhaseDto
                {
                    Id = createdPhase!.Id,
                    Name = createdPhase.Name,
                    Description = createdPhase.Description,
                    ProjectId = createdPhase.ProjectId,
                    ProjectName = createdPhase.Project.ProjectName,
                    StartDate = createdPhase.StartDate,
                    EndDate = createdPhase.EndDate,
                    Status = createdPhase.Status,
                    PlannedBeneficiaries = createdPhase.PlannedBeneficiaries,
                    ActualBeneficiaries = createdPhase.ActualBeneficiaries,
                    BudgetAllocation = createdPhase.BudgetAllocation,
                    ActualSpent = createdPhase.ActualSpent,
                    CreatedAt = createdPhase.CreatedAt,
                    UpdatedAt = createdPhase.UpdatedAt,
                    CreatedByUserName = createdPhase.CreatedByUser.FirstName + " " + createdPhase.CreatedByUser.LastName,
                    Qualifications = createdPhase.PhaseQualifications.Select(pq => new PhaseQualificationDetailDto
                    {
                        Id = pq.Id,
                        ProjectQualificationId = pq.ProjectQualificationId,
                        QualificationName = pq.ProjectQualification.OccupationalQualification?.Name ?? 
                                          pq.ProjectQualification.LegacyQualification?.Name ?? "Unknown",
                        QualificationCode = pq.ProjectQualification.OccupationalQualification?.QualificationId.ToString() ?? 
                                          pq.ProjectQualification.LegacyQualification?.QualificationId.ToString() ?? "N/A",
                        PlannedLearners = pq.PlannedLearners,
                        ActualLearners = pq.ActualLearners,
                        CompletedLearners = pq.CompletedLearners,
                        TotalCapacity = pq.ProjectQualification.NumberOfBeneficiaries,
                        RemainingCapacity = pq.ProjectQualification.NumberOfBeneficiaries - pq.ActualLearners
                    }).ToList(),
                    LearningPathways = createdPhase.PhaseLearningPathways.Select(plp => new PhaseLearningPathwayDetailDto
                    {
                        Id = plp.Id,
                        ProjectLearningPathwayId = plp.ProjectLearningPathwayId,
                        PathwayName = plp.ProjectLearningPathway.LearningPathway.Name,
                        PlannedLearners = plp.PlannedLearners,
                        ActualLearners = plp.ActualLearners
                    }).ToList()
                };

                return CreatedAtAction(nameof(GetProjectPhases), new { projectId = phase.ProjectId }, phaseDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating project phase");
                return StatusCode(500, new { message = "Error occurred", error = ex.Message });
            }
        }

        // PUT: api/ProjectPhases/{id}/Activities/{activityId}
        [HttpPut("{id}/Activities/{activityId}")]
        public async Task<ActionResult> UpdatePhaseActivity(int id, int activityId, [FromBody] object updateData)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (!currentUserId.HasValue)
                {
                    return Unauthorized("User ID not found in token");
                }

                var activity = await _context.PhaseActivities
                    .Include(a => a.ProjectPhase)
                        .ThenInclude(p => p.Project)
                    .FirstOrDefaultAsync(a => a.Id == activityId && a.ProjectPhaseId == id);

                if (activity == null)
                {
                    return NotFound(new { message = "Activity not found" });
                }

                // Check access
                var currentUser = await _context.Users.FirstOrDefaultAsync(u => u.Id == currentUserId.Value);
                if (currentUser?.SkillsDevelopmentProviderId != activity.ProjectPhase.Project.SkillsDevelopmentProviderId)
                {
                    return Forbid("You don't have access to this activity");
                }

                // Parse update data (simplified - you can expand this based on needs)
                var updateJson = System.Text.Json.JsonSerializer.Serialize(updateData);
                var updateDict = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(updateJson);

                if (updateDict != null)
                {
                    if (updateDict.ContainsKey("startDate") && DateTime.TryParse(updateDict["startDate"].ToString(), out DateTime startDate))
                    {
                        activity.StartDate = startDate;
                    }

                    if (updateDict.ContainsKey("endDate") && DateTime.TryParse(updateDict["endDate"].ToString(), out DateTime endDate))
                    {
                        activity.EndDate = endDate;
                    }

                    if (updateDict.ContainsKey("status") && Enum.TryParse<ActivityStatus>(updateDict["status"].ToString(), out ActivityStatus status))
                    {
                        activity.Status = status;
                    }

                    if (updateDict.ContainsKey("assignedToUserId") && int.TryParse(updateDict["assignedToUserId"].ToString(), out int assignedUserId))
                    {
                        activity.AssignedToUserId = assignedUserId == 0 ? null : assignedUserId;
                    }

                    activity.UpdatedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                }

                return Ok(new { message = "Activity updated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating phase activity {ActivityId}", activityId);
                return StatusCode(500, new { message = "Error occurred", error = ex.Message });
            }
        }

        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(userIdClaim, out int userId))
            {
                return userId;
            }
            return null;
        }
    }
}