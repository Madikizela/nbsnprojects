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
        [AllowAnonymous] // Temporarily allow anonymous access to debug
        public async Task<ActionResult> GetSDPProjects()
        {
            try
            {
                _logger.LogInformation("=== GET /api/sdp/projects called === ");
                _logger.LogInformation("User.Identity.Name: {Name}", User.Identity?.Name);
                _logger.LogInformation("User.Identity.IsAuthenticated: {IsAuth}", User.Identity?.IsAuthenticated);
                
                // Log all claims for debugging
                foreach (var claim in User.Claims)
                {
                    _logger.LogInformation("Claim: {Type} = {Value}", claim.Type, claim.Value);
                }

                var userId = GetCurrentUserId();
                _logger.LogInformation("Got userId: {UserId}", userId);
                
                if (!userId.HasValue)
                {
                    _logger.LogWarning("User ID not found in token!");
                }

                // For debugging: if we have no userId, proceed, else get SDP 15 projects
                int? sdpId;
                if (userId.HasValue)
                {
                    // Get user's SDP ID
                    var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId.Value);
                    sdpId = user?.SkillsDevelopmentProviderId;
                    _logger.LogInformation("User's SDP ID: {SDPId}", sdpId);
                }
                else
                {
                    // Fallback for debugging
                    sdpId = 15;
                }
                
                if (!sdpId.HasValue)
                {
                    return Ok(new { message = "User is not associated with any SDP", projects = new List<object>() });
                }

                // Get all projects for this SDP
                var projects = await _context.Projects
                    .Where(p => p.SkillsDevelopmentProviderId == sdpId.Value)
                    .Include(p => p.Client)
                    .Include(p => p.SkillsDevelopmentProvider)
                    .ToListAsync();

                return Ok(new { 
                    message = "SDP Projects Retrieved Successfully", 
                    sdpId = sdpId.Value,
                    projectCount = projects.Count,
                    projects = projects
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting SDP projects");
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