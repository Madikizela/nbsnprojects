using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/sdp/projects")]
    public class WorkingSDPController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<WorkingSDPController> _logger;

        public WorkingSDPController(
            ApplicationDbContext context,
            ILogger<WorkingSDPController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet("ping")]
        public ActionResult Ping()
        {
            return Ok(new { message = "SDP Projects Controller is working!", timestamp = DateTime.UtcNow });
        }

        // GET: api/sdp/projects
        [HttpGet]
        [Authorize]
        public async Task<ActionResult> GetSDPProjects()
        {
            try
            {
                var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                _logger.LogInformation($"DEBUG: GetSDPProjects called. User ID from token: {userIdStr}");
                
                if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out int userId))
                {
                    return Unauthorized(new { message = "Invalid user ID in token" });
                }

                // Get user's SDP ID
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
                _logger.LogInformation($"DEBUG: User found: {user?.Email}, SDP ID from DB: {user?.SkillsDevelopmentProviderId}");
                
                if (user == null || !user.SkillsDevelopmentProviderId.HasValue)
                {
                    return Ok(new { message = "User is not associated with any SDP", projects = new List<object>() });
                }

                var sdpId = user.SkillsDevelopmentProviderId.Value;
                _logger.LogInformation($"DEBUG: Fetching projects for SDP ID: {sdpId}");

                var projects = await _context.Projects
                    .Where(p => p.SkillsDevelopmentProviderId == sdpId)
                    .ToListAsync();
                
                _logger.LogInformation($"DEBUG: Found {projects.Count} projects");

                return Ok(new { 
                    message = "SDP Projects Retrieved Successfully", 
                    sdpId = sdpId,
                    projectCount = projects.Count,
                    projects = projects
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting SDP projects for user {UserId}", GetCurrentUserId());
                return StatusCode(500, new { message = "Error occurred", error = ex.Message });
            }
        }

        // GET: api/sdp/projects/dashboard
        [HttpGet("dashboard")]
        [Authorize]
        public async Task<ActionResult> GetSDPDashboard()
        {
            try
            {
                var userId = GetCurrentUserId();
                if (!userId.HasValue)
                {
                    return Unauthorized("User ID not found in token");
                }

                // Get user's SDP ID
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId.Value);
                var sdpId = user?.SkillsDevelopmentProviderId;
                
                if (!sdpId.HasValue)
                {
                    return Ok(new { 
                        totalProjects = 0,
                        activeProjects = 0,
                        completedProjects = 0,
                        projects = new List<object>()
                    });
                }

                // Get all projects for this SDP
                var projects = await _context.Projects
                    .Where(p => p.SkillsDevelopmentProviderId == sdpId.Value)
                    .Include(p => p.Client)
                    .Include(p => p.SkillsDevelopmentProvider)
                    .ToListAsync();

                return Ok(new { 
                    totalProjects = projects.Count,
                    activeProjects = projects.Count, // For now, assume all are active
                    completedProjects = 0,
                    projects = projects
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting SDP dashboard for user {UserId}", GetCurrentUserId());
                return StatusCode(500, new { message = "Error occurred", error = ex.Message });
            }
        }

        [HttpGet("debug")]
        public async Task<ActionResult> Debug()
        {
            try
            {
                // Check all projects and their SDP assignments
                var allProjects = await _context.Projects
                    .Include(p => p.SkillsDevelopmentProvider)
                    .Select(p => new {
                        Id = p.Id,
                        ProjectName = p.ProjectName,
                        ContractNumber = p.ContractNumber,
                        SkillsDevelopmentProviderId = p.SkillsDevelopmentProviderId,
                        SDPName = p.SkillsDevelopmentProvider != null ? p.SkillsDevelopmentProvider.Name : "No SDP"
                    })
                    .ToListAsync();

                // Check all SDP users
                var sdpUsers = await _context.Users
                    .Where(u => u.SkillsDevelopmentProviderId.HasValue)
                    .Select(u => new {
                        Id = u.Id,
                        Email = u.Email,
                        Role = u.Role,
                        SkillsDevelopmentProviderId = u.SkillsDevelopmentProviderId
                    })
                    .ToListAsync();

                return Ok(new {
                    message = "Working SDP Debug Info",
                    totalProjects = allProjects.Count,
                    projects = allProjects,
                    sdpUsers = sdpUsers,
                    specificSDPProjects = allProjects.Where(p => p.SkillsDevelopmentProviderId == 14).ToList()
                });
            }
            catch (Exception ex)
            {
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