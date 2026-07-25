using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using backend.Models.DTOs;
using backend.Services.Interfaces;
using System.Security.Claims;
using System.Text;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LearnersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _environment;
        private readonly IPasswordHashingService _passwordHashingService;
        private readonly IEmailService _emailService;
        private readonly IWhatsAppService _whatsApp;
        private readonly IConfiguration _configuration;
        private readonly ILogger<LearnersController> _logger;

        public LearnersController(
            ApplicationDbContext context,
            IWebHostEnvironment environment,
            IPasswordHashingService passwordHashingService,
            IEmailService emailService,
            IWhatsAppService whatsApp,
            IConfiguration configuration,
            ILogger<LearnersController> logger)
        {
            _context = context;
            _environment = environment;
            _passwordHashingService = passwordHashingService;
            _emailService = emailService;
            _whatsApp = whatsApp;
            _configuration = configuration;
            _logger = logger;
        }

        /// <summary>
        /// Generates a unique username in the format firstname.lastname (with suffix if taken)
        /// </summary>
        private async Task<string> GenerateUniqueUsernameAsync(string firstName, string lastName)
        {
            Func<string, string> clean = s => System.Text.RegularExpressions.Regex.Replace(s.ToLower().Trim(), @"[^a-z0-9]", "");
            var baseUsername = $"{clean(firstName)}.{clean(lastName)}";
            var username = baseUsername;
            int suffix = 1;
            while (await _context.Learners.AnyAsync(l => l.Username == username))
            {
                username = $"{baseUsername}{suffix++}";
            }
            return username;
        }

        /// <summary>
        /// Generates a secure random password (10 chars: letters + digits + symbol)
        /// </summary>
        private static string GenerateRandomPassword()
        {
            const string upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
            const string lower = "abcdefghjkmnpqrstuvwxyz";
            const string digits = "23456789";
            const string symbols = "@#!$";
            var rng = new Random();
            var chars = new char[10];
            chars[0] = upper[rng.Next(upper.Length)];
            chars[1] = upper[rng.Next(upper.Length)];
            chars[2] = lower[rng.Next(lower.Length)];
            chars[3] = lower[rng.Next(lower.Length)];
            chars[4] = digits[rng.Next(digits.Length)];
            chars[5] = digits[rng.Next(digits.Length)];
            chars[6] = symbols[rng.Next(symbols.Length)];
            for (int i = 7; i < 10; i++)
            {
                var all = upper + lower + digits;
                chars[i] = all[rng.Next(all.Length)];
            }
            return new string(chars.OrderBy(_ => rng.Next()).ToArray());
        }
        // GET: api/Learners/class/{classId}
        // Get all learners enrolled in a specific class
        [HttpGet("class/{classId}")]
                public async Task<ActionResult<IEnumerable<LearnerResponseDto>>> GetClassLearners(int classId)
                {
                    var enrollments = await _context.ClassEnrollments
                        .Include(e => e.Learner)
                        .Include(e => e.SiteClass)
                            .ThenInclude(c => c!.ProjectSite)
                        .Include(e => e.CreatedByUser)
                        .Where(e => e.SiteClassId == classId)
                        .OrderBy(e => e.Learner!.LastName)
                        .ThenBy(e => e.Learner!.FirstName)
                        .Select(e => new LearnerResponseDto
                {
                    Id = e.Learner!.Id,
                    EnrollmentId = e.Id,
                    SiteClassId = e.SiteClassId,
                    ClassName = e.SiteClass != null ? e.SiteClass.ClassName : "",
                    SiteName = e.SiteClass != null && e.SiteClass.ProjectSite != null ? e.SiteClass.ProjectSite.SiteName : "",
                    Title = e.Learner.Title,
                    FirstName = e.Learner.FirstName,
                    LastName = e.Learner.LastName,
                    IdNumber = e.Learner.IdNumber,
                    ContactNumber = e.Learner.ContactNumber,
                    Email = e.Learner.Email,
                    DateOfBirth = e.Learner.DateOfBirth,
                    Age = e.Learner.Age,
                    Gender = e.Learner.Gender,
                    Race = e.Learner.Race,
                    HomeLanguage = e.Learner.HomeLanguage,
                    Disability = e.Learner.Disability,
                    AddressLine1 = e.Learner.AddressLine1,
                    AddressLine2 = e.Learner.AddressLine2,
                    AddressLine3 = e.Learner.AddressLine3,
                    PostalCode = e.Learner.PostalCode,
                    HighSchoolName = e.Learner.HighSchoolName,
                    YearOfCompletion = e.Learner.YearOfCompletion,
                    SchoolLocation = e.Learner.SchoolLocation,
                    HighestGradePassed = e.Learner.HighestGradePassed,
                    NextOfKinName = e.Learner.NextOfKinName,
                    NextOfKinRelation = e.Learner.NextOfKinRelation,
                    NextOfKinContactNumber = e.Learner.NextOfKinContactNumber,
                    BankName = e.Learner.BankName,
                    AccountType = e.Learner.AccountType,
                    AccountNumber = e.Learner.AccountNumber,
                    BranchCode = e.Learner.BranchCode,
                    ProfilePhotoPath = e.Learner.ProfilePhotoPath,
                    Status = e.Status,
                    EnrollmentDate = e.EnrollmentDate,
                    CompletionDate = e.CompletionDate,
                    LeftThumbTemplate = e.Learner.LeftThumbTemplate,
                    RightThumbTemplate = e.Learner.RightThumbTemplate,
                    LeftThumbTemplateZk = e.Learner.LeftThumbTemplateZk,
                    RightThumbTemplateZk = e.Learner.RightThumbTemplateZk,
                    SignaturePath = e.Learner.SignaturePath,
                    CreatedAt = e.Learner.CreatedAt,
                    UpdatedAt = e.Learner.UpdatedAt,
                    CreatedByUserName = e.CreatedByUser != null ? (e.CreatedByUser.FirstName + " " + e.CreatedByUser.LastName) : null
                })
                        .ToListAsync();

                    return Ok(enrollments);
                }


        // GET: api/Learners/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<Learner>> GetLearner(int id)
        {
            var learner = await _context.Learners
                .Include(l => l.CreatedByUser)
                .Include(l => l.ClassEnrollments)
                    .ThenInclude(e => e.SiteClass)
                .FirstOrDefaultAsync(l => l.Id == id);

            if (learner == null)
            {
                return NotFound();
            }

            return Ok(learner);
        }

        // GET: api/Learners/project/{projectId}
        // Get distinct learners enrolled in classes under a project
        [HttpGet("project/{projectId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetProjectLearners(int projectId)
        {
            // 1) Learners enrolled via Site/Class structure
            var enrolledLearnersRaw = await _context.ClassEnrollments
                .AsNoTracking()
                .Include(e => e.Learner)
                .Include(e => e.SiteClass)
                    .ThenInclude(c => c!.ProjectSite)
                .Where(e => e.SiteClass != null &&
                            e.SiteClass.ProjectSite != null &&
                            e.SiteClass.ProjectSite.ProjectId == projectId)
                .Select(e => new
                {
                    learnerId = e.LearnerId,
                    firstName = e.Learner != null ? e.Learner.FirstName : "",
                    lastName = e.Learner != null ? e.Learner.LastName : "",
                    idNumber = e.Learner != null ? e.Learner.IdNumber : "",
                    className = e.SiteClass != null ? e.SiteClass.ClassName : ""
                })
                .ToListAsync();

            var enrolledLearners = enrolledLearnersRaw
                .GroupBy(l => l.learnerId)
                .Select(g => new
                {
                    learnerId = g.Key,
                    firstName = g.First().firstName,
                    lastName = g.First().lastName,
                    idNumber = g.First().idNumber,
                    classCount = g.Select(x => x.className).Distinct().Count()
                })
                .ToList();

            // 2) Learners who have uploaded assessment answers for this project's unit standards
            // Group and count uploads per learner so the UI can highlight them.
            var uploadCounts = await (
                from a in _context.LearnerAssessmentAnswers.AsNoTracking()
                join l in _context.Learners.AsNoTracking() on a.LearnerId equals l.Id
                join fa in _context.FormativeAssessments.AsNoTracking() on a.AssessmentId equals fa.Id into faJoin
                from fa in faJoin.DefaultIfEmpty()
                join sa in _context.SummativeAssessments.AsNoTracking() on a.AssessmentId equals sa.Id into saJoin
                from sa in saJoin.DefaultIfEmpty()
                join pqus in _context.ProjectQualificationUnitStandards.AsNoTracking()
                    on (fa != null ? fa.ProjectQualificationUnitStandardId : sa!.ProjectQualificationUnitStandardId) equals pqus.Id
                join pq in _context.ProjectQualifications.AsNoTracking() on pqus.ProjectQualificationId equals pq.Id
                join plp in _context.ProjectLearningPathways.AsNoTracking() on pq.ProjectLearningPathwayId equals plp.Id
                where a.AssessmentType != null &&
                      (a.AssessmentType.ToLower() == "formative" || a.AssessmentType.ToLower() == "summative") &&
                      plp.ProjectId == projectId
                group a by new { l.Id, l.FirstName, l.LastName, l.IdNumber } into g
                select new
                {
                    learnerId = g.Key.Id,
                    firstName = g.Key.FirstName,
                    lastName = g.Key.LastName,
                    idNumber = g.Key.IdNumber,
                    uploadCount = g.Count()
                }
            ).ToListAsync();

            var allLearners = enrolledLearners
                .Select(x => new
                {
                    learnerId = x.learnerId,
                    firstName = x.firstName,
                    lastName = x.lastName,
                    idNumber = x.idNumber,
                    classCount = x.classCount,
                    uploadCount = 0
                })
                .Concat(uploadCounts.Select(x => new
                {
                    learnerId = x.learnerId,
                    firstName = x.firstName,
                    lastName = x.lastName,
                    idNumber = x.idNumber,
                    classCount = 0,
                    uploadCount = x.uploadCount
                }))
                .GroupBy(x => x.learnerId)
                .Select(g => new
                {
                    learnerId = g.Key,
                    firstName = g.First().firstName,
                    lastName = g.First().lastName,
                    idNumber = g.First().idNumber,
                    classCount = g.Max(x => x.classCount),
                    uploadCount = g.Max(x => x.uploadCount),
                    hasUploads = g.Max(x => x.uploadCount) > 0
                })
                .OrderByDescending(x => x.hasUploads)
                .ThenByDescending(x => x.uploadCount)
                .ThenBy(x => x.lastName)
                .ThenBy(x => x.firstName)
                .ToList();

            return Ok(allLearners);
        }

        // POST: api/Learners
        // Create a new learner and enroll them in a class
        [HttpPost]
        public async Task<ActionResult<LearnerResponseDto>> CreateLearner(CreateLearnerDto dto)
        {
            // Get user ID from claims
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            int? userId = null;
            if (int.TryParse(userIdClaim, out int parsedUserId))
            {
                userId = parsedUserId;
            }

            // Check if learner with this ID number already exists
            var existingLearner = await _context.Learners
                .FirstOrDefaultAsync(l => l.IdNumber == dto.IdNumber.Trim());

            Learner learner;
            
            if (existingLearner != null)
            {
                // Learner exists, just enroll them in the new class
                learner = existingLearner;
                
                // Check if already enrolled in this class
                var existingEnrollment = await _context.ClassEnrollments
                    .FirstOrDefaultAsync(e => e.LearnerId == learner.Id && e.SiteClassId == dto.SiteClassId);
                
                if (existingEnrollment != null)
                {
                    return BadRequest(new { message = "Learner is already enrolled in this class" });
                }
            }
            else
            {
                // Create new learner
                // Convert DateOfBirth to UTC if provided
                DateTime? dateOfBirthUtc = null;
                if (dto.DateOfBirth.HasValue)
                {
                    var dob = dto.DateOfBirth.Value;
                    dateOfBirthUtc = dob.Kind == DateTimeKind.Unspecified 
                        ? DateTime.SpecifyKind(dob, DateTimeKind.Utc)
                        : dob.ToUniversalTime();
                }

                learner = new Learner
                {
                    Title = dto.Title.Trim(),
                    FirstName = dto.FirstName.Trim(),
                    LastName = dto.LastName.Trim(),
                    IdNumber = dto.IdNumber.Trim(),
                    ContactNumber = dto.ContactNumber?.Trim(),
                    Email = dto.Email?.Trim(),
                    DateOfBirth = dateOfBirthUtc,
                    Age = dto.Age,
                    Gender = dto.Gender,
                    Race = dto.Race,
                    HomeLanguage = dto.HomeLanguage,
                    Disability = dto.Disability,
                    AddressLine1 = dto.AddressLine1?.Trim(),
                    AddressLine2 = dto.AddressLine2?.Trim(),
                    AddressLine3 = dto.AddressLine3?.Trim(),
                    PostalCode = dto.PostalCode?.Trim(),
                    HighSchoolName = dto.HighSchoolName?.Trim(),
                    YearOfCompletion = dto.YearOfCompletion,
                    SchoolLocation = dto.SchoolLocation?.Trim(),
                    HighestGradePassed = dto.HighestGradePassed,
                    NextOfKinName = dto.NextOfKinName?.Trim(),
                    NextOfKinRelation = dto.NextOfKinRelation,
                    NextOfKinContactNumber = dto.NextOfKinContactNumber?.Trim(),
                    BankName = dto.BankName,
                    AccountType = dto.AccountType,
                    AccountNumber = dto.AccountNumber?.Trim(),
                    BranchCode = dto.BranchCode?.Trim(),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    CreatedByUserId = userId
                };

                _context.Learners.Add(learner);
                await _context.SaveChangesAsync();

                // Generate credentials and send welcome notifications
                // Trigger if learner has an email OR a phone number
                if (!string.IsNullOrWhiteSpace(learner.Email) || !string.IsNullOrWhiteSpace(learner.ContactNumber))
                {
                    try
                    {
                        var username = await GenerateUniqueUsernameAsync(learner.FirstName, learner.LastName);
                        var plainPassword = GenerateRandomPassword();
                        var passwordHash = _passwordHashingService.HashPassword(plainPassword);

                        learner.Username = username;
                        learner.PasswordHash = passwordHash;
                        learner.MustChangePassword = true;
                        await _context.SaveChangesAsync();

                        var portalUrl = Environment.GetEnvironmentVariable("LEARNER_PORTAL_URL")
                            ?? _configuration["LearnerPortal:Url"]
                            ?? "http://localhost:5174/learner";

                        var learnerFullName = $"{learner.FirstName} {learner.LastName}";

                        // Send welcome email if email exists
                        if (!string.IsNullOrWhiteSpace(learner.Email))
                        {
                            var emailSent = await _emailService.SendLearnerWelcomeEmailAsync(
                                learner.Email, learnerFullName, username, plainPassword, portalUrl);

                            if (emailSent)
                                _logger.LogInformation("Welcome email sent to learner {LearnerId} at {Email}", learner.Id, learner.Email);
                            else
                                _logger.LogWarning("Failed to send welcome email to learner {LearnerId} at {Email}", learner.Id, learner.Email);
                        }

                        // Send WhatsApp welcome if phone exists
                        if (!string.IsNullOrWhiteSpace(learner.ContactNumber))
                        {
                            _ = _whatsApp.SendLearnerWelcomeAsync(
                                learner.ContactNumber, learnerFullName, username, plainPassword, portalUrl);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Could not send welcome notifications to learner {LearnerId}: {Message}", learner.Id, ex.Message);
                    }
                }
            } // end else (new learner)

            // Create enrollment
            var enrollment = new ClassEnrollment
            {
                LearnerId = learner.Id,
                SiteClassId = dto.SiteClassId,
                EnrollmentDate = DateTime.UtcNow,
                Status = "Active",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedByUserId = userId
            };

            _context.ClassEnrollments.Add(enrollment);
            await _context.SaveChangesAsync();

            // Reload with navigation properties
            var createdEnrollment = await _context.ClassEnrollments
                .Include(e => e.Learner)
                .Include(e => e.SiteClass)
                    .ThenInclude(c => c!.ProjectSite)
                .Include(e => e.CreatedByUser)
                .Where(e => e.Id == enrollment.Id)
                .Select(e => new LearnerResponseDto
                {
                    Id = e.Learner!.Id,
                    EnrollmentId = e.Id,
                    SiteClassId = e.SiteClassId,
                    ClassName = e.SiteClass != null ? e.SiteClass.ClassName : "",
                    SiteName = e.SiteClass != null && e.SiteClass.ProjectSite != null ? e.SiteClass.ProjectSite.SiteName : "",
                    Title = e.Learner.Title,
                    FirstName = e.Learner.FirstName,
                    LastName = e.Learner.LastName,
                    IdNumber = e.Learner.IdNumber,
                    ContactNumber = e.Learner.ContactNumber,
                    Email = e.Learner.Email,
                    DateOfBirth = e.Learner.DateOfBirth,
                    Age = e.Learner.Age,
                    Gender = e.Learner.Gender,
                    Race = e.Learner.Race,
                    HomeLanguage = e.Learner.HomeLanguage,
                    Disability = e.Learner.Disability,
                    AddressLine1 = e.Learner.AddressLine1,
                    AddressLine2 = e.Learner.AddressLine2,
                    AddressLine3 = e.Learner.AddressLine3,
                    PostalCode = e.Learner.PostalCode,
                    HighSchoolName = e.Learner.HighSchoolName,
                    YearOfCompletion = e.Learner.YearOfCompletion,
                    SchoolLocation = e.Learner.SchoolLocation,
                    HighestGradePassed = e.Learner.HighestGradePassed,
                    NextOfKinName = e.Learner.NextOfKinName,
                    NextOfKinRelation = e.Learner.NextOfKinRelation,
                    NextOfKinContactNumber = e.Learner.NextOfKinContactNumber,
                    BankName = e.Learner.BankName,
                    AccountType = e.Learner.AccountType,
                    AccountNumber = e.Learner.AccountNumber,
                    BranchCode = e.Learner.BranchCode,
                    Status = e.Status,
                    EnrollmentDate = e.EnrollmentDate,
                    CompletionDate = e.CompletionDate,
                    SignaturePath = e.Learner.SignaturePath,
                    CreatedAt = e.Learner.CreatedAt,
                    UpdatedAt = e.Learner.UpdatedAt,
                    CreatedByUserName = e.CreatedByUser != null ? (e.CreatedByUser.FirstName + " " + e.CreatedByUser.LastName) : null
                })
                .FirstOrDefaultAsync();

            return CreatedAtAction(nameof(GetLearner), new { id = learner.Id }, createdEnrollment);
        }

        // PUT: api/Learners/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateLearner(int id, UpdateLearnerDto dto)
        {
            var learner = await _context.Learners.FindAsync(id);
            if (learner == null)
            {
                return NotFound();
            }

            // Convert DateOfBirth to UTC if provided
            DateTime? dateOfBirthUtc = null;
            if (dto.DateOfBirth.HasValue)
            {
                var dob = dto.DateOfBirth.Value;
                dateOfBirthUtc = dob.Kind == DateTimeKind.Unspecified 
                    ? DateTime.SpecifyKind(dob, DateTimeKind.Utc)
                    : dob.ToUniversalTime();
            }

            learner.Title = dto.Title.Trim();
            learner.FirstName = dto.FirstName.Trim();
            learner.LastName = dto.LastName.Trim();
            learner.IdNumber = dto.IdNumber.Trim();
            learner.ContactNumber = dto.ContactNumber?.Trim();
            learner.Email = dto.Email?.Trim();
            learner.DateOfBirth = dateOfBirthUtc;
            learner.Age = dto.Age;
            learner.Gender = dto.Gender;
            learner.Race = dto.Race;
            learner.HomeLanguage = dto.HomeLanguage;
            learner.Disability = dto.Disability;
            learner.AddressLine1 = dto.AddressLine1?.Trim();
            learner.AddressLine2 = dto.AddressLine2?.Trim();
            learner.AddressLine3 = dto.AddressLine3?.Trim();
            learner.PostalCode = dto.PostalCode?.Trim();
            learner.HighSchoolName = dto.HighSchoolName?.Trim();
            learner.YearOfCompletion = dto.YearOfCompletion;
            learner.SchoolLocation = dto.SchoolLocation?.Trim();
            learner.HighestGradePassed = dto.HighestGradePassed;
            learner.NextOfKinName = dto.NextOfKinName?.Trim();
            learner.NextOfKinRelation = dto.NextOfKinRelation;
            learner.NextOfKinContactNumber = dto.NextOfKinContactNumber?.Trim();
            learner.BankName = dto.BankName;
            learner.AccountType = dto.AccountType;
            learner.AccountNumber = dto.AccountNumber?.Trim();
            learner.BranchCode = dto.BranchCode?.Trim();
            learner.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/Learners/{enrollmentId}
        // Remove a learner from a class (delete enrollment, not the learner)
        [HttpDelete("{enrollmentId}")]
        public async Task<IActionResult> DeleteEnrollment(int enrollmentId)
        {
            var enrollment = await _context.ClassEnrollments.FindAsync(enrollmentId);
            if (enrollment == null)
            {
                return NotFound();
            }

            _context.ClassEnrollments.Remove(enrollment);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // POST: api/Learners/enroll
        // Enroll an existing learner in a new class
        [HttpPost("enroll")]
        public async Task<ActionResult<LearnerResponseDto>> EnrollLearner(EnrollLearnerDto dto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            int? userId = null;
            if (int.TryParse(userIdClaim, out int parsedUserId))
            {
                userId = parsedUserId;
            }

            // Check if learner exists
            var learner = await _context.Learners.FindAsync(dto.LearnerId);
            if (learner == null)
            {
                return NotFound(new { message = "Learner not found" });
            }

            // Check if already enrolled
            var existingEnrollment = await _context.ClassEnrollments
                .FirstOrDefaultAsync(e => e.LearnerId == dto.LearnerId && e.SiteClassId == dto.SiteClassId);
            
            if (existingEnrollment != null)
            {
                return BadRequest(new { message = "Learner is already enrolled in this class" });
            }

            // Create enrollment
            var enrollment = new ClassEnrollment
            {
                LearnerId = dto.LearnerId,
                SiteClassId = dto.SiteClassId,
                EnrollmentDate = DateTime.UtcNow,
                Status = "Active",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedByUserId = userId
            };

            _context.ClassEnrollments.Add(enrollment);
            await _context.SaveChangesAsync();

            // Return the enrollment details
            var result = await _context.ClassEnrollments
                .Include(e => e.Learner)
                .Include(e => e.SiteClass)
                    .ThenInclude(c => c!.ProjectSite)
                .Include(e => e.CreatedByUser)
                .Where(e => e.Id == enrollment.Id)
                .Select(e => new LearnerResponseDto
                {
                    Id = e.Learner!.Id,
                    EnrollmentId = e.Id,
                    SiteClassId = e.SiteClassId,
                    ClassName = e.SiteClass != null ? e.SiteClass.ClassName : "",
                    SiteName = e.SiteClass != null && e.SiteClass.ProjectSite != null ? e.SiteClass.ProjectSite.SiteName : "",
                    Title = e.Learner.Title,
                    FirstName = e.Learner.FirstName,
                    LastName = e.Learner.LastName,
                    IdNumber = e.Learner.IdNumber,
                    ContactNumber = e.Learner.ContactNumber,
                    Email = e.Learner.Email,
                    DateOfBirth = e.Learner.DateOfBirth,
                    Age = e.Learner.Age,
                    Gender = e.Learner.Gender,
                    Race = e.Learner.Race,
                    HomeLanguage = e.Learner.HomeLanguage,
                    Disability = e.Learner.Disability,
                    AddressLine1 = e.Learner.AddressLine1,
                    AddressLine2 = e.Learner.AddressLine2,
                    AddressLine3 = e.Learner.AddressLine3,
                    PostalCode = e.Learner.PostalCode,
                    HighSchoolName = e.Learner.HighSchoolName,
                    YearOfCompletion = e.Learner.YearOfCompletion,
                    SchoolLocation = e.Learner.SchoolLocation,
                    HighestGradePassed = e.Learner.HighestGradePassed,
                    NextOfKinName = e.Learner.NextOfKinName,
                    NextOfKinRelation = e.Learner.NextOfKinRelation,
                    NextOfKinContactNumber = e.Learner.NextOfKinContactNumber,
                    BankName = e.Learner.BankName,
                    AccountType = e.Learner.AccountType,
                    AccountNumber = e.Learner.AccountNumber,
                    BranchCode = e.Learner.BranchCode,
                    Status = e.Status,
                    EnrollmentDate = e.EnrollmentDate,
                    CompletionDate = e.CompletionDate,
                    CreatedAt = e.Learner.CreatedAt,
                    UpdatedAt = e.Learner.UpdatedAt,
                    CreatedByUserName = e.CreatedByUser != null ? (e.CreatedByUser.FirstName + " " + e.CreatedByUser.LastName) : null
                })
                .FirstOrDefaultAsync();

            return Ok(result);
        }

        // PUT: api/Learners/enrollment/{enrollmentId}/status
        // Update enrollment status (complete, withdraw, etc.)
        [HttpPut("enrollment/{enrollmentId}/status")]
        public async Task<IActionResult> UpdateEnrollmentStatus(int enrollmentId, UpdateEnrollmentStatusDto dto)
        {
            var enrollment = await _context.ClassEnrollments.FindAsync(enrollmentId);
            if (enrollment == null)
            {
                return NotFound();
            }

            enrollment.Status = dto.Status;
            enrollment.CompletionDate = dto.CompletionDate;
            enrollment.WithdrawalDate = dto.WithdrawalDate;
            enrollment.WithdrawalReason = dto.WithdrawalReason;
            enrollment.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // POST: api/Learners/{id}/signature
        [HttpPost("{id}/signature")]
        public async Task<IActionResult> UploadSignature(int id, IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("No file uploaded.");
            }

            var learner = await _context.Learners.FindAsync(id);
            if (learner == null)
            {
                return NotFound("Learner not found.");
            }

            try
            {
                // Create directory if it doesn't exist
                var uploadsDir = Path.Combine(_environment.ContentRootPath, "uploads", "signatures");
                if (!Directory.Exists(uploadsDir))
                {
                    Directory.CreateDirectory(uploadsDir);
                }

                // Delete old signature if it exists
                if (!string.IsNullOrEmpty(learner.SignaturePath))
                {
                    var oldPath = Path.Combine(_environment.ContentRootPath, learner.SignaturePath);
                    if (System.IO.File.Exists(oldPath))
                    {
                        System.IO.File.Delete(oldPath);
                    }
                }

                // Save new signature
                var fileName = $"signature_{id}_{DateTime.UtcNow.Ticks}.png";
                var filePath = Path.Combine(uploadsDir, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                learner.SignaturePath = Path.Combine("uploads", "signatures", fileName);
                learner.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new { signaturePath = learner.SignaturePath });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // GET: api/Learners/{id}/signature
        [HttpGet("{id}/signature")]
        public async Task<IActionResult> GetSignature(int id)
        {
            var learner = await _context.Learners.FindAsync(id);
            if (learner == null || string.IsNullOrEmpty(learner.SignaturePath))
            {
                return NotFound();
            }

            var filePath = Path.Combine(_environment.ContentRootPath, learner.SignaturePath);
            if (!System.IO.File.Exists(filePath))
            {
                return NotFound();
            }

            var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
            return File(fileBytes, "image/png");
        }

        // POST: api/Learners/{id}/profile-photo
        [HttpPost("{id}/profile-photo")]
        public async Task<IActionResult> UploadProfilePhoto(int id, [FromForm] IFormFile photo)
        {
            var learner = await _context.Learners.FindAsync(id);
            if (learner == null)
            {
                return NotFound(new { message = "Learner not found" });
            }

            if (photo == null || photo.Length == 0)
            {
                return BadRequest(new { message = "No photo uploaded" });
            }

            // Validate file type
            var allowedTypes = new[] { "image/jpeg", "image/jpg", "image/png" };
            if (!allowedTypes.Contains(photo.ContentType.ToLower()))
            {
                return BadRequest(new { message = "Invalid file type. Only JPEG and PNG are allowed" });
            }

            // Validate file size (max 5MB)
            if (photo.Length > 5 * 1024 * 1024)
            {
                return BadRequest(new { message = "File size exceeds 5MB limit" });
            }

            // Create uploads directory if it doesn't exist
            var uploadsDir = Path.Combine(_environment.ContentRootPath, "uploads", "profile-photos");
            Directory.CreateDirectory(uploadsDir);

            // Delete old photo if exists
            if (!string.IsNullOrEmpty(learner.ProfilePhotoPath))
            {
                var oldPhotoPath = Path.Combine(_environment.ContentRootPath, learner.ProfilePhotoPath);
                if (System.IO.File.Exists(oldPhotoPath))
                {
                    System.IO.File.Delete(oldPhotoPath);
                }
            }

            // Generate unique filename
            var extension = Path.GetExtension(photo.FileName);
            var fileName = $"learner_{id}_{DateTime.UtcNow.Ticks}{extension}";
            var filePath = Path.Combine(uploadsDir, fileName);

            // Save file
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await photo.CopyToAsync(stream);
            }

            // Update learner record
            learner.ProfilePhotoPath = Path.Combine("uploads", "profile-photos", fileName);
            learner.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { 
                message = "Profile photo uploaded successfully",
                photoPath = learner.ProfilePhotoPath
            });
        }

        // GET: api/Learners/{id}/profile-photo
        [HttpGet("{id}/profile-photo")]
        public async Task<IActionResult> GetProfilePhoto(int id)
        {
            var learner = await _context.Learners.FindAsync(id);
            if (learner == null)
            {
                return NotFound(new { message = "Learner not found" });
            }

            if (string.IsNullOrEmpty(learner.ProfilePhotoPath))
            {
                return NotFound(new { message = "No profile photo found" });
            }

            var filePath = Path.Combine(_environment.ContentRootPath, learner.ProfilePhotoPath.Replace('\\', Path.DirectorySeparatorChar).Replace('/', Path.DirectorySeparatorChar));

            if (!System.IO.File.Exists(filePath))
            {
                return NotFound(new { message = "Profile photo file not found" });
            }

            var extension = Path.GetExtension(filePath).ToLower();
            var contentType = extension switch
            {
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                _ => "application/octet-stream"
            };

            var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
            return File(fileBytes, contentType);
        }

        // POST: api/Learners/{id}/fingerprint
        [HttpPost("{id}/fingerprint")]
        public async Task<IActionResult> RegisterFingerprint(int id, [FromBody] RegisterFingerprintDto dto)
        {
            var learner = await _context.Learners.FindAsync(id);
            if (learner == null)
            {
                return NotFound(new { message = "Learner not found" });
            }

            // Validate fingerprint type
            if (dto.FingerprintType != "LeftThumb" && dto.FingerprintType != "RightThumb")
            {
                return BadRequest(new { message = "Invalid fingerprint type. Must be 'LeftThumb' or 'RightThumb'" });
            }

            // Validate scanner type
            if (dto.ScannerType != "Futronic" && dto.ScannerType != "ZKTECO")
            {
                return BadRequest(new { message = "Invalid scanner type. Must be 'Futronic' or 'ZKTECO'" });
            }

            // Validate template data
            if (string.IsNullOrEmpty(dto.TemplateData))
            {
                return BadRequest(new { message = "Template data is required" });
            }

            // Update learner record
            if (dto.ScannerType == "Futronic")
            {
                if (dto.FingerprintType == "LeftThumb")
                {
                    learner.LeftThumbTemplate = dto.TemplateData;
                }
                else
                {
                    learner.RightThumbTemplate = dto.TemplateData;
                }
            }
            else // ZKTECO
            {
                if (dto.FingerprintType == "LeftThumb")
                {
                    learner.LeftThumbTemplateZk = dto.TemplateData;
                }
                else
                {
                    learner.RightThumbTemplateZk = dto.TemplateData;
                }
            }

            learner.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { 
                message = $"{dto.FingerprintType} registered successfully for {dto.ScannerType}",
                fingerprintType = dto.FingerprintType,
                scannerType = dto.ScannerType
            });
        }

        // GET: api/Learners/{id}/fingerprints
        [HttpGet("{id}/fingerprints")]
        public async Task<IActionResult> GetFingerprints(int id)
        {
            var learner = await _context.Learners.FindAsync(id);
            if (learner == null)
            {
                return NotFound(new { message = "Learner not found" });
            }

            return Ok(new {
                learnerId = id,
                // Futronic fingerprints
                hasLeftThumbFutronic = !string.IsNullOrEmpty(learner.LeftThumbTemplate),
                hasRightThumbFutronic = !string.IsNullOrEmpty(learner.RightThumbTemplate),
                // ZKTECO fingerprints
                hasLeftThumbZkteco = !string.IsNullOrEmpty(learner.LeftThumbTemplateZk),
                hasRightThumbZkteco = !string.IsNullOrEmpty(learner.RightThumbTemplateZk)
            });
        }

        // POST: api/Learners/{id}/face-embedding
        [HttpPost("{id}/face-embedding")]
        public async Task<IActionResult> RegisterFaceEmbedding(int id, [FromBody] RegisterFaceEmbeddingDto dto)
        {
            var learner = await _context.Learners.FindAsync(id);
            if (learner == null)
            {
                return NotFound(new { message = "Learner not found" });
            }

            if (dto.Embedding == null || dto.Embedding.Count == 0)
            {
                return BadRequest(new { message = "Embedding data is required" });
            }

            // Store as JSON string
            learner.FaceEmbedding = System.Text.Json.JsonSerializer.Serialize(dto.Embedding);
            learner.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Invalidate the face embedding cache for all classes this learner belongs to,
            // so the next clock attempt picks up the fresh embedding immediately.
            var classIds = await _context.ClassEnrollments
                .Where(ce => ce.LearnerId == id && ce.Status == "Active")
                .Select(ce => ce.SiteClassId)
                .ToListAsync();
            foreach (var classId in classIds)
                AttendanceController.InvalidateEmbeddingCache(classId);

            return Ok(new { message = "Face embedding registered successfully" });
        }
    }
}

// DTO for fingerprint registration
public class RegisterFingerprintDto
{
    public string FingerprintType { get; set; } = string.Empty; // "LeftThumb" or "RightThumb"
    public string ScannerType { get; set; } = string.Empty; // "Futronic" or "ZKTECO"
    public string TemplateData { get; set; } = string.Empty; // Base64 encoded template
}

// DTO for face embedding registration
public class RegisterFaceEmbeddingDto
{
    public List<double> Embedding { get; set; } = new List<double>();
}
