using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using backend.Services.Interfaces;
using System.IO.Compression;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ExternalUsersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IPasswordHashingService _passwordHashingService;
        private readonly IEmailService _emailService;
        private readonly ILogger<ExternalUsersController> _logger;
        private readonly ILearnerDocumentEncryptionService _learnerDocEncryptionService;

        public ExternalUsersController(
            ApplicationDbContext context,
            IPasswordHashingService passwordHashingService,
            IEmailService emailService,
            ILogger<ExternalUsersController> logger,
            ILearnerDocumentEncryptionService learnerDocEncryptionService)
        {
            _context = context;
            _passwordHashingService = passwordHashingService;
            _emailService = emailService;
            _logger = logger;
            _learnerDocEncryptionService = learnerDocEncryptionService;
        }

        // GET: api/ExternalUsers/document-types/{projectId}
        [HttpGet("document-types/{projectId}")]
        public async Task<IActionResult> GetDocumentTypesForProject(int projectId)
        {
            var docTypes = await _context.LearnerDocuments
                .Include(d => d.Learner)
                    .ThenInclude(l => l!.ClassEnrollments!)
                        .ThenInclude(ce => ce.SiteClass!)
                            .ThenInclude(sc => sc.ProjectSite)
                .Where(d => d.Learner!.ClassEnrollments!.Any(ce =>
                    ce.SiteClass != null &&
                    ce.SiteClass.ProjectSite != null &&
                    ce.SiteClass.ProjectSite.ProjectId == projectId))
                .Select(d => d.DocumentType)
                .Distinct()
                .OrderBy(t => t)
                .ToListAsync();

            return Ok(docTypes);
        }

        // GET: api/ExternalUsers
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var users = await _context.Users
                .Where(u => u.Role == UserRole.ExternalUser)
                .Select(u => new
                {
                    u.Id,
                    u.FirstName,
                    u.LastName,
                    u.Email,
                    u.Username,
                    u.PhoneNumber,
                    u.Status,
                    u.CreatedAt,
                    Access = _context.ExternalUserAccess
                        .Where(a => a.UserId == u.Id)
                        .Select(a => new
                        {
                            a.Id,
                            a.ProjectId,
                            ProjectName = a.Project!.ProjectName,
                            a.AllowedDocumentTypes,
                            a.OrganizationName
                        }).ToList()
                })
                .OrderByDescending(u => u.CreatedAt)
                .ToListAsync();

            return Ok(users);
        }

        // GET: api/ExternalUsers/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var user = await _context.Users
                .Where(u => u.Id == id && u.Role == UserRole.ExternalUser)
                .Select(u => new
                {
                    u.Id,
                    u.FirstName,
                    u.LastName,
                    u.Email,
                    u.Username,
                    u.PhoneNumber,
                    u.Status,
                    u.CreatedAt,
                    Access = _context.ExternalUserAccess
                        .Where(a => a.UserId == u.Id)
                        .Select(a => new
                        {
                            a.Id,
                            a.ProjectId,
                            ProjectName = a.Project!.ProjectName,
                            a.AllowedDocumentTypes,
                            a.OrganizationName
                        }).ToList()
                })
                .FirstOrDefaultAsync();

            if (user == null) return NotFound(new { message = "External user not found" });
            return Ok(user);
        }

        // POST: api/ExternalUsers
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateExternalUserDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // Check email uniqueness
            var emailLower = dto.Email.Trim().ToLowerInvariant();
            if (await _context.Users.AnyAsync(u => u.Email.ToLower() == emailLower))
                return BadRequest(new { message = "Email already exists" });

            // Generate username from email
            var baseUsername = emailLower.Split('@')[0].Replace(".", "").Replace("-", "");
            var username = baseUsername;
            int suffix = 1;
            while (await _context.Users.AnyAsync(u => u.Username == username))
                username = $"{baseUsername}{suffix++}";

            // Generate temp password
            var tempPassword = GenerateTempPassword();

            var user = new User
            {
                FirstName = dto.FirstName.Trim(),
                LastName = dto.LastName.Trim(),
                Email = dto.Email.Trim(),
                Username = username,
                PhoneNumber = dto.PhoneNumber?.Trim(),
                PasswordHash = _passwordHashingService.HashPassword(tempPassword),
                Role = UserRole.ExternalUser,
                Status = UserStatus.Active,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Create access entries
            foreach (var access in dto.ProjectAccess)
            {
                _context.ExternalUserAccess.Add(new ExternalUserAccess
                {
                    UserId = user.Id,
                    ProjectId = access.ProjectId,
                    AllowedDocumentTypes = string.Join(",", access.AllowedDocumentTypes),
                    OrganizationName = dto.OrganizationName?.Trim(),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
            }
            await _context.SaveChangesAsync();

            // Send welcome email
            try
            {
                var subject = "NBSN Project Portal - Your Account Details";
                var body = $@"
<h2>Welcome to the NBSN Project External Portal</h2>
<p>Dear {user.FirstName} {user.LastName},</p>
<p>Your external access account has been created. Please use the following credentials to login:</p>
<table>
<tr><td><strong>Email:</strong></td><td>{user.Email}</td></tr>
<tr><td><strong>Username:</strong></td><td>{user.Username}</td></tr>
<tr><td><strong>Temporary Password:</strong></td><td>{tempPassword}</td></tr>
</table>
<p>Login at: <a href='http://192.168.0.53:5174/login'>http://192.168.0.53:5174/login</a></p>
<p>Please change your password after first login.</p>
<p>Regards,<br/>NBSN Project Team</p>";
                await _emailService.SendEmailAsync(user.Email, subject, body);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to send welcome email to external user {Email}", user.Email);
            }

            return CreatedAtAction(nameof(GetById), new { id = user.Id }, new
            {
                user.Id,
                user.FirstName,
                user.LastName,
                user.Email,
                user.Username,
                message = "External user created successfully. Login credentials sent via email."
            });
        }

        // PUT: api/ExternalUsers/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateExternalUserDto dto)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null || user.Role != UserRole.ExternalUser)
                return NotFound(new { message = "External user not found" });

            user.FirstName = dto.FirstName.Trim();
            user.LastName = dto.LastName.Trim();
            user.PhoneNumber = dto.PhoneNumber?.Trim();
            user.Status = dto.Status;
            user.UpdatedAt = DateTime.UtcNow;

            // Update access - remove old, add new
            var existingAccess = await _context.ExternalUserAccess.Where(a => a.UserId == id).ToListAsync();
            _context.ExternalUserAccess.RemoveRange(existingAccess);

            foreach (var access in dto.ProjectAccess)
            {
                _context.ExternalUserAccess.Add(new ExternalUserAccess
                {
                    UserId = id,
                    ProjectId = access.ProjectId,
                    AllowedDocumentTypes = string.Join(",", access.AllowedDocumentTypes),
                    OrganizationName = dto.OrganizationName?.Trim(),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "External user updated successfully" });
        }

        // DELETE: api/ExternalUsers/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null || user.Role != UserRole.ExternalUser)
                return NotFound(new { message = "External user not found" });

            var access = await _context.ExternalUserAccess.Where(a => a.UserId == id).ToListAsync();
            _context.ExternalUserAccess.RemoveRange(access);
            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return Ok(new { message = "External user deleted successfully" });
        }

        // GET: api/ExternalUsers/my-access  (called from external portal on login)
        [HttpGet("my-access")]
        public async Task<IActionResult> GetMyAccess()
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int userId))
                return Unauthorized();

            var access = await _context.ExternalUserAccess
                .Include(a => a.Project)
                .Where(a => a.UserId == userId)
                .ToListAsync();

            var result = new List<object>();
            foreach (var a in access)
            {
                var project = a.Project!;
                var allowedTypes = a.AllowedDocumentTypes.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(t => t.Trim()).ToList();

                // Get all learners in this project via ClassEnrollments → SiteClasses → ProjectSites → Project
                var learners = await _context.Learners
                    .Include(l => l.ClassEnrollments!)
                        .ThenInclude(ce => ce.SiteClass!)
                            .ThenInclude(sc => sc.ProjectSite)
                    .Include(l => l.LearnerDocuments)
                    .Where(l => l.ClassEnrollments!.Any(ce =>
                        ce.SiteClass != null &&
                        ce.SiteClass.ProjectSite != null &&
                        ce.SiteClass.ProjectSite.ProjectId == a.ProjectId))
                    .ToListAsync();

                var today = DateTime.Today;
                var learnerData = learners.Select(l =>
                {
                    var age = l.Age ?? (l.DateOfBirth.HasValue
                        ? (int)((today - l.DateOfBirth.Value).TotalDays / 365.25)
                        : (int?)null);

                    var docs = l.LearnerDocuments!
                        .Where(d => allowedTypes.Contains(d.DocumentType))
                        .Select(d => new
                        {
                            d.Id, d.DocumentType, d.FileName, d.UploadedAt, d.ApprovalStatus,
                            IsAttendanceRegister = false
                        }).ToList<object>();

                    // If "Attendance Register" is in allowed types, add virtual attendance doc
                    if (allowedTypes.Contains("Attendance Register"))
                    {
                        docs.Add(new
                        {
                            Id = -l.Id,           // negative ID = attendance register
                            DocumentType = "Attendance Register",
                            FileName = $"Attendance_Register_{l.FirstName}_{l.LastName}.pdf",
                            UploadedAt = DateTime.UtcNow,
                            ApprovalStatus = "Approved",
                            IsAttendanceRegister = true
                        });
                    }

                    return new
                    {
                        l.Id, l.FirstName, l.LastName, l.IdNumber,
                        l.Gender, l.ProfilePhotoPath, age,
                        Documents = docs
                    };
                }).ToList();

                // Demographics
                int totalLearners = learners.Count;
                int male   = learners.Count(l => (l.Gender ?? "").ToLower().Contains("male") && !(l.Gender ?? "").ToLower().Contains("female"));
                int female = learners.Count(l => (l.Gender ?? "").ToLower().Contains("female"));
                int youth  = learnerData.Count(l => l.age.HasValue && l.age <= 35);
                int above35 = learnerData.Count(l => l.age.HasValue && l.age > 35);
                int ageUnknown = learnerData.Count(l => !l.age.HasValue);

                // Document summary
                var allAllowedDocs = learners.SelectMany(l => l.LearnerDocuments!
                    .Where(d => allowedTypes.Contains(d.DocumentType))).ToList();
                var docSummary = allowedTypes.Select(dt => new
                {
                    DocumentType = dt,
                    Count = dt == "Attendance Register"
                        ? learners.Count // every learner has one
                        : allAllowedDocs.Count(d => d.DocumentType == dt)
                }).ToList();

                // Sites summary - get all sites for this project with learner counts
                var sites = await _context.ProjectSites
                    .Include(ps => ps.SiteClasses!)
                        .ThenInclude(sc => sc.ClassEnrollments)
                    .Where(ps => ps.ProjectId == a.ProjectId)
                    .Select(ps => new
                    {
                        ps.Id,
                        ps.SiteName,
                        ps.City,
                        ps.Province,
                        LearnerCount = ps.SiteClasses!
                            .SelectMany(sc => sc.ClassEnrollments)
                            .Select(ce => ce.LearnerId)
                            .Distinct()
                            .Count()
                    })
                    .ToListAsync();

                result.Add(new
                {
                    AccessId = a.Id,
                    Project = new
                    {
                        project.Id, project.ProjectName, project.Province,
                        project.StartDate, project.EndDate,
                        project.ProjectFunder, project.LeadEmployerPartner,
                        project.NumberOfBeneficiaries
                    },
                    AllowedDocumentTypes = allowedTypes,
                    OrganizationName = a.OrganizationName,
                    Demographics = new
                    {
                        TotalLearners = totalLearners,
                        Male = male,
                        Female = female,
                        Youth = youth,        // age <= 35
                        Above35 = above35,
                        AgeUnknown = ageUnknown
                    },
                    DocumentSummary = docSummary,
                    TotalDocuments = allAllowedDocs.Count,
                    Sites = sites,
                    Learners = learnerData
                });
            }

            return Ok(result);
        }

        // GET: api/ExternalUsers/document/{documentId}/download  (secure – validates access)
        [HttpGet("document/{documentId}/download")]
        public async Task<IActionResult> DownloadDocument(int documentId)
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int userId)) return Unauthorized();

            var doc = await _context.LearnerDocuments
                .Include(d => d.Learner)
                    .ThenInclude(l => l!.ClassEnrollments!)
                        .ThenInclude(ce => ce.SiteClass!)
                            .ThenInclude(sc => sc.ProjectSite)
                .FirstOrDefaultAsync(d => d.Id == documentId);

            if (doc == null) return NotFound(new { message = "Document not found" });

            // Find the project this learner belongs to
            var projectId = doc.Learner?.ClassEnrollments?
                .FirstOrDefault(ce => ce.SiteClass?.ProjectSite != null)
                ?.SiteClass?.ProjectSite?.ProjectId;

            if (projectId == null) return Forbid();

            // Verify this external user has access to the project AND this document type
            var access = await _context.ExternalUserAccess
                .FirstOrDefaultAsync(a => a.UserId == userId && a.ProjectId == projectId);

            if (access == null) return Forbid();

            var allowed = access.AllowedDocumentTypes
                .Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(t => t.Trim()).ToList();

            if (!allowed.Contains(doc.DocumentType)) return Forbid();

            // Decrypt and serve the file
            try
            {
                var decryptedContent = await _learnerDocEncryptionService.DecryptFileAsync(
                    doc.EncryptedFilePath, doc.EncryptionIV);

                _logger.LogInformation("External user {UserId} downloaded document {DocId}", userId, documentId);
                return File(decryptedContent, doc.MimeType, doc.FileName);
            }
            catch (FileNotFoundException ex)
            {
                _logger.LogError(ex, "File not found for document {DocId}", documentId);
                return NotFound(new { message = "Document file not found on server" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error serving document {DocId} to external user {UserId}", documentId, userId);
                return StatusCode(500, new { message = "Error retrieving document" });
            }
        }

        // POST: api/ExternalUsers/bulk-download
        // Body: { projectId, learnerIds: [1,2,3], documentTypes: ["ID Document","Bank Confirmation"] }
        [HttpPost("bulk-download")]
        public async Task<IActionResult> BulkDownload([FromBody] BulkDownloadRequestDto request)
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int userId)) return Unauthorized();

            // Verify access
            var access = await _context.ExternalUserAccess
                .FirstOrDefaultAsync(a => a.UserId == userId && a.ProjectId == request.ProjectId);
            if (access == null) return Forbid();

            var allowedTypes = access.AllowedDocumentTypes
                .Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(t => t.Trim()).ToList();

            // Determine which types to include (filter to allowed only)
            var requestedList = request.DocumentTypes?.Count > 0
                ? request.DocumentTypes.Where(t => allowedTypes.Contains(t)).ToList()
                : allowedTypes.ToList();  // default: all allowed types including attendance

            // Separate attendance from regular doc types
            bool includeAttendance = requestedList.Contains("Attendance Register");
            var requestedRegularTypes = requestedList.Where(t => t != "Attendance Register").ToList();

            // Load learners with their documents and site info
            var learners = await _context.Learners
                .Include(l => l.LearnerDocuments)
                .Include(l => l.ClassEnrollments!)
                    .ThenInclude(ce => ce.SiteClass!)
                        .ThenInclude(sc => sc.ProjectSite)
                .Where(l => request.LearnerIds.Contains(l.Id) &&
                    l.ClassEnrollments!.Any(ce =>
                        ce.SiteClass != null &&
                        ce.SiteClass.ProjectSite != null &&
                        ce.SiteClass.ProjectSite.ProjectId == request.ProjectId))
                .ToListAsync();

            if (!learners.Any())
                return BadRequest(new { message = "No learners found for the given selection" });

            // Get project name for zip naming
            var project = await _context.Projects.FindAsync(request.ProjectId);
            var projectName = project?.ProjectName?.Replace(" ", "_") ?? "Project";

            // Build ZIP in memory
            using var zipStream = new MemoryStream();
            using (var archive = new ZipArchive(zipStream, ZipArchiveMode.Create, leaveOpen: true))
            {
                foreach (var learner in learners)
                {
                    // Get site name
                    var siteName = learner.ClassEnrollments?
                        .FirstOrDefault(ce => ce.SiteClass?.ProjectSite?.ProjectId == request.ProjectId)
                        ?.SiteClass?.ProjectSite?.SiteName?.Replace(" ", "_") ?? "Unknown_Site";

                    var learnerFolder = $"{projectName}/{siteName}/{learner.FirstName}_{learner.LastName}_{learner.IdNumber}";

                    // Add regular documents
                    var docs = learner.LearnerDocuments?
                        .Where(d => requestedRegularTypes.Contains(d.DocumentType))
                        .ToList() ?? new();

                    foreach (var doc in docs)
                    {
                        try
                        {
                            var bytes = await _learnerDocEncryptionService.DecryptFileAsync(
                                doc.EncryptedFilePath, doc.EncryptionIV);
                            var ext = Path.GetExtension(doc.FileName);
                            var safeType = doc.DocumentType.Replace(" ", "_").Replace("/", "_");
                            var entryName = $"{learnerFolder}/{safeType}{ext}";
                            var entry = archive.CreateEntry(entryName, CompressionLevel.Optimal);
                            using var entryStream = entry.Open();
                            await entryStream.WriteAsync(bytes);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(ex, "Failed to decrypt doc {DocId} for bulk download", doc.Id);
                        }
                    }

                    // Add attendance register if requested
                    if (includeAttendance)
                    {
                        try
                        {
                            // Determine date range
                            int fromYear = request.AttendanceFromYear ?? request.AttendanceYear ?? DateTime.Today.Year;
                            int fromMonth = request.AttendanceFromMonth ?? request.AttendanceMonth ?? DateTime.Today.Month;
                            int toYear = request.AttendanceToYear ?? request.AttendanceYear ?? DateTime.Today.Year;
                            int toMonth = request.AttendanceToMonth ?? request.AttendanceMonth ?? DateTime.Today.Month;

                            // Iterate each month in range
                            var current = new DateTime(fromYear, fromMonth, 1);
                            var end = new DateTime(toYear, toMonth, 1);
                            while (current <= end)
                            {
                                var calData = await GetLearnerAttendanceCalendarInternal(learner.Id, current.Year, current.Month);
                                if (calData != null)
                                {
                                    var pdfBytes = GenerateAttendancePdfBytes(calData);
                                    var entryName = $"{learnerFolder}/Attendance_{current.Year}_{current.Month:D2}.pdf";
                                    var entry = archive.CreateEntry(entryName, CompressionLevel.Optimal);
                                    using var entryStream = entry.Open();
                                    await entryStream.WriteAsync(pdfBytes);
                                }
                                current = current.AddMonths(1);
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(ex, "Failed attendance PDF for learner {Id}", learner.Id);
                        }
                    }
                }
            }

            zipStream.Position = 0;
            var zipName = $"{projectName}_Documents_{DateTime.Today:yyyyMMdd}.zip";
            return File(zipStream.ToArray(), "application/zip", zipName);
        }

        private async Task<backend.Models.DTOs.LearnerAttendanceCalendarDto?> GetLearnerAttendanceCalendarInternal(int learnerId, int year, int month)
        {
            try
            {
                var learner = await _context.Learners
                    .Include(l => l.ClassEnrollments!)
                        .ThenInclude(ce => ce.SiteClass!).ThenInclude(sc => sc.ProjectSite!).ThenInclude(ps => ps.Project)
                            .ThenInclude(p => p!.ProjectLearningPathways).ThenInclude(plp => plp.LearningPathway)
                    .Include(l => l.ClassEnrollments!).ThenInclude(ce => ce.SiteClass!).ThenInclude(sc => sc.CreatedByUser)
                    .FirstOrDefaultAsync(l => l.Id == learnerId);
                if (learner == null) return null;
                var enrollment = learner.ClassEnrollments?.FirstOrDefault(ce => ce.Status == "Active");
                if (enrollment?.SiteClass == null) return null;
                var projectSite = enrollment.SiteClass.ProjectSite;
                var project = projectSite?.Project;
                var startDate = new DateTime(year, month, 1);
                var endDate = startDate.AddMonths(1).AddDays(-1);
                var records = await _context.LearnerAttendances
                    .Where(la => la.LearnerId == learnerId && la.AttendanceDate >= startDate && la.AttendanceDate <= endDate)
                    .OrderBy(la => la.AttendanceDate).ToListAsync();
                var calendarDays = new List<backend.Models.DTOs.CalendarDayDto>();
                for (var date = startDate; date <= endDate; date = date.AddDays(1))
                {
                    var att = records.FirstOrDefault(ar => ar.AttendanceDate.Date == date.Date);
                    calendarDays.Add(new backend.Models.DTOs.CalendarDayDto
                    {
                        Date = date, Day = date.Day, DayOfWeek = date.DayOfWeek.ToString(),
                        Status = att?.Status ?? "No Record",
                        ClockInTime = att?.ClockInTime, ClockOutTime = att?.ClockOutTime,
                        SignaturePath = att != null ? (learner.SignaturePath ?? att.SignaturePath) : null,
                        ContactHours = att?.ClockInTime != null && att?.ClockOutTime != null
                            ? Math.Round((att.ClockOutTime!.Value - att.ClockInTime!.Value).TotalHours, 2) : null,
                        IsWeekend = date.DayOfWeek == DayOfWeek.Saturday || date.DayOfWeek == DayOfWeek.Sunday
                    });
                }
                var today = DateTime.Today;
                var presentDays = records.Count(r => r.Status == "Present" && r.ClockInTime.HasValue);
                var absentDays = records.Count(r => r.Status == "Absent")
                    + calendarDays.Count(cd => cd.Date < today && !cd.IsWeekend && cd.Status == "No Record");
                var workingDays = calendarDays.Count(cd => !cd.IsWeekend && cd.Date <= today);
                return new backend.Models.DTOs.LearnerAttendanceCalendarDto
                {
                    LearnerId = learnerId, FirstName = learner.FirstName, LastName = learner.LastName,
                    IdNumber = learner.IdNumber, Gender = learner.Gender, Telephone = learner.ContactNumber,
                    Address = $"{learner.AddressLine1} {learner.AddressLine2} {learner.AddressLine3}".Trim(),
                    ProfilePhotoPath = learner.ProfilePhotoPath, SignaturePath = learner.SignaturePath,
                    ProjectName = project?.ProjectName, Province = projectSite?.Province, SiteName = projectSite?.SiteName,
                    Pathway = project?.ProjectLearningPathways?.FirstOrDefault()?.LearningPathway?.Name,
                    ClassName = enrollment.SiteClass.ClassName,
                    TeacherName = enrollment.SiteClass.CreatedByUser != null ? $"{enrollment.SiteClass.CreatedByUser.FirstName} {enrollment.SiteClass.CreatedByUser.LastName}" : null,
                    TeacherEmail = enrollment.SiteClass.CreatedByUser?.Email,
                    Year = year, Month = month, MonthName = new DateTime(year, month, 1).ToString("MMMM"),
                    CalendarDays = calendarDays, PresentDays = presentDays, AbsentDays = absentDays,
                    LateDays = records.Count(r => r.Status == "Late"), ExpectedAttendance = workingDays,
                    ActualAttendance = presentDays, DaysAbsent = absentDays,
                    AttendanceRate = workingDays > 0 ? Math.Round((double)presentDays / workingDays * 100, 2) : 0
                };
            }
            catch { return null; }
        }

        private byte[] GenerateAttendancePdfBytes(backend.Models.DTOs.LearnerAttendanceCalendarDto cal)
        {
            var firstDay = new DateTime(cal.Year, cal.Month, 1);
            int startOffset = ((int)firstDay.DayOfWeek + 6) % 7;
            int totalRows = (int)Math.Ceiling((cal.CalendarDays.Count + startOffset) / 7.0);
            float cellH = (float)Math.Floor((157f - 10f) / totalRows);

            // Helper: resolve file path
            string? ResolvePath(string? stored)
            {
                if (string.IsNullOrEmpty(stored)) return null;
                var clean = stored.TrimStart('/', '\\').Replace('\\', Path.DirectorySeparatorChar).Replace('/', Path.DirectorySeparatorChar);
                var full = Path.Combine(Directory.GetCurrentDirectory(), clean);
                return System.IO.File.Exists(full) ? full : null;
            }

            // Helper: make circular photo bytes using SkiaSharp
            byte[]? MakeCircularPhoto(string? photoPath)
            {
                var path = ResolvePath(photoPath);
                if (path == null) return null;
                try
                {
                    var raw = System.IO.File.ReadAllBytes(path);
                    using var bmp = SkiaSharp.SKBitmap.Decode(raw);
                    if (bmp == null) return null;
                    const int sz = 54;
                    using var surface = SkiaSharp.SKSurface.Create(new SkiaSharp.SKImageInfo(sz, sz, SkiaSharp.SKColorType.Rgba8888, SkiaSharp.SKAlphaType.Premul));
                    var canvas = surface.Canvas;
                    canvas.Clear(SkiaSharp.SKColors.Transparent);
                    using var clip = new SkiaSharp.SKPath();
                    clip.AddCircle(sz / 2f, sz / 2f, sz / 2f);
                    canvas.ClipPath(clip, SkiaSharp.SKClipOperation.Intersect, true);
                    canvas.DrawBitmap(bmp, SkiaSharp.SKRect.Create(0, 0, sz, sz));
                    canvas.Flush();
                    using var img = surface.Snapshot();
                    using var data = img.Encode(SkiaSharp.SKEncodedImageFormat.Png, 100);
                    return data.ToArray();
                }
                catch { return null; }
            }

            var document = QuestPDF.Fluent.Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(QuestPDF.Helpers.PageSizes.A4.Landscape());
                    page.Margin(10);
                    page.PageColor("#0f172a");
                    page.Header().Background("#1e3a8a").Padding(4).Row(h =>
                    {
                        h.RelativeItem().Column(lc =>
                        {
                            lc.Item().Text("Attendance Calendar").FontSize(12).Bold().FontColor(QuestPDF.Helpers.Colors.White);
                            lc.Item().Text($"{cal.MonthName} {cal.Year}").FontSize(7).FontColor(QuestPDF.Helpers.Colors.White);
                        });
                        h.RelativeItem().AlignRight().Text("NBSN Project").FontSize(11).Bold().FontColor(QuestPDF.Helpers.Colors.White);
                    });
                    page.Content().PaddingTop(3).Row(row =>
                    {
                        // Calendar left panel
                        row.RelativeItem(70).Column(col =>
                        {
                            col.Item().Table(table =>
                            {
                                table.ColumnsDefinition(cd => { for (int i = 0; i < 7; i++) cd.RelativeColumn(); });
                                table.ExtendLastCellsToTableBottom();
                                foreach (var d in new[] { "MON","TUE","WED","THU","FRI","SAT","SUN" })
                                    table.Cell().Background("#1e3a8a").MinHeight(10f).AlignCenter().AlignMiddle().Text(d).FontSize(7).Bold().FontColor(QuestPDF.Helpers.Colors.White);
                                for (int i = 0; i < startOffset; i++)
                                    table.Cell().Background("#070d17").MinHeight(cellH).Text("");
                                var today2 = DateTime.Today;
                                foreach (var day in cal.CalendarDays)
                                {
                                    var dt = new DateTime(cal.Year, cal.Month, day.Day);
                                    bool fut = dt > today2, noRec = day.Status == "No Record" && !fut && !day.IsWeekend;
                                    string bg = day.IsWeekend ? "#0a0f1a" : day.Status == "Present" ? "#064e3b" : (day.Status == "Absent" || noRec) ? "#7f1d1d" : day.Status == "Late" ? "#78350f" : "#1e293b";
                                    string br = day.IsWeekend ? "#1e293b" : day.Status == "Present" ? "#10b981" : (day.Status == "Absent" || noRec) ? "#ef4444" : day.Status == "Late" ? "#f59e0b" : "#334155";
                                    string lbl = day.IsWeekend ? "WKND" : day.Status == "Present" ? "PRESENT" : (day.Status == "Absent" || noRec) ? "ABSENT" : day.Status == "Late" ? "LATE" : fut ? "PENDING" : "";
                                    string tc = day.Status == "Present" ? "#6ee7b7" : (day.Status == "Absent" || noRec) ? "#fca5a5" : day.Status == "Late" ? "#fcd34d" : "#94a3b8";
                                    table.Cell().Background(bg).Border(1).BorderColor(br).MinHeight(cellH).Padding(3).Column(cc =>
                                    {
                                        cc.Item().Text(day.Day.ToString()).FontSize(8).Bold().FontColor(QuestPDF.Helpers.Colors.White);
                                        cc.Item().AlignCenter().Text(lbl).FontSize(7).Bold().FontColor(tc);
                                        if ((day.Status == "Present" || day.Status == "Late") && day.ClockInTime.HasValue && day.ClockOutTime.HasValue)
                                            cc.Item().AlignCenter().Text($"{day.ClockInTime.Value:HH:mm}–{day.ClockOutTime.Value:HH:mm}").FontSize(5).FontColor(tc);
                                    });
                                }
                                int filled = startOffset + cal.CalendarDays.Count, rem = filled % 7;
                                if (rem != 0) for (int i = 0; i < 7 - rem; i++) table.Cell().Background("#070d17").MinHeight(cellH).Text("");
                            });

                            // Legend
                            col.Item().PaddingTop(3).Row(leg =>
                            {
                                leg.AutoItem().PaddingRight(5).Text("Legend:").FontSize(6).Bold().FontColor(QuestPDF.Helpers.Colors.White);
                                foreach (var (lb, bg2, br2) in new (string, string, string)[] { ("Present","#064e3b","#10b981"),("Absent","#7f1d1d","#ef4444"),("Late","#78350f","#f59e0b"),("Pending","#1e293b","#475569"),("Weekend","#0a0f1a","#1e293b") })
                                    leg.AutoItem().PaddingRight(6).Row(r2 => { r2.AutoItem().Width(12).Height(9).Background(bg2).Border(1).BorderColor(br2); r2.AutoItem().PaddingLeft(2).Text(lb).FontSize(6).FontColor(QuestPDF.Helpers.Colors.White); });
                            });

                            // Signatures
                            col.Item().PaddingTop(5).Row(sigRow =>
                            {
                                // Learner signature
                                sigRow.RelativeItem().Column(sig =>
                                {
                                    sig.Item().Text("Learner Signature:").FontSize(6).FontColor("#94a3b8");
                                    var sigPath = ResolvePath(cal.SignaturePath);
                                    if (sigPath != null)
                                    {
                                        try
                                        {
                                            var sigBytes = System.IO.File.ReadAllBytes(sigPath);
                                            sig.Item().PaddingTop(2).Background(QuestPDF.Helpers.Colors.White).Padding(2).Height(25).Width(80).Image(sigBytes).FitArea();
                                        }
                                        catch { sig.Item().PaddingTop(2).Height(25).Width(80).Background("#1e293b").Border(1).BorderColor("#334155"); }
                                    }
                                    else
                                        sig.Item().PaddingTop(2).Height(25).Width(80).Background("#1e293b").Border(1).BorderColor("#334155").AlignCenter().AlignMiddle().Text("No signature").FontSize(5).FontColor("#94a3b8");
                                    sig.Item().PaddingTop(2).BorderTop(1).BorderColor("#334155").Text($"{cal.FirstName} {cal.LastName}").FontSize(6).FontColor(QuestPDF.Helpers.Colors.White);
                                });
                                sigRow.ConstantItem(10);
                                // Facilitator signature
                                sigRow.RelativeItem().Column(sig =>
                                {
                                    sig.Item().Text("Facilitator Signature:").FontSize(6).FontColor("#94a3b8");
                                    sig.Item().PaddingTop(2).Height(25).Width(80).Background("#1e293b").Border(1).BorderColor("#334155").AlignCenter().AlignMiddle().Text("No signature").FontSize(5).FontColor("#94a3b8");
                                    sig.Item().PaddingTop(2).BorderTop(1).BorderColor("#334155").Text(cal.TeacherName ?? "Facilitator").FontSize(6).FontColor(QuestPDF.Helpers.Colors.White);
                                });
                            });
                        });

                        row.ConstantItem(6);

                        // Right info panel
                        row.RelativeItem(30).Column(rc =>
                        {
                            // Photo + name header
                            rc.Item().Background("#1e3a8a").Padding(5).Column(header =>
                            {
                                var photoBytes = MakeCircularPhoto(cal.ProfilePhotoPath);
                                if (photoBytes != null)
                                    header.Item().AlignCenter().Width(50).Height(50).Image(photoBytes).FitArea();
                                header.Item().AlignCenter().PaddingTop(3).Text($"{cal.FirstName} {cal.LastName}").FontSize(10).Bold().FontColor(QuestPDF.Helpers.Colors.White);
                            });

                            void Sec(string t) { rc.Item().PaddingTop(3).Text(t).FontSize(7).Bold().FontColor("#3b82f6"); }
                            void InfoRow(string l, string? v) { rc.Item().PaddingBottom(1).Row(r2 => { r2.ConstantItem(52).Text(l).FontSize(6).FontColor("#94a3b8"); r2.RelativeItem().Text(v ?? "N/A").FontSize(6).FontColor(QuestPDF.Helpers.Colors.White); }); }
                            Sec("PROJECT DETAILS"); InfoRow("Pathway:", cal.Pathway); InfoRow("Province:", cal.Province); InfoRow("Project:", cal.ProjectName); InfoRow("Site:", cal.SiteName);
                            Sec("CLASS & FACILITATOR"); InfoRow("Class:", cal.ClassName); InfoRow("Facilitator:", cal.TeacherName); InfoRow("Email:", cal.TeacherEmail);
                            Sec("LEARNER"); InfoRow("ID:", cal.IdNumber); InfoRow("Gender:", cal.Gender); InfoRow("Phone:", cal.Telephone); InfoRow("Address:", cal.Address);
                            Sec("STATISTICS");
                            rc.Item().PaddingTop(2).Column(sc =>
                            {
                                void StatPair(string l1, string v1, string c1, string l2, string v2, string c2)
                                {
                                    sc.Item().PaddingBottom(1).Row(r2 =>
                                    {
                                        r2.RelativeItem().Border(1).BorderColor("#334155").Background("#1e293b").Padding(3).Row(inner => { inner.ConstantItem(3).Background(c1); inner.RelativeItem().PaddingLeft(4).AlignCenter().Column(cc => { cc.Item().Text(v1).FontSize(9).Bold().FontColor(QuestPDF.Helpers.Colors.White); cc.Item().Text(l1).FontSize(5).FontColor("#94a3b8"); }); });
                                        r2.RelativeItem().Border(1).BorderColor("#334155").Background("#1e293b").Padding(3).Row(inner => { inner.ConstantItem(3).Background(c2); inner.RelativeItem().PaddingLeft(4).AlignCenter().Column(cc => { cc.Item().Text(v2).FontSize(9).Bold().FontColor(QuestPDF.Helpers.Colors.White); cc.Item().Text(l2).FontSize(5).FontColor("#94a3b8"); }); });
                                    });
                                }
                                StatPair("Expected", cal.ExpectedAttendance.ToString(), "#06b6d4", "Actual", cal.ActualAttendance.ToString(), "#10b981");
                                StatPair("Absent", cal.DaysAbsent.ToString(), "#ef4444", "Rate", $"{cal.AttendanceRate:F1}%", "#3b82f6");
                            });
                        });
                    });
                    page.Footer().BorderTop(1).BorderColor("#334155").PaddingTop(3).Row(f =>
                    {
                        f.RelativeItem().AlignCenter().Text("NBSN Project · Attendance Management").FontSize(6).FontColor("#3b82f6");
                        f.RelativeItem().AlignRight().Text($"Generated: {DateTime.Now:yyyy-MM-dd}").FontSize(6).FontColor("#94a3b8");
                    });
                });
            });
            return document.GeneratePdf();
        }

        // GET: api/ExternalUsers/project/{projectId}/summary-report
        // Generates a full project PDF summary: learner list, demographics, attendance stats
        [HttpGet("project/{projectId}/summary-report")]
        public async Task<IActionResult> GetProjectSummaryReport(int projectId,
            [FromQuery] int? year, [FromQuery] int? month)
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int userId)) return Unauthorized();

            // Verify access
            var access = await _context.ExternalUserAccess
                .FirstOrDefaultAsync(a => a.UserId == userId && a.ProjectId == projectId);
            if (access == null) return Forbid();

            // Load project with all sites and learners
            var project = await _context.Projects
                .Include(p => p.ProjectLearningPathways).ThenInclude(plp => plp.LearningPathway)
                .FirstOrDefaultAsync(p => p.Id == projectId);
            if (project == null) return NotFound();

            var sites = await _context.ProjectSites
                .Include(ps => ps.SiteClasses!).ThenInclude(sc => sc.ClassEnrollments)
                .Where(ps => ps.ProjectId == projectId)
                .ToListAsync();

            var learners = await _context.Learners
                .Include(l => l.ClassEnrollments!).ThenInclude(ce => ce.SiteClass!).ThenInclude(sc => sc.ProjectSite)
                .Include(l => l.LearnerDocuments)
                .Where(l => l.ClassEnrollments!.Any(ce => ce.SiteClass!.ProjectSite!.ProjectId == projectId))
                .ToListAsync();

            var today = DateTime.Today;
            int reportYear = year ?? today.Year;
            int reportMonth = month ?? today.Month;

            // Demographics
            int male = learners.Count(l => (l.Gender ?? "").ToLower().Contains("male") && !(l.Gender ?? "").ToLower().Contains("female"));
            int female = learners.Count(l => (l.Gender ?? "").ToLower().Contains("female"));

            // Attendance summary for the month
            var startDate = new DateTime(reportYear, reportMonth, 1);
            var endDate = startDate.AddMonths(1).AddDays(-1);
            var allAttendance = await _context.LearnerAttendances
                .Where(la => learners.Select(l => l.Id).Contains(la.LearnerId) &&
                             la.AttendanceDate >= startDate && la.AttendanceDate <= endDate)
                .ToListAsync();

            int workingDays = 0;
            for (var d = startDate; d <= (endDate < today ? endDate : today); d = d.AddDays(1))
                if (d.DayOfWeek != DayOfWeek.Saturday && d.DayOfWeek != DayOfWeek.Sunday) workingDays++;

            int presentCount = allAttendance.Count(a => a.Status == "Present");
            int possibleAttendances = learners.Count * workingDays;
            double overallRate = possibleAttendances > 0 ? Math.Round((double)presentCount / possibleAttendances * 100, 1) : 0;

            // Build the PDF
            var monthName = new DateTime(reportYear, reportMonth, 1).ToString("MMMM yyyy");
            var pathway = project.ProjectLearningPathways?.FirstOrDefault()?.LearningPathway?.Name ?? "N/A";

            var document = QuestPDF.Fluent.Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(QuestPDF.Helpers.PageSizes.A4);
                    page.Margin(20);
                    page.PageColor("#0f172a");

                    // Header
                    page.Header().Background("#1e3a8a").Padding(14).Row(h =>
                    {
                        h.RelativeItem().Column(c =>
                        {
                            c.Item().Text("Project Summary Report").FontSize(18).Bold().FontColor(QuestPDF.Helpers.Colors.White);
                            c.Item().Text(project.ProjectName).FontSize(11).FontColor("#93c5fd");
                            c.Item().Text($"Attendance Period: {monthName}").FontSize(9).FontColor(QuestPDF.Helpers.Colors.White);
                        });
                        h.ConstantItem(8);
                        h.AutoItem().AlignRight().Column(c =>
                        {
                            c.Item().AlignRight().Text("NBSN Project").FontSize(13).Bold().FontColor(QuestPDF.Helpers.Colors.White);
                            c.Item().AlignRight().Text($"Generated: {DateTime.Now:yyyy-MM-dd}").FontSize(8).FontColor("#94a3b8");
                        });
                    });

                    page.Content().PaddingTop(12).Column(body =>
                    {
                        // ─ Project Info ─
                        body.Item().Background("#1e293b").Padding(10).Column(info =>
                        {
                            info.Item().Text("PROJECT INFORMATION").FontSize(9).Bold().FontColor("#3b82f6");
                            info.Item().PaddingTop(6).Row(r =>
                            {
                                void InfoItem(string l, string v) { r.RelativeItem().Column(c => { c.Item().Text(l).FontSize(7).FontColor("#94a3b8"); c.Item().Text(v).FontSize(9).Bold().FontColor(QuestPDF.Helpers.Colors.White); }); }
                                InfoItem("Province", project.Province ?? "N/A");
                                InfoItem("Pathway", pathway);
                                InfoItem("Funder", project.ProjectFunder);
                                InfoItem("Partner", project.LeadEmployerPartner);
                                InfoItem("Start", project.StartDate.ToString("dd MMM yyyy"));
                                InfoItem("End", project.EndDate.ToString("dd MMM yyyy"));
                            });
                        });

                        body.Item().PaddingTop(8);

                        // ─ Key Metrics ─
                        body.Item().Row(r =>
                        {
                            void Metric(string label, string value, string color)
                            {
                                r.RelativeItem().Background("#1e293b").BorderLeft(4).BorderColor(color).Padding(10).Column(c =>
                                {
                                    c.Item().Text(value).FontSize(20).Bold().FontColor(color);
                                    c.Item().Text(label).FontSize(8).FontColor("#94a3b8");
                                });
                            }
                            Metric("Total Learners", learners.Count.ToString(), "#3b82f6");
                            r.ConstantItem(6);
                            Metric("Male", male.ToString(), "#06b6d4");
                            r.ConstantItem(6);
                            Metric("Female", female.ToString(), "#ec4899");
                            r.ConstantItem(6);
                            Metric("Present (Month)", presentCount.ToString(), "#10b981");
                            r.ConstantItem(6);
                            Metric("Attendance Rate", $"{overallRate}%", overallRate >= 80 ? "#10b981" : overallRate >= 60 ? "#f59e0b" : "#ef4444");
                            r.ConstantItem(6);
                            Metric("Sites", sites.Count.ToString(), "#8b5cf6");
                        });

                        body.Item().PaddingTop(8);

                        // ─ Sites Summary ─
                        body.Item().Text("SITES SUMMARY").FontSize(9).Bold().FontColor("#3b82f6");
                        body.Item().PaddingTop(4).Table(table =>
                        {
                            table.ColumnsDefinition(c => { c.RelativeColumn(3); c.RelativeColumn(2); c.RelativeColumn(1); c.RelativeColumn(1); c.RelativeColumn(1); });
                            // Header
                            foreach (var h in new[] { "Site Name", "City / Province", "Learners", "Present", "Rate" })
                                table.Cell().Background("#1e3a8a").Padding(6).Text(h).FontSize(8).Bold().FontColor(QuestPDF.Helpers.Colors.White);
                            // Rows
                            bool alt = false;
                            foreach (var site in sites)
                            {
                                var siteLearnerIds = site.SiteClasses!
                                    .SelectMany(sc => sc.ClassEnrollments)
                                    .Select(ce => ce.LearnerId).Distinct().ToList();
                                int sitePresent = allAttendance.Count(a => siteLearnerIds.Contains(a.LearnerId) && a.Status == "Present");
                                int sitePossible = siteLearnerIds.Count * workingDays;
                                double siteRate = sitePossible > 0 ? Math.Round((double)sitePresent / sitePossible * 100, 1) : 0;
                                var rowBg = alt ? "#1e293b" : "#0f172a";
                                alt = !alt;
                                foreach (var (val, align) in new[] { (site.SiteName, "left"), ($"{site.City ?? ""} / {site.Province ?? ""}", "left"), (siteLearnerIds.Count.ToString(), "center"), (sitePresent.ToString(), "center"), ($"{siteRate}%", "center") })
                                    table.Cell().Background(rowBg).Padding(5).Text(val).FontSize(8).FontColor(QuestPDF.Helpers.Colors.White).WrapAnywhere();
                            }
                        });

                        body.Item().PaddingTop(8);

                        // ─ Learner Attendance Summary ─
                        body.Item().Text($"LEARNER ATTENDANCE – {monthName.ToUpper()}").FontSize(9).Bold().FontColor("#3b82f6");
                        body.Item().PaddingTop(4).Table(table =>
                        {
                            table.ColumnsDefinition(c => { c.RelativeColumn(3); c.RelativeColumn(2); c.RelativeColumn(2); c.RelativeColumn(1); c.RelativeColumn(1); c.RelativeColumn(1); c.RelativeColumn(1); });
                            foreach (var h in new[] { "Learner", "ID Number", "Site", "Expected", "Present", "Absent", "Rate" })
                                table.Cell().Background("#1e3a8a").Padding(5).Text(h).FontSize(7).Bold().FontColor(QuestPDF.Helpers.Colors.White);
                            bool alt2 = false;
                            foreach (var learner in learners.OrderBy(l => l.LastName))
                            {
                                var siteName = learner.ClassEnrollments?.FirstOrDefault(ce => ce.SiteClass?.ProjectSite?.ProjectId == projectId)?.SiteClass?.ProjectSite?.SiteName ?? "—";
                                var lAtt = allAttendance.Where(a => a.LearnerId == learner.Id).ToList();
                                int lPresent = lAtt.Count(a => a.Status == "Present");
                                int lAbsent = workingDays - lPresent - lAtt.Count(a => a.Status == "Late");
                                if (lAbsent < 0) lAbsent = 0;
                                double lRate = workingDays > 0 ? Math.Round((double)lPresent / workingDays * 100, 1) : 0;
                                var rateColor = lRate >= 80 ? "#10b981" : lRate >= 60 ? "#f59e0b" : "#ef4444";
                                var rowBg = alt2 ? "#1e293b" : "#0f172a";
                                alt2 = !alt2;
                                table.Cell().Background(rowBg).Padding(4).Text($"{learner.FirstName} {learner.LastName}").FontSize(7).FontColor(QuestPDF.Helpers.Colors.White);
                                table.Cell().Background(rowBg).Padding(4).Text(learner.IdNumber).FontSize(7).FontColor("#94a3b8");
                                table.Cell().Background(rowBg).Padding(4).Text(siteName).FontSize(7).FontColor("#94a3b8");
                                table.Cell().Background(rowBg).Padding(4).AlignCenter().Text(workingDays.ToString()).FontSize(7).FontColor(QuestPDF.Helpers.Colors.White);
                                table.Cell().Background(rowBg).Padding(4).AlignCenter().Text(lPresent.ToString()).FontSize(7).FontColor("#10b981");
                                table.Cell().Background(rowBg).Padding(4).AlignCenter().Text(lAbsent.ToString()).FontSize(7).FontColor("#ef4444");
                                table.Cell().Background(rowBg).Padding(4).AlignCenter().Text($"{lRate}%").FontSize(7).FontColor(rateColor);
                            }
                        });
                    });

                    page.Footer().BorderTop(1).BorderColor("#334155").PaddingTop(4).Row(f =>
                    {
                        f.RelativeItem().AlignLeft().Text($"Project: {project.ProjectName}").FontSize(7).FontColor("#94a3b8");
                        f.RelativeItem().AlignCenter().Text("NBSN Project · Attendance Management").FontSize(7).FontColor("#3b82f6");
                        f.RelativeItem().AlignRight().Text($"Page 1  |  Generated: {DateTime.Now:yyyy-MM-dd HH:mm}").FontSize(7).FontColor("#94a3b8");
                    });
                });
            });

            var pdfBytes = document.GeneratePdf();
            var fileName = $"Project_Summary_{project.ProjectName.Replace(" ", "_")}_{monthName.Replace(" ", "_")}.pdf";
            return File(pdfBytes, "application/pdf", fileName);
        }

        private static string GenerateTempPassword()
        {
            const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$";
            var random = new Random();
            return new string(Enumerable.Repeat(chars, 10).Select(s => s[random.Next(s.Length)]).ToArray());
        }
    }

    // ── DTOs ──────────────────────────────────────────────────────────────────

    public class CreateExternalUserDto
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public string? OrganizationName { get; set; }
        public List<ExternalAccessDto> ProjectAccess { get; set; } = new();
    }

    public class UpdateExternalUserDto
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public string? OrganizationName { get; set; }
        public UserStatus Status { get; set; }
        public List<ExternalAccessDto> ProjectAccess { get; set; } = new();
    }

    public class ExternalAccessDto
    {
        public int ProjectId { get; set; }
        public List<string> AllowedDocumentTypes { get; set; } = new();
    }

    public class BulkDownloadRequestDto
    {
        public int ProjectId { get; set; }
        public List<int> LearnerIds { get; set; } = new();
        public List<string>? DocumentTypes { get; set; }
        // Single month (legacy)
        public int? AttendanceYear { get; set; }
        public int? AttendanceMonth { get; set; }
        // Date range for multiple months
        public int? AttendanceFromYear { get; set; }
        public int? AttendanceFromMonth { get; set; }
        public int? AttendanceToYear { get; set; }
        public int? AttendanceToMonth { get; set; }
    }
}
