using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using backend.Services.Interfaces;
using backend.Services;
using System.ComponentModel.DataAnnotations;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SkillsDevelopmentProvidersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IEmailService _emailService;
        private readonly IPasswordHashingService _passwordHashingService;
        private readonly IDataEncryptionService _dataEncryptionService;
        private readonly ILogger<SkillsDevelopmentProvidersController> _logger;

        public SkillsDevelopmentProvidersController(
            ApplicationDbContext context,
            IEmailService emailService,
            IPasswordHashingService passwordHashingService,
            IDataEncryptionService dataEncryptionService,
            ILogger<SkillsDevelopmentProvidersController> logger)
        {
            _context = context;
            _emailService = emailService;
            _passwordHashingService = passwordHashingService;
            _dataEncryptionService = dataEncryptionService;
            _logger = logger;
        }

        // GET: api/SkillsDevelopmentProviders
        [HttpGet]
        public async Task<ActionResult<IEnumerable<SkillsDevelopmentProvider>>> GetSkillsDevelopmentProviders()
        {
            return await _context.SkillsDevelopmentProviders
                .Include(s => s.Client)
                .Include(s => s.Users)
                .Include(s => s.Departments)
                .ToListAsync();
        }

        // GET: api/SkillsDevelopmentProviders/5
        [HttpGet("{id}")]
        public async Task<ActionResult<SkillsDevelopmentProvider>> GetSkillsDevelopmentProvider(int id)
        {
            var sdp = await _context.SkillsDevelopmentProviders
                .Include(s => s.Client)
                .Include(s => s.Users)
                .Include(s => s.Departments)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (sdp == null)
            {
                return NotFound();
            }

            return sdp;
        }

        // GET: api/SkillsDevelopmentProviders/ByClient/{clientId}
        [HttpGet("ByClient/{clientId}")]
        public async Task<ActionResult<IEnumerable<SkillsDevelopmentProvider>>> GetSDPsByClient(int clientId)
        {
            return await _context.SkillsDevelopmentProviders
                .Where(s => s.ClientId == clientId)
                .Include(s => s.Client)
                .Include(s => s.Users)
                .Include(s => s.Departments)
                .ToListAsync();
        }

        // GET: api/SkillsDevelopmentProviders/{id}/Users
        [HttpGet("{id}/Users")]
        public async Task<ActionResult<IEnumerable<User>>> GetSDPUsers(int id)
        {
            Console.WriteLine($"=== GET /api/SkillsDevelopmentProviders/{id}/Users called ===");
            
            var sdp = await _context.SkillsDevelopmentProviders
                .Include(s => s.Users)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (sdp == null)
            {
                Console.WriteLine($"SDP with ID {id} not found");
                return NotFound();
            }

            Console.WriteLine($"Found {sdp.Users.Count} users for SDP {id}");
            return Ok(sdp.Users);
        }

        // GET: api/SkillsDevelopmentProviders/{id}/Departments
        [HttpGet("{id}/Departments")]
        public async Task<ActionResult<IEnumerable<Department>>> GetSDPDepartments(int id)
        {
            Console.WriteLine($"=== GET /api/SkillsDevelopmentProviders/{id}/Departments called ===");
            
            var sdp = await _context.SkillsDevelopmentProviders
                .Include(s => s.Departments)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (sdp == null)
            {
                Console.WriteLine($"SDP with ID {id} not found");
                return NotFound();
            }

            Console.WriteLine($"Found {sdp.Departments.Count} departments for SDP {id}");
            return Ok(sdp.Departments);
        }

        // GET: api/SkillsDevelopmentProviders/{id}/Projects
        [HttpGet("{id}/Projects")]
        public async Task<ActionResult<IEnumerable<Project>>> GetSDPProjects(int id)
        {
            Console.WriteLine($"=== GET /api/SkillsDevelopmentProviders/{id}/Projects called ===");
            
            var projects = await _context.Projects
                .Where(p => p.SkillsDevelopmentProviderId == id)
                .Include(p => p.Client)
                .Include(p => p.SkillsDevelopmentProvider)
                .Include(p => p.ProjectLearningPathways)
                    .ThenInclude(plp => plp.LearningPathway)
                .ToListAsync();

            Console.WriteLine($"Found {projects.Count} projects for SDP {id}");
            return Ok(projects);
        }

        // PUT: api/SkillsDevelopmentProviders/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutSkillsDevelopmentProvider(int id, SkillsDevelopmentProvider sdp)
        {
            if (id != sdp.Id)
            {
                return BadRequest();
            }

            sdp.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
            _context.Entry(sdp).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!SkillsDevelopmentProviderExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // POST: api/SkillsDevelopmentProviders/register
        [HttpPost("register")]
        public async Task<ActionResult<SdpRegistrationResponse>> RegisterSkillsDevelopmentProvider(SdpRegistrationRequest request)
        {
            try
            {
                // Debug logging
                _logger.LogInformation("SDP Registration Request: SdpName={SdpName}, BusinessDescription={BusinessDescription}, ContactPerson={ContactPerson}, PhysicalAddress={PhysicalAddress}", 
                    request.SdpName, request.BusinessDescription, request.ContactPerson, request.PhysicalAddress);
                
                // Validate the request
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // Check if SDP with same accreditation number already exists (if provided)
                // Temporarily disabled due to database schema mismatch
                /*
                if (!string.IsNullOrEmpty(request.AccreditationNumber))
                {
                    var existingSdp = await _context.SkillsDevelopmentProviders
                        .FirstOrDefaultAsync(s => s.AccreditationNumber == request.AccreditationNumber);
                    
                    if (existingSdp != null)
                    {
                        return BadRequest(new { message = "SDP with this accreditation number already exists" });
                    }
                }
                */

                // Check if client exists
                var client = await _context.Clients.FindAsync(request.ClientId);
                if (client == null)
                {
                    return BadRequest(new { message = "Invalid client ID" });
                }

                // Check if user with this email already exists
                var existingUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email == request.EmailAddress);
                
                if (existingUser != null)
                {
                    return BadRequest(new { message = "User with this email already exists" });
                }

                // Create the SDP with all available fields
                var sdp = new SkillsDevelopmentProvider
                {
                    Name = request.SdpName,
                    Description = request.BusinessDescription,
                    Address = $"{request.PhysicalAddress}, {request.Municipality}, {request.District}, {request.Province}",
                    ContactPerson = request.ContactPerson,
                    Status = SDPStatus.PendingApproval,
                    ClientId = request.ClientId,
                    CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc),
                    UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc)
                };

                _context.SkillsDevelopmentProviders.Add(sdp);
                await _context.SaveChangesAsync();

                // Generate login credentials
                var username = request.EmailAddress; // Use email as username
                var password = _dataEncryptionService.GenerateSecurePassword(12, true);
                var hashedPassword = _passwordHashingService.HashPassword(password);

                // Create user account for the SDP
                var user = new User
                {
                    FirstName = request.ContactPerson.Split(' ').FirstOrDefault() ?? request.ContactPerson,
                    LastName = request.ContactPerson.Split(' ').Skip(1).FirstOrDefault() ?? "",
                    Username = username,
                    Email = request.EmailAddress,
                    PasswordHash = hashedPassword,
                    PhoneNumber = request.PhoneNumber,
                    Role = UserRole.SDPAdministrator,
                    Status = UserStatus.Active,
                    MustChangePassword = true,  // Force password change on first login
                    SkillsDevelopmentProviderId = sdp.Id,
                    CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc),
                    UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc)
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                // Send welcome email with credentials
                var emailSent = await _emailService.SendWelcomeEmailAsync(
                    request.EmailAddress,
                    request.SdpName,
                    username,
                    password
                );

                if (!emailSent)
                {
                    _logger.LogWarning("Failed to send welcome email to {Email} for SDP {SdpName}", 
                        request.EmailAddress, request.SdpName);
                }

                return Ok(new SdpRegistrationResponse
                {
                    Success = true,
                    Message = "SDP registered successfully. Login credentials have been sent to the provided email address.",
                    SdpId = sdp.Id,
                    Username = username,
                    EmailSent = emailSent
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error registering SDP: {SdpName}", request.SdpName);
                return StatusCode(500, new { message = "An error occurred while registering the SDP" });
            }
        }

        // POST: api/SkillsDevelopmentProviders
        [HttpPost]
        public async Task<ActionResult<SkillsDevelopmentProvider>> PostSkillsDevelopmentProvider(SkillsDevelopmentProvider sdp)
        {
            // Clear the Client navigation property to avoid validation issues
            sdp.Client = null!;
            
            sdp.CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
            sdp.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
            
            _context.SkillsDevelopmentProviders.Add(sdp);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetSkillsDevelopmentProvider", new { id = sdp.Id }, sdp);
        }

        // DELETE: api/SkillsDevelopmentProviders/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSkillsDevelopmentProvider(int id)
        {
            var sdp = await _context.SkillsDevelopmentProviders.FindAsync(id);
            if (sdp == null)
            {
                return NotFound();
            }

            _context.SkillsDevelopmentProviders.Remove(sdp);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool SkillsDevelopmentProviderExists(int id)
        {
            return _context.SkillsDevelopmentProviders.Any(e => e.Id == id);
        }

        // PUT: api/SkillsDevelopmentProviders/{id}/approve
        // Approves a PendingApproval SDP — sets it Active and activates its users.
        [HttpPut("{id}/approve")]
        public async Task<IActionResult> ApproveSDP(int id)
        {
            var sdp = await _context.SkillsDevelopmentProviders
                .Include(s => s.Users)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (sdp == null)
                return NotFound(new { message = "SDP not found" });

            var previousStatus = sdp.Status.ToString();
            sdp.Status    = SDPStatus.Active;
            sdp.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);

            foreach (var user in sdp.Users)
            {
                user.Status    = UserStatus.Active;
                user.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
            }

            await _context.SaveChangesAsync();

            var adminEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "System Admin";
            await AuditLogHelper.LogAsync(_context, "SDP_APPROVED",
                $"SDP '{sdp.Name}' was approved by {adminEmail}. Previous status: {previousStatus}.",
                "SDP", sdp.Id, sdp.Name, adminEmail,
                metadata: $"{{\"previousStatus\":\"{previousStatus}\",\"newStatus\":\"Active\"}}");

            // Notify users
            foreach (var subUser in sdp.Users.Where(u => !string.IsNullOrWhiteSpace(u.Email)))
            {
                try
                {
                    await _emailService.SendEmailAsync(subUser.Email,
                        "✅ Your NBSN SDP has been approved",
                        $@"<div style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto'>
                             <h2 style='color:#16a34a'>✅ SDP Approved</h2>
                             <p>Dear {subUser.FirstName},</p>
                             <p>Your Skills Development Provider <strong>{sdp.Name}</strong> has been <strong>approved</strong> by a system administrator.</p>
                             <p>You can now log in at <a href='https://nbsn-frontend-production.up.railway.app'>nbsn-frontend-production.up.railway.app</a>.</p>
                             <p>Regards,<br/>NBSN System</p>
                           </div>");
                }
                catch (Exception ex) { _logger.LogWarning(ex, "Could not send approval email to {Email}", subUser.Email); }
            }

            return Ok(new { message = $"SDP '{sdp.Name}' has been approved and is now Active.", sdpStatus = "Active" });
        }

        // PUT: api/SkillsDevelopmentProviders/{id}/reject
        // Rejects/suspends a PendingApproval SDP.
        [HttpPut("{id}/reject")]
        public async Task<IActionResult> RejectSDP(int id, [FromBody] ApproveSdpRequest request)
        {
            var sdp = await _context.SkillsDevelopmentProviders
                .Include(s => s.Users)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (sdp == null)
                return NotFound(new { message = "SDP not found" });

            var previousStatus = sdp.Status.ToString();
            sdp.Status    = SDPStatus.Inactive;
            sdp.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);

            foreach (var user in sdp.Users)
            {
                user.Status    = UserStatus.Inactive;
                user.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
            }

            await _context.SaveChangesAsync();

            var adminEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "System Admin";
            var reason = string.IsNullOrWhiteSpace(request?.RejectionReason) ? "No reason provided" : request.RejectionReason;
            await AuditLogHelper.LogAsync(_context, "SDP_REJECTED",
                $"SDP '{sdp.Name}' was rejected by {adminEmail}. Reason: {reason}.",
                "SDP", sdp.Id, sdp.Name, adminEmail,
                metadata: $"{{\"previousStatus\":\"{previousStatus}\",\"reason\":\"{reason}\"}}");

            foreach (var subUser in sdp.Users.Where(u => !string.IsNullOrWhiteSpace(u.Email)))
            {
                try
                {
                    await _emailService.SendEmailAsync(subUser.Email,
                        "❌ Your NBSN SDP registration was not approved",
                        $@"<div style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto'>
                             <h2 style='color:#dc2626'>❌ SDP Not Approved</h2>
                             <p>Dear {subUser.FirstName},</p>
                             <p>Your Skills Development Provider <strong>{sdp.Name}</strong> registration was not approved.</p>
                             <p><strong>Reason:</strong> {reason}</p>
                             <p>Please contact NBSN for more information.</p>
                             <p>Regards,<br/>NBSN System</p>
                           </div>");
                }
                catch (Exception ex) { _logger.LogWarning(ex, "Could not send rejection email to {Email}", subUser.Email); }
            }

            return Ok(new { message = $"SDP '{sdp.Name}' has been rejected.", sdpStatus = "Inactive" });
        }

        // PUT: api/SkillsDevelopmentProviders/{id}/status
        // Sets the SDP active/inactive and cascades the same status to all its sub-users.
        [HttpPut("{id}/status")]
        public async Task<IActionResult> SetSDPStatus(int id, [FromBody] SetSDPStatusRequest request)
        {
            var sdp = await _context.SkillsDevelopmentProviders
                .Include(s => s.Users)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (sdp == null)
                return NotFound(new { message = "SDP not found" });

            var newSdpStatus = request.Active ? SDPStatus.Active : SDPStatus.Inactive;
            var newUserStatus = request.Active ? UserStatus.Active : UserStatus.Inactive;
            var previousStatus = sdp.Status.ToString();

            sdp.Status = newSdpStatus;
            sdp.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);

            // Cascade to all sub-users so login is blocked/unblocked immediately
            foreach (var user in sdp.Users)
            {
                user.Status = newUserStatus;
                user.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
            }

            await _context.SaveChangesAsync();

            // Write audit log
            var adminEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "System Admin";
            var action = request.Active ? "SDP_ENABLED" : "SDP_DISABLED";
            var description = $"SDP '{sdp.Name}' was {(request.Active ? "enabled" : "disabled")} by {adminEmail}. {sdp.Users.Count} sub-user(s) updated. Previous status: {previousStatus}.";
            await AuditLogHelper.LogAsync(_context, action, description, "SDP", sdp.Id, sdp.Name, adminEmail,
                metadata: $"{{\"previousStatus\":\"{previousStatus}\",\"newStatus\":\"{newSdpStatus}\",\"usersAffected\":{sdp.Users.Count}}}");

            // Send email notification to all sub-users informing them of the status change
            var statusVerb = request.Active ? "re-enabled" : "disabled";
            var statusEmoji = request.Active ? "✅" : "🚫";
            var emailSubject = $"{statusEmoji} Your NBSN account has been {statusVerb}";
            foreach (var subUser in sdp.Users.Where(u => !string.IsNullOrWhiteSpace(u.Email)))
            {
                var emailBody = request.Active
                    ? $@"<div style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto'>
                            <h2 style='color:#16a34a'>✅ Account Re-enabled</h2>
                            <p>Dear {subUser.FirstName},</p>
                            <p>Your NBSN account for <strong>{sdp.Name}</strong> has been <strong>re-enabled</strong> by a system administrator.</p>
                            <p>You can now log in at <a href='https://nbsn-frontend-production.up.railway.app'>nbsn-frontend-production.up.railway.app</a>.</p>
                            <p>If you have any questions, please contact your administrator.</p>
                            <p>Regards,<br/>NBSN System</p>
                          </div>"
                    : $@"<div style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto'>
                            <h2 style='color:#dc2626'>🚫 Account Disabled</h2>
                            <p>Dear {subUser.FirstName},</p>
                            <p>Your NBSN account for <strong>{sdp.Name}</strong> has been <strong>disabled</strong> by a system administrator.</p>
                            <p>You will not be able to log in until the account is re-enabled. If you believe this is a mistake, please contact your administrator.</p>
                            <p>Regards,<br/>NBSN System</p>
                          </div>";

                try { await _emailService.SendEmailAsync(subUser.Email, emailSubject, emailBody); }
                catch (Exception emailEx) { _logger.LogWarning(emailEx, "Failed to send status notification to {Email}", subUser.Email); }
            }

            _logger.LogInformation(
                "SDP {SdpId} ({SdpName}) set to {Status}. {UserCount} sub-users updated.",
                sdp.Id, sdp.Name, newSdpStatus, sdp.Users.Count);

            return Ok(new
            {
                message = $"SDP '{sdp.Name}' is now {newSdpStatus}. {sdp.Users.Count} user(s) updated.",
                sdpStatus = newSdpStatus.ToString(),
                usersUpdated = sdp.Users.Count
            });
        }

        // POST: api/SkillsDevelopmentProviders/{id}/resend-credentials
        [HttpPost("{id}/resend-credentials")]
        public async Task<IActionResult> ResendCredentials(int id)
        {
            try
            {
                var sdp = await _context.SkillsDevelopmentProviders.FindAsync(id);
                if (sdp == null)
                    return NotFound(new { message = "SDP not found" });

                // Find the admin user for this SDP
                var adminUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.SkillsDevelopmentProviderId == id);

                if (adminUser == null)
                    return NotFound(new { message = "No user account found for this SDP" });

                // Generate fresh password
                var newPassword = _dataEncryptionService.GenerateSecurePassword();
                adminUser.PasswordHash = _passwordHashingService.HashPassword(newPassword);
                adminUser.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
                await _context.SaveChangesAsync();

                // Send welcome email
                var emailSent = await _emailService.SendWelcomeEmailAsync(
                    adminUser.Email!,
                    sdp.Name,
                    adminUser.Username ?? adminUser.Email!,
                    newPassword);

                if (emailSent)
                {
                    _logger.LogInformation("Credentials resent to {Email} for SDP {SdpName}", adminUser.Email, sdp.Name);
                    var adminEmail2 = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "System Admin";
                    await AuditLogHelper.LogAsync(_context, "CREDENTIALS_RESENT",
                        $"Credentials resent to {adminUser.Email} for SDP '{sdp.Name}' by {adminEmail2}.",
                        "SDP", sdp.Id, sdp.Name, adminEmail2);
                    return Ok(new { message = $"Credentials resent to {adminUser.Email}", emailSent = true });
                }
                else
                {
                    return Ok(new
                    {
                        message = "Password reset but email could not be sent. Save these credentials:",
                        emailSent = false,
                        adminUsername = adminUser.Username ?? adminUser.Email,
                        temporaryPassword = newPassword
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error resending credentials for SDP {SdpId}", id);
                return StatusCode(500, new { message = "An error occurred while resending credentials" });
            }
        }

        // POST: api/SkillsDevelopmentProviders/{id}/logo
        [HttpPost("{id}/logo")]
        public async Task<IActionResult> UploadLogo(int id, IFormFile logo)
        {
            try
            {
                var sdp = await _context.SkillsDevelopmentProviders.FindAsync(id);
                if (sdp == null) return NotFound(new { message = "SDP not found" });

                if (logo == null || logo.Length == 0)
                    return BadRequest(new { message = "No file provided" });

                // Validate file type
                var allowed = new[] { ".jpg", ".jpeg", ".png", ".svg", ".webp" };
                var ext = Path.GetExtension(logo.FileName).ToLowerInvariant();
                if (!allowed.Contains(ext))
                    return BadRequest(new { message = "Only JPG, PNG, SVG, WEBP files are allowed" });

                // Max 2MB
                if (logo.Length > 2 * 1024 * 1024)
                    return BadRequest(new { message = "File size must not exceed 2MB" });

                // Save to uploads/sdp-logos/
                var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "uploads", "sdp-logos");
                Directory.CreateDirectory(uploadsDir);

                // Delete old logo if exists
                if (!string.IsNullOrEmpty(sdp.LogoPath))
                {
                    var oldPath = Path.Combine(Directory.GetCurrentDirectory(), sdp.LogoPath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
                    if (System.IO.File.Exists(oldPath)) System.IO.File.Delete(oldPath);
                }

                var fileName = $"sdp_{id}_{Guid.NewGuid():N}{ext}";
                var filePath = Path.Combine(uploadsDir, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                    await logo.CopyToAsync(stream);

                sdp.LogoPath = $"uploads/sdp-logos/{fileName}";
                sdp.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, logoPath = sdp.LogoPath });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading logo for SDP {SdpId}", id);
                return StatusCode(500, new { message = "Error uploading logo" });
            }
        }

        // DELETE: api/SkillsDevelopmentProviders/{id}/logo
        [HttpDelete("{id}/logo")]
        public async Task<IActionResult> DeleteLogo(int id)
        {
            var sdp = await _context.SkillsDevelopmentProviders.FindAsync(id);
            if (sdp == null) return NotFound();

            if (!string.IsNullOrEmpty(sdp.LogoPath))
            {
                var fullPath = Path.Combine(Directory.GetCurrentDirectory(), sdp.LogoPath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
                if (System.IO.File.Exists(fullPath)) System.IO.File.Delete(fullPath);
                sdp.LogoPath = null;
                sdp.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
                await _context.SaveChangesAsync();
            }

            return Ok(new { success = true });
        }
    }

    // DTOs for SDP Registration
    public class SdpRegistrationRequest
    {
        [Required(ErrorMessage = "SDP name is required")]
        [StringLength(200, ErrorMessage = "SDP name cannot exceed 200 characters")]
        public string SdpName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Registration number is required")]
        [StringLength(50, ErrorMessage = "Registration number cannot exceed 50 characters")]
        public string RegistrationNumber { get; set; } = string.Empty;

        [StringLength(500, ErrorMessage = "Business description cannot exceed 500 characters")]
        public string? BusinessDescription { get; set; }

        [StringLength(100, ErrorMessage = "Accreditation number cannot exceed 100 characters")]
        public string? AccreditationNumber { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Number of beneficiaries must be greater than 0")]
        public int? Beneficiaries { get; set; }

        [Required(ErrorMessage = "Province is required")]
        public string Province { get; set; } = string.Empty;

        [Required(ErrorMessage = "District is required")]
        public string District { get; set; } = string.Empty;

        [Required(ErrorMessage = "Municipality is required")]
        public string Municipality { get; set; } = string.Empty;

        [Required(ErrorMessage = "Physical address is required")]
        [StringLength(200, ErrorMessage = "Physical address cannot exceed 200 characters")]
        public string PhysicalAddress { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email address is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        [StringLength(255, ErrorMessage = "Email cannot exceed 255 characters")]
        public string EmailAddress { get; set; } = string.Empty;

        [Required(ErrorMessage = "Phone number is required")]
        [StringLength(20, ErrorMessage = "Phone number cannot exceed 20 characters")]
        public string PhoneNumber { get; set; } = string.Empty;

        [Required(ErrorMessage = "Contact person is required")]
        [StringLength(100, ErrorMessage = "Contact person cannot exceed 100 characters")]
        public string ContactPerson { get; set; } = string.Empty;

        [Url(ErrorMessage = "Invalid website URL format")]
        [StringLength(255, ErrorMessage = "Website URL cannot exceed 255 characters")]
        public string? Website { get; set; }

        [Required(ErrorMessage = "Client ID is required")]
        public int ClientId { get; set; }
    }

    public class SdpRegistrationResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public int SdpId { get; set; }
        public string Username { get; set; } = string.Empty;
        public bool EmailSent { get; set; }
    }

    // DTO for SDP status toggle
    public class SetSDPStatusRequest
    {
        /// <summary>true = Active, false = Inactive</summary>
        public bool Active { get; set; }
    }

    // DTO for SDP approval/rejection
    public class ApproveSdpRequest
    {
        public string? RejectionReason { get; set; }
    }
}