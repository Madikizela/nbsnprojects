using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LearnerProgressController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public LearnerProgressController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/LearnerProgress/project/{projectId}
        // Returns a per-learner summary: attendance rate, assessments completed, and status
        [HttpGet("project/{projectId}")]
        public async Task<IActionResult> GetProjectLearnerProgress(int projectId)
        {
            try
            {
                // Get all classes under this project via sites
                var classIds = await _context.SiteClasses
                    .Where(sc => _context.ProjectSites
                        .Where(ps => ps.ProjectId == projectId)
                        .Select(ps => ps.Id)
                        .Contains(sc.ProjectSiteId))
                    .Select(sc => sc.Id)
                    .ToListAsync();

                if (!classIds.Any())
                    return Ok(new { projectId, learners = new List<object>() });

                // Get all active enrollments
                var enrollments = await _context.ClassEnrollments
                    .Where(ce => classIds.Contains(ce.SiteClassId) && ce.Status == "Active")
                    .Include(ce => ce.Learner)
                    .ToListAsync();

                if (!enrollments.Any())
                    return Ok(new { projectId, learners = new List<object>() });

                var learnerIds = enrollments.Select(e => e.LearnerId).Distinct().ToList();

                // Count total class days (distinct dates with any attendance record)
                var totalDays = await _context.LearnerAttendances
                    .Where(a => classIds.Contains(a.ClassId))
                    .Select(a => a.AttendanceDate.Date)
                    .Distinct()
                    .CountAsync();

                // Per-learner attendance
                var attendanceCounts = await _context.LearnerAttendances
                    .Where(a => classIds.Contains(a.ClassId) && learnerIds.Contains(a.LearnerId) && a.ClockInTime != null)
                    .GroupBy(a => a.LearnerId)
                    .Select(g => new { LearnerId = g.Key, DaysPresent = g.Count() })
                    .ToListAsync();

                // Per-learner assessment completion
                var assessmentCounts = await _context.LearnerAssessmentAnswers
                    .Where(a => learnerIds.Contains(a.LearnerId))
                    .GroupBy(a => a.LearnerId)
                    .Select(g => new { LearnerId = g.Key, AnswersSubmitted = g.Count() })
                    .ToListAsync();

                // Build per-learner summary
                var result = enrollments
                    .GroupBy(e => e.LearnerId)
                    .Select(g =>
                    {
                        var learner     = g.First().Learner;
                        var daysPresent = attendanceCounts.FirstOrDefault(a => a.LearnerId == g.Key)?.DaysPresent ?? 0;
                        var answers     = assessmentCounts.FirstOrDefault(a => a.LearnerId == g.Key)?.AnswersSubmitted ?? 0;
                        var attendRate  = totalDays > 0 ? Math.Round((double)daysPresent / totalDays * 100, 1) : 0.0;

                        var status = attendRate >= 80 ? "On Track"
                                   : attendRate >= 50 ? "At Risk"
                                   : "Behind";

                        return new
                        {
                            learnerId    = g.Key,
                            fullName     = learner != null ? $"{learner.FirstName} {learner.LastName}" : "Unknown",
                            email        = learner?.Email ?? "",
                            idNumber     = learner?.IdNumber ?? "",
                            daysPresent,
                            totalDays,
                            attendanceRate = attendRate,
                            assessmentsSubmitted = answers,
                            status,
                            enrollmentStatus = g.First().Status
                        };
                    })
                    .OrderBy(l => l.fullName)
                    .ToList();

                return Ok(new
                {
                    projectId,
                    totalLearners  = result.Count,
                    onTrack        = result.Count(l => l.status == "On Track"),
                    atRisk         = result.Count(l => l.status == "At Risk"),
                    behind         = result.Count(l => l.status == "Behind"),
                    learners       = result
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message, inner = ex.InnerException?.Message });
            }
        }

        // GET: api/LearnerProgress/sdp/{sdpId}
        // Summary across all projects for an SDP
        [HttpGet("sdp/{sdpId}")]
        public async Task<IActionResult> GetSDPLearnerProgress(int sdpId)
        {
            try
            {
                var projects = await _context.Projects
                    .Where(p => p.SkillsDevelopmentProviderId == sdpId)
                    .Select(p => new { p.Id, p.ProjectName })
                    .ToListAsync();

                if (!projects.Any())
                    return Ok(new { sdpId, projects = new List<object>() });

                var summaries = new List<object>();
                foreach (var project in projects)
                {
                    var classIds = await _context.SiteClasses
                        .Where(sc => _context.ProjectSites
                            .Where(ps => ps.ProjectId == project.Id)
                            .Select(ps => ps.Id)
                            .Contains(sc.ProjectSiteId))
                        .Select(sc => sc.Id)
                        .ToListAsync();

                    var totalLearners = await _context.ClassEnrollments
                        .Where(ce => classIds.Contains(ce.SiteClassId) && ce.Status == "Active")
                        .Select(ce => ce.LearnerId)
                        .Distinct()
                        .CountAsync();

                    var totalDays = classIds.Any()
                        ? await _context.LearnerAttendances
                            .Where(a => classIds.Contains(a.ClassId))
                            .Select(a => a.AttendanceDate.Date)
                            .Distinct()
                            .CountAsync()
                        : 0;

                    summaries.Add(new
                    {
                        projectId    = project.Id,
                        projectName  = project.ProjectName,
                        totalLearners,
                        totalDays
                    });
                }

                return Ok(new { sdpId, projects = summaries });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message, inner = ex.InnerException?.Message });
            }
        }
    }
}
