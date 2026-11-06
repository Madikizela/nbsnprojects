using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AdminStatsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AdminStatsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/AdminStats
        // Returns platform-wide counts for the System Admin dashboard summary cards.
        [HttpGet]
        public async Task<IActionResult> GetStats()
        {
            try
            {
                var totalSdps       = await _context.SkillsDevelopmentProviders.CountAsync();
                var activeSdps      = await _context.SkillsDevelopmentProviders.CountAsync(s => s.Status == SDPStatus.Active);
                var inactiveSdps    = await _context.SkillsDevelopmentProviders.CountAsync(s => s.Status == SDPStatus.Inactive);
                var pendingSdps     = await _context.SkillsDevelopmentProviders.CountAsync(s => s.Status == SDPStatus.PendingApproval);

                var totalClients    = await _context.Clients.CountAsync();
                var totalUsers      = await _context.Users.CountAsync();
                var activeUsers     = await _context.Users.CountAsync(u => u.Status == UserStatus.Active);
                var inactiveUsers   = await _context.Users.CountAsync(u => u.Status == UserStatus.Inactive);

                var totalLearners   = await _context.Learners.CountAsync();
                var totalProjects   = await _context.Projects.CountAsync();
                var totalClasses    = await _context.SiteClasses.CountAsync();

                // Attendance today (SA time = UTC+2)
                var today           = DateTime.UtcNow.AddHours(2).Date;
                var todayClockins   = await _context.LearnerAttendances
                    .CountAsync(a => a.AttendanceDate.Date == today && a.ClockInTime != null);

                // Recent audit activity (last 5 entries)
                var recentActivity  = await _context.AdminAuditLogs
                    .OrderByDescending(l => l.CreatedAt)
                    .Take(5)
                    .Select(l => new { l.Action, l.Description, l.EntityName, l.PerformedBy, l.CreatedAt })
                    .ToListAsync();

                // SDPs registered in the last 30 days
                var thirtyDaysAgo   = DateTime.UtcNow.AddDays(-30);
                var newSdpsThisMonth = await _context.SkillsDevelopmentProviders
                    .CountAsync(s => s.CreatedAt >= thirtyDaysAgo);

                return Ok(new
                {
                    sdps = new { total = totalSdps, active = activeSdps, inactive = inactiveSdps, pending = pendingSdps, newThisMonth = newSdpsThisMonth },
                    clients      = new { total = totalClients },
                    users        = new { total = totalUsers, active = activeUsers, inactive = inactiveUsers },
                    learners     = new { total = totalLearners },
                    projects     = new { total = totalProjects },
                    classes      = new { total = totalClasses },
                    attendance   = new { todayClockins },
                    recentActivity
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message, inner = ex.InnerException?.Message });
            }
        }
    }
}
