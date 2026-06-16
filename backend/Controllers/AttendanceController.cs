using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using backend.Models.DTOs;
using backend.Services.Interfaces;
using System.Security.Cryptography;
using System.Collections.Concurrent;

namespace backend.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class AttendanceController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<AttendanceController> _logger;
        private readonly IEmailService _emailService;
        private readonly IPasswordHashingService _passwordHashingService;
        private readonly IWhatsAppService _whatsApp;

        // ── Per-class face embedding cache ────────────────────────────────────
        // Key: classId → list of (learnerId, embedding) pairs
        // Invalidated on new face registration so it stays fresh.
        private static readonly ConcurrentDictionary<int, (DateTime LoadedAt, List<(int LearnerId, string FullName, List<double> Embedding)> Entries)>
            _embeddingCache = new();
        private static readonly TimeSpan _cacheMaxAge = TimeSpan.FromMinutes(10);

        public AttendanceController(
            ApplicationDbContext context, 
            ILogger<AttendanceController> logger,
            IEmailService emailService,
            IPasswordHashingService passwordHashingService,
            IWhatsAppService whatsApp)
        {
            _context = context;
            _logger = logger;
            _emailService = emailService;
            _passwordHashingService = passwordHashingService;
            _whatsApp = whatsApp;
        }

        private DateTime GetSASTime()
        {
            // South Africa Standard Time is UTC + 2
            return DateTime.UtcNow.AddHours(2);
        }

        private async Task<bool> IsOnApprovedSickNote(int learnerId, DateTime date)
        {
            var targetDate = date.Date;
            return await _context.SickNotes
                .AnyAsync(s => s.LearnerId == learnerId && 
                               s.Status == "Approved" && 
                               targetDate >= s.StartDate.Date && 
                               targetDate <= s.EndDate.Date);
        }

        // POST: api/Attendance/assign-teacher
        [HttpPost("assign-teacher")]
        public async Task<IActionResult> AssignTeacher([FromBody] AssignTeacherDTO dto)
        {
            try
            {
                // Check if class exists
                var siteClass = await _context.SiteClasses
                    .Include(sc => sc.ProjectSite)
                    .FirstOrDefaultAsync(sc => sc.Id == dto.ClassId);
                    
                if (siteClass == null)
                {
                    return NotFound(new { message = "Class not found" });
                }

                // Check if teacher exists
                var teacher = await _context.Users.FindAsync(dto.TeacherId);
                if (teacher == null)
                {
                    return NotFound(new { message = "Teacher not found" });
                }

                // Check if assignment already exists
                var existing = await _context.ClassTeachers
                    .FirstOrDefaultAsync(ct => ct.ClassId == dto.ClassId && ct.TeacherId == dto.TeacherId && ct.IsActive);

                if (existing != null)
                {
                    return BadRequest(new { message = "Teacher is already assigned to this class" });
                }

                // Create new assignment
                var classTeacher = new ClassTeacher
                {
                    ClassId = dto.ClassId,
                    TeacherId = dto.TeacherId,
                    AssignedDate = GetSASTime(),
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.ClassTeachers.Add(classTeacher);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Teacher {TeacherId} assigned to class {ClassId}", dto.TeacherId, dto.ClassId);

                // Send welcome email to teacher
                try
                {
                    var emailBody = $@"
                        <html>
                        <body style='font-family: Arial, sans-serif;'>
                            <h2>Class Assignment Notification</h2>
                            <p>Dear {teacher.FirstName} {teacher.LastName},</p>
                            <p>You have been assigned as a teacher to the following class:</p>
                            <div style='background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;'>
                                <p><strong>Class:</strong> {siteClass.ClassName}</p>
                                <p><strong>Site:</strong> {siteClass.ProjectSite?.SiteName ?? "N/A"}</p>
                                <p><strong>Max Learners:</strong> {siteClass.MaxLearners}</p>
                                <p><strong>Assigned Date:</strong> {DateTime.Now:yyyy-MM-dd}</p>
                            </div>
                            <h3>Login Information</h3>
                            <p>You can access the system using the following credentials:</p>
                            <div style='background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;'>
                                <p><strong>Email:</strong> {teacher.Email}</p>
                                <p><strong>Login URL:</strong> <a href='http://192.168.209.166:5173'>http://192.168.209.166:5173</a></p>
                            </div>
                            <p><em>Note: If you haven't set up your password yet, please use the 'Forgot Password' feature on the login page.</em></p>
                            <p>You can now:</p>
                            <ul>
                                <li>View your assigned classes</li>
                                <li>Track learner attendance using fingerprint verification</li>
                                <li>View attendance reports and statistics</li>
                            </ul>
                            <p>If you have any questions, please contact your administrator.</p>
                            <p>Best regards,<br/>NBSN Team</p>
                        </body>
                        </html>
                    ";

                    await _emailService.SendEmailAsync(
                        teacher.Email,
                        "Class Assignment - Login Information",
                        emailBody
                    );

                    _logger.LogInformation("Welcome email sent to teacher {Email}", teacher.Email);
                }
                catch (Exception emailEx)
                {
                    _logger.LogWarning(emailEx, "Failed to send welcome email to teacher {Email}", teacher.Email);
                    // Don't fail the assignment if email fails
                }

                return Ok(new
                {
                    message = "Teacher assigned successfully. Welcome email sent.",
                    assignment = new
                    {
                        id = classTeacher.Id,
                        classId = classTeacher.ClassId,
                        teacherId = classTeacher.TeacherId,
                        teacherName = $"{teacher.FirstName} {teacher.LastName}",
                        assignedDate = classTeacher.AssignedDate
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error assigning teacher to class");
                return StatusCode(500, new { message = "An error occurred while assigning teacher" });
            }
        }

        // POST: api/Attendance/create-and-assign-teacher
        [HttpPost("create-and-assign-teacher")]
        public async Task<IActionResult> CreateAndAssignTeacher([FromBody] CreateTeacherDTO dto)
        {
            try
            {
                // Validate input
                if (string.IsNullOrWhiteSpace(dto.FirstName) || !System.Text.RegularExpressions.Regex.IsMatch(dto.FirstName, @"^[a-zA-Z\s]+$"))
                {
                    return BadRequest(new { message = "First name must contain only letters and spaces" });
                }

                if (string.IsNullOrWhiteSpace(dto.LastName) || !System.Text.RegularExpressions.Regex.IsMatch(dto.LastName, @"^[a-zA-Z\s]+$"))
                {
                    return BadRequest(new { message = "Last name must contain only letters and spaces" });
                }

                if (string.IsNullOrWhiteSpace(dto.Email) || !System.Text.RegularExpressions.Regex.IsMatch(dto.Email, @"^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$"))
                {
                    return BadRequest(new { message = "Please enter a valid email address" });
                }

                // Check if class exists
                var siteClass = await _context.SiteClasses
                    .Include(sc => sc.ProjectSite)
                    .FirstOrDefaultAsync(sc => sc.Id == dto.ClassId);
                    
                if (siteClass == null)
                {
                    return NotFound(new { message = "Class not found" });
                }

                // Check if email already exists
                var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == dto.Email.ToLower());
                if (existingUser != null)
                {
                    return BadRequest(new { message = "A user with this email already exists" });
                }

                // Generate random password
                var password = GenerateRandomPassword();
                var passwordHash = _passwordHashingService.HashPassword(password);

                // Create new teacher user
                var teacher = new User
                {
                    FirstName = dto.FirstName.Trim(),
                    LastName = dto.LastName.Trim(),
                    Email = dto.Email.Trim().ToLower(),
                    PasswordHash = passwordHash,
                    Role = UserRole.Teacher,
                    Status = UserStatus.Active,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Users.Add(teacher);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Created new teacher user: {Email}", teacher.Email);

                // Assign teacher to class
                var classTeacher = new ClassTeacher
                {
                    ClassId = dto.ClassId,
                    TeacherId = teacher.Id,
                    AssignedDate = DateTime.UtcNow,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.ClassTeachers.Add(classTeacher);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Teacher {TeacherId} assigned to class {ClassId}", teacher.Id, dto.ClassId);

                // Send welcome email with credentials
                try
                {
                    var emailBody = $@"
                        <html>
                        <body style='font-family: Arial, sans-serif;'>
                            <h2>Welcome to NBSN - Teacher Account Created</h2>
                            <p>Dear {teacher.FirstName} {teacher.LastName},</p>
                            <p>Your teacher account has been created and you have been assigned to a class.</p>
                            
                            <div style='background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;'>
                                <h3>Class Assignment</h3>
                                <p><strong>Class:</strong> {siteClass.ClassName}</p>
                                <p><strong>Site:</strong> {siteClass.ProjectSite?.SiteName ?? "N/A"}</p>
                                <p><strong>Max Learners:</strong> {siteClass.MaxLearners}</p>
                                <p><strong>Assigned Date:</strong> {DateTime.Now:yyyy-MM-dd}</p>
                            </div>
                            
                            <div style='background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;'>
                                <h3>Your Login Credentials</h3>
                                <p><strong>Email:</strong> {teacher.Email}</p>
                                <p><strong>Password:</strong> {password}</p>
                                <p><strong>Login URL:</strong> <a href='http://192.168.209.166:5173'>http://192.168.209.166:5173</a></p>
                            </div>
                            
                            <p><strong style='color: #d32f2f;'>⚠️ Important Security Notice:</strong></p>
                            <ul>
                                <li>Please change your password after your first login</li>
                                <li>Do not share your password with anyone</li>
                                <li>Keep this email secure or delete it after changing your password</li>
                            </ul>
                            
                            <h3>What You Can Do:</h3>
                            <ul>
                                <li>View your assigned classes and learners</li>
                                <li>Track learner attendance using fingerprint verification</li>
                                <li>Clock learners in and out</li>
                                <li>View attendance reports and statistics</li>
                            </ul>
                            
                            <p>If you have any questions, please contact your administrator.</p>
                            <p>Best regards,<br/>NBSN Team</p>
                        </body>
                        </html>
                    ";

                    await _emailService.SendEmailAsync(
                        teacher.Email,
                        "Welcome to NBSN - Your Login Credentials",
                        emailBody
                    );

                    _logger.LogInformation("Welcome email with credentials sent to teacher {Email}", teacher.Email);
                }
                catch (Exception emailEx)
                {
                    _logger.LogWarning(emailEx, "Failed to send welcome email to teacher {Email}", teacher.Email);
                    // Don't fail the creation if email fails
                }

                return Ok(new
                {
                    message = "Teacher created and assigned successfully. Login credentials sent to email.",
                    teacher = new
                    {
                        id = teacher.Id,
                        firstName = teacher.FirstName,
                        lastName = teacher.LastName,
                        email = teacher.Email
                    },
                    assignment = new
                    {
                        id = classTeacher.Id,
                        classId = classTeacher.ClassId,
                        assignedDate = classTeacher.AssignedDate
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating and assigning teacher");
                return StatusCode(500, new { message = "An error occurred while creating teacher account" });
            }
        }

        private string GenerateRandomPassword()
        {
            const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
            var random = new byte[12];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(random);
            }
            return new string(random.Select(b => chars[b % chars.Length]).ToArray());
        }

        private double CalculateTemplateSimilarity(string template1, string template2)
        {
            if (string.IsNullOrEmpty(template1) || string.IsNullOrEmpty(template2))
                return 0.0;

            // For fingerprint templates, we'll use a more lenient approach
            // Check if templates are similar in length and have some common prefix
            int minLength = Math.Min(template1.Length, template2.Length);
            int maxLength = Math.Max(template1.Length, template2.Length);
            
            if (maxLength == 0) return 0.0;
            
            // Length similarity (important for fingerprint templates)
            double lengthSimilarity = (double)minLength / maxLength;
            
            // Check common prefix (first 20 characters)
            int prefixLength = Math.Min(20, minLength);
            int commonPrefix = 0;
            for (int i = 0; i < prefixLength; i++)
            {
                if (template1[i] == template2[i])
                {
                    commonPrefix++;
                }
            }
            double prefixSimilarity = prefixLength > 0 ? (double)commonPrefix / prefixLength : 0.0;
            
            // Check if templates start with same fingerprint header (common for same scanner)
            bool sameHeader = template1.Length > 10 && template2.Length > 10 && 
                             template1.Substring(0, 10) == template2.Substring(0, 10);
            
            // Combined score with bonus for same header
            double score = (lengthSimilarity * 0.4) + (prefixSimilarity * 0.4) + (sameHeader ? 0.2 : 0.0);
            
            return score;
        }

        // GET: api/Attendance/class/{classId}/teachers
        [HttpGet("class/{classId}/teachers")]
        public async Task<IActionResult> GetClassTeachers(int classId)
        {
            try
            {
                var teachers = await _context.ClassTeachers
                    .Where(ct => ct.ClassId == classId && ct.IsActive)
                    .Include(ct => ct.Teacher)
                    .Select(ct => new
                    {
                        id = ct.Id,
                        teacherId = ct.TeacherId,
                        teacherName = $"{ct.Teacher!.FirstName} {ct.Teacher.LastName}",
                        teacherEmail = ct.Teacher.Email,
                        assignedDate = ct.AssignedDate
                    })
                    .ToListAsync();

                return Ok(teachers);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching class teachers");
                return StatusCode(500, new { message = "An error occurred while fetching teachers" });
            }
        }

        // GET: api/Attendance/available-teachers
        [HttpGet("available-teachers")]
        public async Task<IActionResult> GetAvailableTeachers()
        {
            try
            {
                // Get all users who could be teachers (you can add role filtering here)
                var users = await _context.Users
                    .Where(u => u.Status == UserStatus.Active)
                    .ToListAsync();

                var teachers = users
                    .Select(u => new
                    {
                        id = u.Id,
                        name = $"{u.FirstName} {u.LastName}",
                        email = u.Email,
                        role = u.Role.ToString()
                    })
                    .OrderBy(u => u.name)
                    .ToList();

                return Ok(teachers);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching available teachers");
                return StatusCode(500, new { message = "An error occurred while fetching teachers" });
            }
        }

        // DELETE: api/Attendance/class-teacher/{id}
        [HttpDelete("class-teacher/{id}")]
        public async Task<IActionResult> RemoveTeacherAssignment(int id)
        {
            try
            {
                var assignment = await _context.ClassTeachers.FindAsync(id);
                if (assignment == null)
                {
                    return NotFound(new { message = "Assignment not found" });
                }

                assignment.IsActive = false;
                assignment.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                _logger.LogInformation("Teacher assignment {Id} removed", id);

                return Ok(new { message = "Teacher removed from class successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing teacher assignment");
                return StatusCode(500, new { message = "An error occurred while removing teacher" });
            }
        }

        [HttpGet("teacher/{teacherId}/classes")]
        public async Task<IActionResult> GetTeacherClasses(int teacherId)
        {
            try
            {
                _logger.LogInformation("📍 [DEBUG] Fetching classes for teacher {TeacherId}", teacherId);
                
                var teacherClasses = await _context.ClassTeachers
                    .Where(ct => ct.TeacherId == teacherId && ct.IsActive)
                    .Select(ct => new TeacherClassDTO
                    {
                        ClassId = ct.ClassId,
                        ClassName = ct.SiteClass != null ? ct.SiteClass.ClassName : "Unknown Class",
                        ProjectSiteId = ct.SiteClass != null ? ct.SiteClass.ProjectSiteId : 0,
                        SiteName = (ct.SiteClass != null && ct.SiteClass.ProjectSite != null) ? ct.SiteClass.ProjectSite.SiteName : "Unknown Site",
                        Latitude = (ct.SiteClass != null && ct.SiteClass.ProjectSite != null) ? ct.SiteClass.ProjectSite.Latitude : null,
                        Longitude = (ct.SiteClass != null && ct.SiteClass.ProjectSite != null) ? ct.SiteClass.ProjectSite.Longitude : null,
                        TotalLearners = _context.ClassEnrollments.Count(ce => ce.SiteClassId == ct.ClassId && ce.Status == "Active"),
                        PresentToday = 0,
                        AbsentToday = 0,
                        AssignedDate = ct.AssignedDate
                    })
                    .ToListAsync();

                foreach (var cls in teacherClasses)
                {
                    _logger.LogInformation("📍 [DEBUG] Final DTO - Class: {ClassName}, Site: {SiteName}, Lat: {Latitude}, Lng: {Longitude}", 
                        cls.ClassName, cls.SiteName, cls.Latitude, cls.Longitude);
                }

                return Ok(teacherClasses);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching teacher classes");
                return StatusCode(500, new { message = "An error occurred while fetching classes" });
            }
        }

        [HttpGet("class/{classId}/details")]
        public async Task<IActionResult> GetClassAttendanceDetails(int classId, [FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null)
        {
            try
            {
                var start = startDate?.Date ?? DateTime.Today;
                var end = endDate?.Date ?? start;
                
                _logger.LogInformation("Getting attendance details for ClassId: {ClassId}, Range: {Start} to {End}", classId, start, end);

                // Get all active learners in the class
                var enrollments = await _context.ClassEnrollments
                    .Include(ce => ce.Learner)
                    .Where(ce => ce.SiteClassId == classId && ce.Status == "Active")
                    .ToListAsync();

                // Get all attendance records for these learners in the date range
                var attendanceRecords = await _context.LearnerAttendances
                    .Where(la => la.ClassId == classId && 
                                la.AttendanceDate >= start && 
                                la.AttendanceDate <= end)
                    .ToListAsync();

                var details = enrollments.Select(ce => {
                    var learnerAttendance = attendanceRecords
                        .Where(la => la.LearnerId == ce.LearnerId)
                        .OrderByDescending(la => la.AttendanceDate)
                        .ToList();

                    return new {
                        learnerId = ce.LearnerId,
                        firstName = ce.Learner?.FirstName ?? "Unknown",
                        lastName = ce.Learner?.LastName ?? "Unknown",
                        idNumber = ce.Learner?.IdNumber ?? "N/A",
                        attendance = learnerAttendance.Select(la => new {
                            date = la.AttendanceDate.ToString("yyyy-MM-dd"),
                            status = la.Status,
                            clockIn = la.ClockInTime?.ToString("HH:mm:ss"),
                            clockOut = la.ClockOutTime?.ToString("HH:mm:ss"),
                            contactTime = la.ClockInTime.HasValue && la.ClockOutTime.HasValue 
                                ? (la.ClockOutTime.Value - la.ClockInTime.Value).ToString(@"hh\:mm")
                                : null
                        })
                    };
                });

                return Ok(details);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting attendance details for ClassId: {ClassId}", classId);
                return StatusCode(500, new { message = "An error occurred while retrieving attendance details" });
            }
        }

        // POST: api/Attendance/clock-in
        [HttpGet("daily-stats/{classId}")]
        public async Task<IActionResult> GetDailyAttendanceStats(int classId, [FromQuery] DateTime? date = null)
        {
            try
            {
                var targetDate = date?.Date ?? DateTime.Today;
                _logger.LogInformation("Getting daily attendance stats for ClassId: {ClassId}, Date: {Date}", classId, targetDate);

                // Get all active learners in the class
                var totalLearners = await _context.ClassEnrollments
                    .Where(ce => ce.SiteClassId == classId && ce.Status == "Active")
                    .CountAsync();

                // Get learners who clocked in today or have an excused absence
                var presentLearners = await _context.LearnerAttendances
                    .Where(la => la.ClassId == classId && 
                                la.AttendanceDate == targetDate && 
                                (la.ClockInTime.HasValue || la.Status == "Excused"))
                    .CountAsync();

                // Calculate absent learners
                var absentLearners = totalLearners - presentLearners;

                // Get learners who completed full attendance (clocked in and out)
                var completedAttendance = await _context.LearnerAttendances
                    .Where(la => la.ClassId == classId && 
                                la.AttendanceDate == targetDate && 
                                la.ClockInTime.HasValue && 
                                la.ClockOutTime.HasValue)
                    .CountAsync();

                // Get average contact time for completed attendances
                var attendanceRecords = await _context.LearnerAttendances
                    .Where(la => la.ClassId == classId && 
                                la.AttendanceDate == targetDate && 
                                la.ClockInTime.HasValue && 
                                la.ClockOutTime.HasValue)
                    .Select(la => new { 
                        ClockIn = la.ClockInTime.Value, 
                        ClockOut = la.ClockOutTime.Value 
                    })
                    .ToListAsync();

                double averageContactHours = 0;
                string averageContactTime = "0h 0m";
                
                if (attendanceRecords.Any())
                {
                    var totalMinutes = attendanceRecords
                        .Select(ar => (ar.ClockOut - ar.ClockIn).TotalMinutes)
                        .Average();
                    
                    averageContactHours = totalMinutes / 60.0;
                    var hours = (int)(totalMinutes / 60);
                    var minutes = (int)(totalMinutes % 60);
                    averageContactTime = $"{hours}h {minutes}m";
                }

                _logger.LogInformation("Attendance stats - Total: {Total}, Present: {Present}, Absent: {Absent}, Completed: {Completed}", 
                    totalLearners, presentLearners, absentLearners, completedAttendance);

                return Ok(new
                {
                    date = targetDate.ToString("yyyy-MM-dd"),
                    classId = classId,
                    totalLearners = totalLearners,
                    presentLearners = presentLearners,
                    absentLearners = absentLearners,
                    completedAttendance = completedAttendance,
                    averageContactHours = averageContactHours,
                    averageContactTime = averageContactTime,
                    attendanceRate = totalLearners > 0 ? (double)presentLearners / totalLearners * 100 : 0
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting daily attendance stats for ClassId: {ClassId}", classId);
                return StatusCode(500, new { message = "An error occurred while retrieving attendance statistics" });
            }
        }

        [HttpPost("clock-toggle")]
        public async Task<IActionResult> ClockToggle([FromBody] FingerprintClockDTO dto)
        {
            try
            {
                _logger.LogInformation("Clock-toggle attempt - ClassId: {ClassId}, TeacherId: {TeacherId}, Template length: {Length}", 
                    dto.ClassId, dto.TeacherId, dto.FingerprintTemplate?.Length ?? 0);

                // Normalize the fingerprint template (remove whitespace, newlines)
                var normalizedTemplate = dto.FingerprintTemplate?.Replace("\n", "").Replace("\r", "").Replace(" ", "").Trim() ?? "";
                _logger.LogInformation("Normalized template length: {Length}, Preview: {Preview}", 
                    normalizedTemplate.Length, 
                    normalizedTemplate.Length > 50 ? normalizedTemplate.Substring(0, 50) : normalizedTemplate);
                
                // Verify fingerprint matches a learner in the class
                var enrollments = await _context.ClassEnrollments
                    .Include(ce => ce.Learner)
                    .Where(ce => ce.SiteClassId == dto.ClassId && ce.Status == "Active")
                    .ToListAsync();

                _logger.LogInformation("Found {Count} active enrollments in class {ClassId}", enrollments.Count, dto.ClassId);

                ClassEnrollment? matchedEnrollment = null;
                foreach (var enrollment in enrollments)
                {
                    var enrollmentLearner = enrollment.Learner;
                    var leftTemplate = enrollmentLearner?.LeftThumbTemplate?.Replace("\n", "").Replace("\r", "").Replace(" ", "").Trim() ?? "";
                    var rightTemplate = enrollmentLearner?.RightThumbTemplate?.Replace("\n", "").Replace("\r", "").Replace(" ", "").Trim() ?? "";
                    
                    _logger.LogInformation("Checking learner {LearnerId} ({Name}): Left={LeftLen}, Right={RightLen}, Captured={CapturedLen}", 
                        enrollmentLearner?.Id, 
                        $"{enrollmentLearner?.FirstName} {enrollmentLearner?.LastName}",
                        leftTemplate.Length,
                        rightTemplate.Length,
                        normalizedTemplate.Length);
                    
                    // TESTING MODE: Accept any fingerprint that starts with the same scanner header
                    bool leftExactMatch = leftTemplate.Length > 0 && leftTemplate == normalizedTemplate;
                    bool rightExactMatch = rightTemplate.Length > 0 && rightTemplate == normalizedTemplate;
                    
                    // Lenient matching: same scanner header (first 10 characters)
                    bool leftHeaderMatch = leftTemplate.Length > 10 && normalizedTemplate.Length > 10 && 
                                         leftTemplate.Substring(0, 10) == normalizedTemplate.Substring(0, 10);
                    bool rightHeaderMatch = rightTemplate.Length > 10 && normalizedTemplate.Length > 10 && 
                                          rightTemplate.Substring(0, 10) == normalizedTemplate.Substring(0, 10);
                    
                    bool leftMatch = leftExactMatch || leftHeaderMatch;
                    bool rightMatch = rightExactMatch || rightHeaderMatch;
                    
                    _logger.LogInformation("🧪 TESTING MODE - Match results: Left={LeftMatch} (Exact={LeftExact}, Header={LeftHeader}), Right={RightMatch} (Exact={RightExact}, Header={RightHeader})", 
                        leftMatch, leftExactMatch, leftHeaderMatch, rightMatch, rightExactMatch, rightHeaderMatch);
                    
                    if (leftMatch || rightMatch)
                    {
                        matchedEnrollment = enrollment;
                        string matchType = leftExactMatch || rightExactMatch ? "EXACT" : "SIMILAR";
                        _logger.LogInformation("  ✓ {MatchType} MATCH FOUND! Using {Thumb} thumb", matchType, leftMatch ? "LEFT" : "RIGHT");
                        break;
                    }
                }

                if (matchedEnrollment == null)
                {
                    // Try "template update mode" - if we have a template that's from the same scanner type and similar structure,
                    // update it and allow the match (this handles the fact that fingerprint scanners don't produce identical templates)
                    foreach (var enrollment in enrollments)
                    {
                        var enrollmentLearner = enrollment.Learner;
                        var leftTemplate = enrollmentLearner?.LeftThumbTemplate?.Replace("\n", "").Replace("\r", "").Replace(" ", "").Trim() ?? "";
                        var rightTemplate = enrollmentLearner?.RightThumbTemplate?.Replace("\n", "").Replace("\r", "").Replace(" ", "").Trim() ?? "";
                        
                        // Check if templates are from the same scanner (same header pattern - more lenient)
                        bool leftSameScanner = leftTemplate.Length > 15 && normalizedTemplate.Length > 15 && 
                                             leftTemplate.Substring(0, 15) == normalizedTemplate.Substring(0, 15);
                        bool rightSameScanner = rightTemplate.Length > 15 && normalizedTemplate.Length > 15 && 
                                              rightTemplate.Substring(0, 15) == normalizedTemplate.Substring(0, 15);
                        
                        // Check if templates are reasonably similar in length (within 80% difference - more lenient)
                        bool leftSimilarLength = leftTemplate.Length > 0 && 
                                               Math.Abs(leftTemplate.Length - normalizedTemplate.Length) < (Math.Max(leftTemplate.Length, normalizedTemplate.Length) * 0.8);
                        bool rightSimilarLength = rightTemplate.Length > 0 && 
                                                Math.Abs(rightTemplate.Length - normalizedTemplate.Length) < (Math.Max(rightTemplate.Length, normalizedTemplate.Length) * 0.8);
                        
                        _logger.LogInformation("🔍 TEMPLATE UPDATE CHECK for learner {LearnerId}:", enrollmentLearner?.Id);
                        _logger.LogInformation("  Left: SameScanner={LeftSame}, SimilarLength={LeftLength} (stored={StoredLeft}, captured={CapturedLen})", 
                            leftSameScanner, leftSimilarLength, leftTemplate.Length, normalizedTemplate.Length);
                        _logger.LogInformation("  Right: SameScanner={RightSame}, SimilarLength={RightLength} (stored={StoredRight}, captured={CapturedLen})", 
                            rightSameScanner, rightSimilarLength, rightTemplate.Length, normalizedTemplate.Length);
                        
                        if ((leftSameScanner && leftSimilarLength) || (rightSameScanner && rightSimilarLength))
                        {
                            _logger.LogInformation("🔄 TEMPLATE UPDATE: Updating template for learner {LearnerId} ({Name})", 
                                enrollmentLearner?.Id, $"{enrollmentLearner?.FirstName} {enrollmentLearner?.LastName}");
                            
                            // Update the template in the database
                            if (leftSameScanner && leftSimilarLength)
                            {
                                _logger.LogInformation("  Updating LEFT thumb: {OldLen} → {NewLen} chars", leftTemplate.Length, normalizedTemplate.Length);
                                enrollmentLearner!.LeftThumbTemplate = normalizedTemplate;
                            }
                            else if (rightSameScanner && rightSimilarLength)
                            {
                                _logger.LogInformation("  Updating RIGHT thumb: {OldLen} → {NewLen} chars", rightTemplate.Length, normalizedTemplate.Length);
                                enrollmentLearner!.RightThumbTemplate = normalizedTemplate;
                            }
                            
                            await _context.SaveChangesAsync();
                            matchedEnrollment = enrollment;
                            _logger.LogInformation("  ✅ TEMPLATE UPDATED! Learner matched with updated template");
                            break;
                        }
                    }
                }

                if (matchedEnrollment == null)
                {
                    _logger.LogWarning("Fingerprint not recognized for ClassId: {ClassId}. No matching template found.", dto.ClassId);
                    return BadRequest(new { message = "Fingerprint not recognized. Please ensure learner is registered." });
                }

                var learner = matchedEnrollment.Learner!;
                var learnerId = learner.Id;
                var today = GetSASTime().Date;

                // Check if learner is on approved sick leave today
                if (await IsOnApprovedSickNote(learnerId, today))
                {
                    _logger.LogWarning("Clocking denied - Learner {LearnerId} is on approved sick leave today", learnerId);
                    return BadRequest(new { 
                        message = "Attendance disabled. This learner is currently marked as 'Excused' due to an approved sick note.",
                        learnerName = $"{learner.FirstName} {learner.LastName}"
                    });
                }

                _logger.LogInformation("Fingerprint matched - Learner: {LearnerId} ({Name})", learnerId, $"{learner.FirstName} {learner.LastName}");

                // Check current attendance status for today
                var existingAttendance = await _context.LearnerAttendances
                    .FirstOrDefaultAsync(a => a.LearnerId == learnerId && 
                                            a.ClassId == dto.ClassId && 
                                            a.AttendanceDate == today);

                // Decide whether to clock in or clock out
                if (existingAttendance == null || !existingAttendance.ClockInTime.HasValue)
                {
                    // CLOCK IN - No attendance record or no clock-in time
                    _logger.LogInformation("🟢 CLOCK IN - No existing attendance record for today");
                    
                    if (existingAttendance == null)
                    {
                        existingAttendance = new LearnerAttendance
                        {
                            LearnerId = learnerId,
                            ClassId = dto.ClassId,
                            AttendanceDate = today,
                            ClockInTime = GetSASTime(),
                            ClockInMethod = "Fingerprint",
                            ClockInVerified = true,
                            ClockInTeacherId = dto.TeacherId,
                            ClockInLatitude = (decimal?)dto.Latitude,
                            ClockInLongitude = (decimal?)dto.Longitude,
                            Status = "Present",
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow
                        };
                        _context.LearnerAttendances.Add(existingAttendance);
                    }
                    else
                    {
                        existingAttendance.ClockInTime = GetSASTime();
                        existingAttendance.ClockInMethod = "Fingerprint";
                        existingAttendance.ClockInVerified = true;
                        existingAttendance.ClockInTeacherId = dto.TeacherId;
                        existingAttendance.ClockInLatitude = (decimal?)dto.Latitude;
                        existingAttendance.ClockInLongitude = (decimal?)dto.Longitude;
                        existingAttendance.Status = "Present";
                        existingAttendance.UpdatedAt = DateTime.UtcNow;
                    }

                    await _context.SaveChangesAsync();

                    // Log the action
                    var clockInLog = new AttendanceLog
                    {
                        AttendanceId = existingAttendance.Id,
                        Action = "ClockIn",
                        ActionTime = DateTime.UtcNow,
                        ActionBy = dto.TeacherId,
                        FingerprintMatched = true,
                        MatchScore = 100,
                        Notes = "Fingerprint verified clock-in via toggle"
                    };
                    _context.AttendanceLogs.Add(clockInLog);
                    await _context.SaveChangesAsync();

                    _logger.LogInformation("Learner {LearnerId} clocked in at {Time}", learnerId, existingAttendance.ClockInTime);

                    return Ok(new
                    {
                        action = "ClockIn",
                        message = "Clocked in successfully",
                        attendanceId = existingAttendance.Id,
                        learnerId = learnerId,
                        learnerName = $"{learner.FirstName} {learner.LastName}",
                        clockInTime = existingAttendance.ClockInTime,
                        status = existingAttendance.Status
                    });
                }
                else if (existingAttendance.ClockInTime.HasValue && !existingAttendance.ClockOutTime.HasValue)
                {
                    // CLOCK OUT - Already clocked in but not clocked out
                    _logger.LogInformation("🔴 CLOCK OUT - Already clocked in, now clocking out");
                    
                    existingAttendance.ClockOutTime = GetSASTime();
                    existingAttendance.ClockOutMethod = "Fingerprint";
                    existingAttendance.ClockOutVerified = true;
                    existingAttendance.ClockOutTeacherId = dto.TeacherId;
                    existingAttendance.ClockOutLatitude = (decimal?)dto.Latitude;
                    existingAttendance.ClockOutLongitude = (decimal?)dto.Longitude;
                    existingAttendance.UpdatedAt = DateTime.UtcNow;

                    await _context.SaveChangesAsync();

                    // Calculate contact time
                    var contactTime = existingAttendance.ClockOutTime.Value - existingAttendance.ClockInTime.Value;
                    var contactHours = contactTime.TotalHours;

                    // Log the action
                    var clockOutLog = new AttendanceLog
                    {
                        AttendanceId = existingAttendance.Id,
                        Action = "ClockOut",
                        ActionTime = DateTime.UtcNow,
                        ActionBy = dto.TeacherId,
                        FingerprintMatched = true,
                        MatchScore = 100,
                        Notes = $"Fingerprint verified clock-out via toggle. Contact time: {contactHours:F2} hours"
                    };
                    _context.AttendanceLogs.Add(clockOutLog);
                    await _context.SaveChangesAsync();

                    _logger.LogInformation("Learner {LearnerId} clocked out at {Time}. Contact time: {Hours} hours", 
                        learnerId, existingAttendance.ClockOutTime, contactHours);

                    return Ok(new
                    {
                        action = "ClockOut",
                        message = "Clocked out successfully",
                        attendanceId = existingAttendance.Id,
                        learnerId = learnerId,
                        learnerName = $"{learner.FirstName} {learner.LastName}",
                        clockInTime = existingAttendance.ClockInTime,
                        clockOutTime = existingAttendance.ClockOutTime,
                        contactTime = new
                        {
                            hours = (int)contactTime.TotalHours,
                            minutes = contactTime.Minutes,
                            totalHours = contactHours,
                            formatted = $"{(int)contactTime.TotalHours}h {contactTime.Minutes}m"
                        },
                        status = existingAttendance.Status
                    });
                }
                else
                {
                    // Already clocked out today
                    _logger.LogInformation("⚠️ Already completed attendance for today");
                    return BadRequest(new { 
                        message = "Already completed attendance for today",
                        clockInTime = existingAttendance.ClockInTime,
                        clockOutTime = existingAttendance.ClockOutTime,
                        learnerName = $"{learner.FirstName} {learner.LastName}"
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during clock-toggle");
                return StatusCode(500, new { message = "An error occurred during attendance processing" });
            }
        }

        // Called by LearnersController after a new face embedding is registered
        public static void InvalidateEmbeddingCache(int classId) =>
            _embeddingCache.TryRemove(classId, out _);

        [HttpPost("face-clock-toggle")]
        public async Task<IActionResult> FaceClockToggle([FromBody] FaceClockDTO dto)
        {
            try
            {
                _logger.LogInformation("Face-clock-toggle attempt - ClassId: {ClassId}, TeacherId: {TeacherId}", 
                    dto.ClassId, dto.TeacherId);

                // ── Load embeddings (from cache or DB) ────────────────────────
                List<(int LearnerId, string FullName, List<double> Embedding)> candidates;

                if (_embeddingCache.TryGetValue(dto.ClassId, out var cached) &&
                    DateTime.UtcNow - cached.LoadedAt < _cacheMaxAge)
                {
                    candidates = cached.Entries;
                    _logger.LogInformation("Embedding cache HIT for class {ClassId} ({Count} entries)", dto.ClassId, candidates.Count);
                }
                else
                {
                    // Select ONLY the 3 columns we need — avoids loading bank details,
                    // ID numbers, photos etc. for every learner on every clock request.
                    var rows = await _context.ClassEnrollments
                        .AsNoTracking()
                        .Where(ce => ce.SiteClassId == dto.ClassId &&
                                     ce.Status == "Active" &&
                                     ce.Learner != null &&
                                     !string.IsNullOrEmpty(ce.Learner.FaceEmbedding))
                        .Select(ce => new
                        {
                            ce.Learner!.Id,
                            FullName = ce.Learner.FirstName + " " + ce.Learner.LastName,
                            ce.Learner.FaceEmbedding
                        })
                        .ToListAsync();

                    candidates = new List<(int, string, List<double>)>(rows.Count);
                    foreach (var r in rows)
                    {
                        try
                        {
                            var emb = System.Text.Json.JsonSerializer.Deserialize<List<double>>(r.FaceEmbedding!);
                            if (emb != null) candidates.Add((r.Id, r.FullName, emb));
                        }
                        catch { /* skip malformed embeddings */ }
                    }

                    _embeddingCache[dto.ClassId] = (DateTime.UtcNow, candidates);
                    _logger.LogInformation("Embedding cache MISS for class {ClassId} — loaded {Count} embeddings from DB", dto.ClassId, candidates.Count);
                }

                if (candidates.Count == 0)
                {
                    return BadRequest(new { message = "No learners in this class have registered their faces yet. Please register the learner's face first." });
                }

                // ── Nearest-neighbour search ──────────────────────────────────
                const double threshold = 0.6;
                int matchedLearnerId = -1;
                string matchedName = "";
                double bestDistance = threshold;

                foreach (var (learnerId, fullName, storedEmb) in candidates)
                {
                    if (storedEmb.Count != dto.Embedding.Count) continue;

                    double sum = 0;
                    for (int i = 0; i < storedEmb.Count; i++)
                    {
                        double diff = storedEmb[i] - dto.Embedding[i];
                        sum += diff * diff;
                    }
                    double distance = Math.Sqrt(sum);

                    _logger.LogInformation("Match attempt — Learner: {Name}, Distance: {Distance:F4}", fullName, distance);

                    if (distance < bestDistance)
                    {
                        bestDistance = distance;
                        matchedLearnerId = learnerId;
                        matchedName = fullName;
                    }
                }

                if (matchedLearnerId < 0)
                {
                    _logger.LogWarning("Face not recognized for ClassId: {ClassId}", dto.ClassId);
                    return BadRequest(new { message = "Face not recognized. Please ensure learner is registered." });
                }

                _logger.LogInformation("Face matched — Learner: {Name} (id={Id}), Distance: {Distance:F4}", matchedName, matchedLearnerId, bestDistance);

                var learnerId2 = matchedLearnerId;
                var today = GetSASTime().Date;

                // Check if learner is on approved sick leave today
                if (await IsOnApprovedSickNote(learnerId2, today))
                {
                    return BadRequest(new { 
                        message = "Attendance disabled. This learner is currently marked as 'Excused' due to an approved sick note.",
                        learnerName = matchedName
                    });
                }

                // ── Clock in / out logic ──────────────────────────────────────
                var existingAttendance = await _context.LearnerAttendances
                    .FirstOrDefaultAsync(a => a.LearnerId == learnerId2 && 
                                            a.ClassId == dto.ClassId && 
                                            a.AttendanceDate == today);

                if (existingAttendance == null || !existingAttendance.ClockInTime.HasValue)
                {
                    if (existingAttendance == null)
                    {
                        existingAttendance = new LearnerAttendance
                        {
                            LearnerId = learnerId2,
                            ClassId = dto.ClassId,
                            AttendanceDate = today,
                            ClockInTime = GetSASTime(),
                            ClockInMethod = "Face",
                            ClockInVerified = true,
                            ClockInTeacherId = dto.TeacherId,
                            ClockInLatitude = (decimal?)dto.Latitude,
                            ClockInLongitude = (decimal?)dto.Longitude,
                            Status = "Present",
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow
                        };
                        _context.LearnerAttendances.Add(existingAttendance);
                    }
                    else
                    {
                        existingAttendance.ClockInTime = GetSASTime();
                        existingAttendance.ClockInMethod = "Face";
                        existingAttendance.ClockInVerified = true;
                        existingAttendance.ClockInTeacherId = dto.TeacherId;
                        existingAttendance.ClockInLatitude = (decimal?)dto.Latitude;
                        existingAttendance.ClockInLongitude = (decimal?)dto.Longitude;
                        existingAttendance.Status = "Present";
                        existingAttendance.UpdatedAt = DateTime.UtcNow;
                    }

                    await _context.SaveChangesAsync();
                    _logger.LogInformation("Learner {LearnerId} clocked in with face at {Time}", learnerId2, existingAttendance.ClockInTime);

                    // ── WhatsApp: clock-in confirmation (fire-and-forget) ──────
                    _ = Task.Run(async () =>
                    {
                        try
                        {
                            var learner = await _context.Learners.FindAsync(learnerId2);
                            if (learner?.ContactNumber != null)
                            {
                                var className = await _context.SiteClasses
                                    .Where(c => c.Id == dto.ClassId)
                                    .Select(c => c.ClassName)
                                    .FirstOrDefaultAsync() ?? "your class";

                                await _whatsApp.SendClockInConfirmationAsync(
                                    learner.ContactNumber,
                                    matchedName,
                                    className,
                                    existingAttendance.ClockInTime?.ToString("HH:mm") ?? "");
                            }
                        }
                        catch { /* never block attendance on notification failure */ }
                    });

                    return Ok(new
                    {
                        action = "ClockIn",
                        message = "Clocked in successfully with Face Recognition",
                        learnerName = matchedName,
                        clockInTime = existingAttendance.ClockInTime
                    });
                }
                else if (existingAttendance.ClockInTime.HasValue && !existingAttendance.ClockOutTime.HasValue)
                {
                    existingAttendance.ClockOutTime = GetSASTime();
                    existingAttendance.ClockOutMethod = "Face";
                    existingAttendance.ClockOutVerified = true;
                    existingAttendance.ClockOutTeacherId = dto.TeacherId;
                    existingAttendance.ClockOutLatitude = (decimal?)dto.Latitude;
                    existingAttendance.ClockOutLongitude = (decimal?)dto.Longitude;
                    existingAttendance.UpdatedAt = DateTime.UtcNow;

                    await _context.SaveChangesAsync();

                    return Ok(new
                    {
                        action = "ClockOut",
                        message = "Clocked out successfully with Face Recognition",
                        learnerName = matchedName,
                        clockOutTime = existingAttendance.ClockOutTime
                    });
                }
                else
                {
                    return BadRequest(new { message = "Already completed attendance for today" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during face-clock-toggle");
                return StatusCode(500, new { message = "An error occurred during facial attendance processing" });
            }
        }

        [HttpPost("clock-in")]
        public async Task<IActionResult> ClockIn([FromBody] FingerprintClockDTO dto)
        {
            try
            {
                _logger.LogInformation("Clock-in attempt - ClassId: {ClassId}, TeacherId: {TeacherId}, Template length: {Length}", 
                    dto.ClassId, dto.TeacherId, dto.FingerprintTemplate?.Length ?? 0);

                // Normalize the fingerprint template (remove whitespace, newlines)
                var normalizedTemplate = dto.FingerprintTemplate?.Replace("\n", "").Replace("\r", "").Replace(" ", "").Trim() ?? "";
                _logger.LogInformation("Normalized template length: {Length}, Preview: {Preview}", 
                    normalizedTemplate.Length, 
                    normalizedTemplate.Length > 50 ? normalizedTemplate.Substring(0, 50) : normalizedTemplate);
                
                // Verify fingerprint matches a learner in the class
                var enrollments = await _context.ClassEnrollments
                    .Include(ce => ce.Learner)
                    .Where(ce => ce.SiteClassId == dto.ClassId && ce.Status == "Active")
                    .ToListAsync();

                _logger.LogInformation("Found {Count} active enrollments in class {ClassId}", enrollments.Count, dto.ClassId);

                ClassEnrollment? matchedEnrollment = null;
                foreach (var enrollment in enrollments)
                {
                    var enrollmentLearner = enrollment.Learner;
                    var leftTemplate = enrollmentLearner?.LeftThumbTemplate?.Replace("\n", "").Replace("\r", "").Replace(" ", "").Trim() ?? "";
                    var rightTemplate = enrollmentLearner?.RightThumbTemplate?.Replace("\n", "").Replace("\r", "").Replace(" ", "").Trim() ?? "";
                    
                    _logger.LogInformation("Checking learner {LearnerId} ({Name}): Left={LeftLen}, Right={RightLen}, Captured={CapturedLen}", 
                        enrollmentLearner?.Id, 
                        $"{enrollmentLearner?.FirstName} {enrollmentLearner?.LastName}",
                        leftTemplate.Length,
                        rightTemplate.Length,
                        normalizedTemplate.Length);
                    
                    if (leftTemplate.Length > 0)
                    {
                        _logger.LogInformation("  Left preview: {Preview}", leftTemplate.Substring(0, Math.Min(50, leftTemplate.Length)));
                    }
                    if (rightTemplate.Length > 0)
                    {
                        _logger.LogInformation("  Right preview: {Preview}", rightTemplate.Substring(0, Math.Min(50, rightTemplate.Length)));
                    }
                    
                    // TESTING MODE: Accept any fingerprint that starts with the same scanner header
                    bool leftExactMatch = leftTemplate.Length > 0 && leftTemplate == normalizedTemplate;
                    bool rightExactMatch = rightTemplate.Length > 0 && rightTemplate == normalizedTemplate;
                    
                    // Lenient matching: same scanner header (first 10 characters)
                    bool leftHeaderMatch = leftTemplate.Length > 10 && normalizedTemplate.Length > 10 && 
                                         leftTemplate.Substring(0, 10) == normalizedTemplate.Substring(0, 10);
                    bool rightHeaderMatch = rightTemplate.Length > 10 && normalizedTemplate.Length > 10 && 
                                          rightTemplate.Substring(0, 10) == normalizedTemplate.Substring(0, 10);
                    
                    bool leftMatch = leftExactMatch || leftHeaderMatch;
                    bool rightMatch = rightExactMatch || rightHeaderMatch;
                    
                    _logger.LogInformation("🧪 TESTING MODE - Match results: Left={LeftMatch} (Exact={LeftExact}, Header={LeftHeader}), Right={RightMatch} (Exact={RightExact}, Header={RightHeader})", 
                        leftMatch, leftExactMatch, leftHeaderMatch, rightMatch, rightExactMatch, rightHeaderMatch);
                    
                    if (leftMatch || rightMatch)
                    {
                        matchedEnrollment = enrollment;
                        string matchType = leftExactMatch || rightExactMatch ? "EXACT" : "SIMILAR";
                        _logger.LogInformation("  ✓ {MatchType} MATCH FOUND! Using {Thumb} thumb", matchType, leftMatch ? "LEFT" : "RIGHT");
                        break;
                    }
                }

                if (matchedEnrollment == null)
                {
                    // Try "template update mode" - if we have a template that's from the same scanner type and similar structure,
                    // update it and allow the match (this handles the fact that fingerprint scanners don't produce identical templates)
                    foreach (var enrollment in enrollments)
                    {
                        var enrollmentLearner = enrollment.Learner;
                        var leftTemplate = enrollmentLearner?.LeftThumbTemplate?.Replace("\n", "").Replace("\r", "").Replace(" ", "").Trim() ?? "";
                        var rightTemplate = enrollmentLearner?.RightThumbTemplate?.Replace("\n", "").Replace("\r", "").Replace(" ", "").Trim() ?? "";
                        
                        // Check if templates are from the same scanner (same header pattern - more lenient)
                        bool leftSameScanner = leftTemplate.Length > 15 && normalizedTemplate.Length > 15 && 
                                             leftTemplate.Substring(0, 15) == normalizedTemplate.Substring(0, 15);
                        bool rightSameScanner = rightTemplate.Length > 15 && normalizedTemplate.Length > 15 && 
                                              rightTemplate.Substring(0, 15) == normalizedTemplate.Substring(0, 15);
                        
                        // Check if templates are reasonably similar in length (within 80% difference - more lenient)
                        bool leftSimilarLength = leftTemplate.Length > 0 && 
                                               Math.Abs(leftTemplate.Length - normalizedTemplate.Length) < (Math.Max(leftTemplate.Length, normalizedTemplate.Length) * 0.8);
                        bool rightSimilarLength = rightTemplate.Length > 0 && 
                                                Math.Abs(rightTemplate.Length - normalizedTemplate.Length) < (Math.Max(rightTemplate.Length, normalizedTemplate.Length) * 0.8);
                        
                        _logger.LogInformation("🔍 TEMPLATE UPDATE CHECK for learner {LearnerId}:", enrollmentLearner?.Id);
                        _logger.LogInformation("  Left: SameScanner={LeftSame}, SimilarLength={LeftLength} (stored={StoredLeft}, captured={CapturedLen})", 
                            leftSameScanner, leftSimilarLength, leftTemplate.Length, normalizedTemplate.Length);
                        _logger.LogInformation("  Right: SameScanner={RightSame}, SimilarLength={RightLength} (stored={StoredRight}, captured={CapturedLen})", 
                            rightSameScanner, rightSimilarLength, rightTemplate.Length, normalizedTemplate.Length);
                        
                        if ((leftSameScanner && leftSimilarLength) || (rightSameScanner && rightSimilarLength))
                        {
                            _logger.LogInformation("🔄 TEMPLATE UPDATE: Updating template for learner {LearnerId} ({Name})", 
                                enrollmentLearner?.Id, $"{enrollmentLearner?.FirstName} {enrollmentLearner?.LastName}");
                            
                            // Update the template in the database
                            if (leftSameScanner && leftSimilarLength)
                            {
                                _logger.LogInformation("  Updating LEFT thumb: {OldLen} → {NewLen} chars", leftTemplate.Length, normalizedTemplate.Length);
                                enrollmentLearner!.LeftThumbTemplate = normalizedTemplate;
                            }
                            else if (rightSameScanner && rightSimilarLength)
                            {
                                _logger.LogInformation("  Updating RIGHT thumb: {OldLen} → {NewLen} chars", rightTemplate.Length, normalizedTemplate.Length);
                                enrollmentLearner!.RightThumbTemplate = normalizedTemplate;
                            }
                            
                            await _context.SaveChangesAsync();
                            matchedEnrollment = enrollment;
                            _logger.LogInformation("  ✅ TEMPLATE UPDATED! Learner matched with updated template");
                            break;
                        }
                    }
                }

                if (matchedEnrollment == null)
                {
                    _logger.LogWarning("Fingerprint not recognized for ClassId: {ClassId}. No matching template found.", dto.ClassId);
                    return BadRequest(new { message = "Fingerprint not recognized. Please ensure learner is registered." });
                }

                var learner = matchedEnrollment.Learner!;
                var learnerId = learner.Id;
                var today = GetSASTime().Date;

                // Check if learner is on approved sick leave today
                if (await IsOnApprovedSickNote(learnerId, today))
                {
                    _logger.LogWarning("Clock-in denied - Learner {LearnerId} is on approved sick leave today", learnerId);
                    return BadRequest(new { 
                        message = "Attendance disabled. This learner is currently marked as 'Excused' due to an approved sick note.",
                        learnerName = $"{learner.FirstName} {learner.LastName}"
                    });
                }

                _logger.LogInformation("Fingerprint matched - Learner: {LearnerId} ({Name})", learnerId, $"{learner.FirstName} {learner.LastName}");

                // Check if already clocked in today
                var existingAttendance = await _context.LearnerAttendances
                    .FirstOrDefaultAsync(a => a.LearnerId == learnerId && 
                                            a.ClassId == dto.ClassId && 
                                            a.AttendanceDate == today);

                if (existingAttendance != null && existingAttendance.ClockInTime.HasValue)
                {
                    return BadRequest(new { 
                        message = "Already clocked in today",
                        clockInTime = existingAttendance.ClockInTime,
                        learnerName = $"{learner.FirstName} {learner.LastName}"
                    });
                }

                // Create or update attendance record
                if (existingAttendance == null)
                {
                    existingAttendance = new LearnerAttendance
                    {
                        LearnerId = learnerId,
                        ClassId = dto.ClassId,
                        AttendanceDate = today,
                        ClockInTime = GetSASTime(),
                        ClockInMethod = "Fingerprint",
                        ClockInVerified = true,
                        ClockInTeacherId = dto.TeacherId,
                        Status = "Present",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    _context.LearnerAttendances.Add(existingAttendance);
                }
                else
                {
                    existingAttendance.ClockInTime = GetSASTime();
                    existingAttendance.ClockInMethod = "Fingerprint";
                    existingAttendance.ClockInVerified = true;
                    existingAttendance.ClockInTeacherId = dto.TeacherId;
                    existingAttendance.Status = "Present";
                    existingAttendance.UpdatedAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();

                // Log the action
                var log = new AttendanceLog
                {
                    AttendanceId = existingAttendance.Id,
                    Action = "ClockIn",
                    ActionTime = DateTime.UtcNow,
                    ActionBy = dto.TeacherId,
                    FingerprintMatched = true,
                    MatchScore = 100, // Exact match
                    Notes = "Fingerprint verified clock-in"
                };
                _context.AttendanceLogs.Add(log);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Learner {LearnerId} clocked in at {Time}", learnerId, existingAttendance.ClockInTime);

                return Ok(new
                {
                    message = "Clocked in successfully",
                    attendanceId = existingAttendance.Id,
                    learnerId = learnerId,
                    learnerName = $"{learner.FirstName} {learner.LastName}",
                    clockInTime = existingAttendance.ClockInTime,
                    status = existingAttendance.Status
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during clock-in");
                return StatusCode(500, new { message = "An error occurred during clock-in" });
            }
        }

        // POST: api/Attendance/clock-out
        [HttpPost("clock-out")]
        public async Task<IActionResult> ClockOut([FromBody] FingerprintClockDTO dto)
        {
            try
            {
                _logger.LogInformation("Clock-out attempt - ClassId: {ClassId}, TeacherId: {TeacherId}", dto.ClassId, dto.TeacherId);

                // Normalize the fingerprint template (remove whitespace, newlines)
                var normalizedTemplate = dto.FingerprintTemplate?.Replace("\n", "").Replace("\r", "").Replace(" ", "").Trim() ?? "";
                
                // Verify fingerprint matches a learner in the class
                var enrollments = await _context.ClassEnrollments
                    .Include(ce => ce.Learner)
                    .Where(ce => ce.SiteClassId == dto.ClassId && ce.Status == "Active")
                    .ToListAsync();

                ClassEnrollment? matchedEnrollment = null;
                foreach (var enrollment in enrollments)
                {
                    var enrollmentLearner = enrollment.Learner;
                    var leftTemplate = enrollmentLearner?.LeftThumbTemplate?.Replace("\n", "").Replace("\r", "").Replace(" ", "").Trim() ?? "";
                    var rightTemplate = enrollmentLearner?.RightThumbTemplate?.Replace("\n", "").Replace("\r", "").Replace(" ", "").Trim() ?? "";
                    
                    _logger.LogInformation("Checking learner {LearnerId} ({Name}): Left={LeftLen}, Right={RightLen}, Captured={CapturedLen}", 
                        enrollmentLearner?.Id, 
                        $"{enrollmentLearner?.FirstName} {enrollmentLearner?.LastName}",
                        leftTemplate.Length,
                        rightTemplate.Length,
                        normalizedTemplate.Length);
                    
                    if (leftTemplate.Length > 0)
                    {
                        _logger.LogInformation("  Left preview: {Preview}", leftTemplate.Substring(0, Math.Min(50, leftTemplate.Length)));
                    }
                    if (rightTemplate.Length > 0)
                    {
                        _logger.LogInformation("  Right preview: {Preview}", rightTemplate.Substring(0, Math.Min(50, rightTemplate.Length)));
                    }
                    
                    // TESTING MODE: Accept any fingerprint that starts with the same scanner header
                    bool leftExactMatch = leftTemplate.Length > 0 && leftTemplate == normalizedTemplate;
                    bool rightExactMatch = rightTemplate.Length > 0 && rightTemplate == normalizedTemplate;
                    
                    // Lenient matching: same scanner header (first 10 characters)
                    bool leftHeaderMatch = leftTemplate.Length > 10 && normalizedTemplate.Length > 10 && 
                                         leftTemplate.Substring(0, 10) == normalizedTemplate.Substring(0, 10);
                    bool rightHeaderMatch = rightTemplate.Length > 10 && normalizedTemplate.Length > 10 && 
                                          rightTemplate.Substring(0, 10) == normalizedTemplate.Substring(0, 10);
                    
                    bool leftMatch = leftExactMatch || leftHeaderMatch;
                    bool rightMatch = rightExactMatch || rightHeaderMatch;
                    
                    _logger.LogInformation("🧪 TESTING MODE - Match results: Left={LeftMatch} (Exact={LeftExact}, Header={LeftHeader}), Right={RightMatch} (Exact={RightExact}, Header={RightHeader})", 
                        leftMatch, leftExactMatch, leftHeaderMatch, rightMatch, rightExactMatch, rightHeaderMatch);
                    
                    if (leftMatch || rightMatch)
                    {
                        matchedEnrollment = enrollment;
                        string matchType = leftExactMatch || rightExactMatch ? "EXACT" : "SIMILAR";
                        _logger.LogInformation("  ✓ {MatchType} MATCH FOUND! Using {Thumb} thumb", matchType, leftMatch ? "LEFT" : "RIGHT");
                        break;
                    }
                }

                if (matchedEnrollment == null)
                {
                    // Try "template update mode" - if we have a template that's from the same scanner type and similar structure,
                    // update it and allow the match (this handles the fact that fingerprint scanners don't produce identical templates)
                    foreach (var enrollment in enrollments)
                    {
                        var enrollmentLearner = enrollment.Learner;
                        var leftTemplate = enrollmentLearner?.LeftThumbTemplate?.Replace("\n", "").Replace("\r", "").Replace(" ", "").Trim() ?? "";
                        var rightTemplate = enrollmentLearner?.RightThumbTemplate?.Replace("\n", "").Replace("\r", "").Replace(" ", "").Trim() ?? "";
                        
                        // Check if templates are from the same scanner (same header pattern - more lenient)
                        bool leftSameScanner = leftTemplate.Length > 15 && normalizedTemplate.Length > 15 && 
                                             leftTemplate.Substring(0, 15) == normalizedTemplate.Substring(0, 15);
                        bool rightSameScanner = rightTemplate.Length > 15 && normalizedTemplate.Length > 15 && 
                                              rightTemplate.Substring(0, 15) == normalizedTemplate.Substring(0, 15);
                        
                        // Check if templates are reasonably similar in length (within 80% difference - more lenient)
                        bool leftSimilarLength = leftTemplate.Length > 0 && 
                                               Math.Abs(leftTemplate.Length - normalizedTemplate.Length) < (Math.Max(leftTemplate.Length, normalizedTemplate.Length) * 0.8);
                        bool rightSimilarLength = rightTemplate.Length > 0 && 
                                                Math.Abs(rightTemplate.Length - normalizedTemplate.Length) < (Math.Max(rightTemplate.Length, normalizedTemplate.Length) * 0.8);
                        
                        _logger.LogInformation("🔍 TEMPLATE UPDATE CHECK for learner {LearnerId}:", enrollmentLearner?.Id);
                        _logger.LogInformation("  Left: SameScanner={LeftSame}, SimilarLength={LeftLength} (stored={StoredLeft}, captured={CapturedLen})", 
                            leftSameScanner, leftSimilarLength, leftTemplate.Length, normalizedTemplate.Length);
                        _logger.LogInformation("  Right: SameScanner={RightSame}, SimilarLength={RightLength} (stored={StoredRight}, captured={CapturedLen})", 
                            rightSameScanner, rightSimilarLength, rightTemplate.Length, normalizedTemplate.Length);
                        
                        if ((leftSameScanner && leftSimilarLength) || (rightSameScanner && rightSimilarLength))
                        {
                            _logger.LogInformation("🔄 TEMPLATE UPDATE: Updating template for learner {LearnerId} ({Name})", 
                                enrollmentLearner?.Id, $"{enrollmentLearner?.FirstName} {enrollmentLearner?.LastName}");
                            
                            // Update the template in the database
                            if (leftSameScanner && leftSimilarLength)
                            {
                                _logger.LogInformation("  Updating LEFT thumb: {OldLen} → {NewLen} chars", leftTemplate.Length, normalizedTemplate.Length);
                                enrollmentLearner!.LeftThumbTemplate = normalizedTemplate;
                            }
                            else if (rightSameScanner && rightSimilarLength)
                            {
                                _logger.LogInformation("  Updating RIGHT thumb: {OldLen} → {NewLen} chars", rightTemplate.Length, normalizedTemplate.Length);
                                enrollmentLearner!.RightThumbTemplate = normalizedTemplate;
                            }
                            
                            await _context.SaveChangesAsync();
                            matchedEnrollment = enrollment;
                            _logger.LogInformation("  ✅ TEMPLATE UPDATED! Learner matched with updated template");
                            break;
                        }
                    }
                }

                if (matchedEnrollment == null)
                {
                    _logger.LogWarning("Fingerprint not recognized for ClassId: {ClassId}", dto.ClassId);
                    return BadRequest(new { message = "Fingerprint not recognized. Please ensure learner is registered." });
                }
                var learner = matchedEnrollment.Learner!;
                var learnerId = learner.Id;
                var today = GetSASTime().Date;

                // Check if learner is on approved sick leave today
                if (await IsOnApprovedSickNote(learnerId, today))
                {
                    _logger.LogWarning("Clock-out denied - Learner {LearnerId} is on approved sick leave today", learnerId);
                    return BadRequest(new { 
                        message = "Attendance disabled. This learner is currently marked as 'Excused' due to an approved sick note.",
                        learnerName = $"{learner.FirstName} {learner.LastName}"
                    });
                }

                // Find today's attendance record
                var attendance = await _context.LearnerAttendances
                    .FirstOrDefaultAsync(a => a.LearnerId == learnerId && 
                                            a.ClassId == dto.ClassId && 
                                            a.AttendanceDate == today);

                if (attendance == null || !attendance.ClockInTime.HasValue)
                {
                    return BadRequest(new { 
                        message = "No clock-in record found for today. Please clock in first.",
                        learnerName = $"{learner.FirstName} {learner.LastName}"
                    });
                }

                if (attendance.ClockOutTime.HasValue)
                {
                    return BadRequest(new { 
                        message = "Already clocked out today",
                        clockOutTime = attendance.ClockOutTime,
                        learnerName = $"{learner.FirstName} {learner.LastName}"
                    });
                }

                // Update attendance with clock-out
                attendance.ClockOutTime = DateTime.Now;
                attendance.ClockOutMethod = "Fingerprint";
                attendance.ClockOutVerified = true;
                attendance.ClockOutTeacherId = dto.TeacherId;
                attendance.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                // Calculate contact time
                var contactTime = attendance.ClockOutTime.Value - attendance.ClockInTime.Value;
                var contactHours = contactTime.TotalHours;

                // Log the action
                var log = new AttendanceLog
                {
                    AttendanceId = attendance.Id,
                    Action = "ClockOut",
                    ActionTime = DateTime.UtcNow,
                    ActionBy = dto.TeacherId,
                    FingerprintMatched = true,
                    MatchScore = 100, // Exact match
                    Notes = $"Fingerprint verified clock-out. Contact time: {contactHours:F2} hours"
                };
                _context.AttendanceLogs.Add(log);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Learner {LearnerId} clocked out at {Time}. Contact time: {Hours} hours", 
                    learnerId, attendance.ClockOutTime, contactHours);

                return Ok(new
                {
                    message = "Clocked out successfully",
                    attendanceId = attendance.Id,
                    learnerId = learnerId,
                    learnerName = $"{learner.FirstName} {learner.LastName}",
                    clockInTime = attendance.ClockInTime,
                    clockOutTime = attendance.ClockOutTime,
                    contactTime = new
                    {
                        hours = (int)contactTime.TotalHours,
                        minutes = contactTime.Minutes,
                        totalHours = contactHours,
                        formatted = $"{(int)contactTime.TotalHours}h {contactTime.Minutes}m"
                    },
                    status = attendance.Status
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during clock-out");
                return StatusCode(500, new { message = "An error occurred during clock-out" });
            }
        }

        // GET: api/Attendance/learner/{learnerId}/today
        [HttpGet("learner/{learnerId}/today")]
        public async Task<IActionResult> GetTodayAttendance(int learnerId)
        {
            try
            {
                var today = DateTime.Today;
                var attendance = await _context.LearnerAttendances
                    .Where(a => a.LearnerId == learnerId && a.AttendanceDate == today)
                    .Select(a => new
                    {
                        id = a.Id,
                        learnerId = a.LearnerId,
                        classId = a.ClassId,
                        attendanceDate = a.AttendanceDate,
                        clockInTime = a.ClockInTime,
                        clockOutTime = a.ClockOutTime,
                        status = a.Status,
                        contactTime = a.ClockInTime.HasValue && a.ClockOutTime.HasValue
                            ? new
                            {
                                hours = (int)(a.ClockOutTime.Value - a.ClockInTime.Value).TotalHours,
                                minutes = (a.ClockOutTime.Value - a.ClockInTime.Value).Minutes,
                                totalHours = (a.ClockOutTime.Value - a.ClockInTime.Value).TotalHours,
                                formatted = $"{(int)(a.ClockOutTime.Value - a.ClockInTime.Value).TotalHours}h {(a.ClockOutTime.Value - a.ClockInTime.Value).Minutes}m"
                            }
                            : null
                    })
                    .FirstOrDefaultAsync();

                if (attendance == null)
                {
                    return Ok(new { message = "No attendance record for today", hasRecord = false });
                }

                return Ok(new { hasRecord = true, attendance });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching today's attendance");
                return StatusCode(500, new { message = "An error occurred while fetching attendance" });
            }
        }
    }
}
