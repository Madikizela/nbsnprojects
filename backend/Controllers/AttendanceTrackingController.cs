using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using backend.Models;
using backend.Models.DTOs;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AttendanceTrackingController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<AttendanceTrackingController> _logger;
        private readonly IMemoryCache _cache;

        public AttendanceTrackingController(ApplicationDbContext context, ILogger<AttendanceTrackingController> logger, IMemoryCache cache)
        {
            _context = context;
            _logger = logger;
            _cache = cache;
        }

        // GET: api/AttendanceTracking/projects
        [HttpGet("projects")]
        public async Task<ActionResult<IEnumerable<AttendanceTrackingProjectDto>>> GetProjectsWithAttendance([FromQuery] string period = "today")
        {
            try
            {
                DateTime targetStartDate, targetEndDate;
                switch (period.ToLower())
                {
                    case "week":
                        targetStartDate = DateTime.Today.AddDays(-(int)DateTime.Today.DayOfWeek);
                        targetEndDate = targetStartDate.AddDays(6);
                        break;
                    case "month":
                        targetStartDate = new DateTime(DateTime.Today.Year, DateTime.Today.Month, 1);
                        targetEndDate = targetStartDate.AddMonths(1).AddDays(-1);
                        break;
                    default: // "today"
                        targetStartDate = targetEndDate = DateTime.Today;
                        break;
                }

                var cacheKey = $"attendance_projects_{period}_{targetStartDate:yyyyMMdd}";
                
                // Check cache first
                if (_cache.TryGetValue(cacheKey, out List<AttendanceTrackingProjectDto>? cachedProjects))
                {
                    return Ok(cachedProjects);
                }
                
                var totalDays = (targetEndDate - targetStartDate).Days + 1;

                // Optimized query using proper joins and indexes
                var projectsWithAttendance = await _context.Projects
                    .Select(p => new AttendanceTrackingProjectDto
                    {
                        ProjectId = p.Id,
                        ProjectName = p.ProjectName,
                        TotalLearners = _context.ProjectSites
                            .Where(ps => ps.ProjectId == p.Id)
                            .SelectMany(ps => ps.SiteClasses)
                            .SelectMany(sc => sc.ClassEnrollments)
                            .Where(ce => ce.Status == "Active")
                            .Count(),
                        PresentToday = _context.LearnerAttendances
                            .Where(la => la.AttendanceDate >= targetStartDate && 
                                        la.AttendanceDate <= targetEndDate &&
                                        _context.ClassEnrollments.Any(ce => ce.LearnerId == la.LearnerId && 
                                                                         ce.SiteClass!.ProjectSite!.ProjectId == p.Id && 
                                                                         ce.Status == "Active") &&
                                        la.ClockInTime.HasValue)
                            .Count(),
                        TotalClasses = _context.ProjectSites
                            .Where(ps => ps.ProjectId == p.Id)
                            .SelectMany(ps => ps.SiteClasses)
                            .Count()
                    })
                    .Where(p => p.TotalLearners > 0)
                    .ToListAsync();

                // Calculate derived fields
                foreach (var project in projectsWithAttendance)
                {
                    var totalPossibleAttendances = project.TotalLearners * totalDays;
                    project.AbsentToday = totalPossibleAttendances - project.PresentToday;
                    project.AttendanceRate = totalPossibleAttendances > 0 
                        ? Math.Round((double)project.PresentToday / totalPossibleAttendances * 100, 2) 
                        : 0;
                }

                var result = projectsWithAttendance.OrderByDescending(p => p.AttendanceRate).ThenBy(p => p.ProjectName).ToList();
                
                // Cache for 5 minutes
                var cacheOptions = new MemoryCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5),
                    SlidingExpiration = TimeSpan.FromMinutes(2),
                    Priority = CacheItemPriority.High
                };
                _cache.Set(cacheKey, result, cacheOptions);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching projects with attendance for period {Period}", period);
                return StatusCode(500, new { message = "An error occurred while fetching projects" });
            }
        }

        // GET: api/AttendanceTracking/project/{projectId}/stats
        [HttpGet("project/{projectId}/stats")]
        public async Task<ActionResult<AttendanceTrackingStatsDto>> GetProjectAttendanceStats(
            int projectId, 
            [FromQuery] string period = "today",
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            try
            {
                // Determine date range based on period
                DateTime targetStartDate, targetEndDate;
                switch (period.ToLower())
                {
                    case "week":
                        targetStartDate = DateTime.Today.AddDays(-(int)DateTime.Today.DayOfWeek);
                        targetEndDate = targetStartDate.AddDays(6);
                        break;
                    case "month":
                        targetStartDate = new DateTime(DateTime.Today.Year, DateTime.Today.Month, 1);
                        targetEndDate = targetStartDate.AddMonths(1).AddDays(-1);
                        break;
                    case "custom":
                        targetStartDate = startDate ?? DateTime.Today;
                        targetEndDate = endDate ?? DateTime.Today;
                        break;
                    default: // "today"
                        targetStartDate = targetEndDate = DateTime.Today;
                        break;
                }

                var project = await _context.Projects.FindAsync(projectId);
                if (project == null)
                {
                    return NotFound(new { message = "Project not found" });
                }

                // Get total learners in project
                var totalLearners = await _context.ClassEnrollments
                    .Where(ce => ce.SiteClass!.ProjectSite!.ProjectId == projectId && ce.Status == "Active")
                    .CountAsync();

                // Get attendance data for the period
                var attendanceData = await _context.LearnerAttendances
                    .Where(la => la.AttendanceDate >= targetStartDate && 
                                la.AttendanceDate <= targetEndDate &&
                                _context.ClassEnrollments
                                    .Any(ce => ce.LearnerId == la.LearnerId && 
                                              ce.SiteClass!.ProjectSite!.ProjectId == projectId && 
                                              ce.Status == "Active"))
                    .ToListAsync();

                var presentLearners = attendanceData.Count(la => la.ClockInTime.HasValue);
                var absentLearners = totalLearners - presentLearners;
                
                // Calculate late arrivals (after 8:30 AM)
                var lateArrivals = attendanceData.Count(la => 
                    la.ClockInTime.HasValue && 
                    la.ClockInTime.Value.TimeOfDay > new TimeSpan(8, 30, 0));

                // Calculate early departures (before 4:30 PM)
                var earlyDepartures = attendanceData.Count(la => 
                    la.ClockOutTime.HasValue && 
                    la.ClockOutTime.Value.TimeOfDay < new TimeSpan(16, 30, 0));

                // Calculate average contact hours
                var completedAttendances = attendanceData
                    .Where(la => la.ClockInTime.HasValue && la.ClockOutTime.HasValue)
                    .ToList();

                double averageContactHours = 0;
                string averageContactTime = "0h 0m";
                
                if (completedAttendances.Any())
                {
                    var totalMinutes = completedAttendances
                        .Select(la => (la.ClockOutTime!.Value - la.ClockInTime!.Value).TotalMinutes)
                        .Average();
                    
                    averageContactHours = totalMinutes / 60.0;
                    var hours = (int)(totalMinutes / 60);
                    var minutes = (int)(totalMinutes % 60);
                    averageContactTime = $"{hours}h {minutes}m";
                }

                // Get class breakdown
                var classBreakdown = await GetClassAttendanceBreakdown(projectId, targetStartDate, targetEndDate);

                var stats = new AttendanceTrackingStatsDto
                {
                    Date = targetStartDate,
                    ProjectId = projectId,
                    ProjectName = project.ProjectName,
                    TotalLearners = totalLearners,
                    PresentLearners = presentLearners,
                    AbsentLearners = absentLearners,
                    LateArrivals = lateArrivals,
                    EarlyDepartures = earlyDepartures,
                    AttendanceRate = totalLearners > 0 ? Math.Round((double)presentLearners / totalLearners * 100, 2) : 0,
                    AverageContactHours = Math.Round(averageContactHours, 2),
                    AverageContactTime = averageContactTime,
                    ClassBreakdown = classBreakdown
                };

                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching project attendance stats for project {ProjectId}", projectId);
                return StatusCode(500, new { message = "An error occurred while fetching attendance statistics" });
            }
        }

        // GET: api/AttendanceTracking/project/{projectId}/class/{classId}/learners/weekly
        [HttpGet("project/{projectId}/class/{classId}/learners/weekly")]
        public async Task<ActionResult<IEnumerable<LearnerWeeklyAttendanceDto>>> GetClassLearnerWeeklyAttendance(
            int projectId, 
            int classId, 
            [FromQuery] DateTime? startDate = null)
        {
            try
            {
                // Default to current week (Monday to Friday)
                var weekStart = startDate ?? GetMondayOfWeek(DateTime.Today);
                var weekEnd = weekStart.AddDays(4); // Friday

                // Optimized query: Get learners and their attendance in a single query
                var learnersWithAttendance = await (from ce in _context.ClassEnrollments
                                                  join l in _context.Learners on ce.LearnerId equals l.Id
                                                  join sc in _context.SiteClasses on ce.SiteClassId equals sc.Id
                                                  where sc.Id == classId && 
                                                        sc.ProjectSite!.ProjectId == projectId && 
                                                        ce.Status == "Active"
                                                  select new 
                                                  { 
                                                      Learner = l,
                                                      Attendances = _context.LearnerAttendances
                                                          .Where(la => la.LearnerId == l.Id && 
                                                                      la.ClassId == classId && 
                                                                      la.AttendanceDate >= weekStart && 
                                                                      la.AttendanceDate <= weekEnd)
                                                          .ToList()
                                                  })
                                                  .ToListAsync();

                var learnerWeeklyAttendances = new List<LearnerWeeklyAttendanceDto>();

                foreach (var learnerData in learnersWithAttendance)
                {
                    // Create daily attendance records for Monday to Friday
                    var dailyAttendances = new List<DailyLearnerAttendanceDto>();
                    for (var date = weekStart; date <= weekEnd; date = date.AddDays(1))
                    {
                        var dayAttendance = learnerData.Attendances.FirstOrDefault(wa => wa.AttendanceDate.Date == date.Date);
                        
                        var dailyRecord = new DailyLearnerAttendanceDto
                        {
                            Date = date,
                            DayOfWeek = date.ToString("dddd"),
                            Status = dayAttendance?.Status ?? "Absent",
                            ClockInTime = dayAttendance?.ClockInTime,
                            ClockOutTime = dayAttendance?.ClockOutTime,
                            ClockInVerified = dayAttendance?.ClockInVerified ?? false,
                            ClockOutVerified = dayAttendance?.ClockOutVerified ?? false,
                            Notes = dayAttendance?.Notes
                        };

                        // Calculate contact time if both clock in and out exist
                        if (dayAttendance?.ClockInTime.HasValue == true && dayAttendance?.ClockOutTime.HasValue == true)
                        {
                            var contactTime = dayAttendance.ClockOutTime.Value - dayAttendance.ClockInTime.Value;
                            dailyRecord.ContactHours = Math.Round(contactTime.TotalHours, 2);
                            dailyRecord.ContactTime = $"{(int)contactTime.TotalHours}h {contactTime.Minutes}m";
                        }

                        dailyAttendances.Add(dailyRecord);
                    }

                    // Calculate weekly summary
                    var presentDays = dailyAttendances.Count(da => da.Status == "Present");
                    var absentDays = dailyAttendances.Count(da => da.Status == "Absent");
                    var totalContactHours = dailyAttendances.Where(da => da.ContactHours.HasValue).Sum(da => da.ContactHours.Value);

                    var learnerWeeklyAttendance = new LearnerWeeklyAttendanceDto
                    {
                        LearnerId = learnerData.Learner.Id,
                        FirstName = learnerData.Learner.FirstName,
                        LastName = learnerData.Learner.LastName,
                        IdNumber = learnerData.Learner.IdNumber,
                        WeekStartDate = weekStart,
                        WeekEndDate = weekEnd,
                        PresentDays = presentDays,
                        AbsentDays = absentDays,
                        AttendanceRate = Math.Round((double)presentDays / 5 * 100, 2),
                        TotalContactHours = Math.Round(totalContactHours, 2),
                        DailyAttendances = dailyAttendances
                    };

                    learnerWeeklyAttendances.Add(learnerWeeklyAttendance);
                }

                return Ok(learnerWeeklyAttendances.OrderBy(la => la.LastName).ThenBy(la => la.FirstName));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching class learner weekly attendance for class {ClassId}", classId);
                return StatusCode(500, new { message = "An error occurred while fetching weekly learner attendance" });
            }
        }

        // GET: api/AttendanceTracking/project/{projectId}/class/{classId}/learners
        [HttpGet("project/{projectId}/class/{classId}/learners")]
        public async Task<ActionResult<IEnumerable<LearnerAttendanceDto>>> GetClassLearnerAttendance(
            int projectId, 
            int classId, 
            [FromQuery] DateTime? date = null)
        {
            try
            {
                var targetDate = date ?? DateTime.Today;

                var learners = await (from ce in _context.ClassEnrollments
                                    join l in _context.Learners on ce.LearnerId equals l.Id
                                    join sc in _context.SiteClasses on ce.SiteClassId equals sc.Id
                                    where sc.Id == classId && 
                                          sc.ProjectSite!.ProjectId == projectId && 
                                          ce.Status == "Active"
                                    select new { Enrollment = ce, Learner = l })
                                    .ToListAsync();

                var learnerAttendances = new List<LearnerAttendanceDto>();

                foreach (var learnerData in learners)
                {
                    var attendance = await _context.LearnerAttendances
                        .FirstOrDefaultAsync(la => la.LearnerId == learnerData.Learner.Id && 
                                                  la.ClassId == classId && 
                                                  la.AttendanceDate == targetDate);

                    var learnerAttendance = new LearnerAttendanceDto
                    {
                        LearnerId = learnerData.Learner.Id,
                        FirstName = learnerData.Learner.FirstName,
                        LastName = learnerData.Learner.LastName,
                        IdNumber = learnerData.Learner.IdNumber,
                        Status = attendance?.Status ?? "Absent",
                        ClockInTime = attendance?.ClockInTime,
                        ClockOutTime = attendance?.ClockOutTime,
                        ClockInVerified = attendance?.ClockInVerified ?? false,
                        ClockOutVerified = attendance?.ClockOutVerified ?? false,
                        Notes = attendance?.Notes
                    };

                    // Calculate contact time if both clock in and out exist
                    if (attendance?.ClockInTime.HasValue == true && attendance?.ClockOutTime.HasValue == true)
                    {
                        var contactTime = attendance.ClockOutTime.Value - attendance.ClockInTime.Value;
                        learnerAttendance.ContactHours = Math.Round(contactTime.TotalHours, 2);
                        learnerAttendance.ContactTime = $"{(int)contactTime.TotalHours}h {contactTime.Minutes}m";
                    }

                    learnerAttendances.Add(learnerAttendance);
                }

                return Ok(learnerAttendances.OrderBy(la => la.LastName).ThenBy(la => la.FirstName));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching class learner attendance for class {ClassId}", classId);
                return StatusCode(500, new { message = "An error occurred while fetching learner attendance" });
            }
        }

        // GET: api/AttendanceTracking/project/{projectId}/report
        [HttpGet("project/{projectId}/report")]
        public async Task<ActionResult<AttendanceReportDto>> GetAttendanceReport(
            int projectId,
            [FromQuery] string period = "week",
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            try
            {
                // Determine date range
                DateTime targetStartDate, targetEndDate;
                switch (period.ToLower())
                {
                    case "week":
                        targetStartDate = DateTime.Today.AddDays(-(int)DateTime.Today.DayOfWeek);
                        targetEndDate = targetStartDate.AddDays(6);
                        break;
                    case "month":
                        targetStartDate = new DateTime(DateTime.Today.Year, DateTime.Today.Month, 1);
                        targetEndDate = targetStartDate.AddMonths(1).AddDays(-1);
                        break;
                    case "custom":
                        targetStartDate = startDate ?? DateTime.Today.AddDays(-7);
                        targetEndDate = endDate ?? DateTime.Today;
                        break;
                    default:
                        targetStartDate = targetEndDate = DateTime.Today;
                        break;
                }

                var project = await _context.Projects.FindAsync(projectId);
                if (project == null)
                {
                    return NotFound(new { message = "Project not found" });
                }

                // Get all attendance data for the period
                var attendanceData = await _context.LearnerAttendances
                    .Where(la => la.AttendanceDate >= targetStartDate && 
                                la.AttendanceDate <= targetEndDate &&
                                _context.ClassEnrollments
                                    .Any(ce => ce.LearnerId == la.LearnerId && 
                                              ce.SiteClass!.ProjectSite!.ProjectId == projectId && 
                                              ce.Status == "Active"))
                    .Include(la => la.Learner)
                    .ToListAsync();

                var totalLearners = await _context.ClassEnrollments
                    .Where(ce => ce.SiteClass!.ProjectSite!.ProjectId == projectId && ce.Status == "Active")
                    .CountAsync();

                // Calculate summary
                var totalDays = (targetEndDate - targetStartDate).Days + 1;
                var totalPossibleAttendances = totalLearners * totalDays;
                var totalActualAttendances = attendanceData.Count(la => la.ClockInTime.HasValue);
                var overallAttendanceRate = totalPossibleAttendances > 0 
                    ? Math.Round((double)totalActualAttendances / totalPossibleAttendances * 100, 2) 
                    : 0;

                var completedAttendances = attendanceData
                    .Where(la => la.ClockInTime.HasValue && la.ClockOutTime.HasValue)
                    .ToList();

                var averageContactHours = completedAttendances.Any()
                    ? Math.Round(completedAttendances
                        .Select(la => (la.ClockOutTime!.Value - la.ClockInTime!.Value).TotalHours)
                        .Average(), 2)
                    : 0;

                var summary = new AttendanceSummaryDto
                {
                    TotalDays = totalDays,
                    TotalLearners = totalLearners,
                    TotalPossibleAttendances = totalPossibleAttendances,
                    TotalActualAttendances = totalActualAttendances,
                    OverallAttendanceRate = overallAttendanceRate,
                    AverageContactHours = averageContactHours,
                    TotalLateArrivals = attendanceData.Count(la => 
                        la.ClockInTime.HasValue && 
                        la.ClockInTime.Value.TimeOfDay > new TimeSpan(8, 30, 0)),
                    TotalEarlyDepartures = attendanceData.Count(la => 
                        la.ClockOutTime.HasValue && 
                        la.ClockOutTime.Value.TimeOfDay < new TimeSpan(16, 30, 0))
                };

                // Generate daily breakdown
                var dailyBreakdown = new List<DailyAttendanceDto>();
                for (var date = targetStartDate; date <= targetEndDate; date = date.AddDays(1))
                {
                    var dayAttendances = attendanceData.Where(la => la.AttendanceDate == date).ToList();
                    var presentCount = dayAttendances.Count(la => la.ClockInTime.HasValue);
                    var dayContactHours = dayAttendances
                        .Where(la => la.ClockInTime.HasValue && la.ClockOutTime.HasValue)
                        .Select(la => (la.ClockOutTime!.Value - la.ClockInTime!.Value).TotalHours)
                        .DefaultIfEmpty(0)
                        .Average();

                    dailyBreakdown.Add(new DailyAttendanceDto
                    {
                        Date = date,
                        TotalLearners = totalLearners,
                        PresentLearners = presentCount,
                        AbsentLearners = totalLearners - presentCount,
                        AttendanceRate = totalLearners > 0 ? Math.Round((double)presentCount / totalLearners * 100, 2) : 0,
                        AverageContactHours = Math.Round(dayContactHours, 2)
                    });
                }

                // Generate learner summaries
                var learnerSummaries = await GenerateLearnerSummaries(projectId, targetStartDate, targetEndDate);

                var report = new AttendanceReportDto
                {
                    StartDate = targetStartDate,
                    EndDate = targetEndDate,
                    Period = period,
                    ProjectId = projectId,
                    ProjectName = project.ProjectName,
                    Summary = summary,
                    DailyBreakdown = dailyBreakdown,
                    LearnerSummaries = learnerSummaries
                };

                return Ok(report);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating attendance report for project {ProjectId}", projectId);
                return StatusCode(500, new { message = "An error occurred while generating the report" });
            }
        }

        private async Task<List<ClassAttendanceDto>> GetClassAttendanceBreakdown(int projectId, DateTime startDate, DateTime endDate)
        {
            var cacheKey = $"class_breakdown_{projectId}_{startDate:yyyy-MM-dd}_{endDate:yyyy-MM-dd}";
            
            // Check cache first (cache for 10 minutes for class breakdown)
            if (_cache.TryGetValue(cacheKey, out List<ClassAttendanceDto>? cachedBreakdown))
            {
                return cachedBreakdown!;
            }

            var classes = await _context.SiteClasses
                .Where(sc => sc.ProjectSite!.ProjectId == projectId)
                .Include(sc => sc.ProjectSite)
                .ToListAsync();

            var classBreakdown = new List<ClassAttendanceDto>();

            foreach (var siteClass in classes)
            {
                var totalLearners = await _context.ClassEnrollments
                    .Where(ce => ce.SiteClassId == siteClass.Id && ce.Status == "Active")
                    .CountAsync();

                var presentLearners = await _context.LearnerAttendances
                    .Where(la => la.ClassId == siteClass.Id && 
                                la.AttendanceDate >= startDate && 
                                la.AttendanceDate <= endDate &&
                                la.ClockInTime.HasValue)
                    .CountAsync();

                classBreakdown.Add(new ClassAttendanceDto
                {
                    ClassId = siteClass.Id,
                    ClassName = siteClass.ClassName,
                    SiteName = siteClass.ProjectSite?.SiteName ?? "Unknown Site",
                    TotalLearners = totalLearners,
                    PresentLearners = presentLearners,
                    AbsentLearners = totalLearners - presentLearners,
                    AttendanceRate = totalLearners > 0 ? Math.Round((double)presentLearners / totalLearners * 100, 2) : 0
                });
            }

            var result = classBreakdown.OrderByDescending(c => c.AttendanceRate).ToList();
            
            // Cache for 10 minutes
            var cacheOptions = new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10),
                SlidingExpiration = TimeSpan.FromMinutes(5),
                Priority = CacheItemPriority.Normal
            };
            _cache.Set(cacheKey, result, cacheOptions);

            return result;
        }

        private async Task<List<LearnerAttendanceSummaryDto>> GenerateLearnerSummaries(int projectId, DateTime startDate, DateTime endDate)
        {
            var learners = await (from ce in _context.ClassEnrollments
                                join l in _context.Learners on ce.LearnerId equals l.Id
                                join sc in _context.SiteClasses on ce.SiteClassId equals sc.Id
                                where sc.ProjectSite!.ProjectId == projectId && ce.Status == "Active"
                                select l)
                                .Distinct()
                                .ToListAsync();

            var learnerSummaries = new List<LearnerAttendanceSummaryDto>();
            var totalDays = (endDate - startDate).Days + 1;

            foreach (var learner in learners)
            {
                var attendances = await _context.LearnerAttendances
                    .Where(la => la.LearnerId == learner.Id && 
                                la.AttendanceDate >= startDate && 
                                la.AttendanceDate <= endDate)
                    .ToListAsync();

                var presentDays = attendances.Count(la => la.ClockInTime.HasValue);
                var absentDays = totalDays - presentDays;
                var lateDays = attendances.Count(la => 
                    la.ClockInTime.HasValue && 
                    la.ClockInTime.Value.TimeOfDay > new TimeSpan(8, 30, 0));

                var completedAttendances = attendances
                    .Where(la => la.ClockInTime.HasValue && la.ClockOutTime.HasValue)
                    .ToList();

                var totalContactHours = completedAttendances
                    .Sum(la => (la.ClockOutTime!.Value - la.ClockInTime!.Value).TotalHours);

                var averageContactHours = completedAttendances.Any()
                    ? totalContactHours / completedAttendances.Count
                    : 0;

                learnerSummaries.Add(new LearnerAttendanceSummaryDto
                {
                    LearnerId = learner.Id,
                    FirstName = learner.FirstName,
                    LastName = learner.LastName,
                    IdNumber = learner.IdNumber,
                    TotalDays = totalDays,
                    PresentDays = presentDays,
                    AbsentDays = absentDays,
                    LateDays = lateDays,
                    AttendanceRate = totalDays > 0 ? Math.Round((double)presentDays / totalDays * 100, 2) : 0,
                    AverageContactHours = Math.Round(averageContactHours, 2),
                    TotalContactHours = Math.Round(totalContactHours, 2)
                });
            }

            return learnerSummaries.OrderByDescending(ls => ls.AttendanceRate).ThenBy(ls => ls.LastName).ToList();
        }

        private DateTime GetMondayOfWeek(DateTime date)
        {
            var dayOfWeek = (int)date.DayOfWeek;
            var daysFromMonday = dayOfWeek == 0 ? 6 : dayOfWeek - 1; // Sunday = 0, so 6 days from Monday
            return date.AddDays(-daysFromMonday);
        }
    }
}