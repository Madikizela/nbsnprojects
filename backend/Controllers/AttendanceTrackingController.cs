using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using backend.Models;
using backend.Models.DTOs;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AttendanceTrackingController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<AttendanceTrackingController> _logger;
        private readonly IMemoryCache _cache;
        private readonly IWebHostEnvironment _env;

        public AttendanceTrackingController(ApplicationDbContext context, ILogger<AttendanceTrackingController> logger, IMemoryCache cache, IWebHostEnvironment env)
        {
            _context = context;
            _logger = logger;
            _cache = cache;
            _env = env;
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

        // GET: api/AttendanceTracking/learner/{learnerId}/calendar
        [HttpGet("learner/{learnerId}/calendar")]
        public async Task<ActionResult<LearnerAttendanceCalendarDto>> GetLearnerAttendanceCalendar(
            int learnerId,
            [FromQuery] int year,
            [FromQuery] int month)
        {
            try
            {
                // Validate inputs
                if (year < 2020 || year > 2100 || month < 1 || month > 12)
                {
                    return BadRequest(new { message = "Invalid year or month" });
                }

                var learner = await _context.Learners
                    .Include(l => l.ClassEnrollments!)
                        .ThenInclude(ce => ce.SiteClass!)
                            .ThenInclude(sc => sc.ProjectSite!)
                                .ThenInclude(ps => ps.Project)
                                    .ThenInclude(p => p!.ProjectLearningPathways)
                                        .ThenInclude(plp => plp.LearningPathway)
                    .Include(l => l.ClassEnrollments!)
                        .ThenInclude(ce => ce.SiteClass!)
                            .ThenInclude(sc => sc.ProjectSite!)
                                .ThenInclude(ps => ps.Project)
                                    .ThenInclude(p => p!.SkillsDevelopmentProvider)
                    .Include(l => l.ClassEnrollments!)
                        .ThenInclude(ce => ce.SiteClass!)
                            .ThenInclude(sc => sc.CreatedByUser)
                    .FirstOrDefaultAsync(l => l.Id == learnerId);

                if (learner == null)
                {
                    return NotFound(new { message = "Learner not found" });
                }

                // Get active enrollment
                var activeEnrollment = learner.ClassEnrollments?
                    .FirstOrDefault(ce => ce.Status == "Active");

                // Look up the assigned teacher from ClassTeachers for the active class
                // (preferred over CreatedByUser since CreatedByUser is the manager)
                User? assignedTeacher = null;
                if (activeEnrollment?.SiteClassId != null)
                {
                    var classTeacher = await _context.ClassTeachers
                        .Include(ct => ct.Teacher)
                        .Where(ct => ct.ClassId == activeEnrollment.SiteClassId && ct.IsActive)
                        .OrderByDescending(ct => ct.AssignedDate)
                        .FirstOrDefaultAsync();
                    assignedTeacher = classTeacher?.Teacher;
                }

                if (activeEnrollment?.SiteClass == null)
                {
                    return NotFound(new { message = "No active class enrollment found" });
                }

                var projectSite = activeEnrollment.SiteClass.ProjectSite;
                var project = projectSite?.Project;

                var startDate = new DateTime(year, month, 1);
                var endDate = startDate.AddMonths(1).AddDays(-1);

                // Get all attendance records for the month - join with Learner to get signature
                var attendanceRecords = await _context.LearnerAttendances
                    .Where(la => la.LearnerId == learnerId &&
                                la.AttendanceDate >= startDate &&
                                la.AttendanceDate <= endDate)
                    .OrderBy(la => la.AttendanceDate)
                    .ToListAsync();

                // Build calendar days - use learner signature for present days
                var calendarDays = new List<CalendarDayDto>();
                for (var date = startDate; date <= endDate; date = date.AddDays(1))
                {
                    var attendance = attendanceRecords.FirstOrDefault(ar => ar.AttendanceDate.Date == date.Date);
                    
                    // Use learner's signature if present, otherwise use attendance signature
                    string? signaturePath = null;
                    if (attendance != null && (attendance.Status == "Present" || attendance.Status == "Late"))
                    {
                        signaturePath = !string.IsNullOrEmpty(learner.SignaturePath) 
                            ? learner.SignaturePath 
                            : attendance.SignaturePath;
                    }
                    
                    var day = new CalendarDayDto
                    {
                        Date = date,
                        Day = date.Day,
                        DayOfWeek = date.DayOfWeek.ToString(),
                        Status = attendance != null ? attendance.Status : "No Record",
                        ClockInTime = attendance?.ClockInTime,
                        ClockOutTime = attendance?.ClockOutTime,
                        SignaturePath = signaturePath,
                        ContactHours = attendance?.ClockInTime != null && attendance?.ClockOutTime != null
                            ? Math.Round((attendance.ClockOutTime.Value - attendance.ClockInTime.Value).TotalHours, 2)
                            : null,
                        Notes = attendance?.Notes,
                        IsWeekend = date.DayOfWeek == DayOfWeek.Saturday || date.DayOfWeek == DayOfWeek.Sunday
                    };

                    calendarDays.Add(day);
                }

                // Calculate statistics - include past days with no records as absent
                var today = DateTime.Today;
                var presentDays = attendanceRecords.Count(ar => ar.Status == "Present" && ar.ClockInTime.HasValue);
                var recordedAbsentDays = attendanceRecords.Count(ar => ar.Status == "Absent");
                
                // Count past working days with no attendance record as absent
                var pastDaysNoRecord = calendarDays.Count(cd => 
                    cd.Date < today && 
                    !cd.IsWeekend && 
                    cd.Status == "No Record");
                
                var totalAbsentDays = recordedAbsentDays + pastDaysNoRecord;
                
                var lateDays = attendanceRecords.Count(ar => ar.Status == "Late");
                var totalContactHours = attendanceRecords
                    .Where(ar => ar.ClockInTime.HasValue && ar.ClockOutTime.HasValue)
                    .Sum(ar => (ar.ClockOutTime!.Value - ar.ClockInTime!.Value).TotalHours);

                var workingDays = calendarDays.Count(cd => !cd.IsWeekend && cd.Date <= today);
                var invalidAttendanceDays = attendanceRecords.Count(ar => ar.Status == "Invalid");
                var holidayDays = 0; // Can be enhanced later

                // Get unit standards/learning materials for the learner's class  
                var unitStandards = new List<string>(); // Will be populated from learning materials if available

                var result = new LearnerAttendanceCalendarDto
                {
                    LearnerId = learnerId,
                    FirstName = learner.FirstName,
                    LastName = learner.LastName,
                    IdNumber = learner.IdNumber,
                    Gender = learner.Gender,
                    Telephone = learner.ContactNumber,
                    Address = $"{learner.AddressLine1} {learner.AddressLine2} {learner.AddressLine3}".Trim(),
                    ProfilePhotoPath = learner.ProfilePhotoPath,
                    SignaturePath = learner.SignaturePath,
                    
                    // Project Details
                    ProjectName = project?.ProjectName,
                    Pathway = project?.ProjectLearningPathways?.FirstOrDefault()?.LearningPathway?.Name,
                    Province = !string.IsNullOrWhiteSpace(projectSite?.Province)
                        ? projectSite!.Province
                        : project?.Province,
                    SiteName = projectSite?.SiteName,
                    
                    // SDP Details
                    SdpName = project?.SkillsDevelopmentProvider?.Name,
                    SdpLogoPath = project?.SkillsDevelopmentProvider?.LogoPath,
                    
                    // Class Details — prefer the assigned teacher from ClassTeachers over the class creator
                    ClassName = activeEnrollment.SiteClass.ClassName,
                    TeacherName = assignedTeacher != null
                        ? $"{assignedTeacher.FirstName} {assignedTeacher.LastName}"
                        : (activeEnrollment.SiteClass.CreatedByUser != null
                            ? $"{activeEnrollment.SiteClass.CreatedByUser.FirstName} {activeEnrollment.SiteClass.CreatedByUser.LastName}"
                            : null),
                    TeacherEmail = assignedTeacher?.Email
                        ?? activeEnrollment.SiteClass.CreatedByUser?.Email,
                    TeacherSignaturePath = !string.IsNullOrEmpty(assignedTeacher?.Signature)
                        ? assignedTeacher!.Signature
                        : activeEnrollment.SiteClass.CreatedByUser?.Signature,
                    TeacherProfileImagePath = assignedTeacher?.ProfileImage
                        ?? activeEnrollment.SiteClass.CreatedByUser?.ProfileImage,
                    QualificationLevel = null, // To be populated from class data
                    
                    // Unit Standards
                    UnitStandards = unitStandards,
                    
                    // Calendar Data
                    Year = year,
                    Month = month,
                    MonthName = new DateTime(year, month, 1).ToString("MMMM"),
                    CalendarDays = calendarDays,
                    
                    // Statistics
                    PresentDays = presentDays,
                    AbsentDays = totalAbsentDays,
                    LateDays = lateDays,
                    TotalContactHours = Math.Round(totalContactHours, 2),
                    AttendanceRate = workingDays > 0
                        ? Math.Round((double)presentDays / workingDays * 100, 2)
                        : 0,
                    ExpectedAttendance = workingDays,
                    ActualAttendance = presentDays,
                    DaysAbsent = totalAbsentDays,
                    InvalidAttendance = invalidAttendanceDays,
                    Holidays = holidayDays,
                    ApprovedSickDays = 0, // Can be enhanced later
                    PendingSickDays = 0   // Can be enhanced later
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching learner attendance calendar for learner {LearnerId}", learnerId);
                return StatusCode(500, new { message = "An error occurred while fetching attendance calendar" });
            }
        }

        // GET: api/AttendanceTracking/learner/{learnerId}/calendar/pdf
        [HttpGet("learner/{learnerId}/calendar/pdf")]
        public async Task<IActionResult> ExportLearnerAttendanceCalendarPdf(
            int learnerId,
            [FromQuery] int year,
            [FromQuery] int month)
        {
            try
            {
                // Reuse the existing calendar endpoint logic
                var calendarEndpoint = await GetLearnerAttendanceCalendar(learnerId, year, month);
                
                if (calendarEndpoint.Result is not OkObjectResult okResult || okResult.Value is not LearnerAttendanceCalendarDto calendarData)
                {
                    return BadRequest(new { message = "Could not fetch calendar data" });
                }

                // Generate PDF
                // Pre-calculate layout so cells fill the page
                var firstDayOfMonth = new DateTime(year, month, 1);
                int startDayOffset = ((int)firstDayOfMonth.DayOfWeek + 6) % 7; // Monday=0
                int totalCells = calendarData.CalendarDays.Count + startDayOffset;
                int totalRows = (int)Math.Ceiling(totalCells / 7.0);
                
                // A4 Landscape = 297 x 210 mm. With margin 10mm each side:
                // Usable width = 277mm, usable height = 190mm
                // Header ~14mm, footer ~8mm, paddingTop ~3mm, legend ~9mm = 156mm for calendar
                // Header row of days = 10mm, remaining split into totalRows
                float calendarCellHeight = (float)Math.Floor((156f - 10f) / totalRows);

                var document = QuestPDF.Fluent.Document.Create(container =>
                {
                    container.Page(page =>
                    {
                        page.Size(PageSizes.A4.Landscape());
                        page.Margin(10);
                        page.PageColor("#0f172a");
                       
                        page.Header().Column(column =>
                        {
                            column.Item().Background("#1e3a8a").Padding(4).Row(headerRow =>
                            {
                                headerRow.RelativeItem().Column(leftCol =>
                                {
                                    leftCol.Item().Text("Attendance Calendar").FontSize(12).Bold().FontColor(Colors.White);
                                    var startDate = new DateTime(year, month, 1);
                                    var endDate = startDate.AddMonths(1).AddDays(-1);
                                    leftCol.Item().Text($"{calendarData.MonthName} {calendarData.Year}  ·  Period {startDate:yyyy.MM.dd} – {endDate:yyyy.MM.dd}")
                                        .FontSize(7).FontColor(Colors.White);
                                });
                                headerRow.RelativeItem().AlignRight().Column(rightCol =>
                                {
                                    // Simple square logos — no SkiaSharp processing to avoid failures
                                    var sysLogoPath = Path.Combine(_env.ContentRootPath, "wwwroot", "nbsn-logo.png");

                                    rightCol.Item().AlignRight().Row(r =>
                                    {
                                        // SDP name or logo (square)
                                        if (!string.IsNullOrEmpty(calendarData.SdpLogoPath))
                                        {
                                            var sdpPath = Path.Combine(_env.ContentRootPath,
                                                calendarData.SdpLogoPath.TrimStart('/', '\\')
                                                    .Replace('/', Path.DirectorySeparatorChar));
                                            if (System.IO.File.Exists(sdpPath))
                                            {
                                                try
                                                {
                                                    r.ConstantItem(50).Height(36).Image(System.IO.File.ReadAllBytes(sdpPath)).FitArea();
                                                    r.ConstantItem(6);
                                                }
                                                catch { }
                                            }
                                        }
                                        else if (!string.IsNullOrEmpty(calendarData.SdpName))
                                        {
                                            r.RelativeItem().AlignRight().AlignMiddle()
                                                .Text(calendarData.SdpName).FontSize(9).Bold().FontColor(Colors.White);
                                            r.ConstantItem(6);
                                        }

                                        // System logo (square, from wwwroot)
                                        if (System.IO.File.Exists(sysLogoPath))
                                        {
                                            try
                                            {
                                                r.ConstantItem(36).Height(36).Image(System.IO.File.ReadAllBytes(sysLogoPath)).FitArea();
                                            }
                                            catch { }
                                        }
                                    });
                                    rightCol.Item().AlignRight().Text("Attendance Management System").FontSize(6).FontColor(Colors.White);
                                });
                            });
                        });

                        page.Content().PaddingTop(3).Row(row =>
                        {
                            // LEFT SIDE - Calendar (70% width)
                            row.RelativeItem(70).Column(column =>
                            {
                                // Calendar Grid
                                column.Item().Table(table =>
                                {
                                    table.ColumnsDefinition(cols => { for (int i = 0; i < 7; i++) cols.RelativeColumn(); });
                                    table.ExtendLastCellsToTableBottom();

                                    // Day-of-week header row
                                    foreach (var d in new[] { "MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN" })
                                    {
                                        table.Cell().Border(1).BorderColor("#1e3a8a")
                                            .Background("#1e3a8a").MinHeight(10f)
                                            .AlignCenter().AlignMiddle()
                                            .Text(d).FontSize(8).Bold().FontColor(Colors.White);
                                    }

                                    // Empty leading cells
                                    for (int i = 0; i < startDayOffset; i++)
                                        table.Cell().Border(1).BorderColor("#070d17")
                                            .Background("#070d17").MinHeight(calendarCellHeight).Text("");

                                    var today = DateTime.Today;
                                    foreach (var day in calendarData.CalendarDays)
                                    {
                                        var dayDate = new DateTime(calendarData.Year, calendarData.Month, day.Day);
                                        bool isFuture = dayDate > today;
                                        bool isAbsentNoRecord = day.Status == "No Record" && !isFuture && !day.IsWeekend;

                                        // Match modal colors exactly
                                        string bg, border, textColor, statusText;
                                        if (day.IsWeekend)           { bg = "#0a0f1a"; border = "#1e293b"; textColor = "#475569"; statusText = "WKND"; }
                                        else if (day.Status == "Present") { bg = "#064e3b"; border = "#10b981"; textColor = "#6ee7b7"; statusText = "PRESENT"; }
                                        else if (day.Status == "Absent" || isAbsentNoRecord) { bg = "#7f1d1d"; border = "#ef4444"; textColor = "#fca5a5"; statusText = "ABSENT"; }
                                        else if (day.Status == "Late") { bg = "#78350f"; border = "#f59e0b"; textColor = "#fcd34d"; statusText = "LATE"; }
                                        else if (isFuture)           { bg = "#1e293b"; border = "#334155"; textColor = "#94a3b8"; statusText = "PENDING"; }
                                        else                         { bg = "#1e293b"; border = "#334155"; textColor = "#94a3b8"; statusText = ""; }

                                        table.Cell().Border(1).BorderColor(border)
                                            .Background(bg).MinHeight(calendarCellHeight).Padding(3).Column(col =>
                                        {
                                            col.Item().Text(day.Day.ToString()).FontSize(8).Bold().FontColor(Colors.White);

                                            if (!string.IsNullOrEmpty(statusText))
                                                col.Item().AlignCenter().PaddingTop(2).Text(statusText)
                                                    .FontSize(7).Bold().FontColor(textColor);

                                            if ((day.Status == "Present" || day.Status == "Late") && day.ClockInTime.HasValue && day.ClockOutTime.HasValue)
                                            {
                                                col.Item().AlignCenter().PaddingTop(1).Text(
                                                    $"{day.ClockInTime.Value:HH:mm} – {day.ClockOutTime.Value:HH:mm}")
                                                    .FontSize(5).FontColor(textColor);
                                                if (day.ContactHours.HasValue && day.ContactHours > 0)
                                                    col.Item().AlignCenter().Text($"{day.ContactHours:F2}h")
                                                        .FontSize(5).FontColor("#93c5fd");
                                            }
                                        });
                                    }

                                    // Fill trailing empty cells to complete last row
                                    int filled = startDayOffset + calendarData.CalendarDays.Count;
                                    int remainder = filled % 7;
                                    if (remainder != 0)
                                        for (int i = 0; i < 7 - remainder; i++)
                                            table.Cell().Border(1).BorderColor("#070d17")
                                                .Background("#070d17").MinHeight(calendarCellHeight).Text("");
                                });

                                // Legend - dark theme
                                column.Item().PaddingTop(4).Row(leg =>
                                {
                                    leg.AutoItem().PaddingRight(6).Text("Legend:").FontSize(7).Bold().FontColor(Colors.White);
                                    foreach (var (label, bg, border) in new (string, string, string)[] {
                                        ("Present", "#064e3b", "#10b981"),
                                        ("Absent",  "#7f1d1d", "#ef4444"),
                                        ("Late",    "#78350f", "#f59e0b"),
                                        ("Pending", "#1e293b", "#475569"),
                                        ("Weekend", "#0a0f1a", "#1e293b") })
                                    {
                                        leg.AutoItem().PaddingRight(6).Row(r =>
                                        {
                                            r.AutoItem().Width(12).Height(10).Background(bg).Border(1).BorderColor(border);
                                            r.AutoItem().PaddingLeft(2).Text(label).FontSize(6).FontColor(Colors.White);
                                        });
                                    }
                                });

                                // Signatures below legend
                                column.Item().PaddingTop(6).Row(sigRow =>
                                {
                                    string? ResolvePath(string? storedPath)
                                    {
                                        if (string.IsNullOrEmpty(storedPath)) return null;
                                        var clean = storedPath.TrimStart('/', '\\').Replace('\\', Path.DirectorySeparatorChar).Replace('/', Path.DirectorySeparatorChar);
                                        var full = Path.Combine(_env.ContentRootPath, clean);
                                        return System.IO.File.Exists(full) ? full : null;
                                    }

                                    void RenderSig(ColumnDescriptor sig, string label, string? storedPath, string signerName)
                                    {
                                        sig.Item().Text(label).FontSize(6).FontColor("#94a3b8");
                                        
                                        byte[]? sigBytes = null;
                                        
                                        // Handle base64 encoded signature (stored directly in DB)
                                        if (!string.IsNullOrEmpty(storedPath) && storedPath.Length > 200)
                                        {
                                            try
                                            {
                                                // Strip data URI prefix if present
                                                var base64 = storedPath.Contains(',') ? storedPath.Split(',')[1] : storedPath;
                                                sigBytes = Convert.FromBase64String(base64);
                                            }
                                            catch { sigBytes = null; }
                                        }
                                        else
                                        {
                                            // Handle file path
                                            var resolved = ResolvePath(storedPath);
                                            if (resolved != null)
                                            {
                                                try { sigBytes = System.IO.File.ReadAllBytes(resolved); }
                                                catch { sigBytes = null; }
                                            }
                                        }

                                        if (sigBytes != null)
                                        {
                                            sig.Item().PaddingTop(2).Background(Colors.White).Padding(2)
                                                .Height(25).Width(80).Image(sigBytes).FitArea();
                                        }
                                        else
                                        {
                                            sig.Item().PaddingTop(2).Height(25).Width(80)
                                                .Background("#1e293b").Border(1).BorderColor("#334155")
                                                .AlignCenter().AlignMiddle().Text("No signature").FontSize(6).FontColor("#94a3b8");
                                        }
                                        sig.Item().PaddingTop(2).BorderTop(1).BorderColor("#334155")
                                            .Text(signerName).FontSize(6).FontColor(Colors.White);
                                    }

                                    // Learner Signature
                                    sigRow.RelativeItem().Column(sig =>
                                        RenderSig(sig, "Learner Signature:", calendarData.SignaturePath,
                                            $"{calendarData.FirstName} {calendarData.LastName}"));

                                    sigRow.ConstantItem(10);

                                    // Facilitator Signature
                                    sigRow.RelativeItem().Column(sig =>
                                        RenderSig(sig, "Facilitator Signature:", calendarData.TeacherSignaturePath,
                                            calendarData.TeacherName ?? "Facilitator"));
                                });
                            });

                            row.ConstantItem(6);

                            // RIGHT SIDE - Info Panel (30% width) - matches modal exactly
                            row.RelativeItem(30).Column(column =>
                            {
                                // Learner photo + name header
                                column.Item().Background("#1e3a8a").Padding(5).Column(header =>
                                {
                                    if (!string.IsNullOrEmpty(calendarData.ProfilePhotoPath))
                                    {
                                        try
                                        {
                                            // Fetch via HTTP — filesystem is ephemeral on Railway
                                            var baseUrl = $"{Request.Scheme}://{Request.Host}";
                                            var photoUrl = $"{baseUrl}/{calendarData.ProfilePhotoPath.TrimStart('/', '\\')}";
                                            using var http = new System.Net.Http.HttpClient();
                                            http.Timeout = TimeSpan.FromSeconds(5);
                                            var rawBytes = http.GetByteArrayAsync(photoUrl).GetAwaiter().GetResult();
                                            if (rawBytes != null && rawBytes.Length > 0)
                                                header.Item().AlignCenter().Width(54).Height(54).Image(rawBytes).FitArea();
                                        }
                                        catch { /* skip photo */ }
                                    }
                                    header.Item().AlignCenter().PaddingTop(3)
                                        .Text($"{calendarData.FirstName} {calendarData.LastName}")
                                        .FontSize(10).Bold().FontColor(Colors.White);
                                });

                                // ── PROJECT DETAILS ──
                                column.Item().PaddingTop(3)
                                    .Text("PROJECT DETAILS").FontSize(7).Bold().FontColor("#3b82f6");

                                column.Item().PaddingTop(2).Column(col =>
                                {
                                    void InfoRow(string label, string? value)
                                    {
                                        col.Item().PaddingBottom(2).Row(r =>
                                        {
                                            r.ConstantItem(55).Text(label).FontSize(6).FontColor("#94a3b8");
                                            r.RelativeItem().Text(value ?? "N/A").FontSize(6).FontColor(Colors.White);
                                        });
                                    }
                                    InfoRow("Pathway:", calendarData.Pathway);
                                    InfoRow("Province:", calendarData.Province);
                                    InfoRow("Project:", calendarData.ProjectName);
                                    InfoRow("Site:", calendarData.SiteName);
                                });

                                // ── CLASS & FACILITATOR ──
                                column.Item().PaddingTop(4).BorderTop(1).BorderColor("#334155")
                                    .PaddingTop(3).Text("CLASS & FACILITATOR").FontSize(7).Bold().FontColor("#3b82f6");

                                column.Item().PaddingTop(2).Column(col =>
                                {
                                    void InfoRow(string label, string? value)
                                    {
                                        col.Item().PaddingBottom(2).Row(r =>
                                        {
                                            r.ConstantItem(55).Text(label).FontSize(6).FontColor("#94a3b8");
                                            r.RelativeItem().Text(value ?? "N/A").FontSize(6).FontColor(Colors.White);
                                        });
                                    }
                                    InfoRow("Class:", calendarData.ClassName);
                                    InfoRow("Facilitator:", calendarData.TeacherName);
                                    InfoRow("Email:", calendarData.TeacherEmail);
                                });

                                // ── LEARNER ──
                                column.Item().PaddingTop(4).BorderTop(1).BorderColor("#334155")
                                    .PaddingTop(3).Text("LEARNER").FontSize(7).Bold().FontColor("#3b82f6");

                                column.Item().PaddingTop(2).Column(col =>
                                {
                                    void InfoRow(string label, string? value)
                                    {
                                        col.Item().PaddingBottom(2).Row(r =>
                                        {
                                            r.ConstantItem(55).Text(label).FontSize(6).FontColor("#94a3b8");
                                            r.RelativeItem().Text(value ?? "N/A").FontSize(6).FontColor(Colors.White);
                                        });
                                    }
                                    InfoRow("ID:", calendarData.IdNumber);
                                    InfoRow("Gender:", calendarData.Gender);
                                    InfoRow("Phone:", calendarData.Telephone);
                                    col.Item().PaddingBottom(2).Column(c =>
                                    {
                                        c.Item().Text("Address:").FontSize(6).FontColor("#94a3b8");
                                        c.Item().Text(calendarData.Address ?? "N/A").FontSize(6).FontColor(Colors.White);
                                    });
                                });

                                // ── ATTENDANCE STATISTICS ──
                                column.Item().PaddingTop(4).BorderTop(1).BorderColor("#334155")
                                    .PaddingTop(3).Text("ATTENDANCE STATISTICS").FontSize(7).Bold().FontColor("#3b82f6");

                                column.Item().PaddingTop(2).Column(statsCol =>
                                {
                                    void StatPair(string l1, string v1, string bar1, string l2, string v2, string bar2)
                                    {
                                        statsCol.Item().PaddingBottom(2).Row(r =>
                                        {
                                            r.RelativeItem().Border(1).BorderColor("#334155").Background("#0f172a").Padding(3).Row(inner =>
                                            {
                                                inner.ConstantItem(3).Background(bar1);
                                                inner.RelativeItem().PaddingLeft(4).AlignCenter().Column(c =>
                                                {
                                                    c.Item().Text(v1).FontSize(10).Bold().FontColor(Colors.White);
                                                    c.Item().Text(l1).FontSize(5).FontColor("#94a3b8");
                                                });
                                            });
                                            r.RelativeItem().Border(1).BorderColor("#334155").Background("#0f172a").Padding(3).Row(inner =>
                                            {
                                                inner.ConstantItem(3).Background(bar2);
                                                inner.RelativeItem().PaddingLeft(4).AlignCenter().Column(c =>
                                                {
                                                    c.Item().Text(v2).FontSize(10).Bold().FontColor(Colors.White);
                                                    c.Item().Text(l2).FontSize(5).FontColor("#94a3b8");
                                                });
                                            });
                                        });
                                    }

                                    var attendanceRate = $"{calendarData.AttendanceRate:F2}%";
                                    StatPair("Expected", calendarData.ExpectedAttendance.ToString(), "#06b6d4",
                                             "Actual",   calendarData.ActualAttendance.ToString(),   "#10b981");
                                    StatPair("Absent",   calendarData.DaysAbsent.ToString(),         "#ef4444",
                                             "Rate",     attendanceRate,                              "#3b82f6");
                                    StatPair("Holidays", calendarData.Holidays.ToString(),            "#8b5cf6",
                                             "Sick",     calendarData.ApprovedSickDays.ToString(),    "#f59e0b");
                                });
                            });
                        });

                        page.Footer().BorderTop(1).BorderColor("#334155").PaddingTop(3).Row(f =>
                        {
                            f.RelativeItem().AlignLeft().Text($"Facilitator: {calendarData.TeacherName ?? "N/A"}").FontSize(6).Italic().FontColor("#94a3b8");
                            f.RelativeItem().AlignCenter().Text("SDP Portal · Attendance Management").FontSize(6).SemiBold().FontColor("#3b82f6");
                            f.RelativeItem().AlignRight().Text($"Generated: {DateTime.Now:yyyy-MM-dd HH:mm}").FontSize(6).Italic().FontColor("#94a3b8");
                        });
                    });
                });

                var pdfBytes = document.GeneratePdf();
                var fileName = $"Attendance_Calendar_{calendarData.FirstName}_{calendarData.LastName}_{calendarData.Year}_{calendarData.Month:D2}.pdf";

                return File(pdfBytes, "application/pdf", fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating PDF for learner {LearnerId}", learnerId);
                return StatusCode(500, new { message = "An error occurred while generating PDF" });
            }
        }
    }
}
