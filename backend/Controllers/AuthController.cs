using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using backend.Models;
using backend.Services;
using backend.Services.Interfaces;
using System.Collections.Concurrent;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IPasswordHashingService _passwordHashingService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthController> _logger;
        private readonly IEmailService _emailService;
        private readonly IDataEncryptionService _dataEncryptionService;

        public AuthController(
            ApplicationDbContext context,
            IPasswordHashingService passwordHashingService,
            IConfiguration configuration,
            ILogger<AuthController> logger,
            IEmailService emailService,
            IDataEncryptionService dataEncryptionService)
        {
            _context = context;
            _passwordHashingService = passwordHashingService;
            _configuration = configuration;
            _logger = logger;
            _emailService = emailService;
            _dataEncryptionService = dataEncryptionService;
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            string email = request.Email;
            string password = request.Password;

            // Normalize inputs
            email = email?.Trim() ?? string.Empty;
            password = password?.Trim() ?? string.Empty;
            var normalizedEmail = email.ToLowerInvariant();

            _logger.LogInformation("DEBUG: Login attempt for {Email}. Normalized email: {NormEmail}, Plain password length: {PassLen}", 
                email, normalizedEmail, password.Length);

            try
            {
                // Support encrypted login payloads
                if ((string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password)) &&
                    !string.IsNullOrWhiteSpace(request.EncryptedLoginData))
                {
                    _logger.LogInformation("DEBUG: Plain text missing or empty, attempting to decrypt EncryptedLoginData (Length: {EncLen})", 
                        request.EncryptedLoginData.Length);
                    try
                    {
                        var decrypted = _dataEncryptionService.DecryptObject<LoginPayload>(request.EncryptedLoginData);
                        if (decrypted != null)
                        {
                            var decryptedEmail = decrypted.Email?.Trim() ?? string.Empty;
                            var decryptedPassword = decrypted.Password?.Trim() ?? string.Empty;
                            
                            if (!string.IsNullOrWhiteSpace(decryptedEmail) && !string.IsNullOrWhiteSpace(decryptedPassword))
                            {
                                email = decryptedEmail;
                                password = decryptedPassword;
                                normalizedEmail = email.ToLowerInvariant();
                                _logger.LogInformation("DEBUG: Decryption successful. Decrypted email: {Email}, Decrypted password length: {PassLen}", 
                                    email, password.Length);
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "DEBUG: Failed to decrypt login payload");
                        // Don't return error yet, try to proceed with what we have
                    }
                }

                if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
                {
                    return BadRequest(new { message = "Email and password are required" });
                }

                // Check if context is available
                if (_context == null)
                {
                    return StatusCode(500, new { message = "Database context is not available" });
                }

                // Fetch both system admin and regular user by email
                _logger.LogInformation("Looking for user/admin with email: {Email}", email);
                
                var systemAdmin = await _context.SystemAdmins
                    .FirstOrDefaultAsync(sa => sa.Email != null && sa.Email.ToLower() == normalizedEmail);

                var user = await _context.Users
                    .Include(u => u.Client)
                    .Include(u => u.SkillsDevelopmentProvider)
                    .Include(u => u.Department)
                    .FirstOrDefaultAsync(u => u.Email != null && u.Email.ToLower() == normalizedEmail);

                _logger.LogInformation("DEBUG: Found admin: {AdminFound}, Found user: {UserFound}", systemAdmin != null, user != null);

                bool adminPasswordOk = false;
                bool adminActive = false;
                if (systemAdmin != null)
                {
                    try 
                    {
                        adminPasswordOk = _passwordHashingService.VerifyPassword(password, systemAdmin.PasswordHash);
                        adminActive = systemAdmin.Status == SystemAdminStatus.Active;
                        _logger.LogInformation("DEBUG: Admin password check: {PassOk}, Status: {Status}", adminPasswordOk, systemAdmin.Status);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error verifying admin password");
                    }
                }

                bool userPasswordOk = false;
                bool userActive = false;
                if (user != null)
                {
                    try
                    {
                        userPasswordOk = _passwordHashingService.VerifyPassword(password, user.PasswordHash);
                        userActive = user.Status == UserStatus.Active;
                        _logger.LogInformation("DEBUG: User password check: {PassOk}, Status: {Status}", userPasswordOk, user.Status);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error verifying user password");
                    }
                }

                // Prefer system admin if credentials are valid and account is active
                if (systemAdmin != null && adminPasswordOk && adminActive)
                {
                    // Update last login time
                    systemAdmin.LastLoginAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
                    systemAdmin.LoginAttempts = 0;
                    systemAdmin.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
                    await _context.SaveChangesAsync();

                    // Generate JWT token for system admin
                    var adminToken = GenerateJwtTokenForSystemAdmin(systemAdmin);

                    _logger.LogInformation("Successful login for system admin: {Email}", email);

                    return Ok(new LoginResponse
                    {
                        Token = adminToken,
                        User = new UserDto
                        {
                            Id = systemAdmin.Id,
                            Name = $"{systemAdmin.FirstName} {systemAdmin.LastName}",
                            Email = systemAdmin.Email,
                            Role = "SystemAdmin",
                            Status = systemAdmin.Status.ToString(),
                            ClientId = null,
                            ClientName = null,
                            SkillsDevelopmentProviderId = null,
                            SkillsDevelopmentProviderName = null,
                            DepartmentId = null,
                            DepartmentName = null
                        }
                    });
                }

                // If admin is not valid or inactive, try regular user
                if (user != null && userPasswordOk && userActive)
                {
                    // Generate JWT token
                    var token = GenerateJwtToken(user);

                    _logger.LogInformation("Successful login for user: {Email}", email);

                    // Calculate project counts for SDP users
                    int? projectCount = null;
                    int? activeProjectCount = null;
                    int? departmentCount = null;

                    if (user.SkillsDevelopmentProviderId.HasValue)
                    {
                        try
                        {
                            _logger.LogInformation("Fetching project counts for SDP ID: {SdpId}", user.SkillsDevelopmentProviderId.Value);
                            
                            // Get project counts for SDP users
                            projectCount = await _context.Projects
                                .Where(p => p.SkillsDevelopmentProviderId == user.SkillsDevelopmentProviderId.Value)
                                .CountAsync();
                            
                            activeProjectCount = projectCount; 
                            
                            // Get department count
                            departmentCount = await _context.Departments
                                .Where(d => d.SkillsDevelopmentProviderId == user.SkillsDevelopmentProviderId.Value)
                                .CountAsync();

                            _logger.LogInformation("SDP User {Email} has {ProjectCount} projects and {DepartmentCount} departments", 
                                email, projectCount, departmentCount);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Error fetching SDP stats during login for {Email}", email);
                            // Don't fail login if stats fetch fails
                        }
                    }

                    return Ok(new LoginResponse
                    {
                        Token = token,
                        User = new UserDto
                        {
                            Id = user.Id,
                            Name = $"{user.FirstName} {user.LastName}",
                            Email = user.Email,
                            Role = user.Role.ToString(),
                            Status = user.Status.ToString(),
                            ClientId = user.ClientId,
                            ClientName = user.Client?.Name,
                            SkillsDevelopmentProviderId = user.SkillsDevelopmentProviderId,
                            SkillsDevelopmentProviderName = user.SkillsDevelopmentProvider?.Name,
                            DepartmentId = user.DepartmentId,
                            DepartmentName = user.Department?.Name,
                            ProjectCount = projectCount,
                            ActiveProjectCount = activeProjectCount,
                            DepartmentCount = departmentCount
                        }
                    });
                }

                // If no valid account matched, log details
                if (systemAdmin == null && user == null)
                {
                    _logger.LogWarning("Login attempt with non-existent email: {Email}", email);
                }
                else
                {
                    if (systemAdmin != null && adminPasswordOk && !adminActive)
                    {
                        _logger.LogWarning("Login attempt for inactive system admin: {Email}", email);
                    }
                    if (user != null && userPasswordOk && !userActive)
                    {
                        _logger.LogWarning("Login attempt for inactive user: {Email}", email);
                    }
                }

                return Unauthorized(new { message = "Invalid email or password" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during login attempt for email: {Email}", email);
                return StatusCode(500, new { message = "An error occurred during login", error = ex.Message, details = ex.InnerException?.Message });
            }
        }

        private string GenerateJwtTokenForSystemAdmin(SystemAdmin systemAdmin)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var secretKey = Environment.GetEnvironmentVariable("JWT_SECRET") ?? jwtSettings["SecretKey"] ?? "YourSuperSecretKeyThatIsAtLeast32CharactersLong!";
            var issuer = Environment.GetEnvironmentVariable("JWT_ISSUER") ?? jwtSettings["Issuer"] ?? "YourAppName";
            var audience = Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? jwtSettings["Audience"] ?? "YourAppUsers";
            var expiryMinutesStr = Environment.GetEnvironmentVariable("JWT_EXPIRY_MINUTES") ?? jwtSettings["ExpiryMinutes"] ?? "60";
            var expiryMinutes = int.Parse(expiryMinutesStr);

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, systemAdmin.Id.ToString()),
                new Claim(ClaimTypes.Name, $"{systemAdmin.FirstName} {systemAdmin.LastName}"),
                new Claim(ClaimTypes.Email, systemAdmin.Email),
                new Claim(ClaimTypes.Role, "SystemAdmin"),
                new Claim("AccessLevel", systemAdmin.AccessLevel.ToString()),
                new Claim("UserType", "SystemAdmin")
            };

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc).AddMinutes(expiryMinutes),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        // In-memory password reset token store for development
        private static readonly ConcurrentDictionary<string, ResetTokenEntry> _resetTokens = new();

        private class ResetTokenEntry
        {
            public string UserType { get; set; } = string.Empty; // "SystemAdmin" or "User"
            public int UserId { get; set; }
            public DateTime ExpiresAt { get; set; }
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            string email = request.Email?.Trim() ?? string.Empty;
            var normalizedEmail = email.ToLowerInvariant();

            try
            {
                if (string.IsNullOrEmpty(email))
                {
                    return BadRequest(new { message = "Email is required" });
                }

                _logger.LogInformation("Password reset requested for email: {Email}", email);

                // Check if email exists in system admins (case-insensitive)
                var systemAdmin = await _context.SystemAdmins
                    .FirstOrDefaultAsync(sa => sa.Email != null && sa.Email.ToLower() == normalizedEmail);

                // Check if email exists in regular users (case-insensitive)
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email != null && u.Email.ToLower() == normalizedEmail);

                // Always return success to prevent email enumeration attacks
                if (systemAdmin == null && user == null)
                {
                    _logger.LogWarning("Password reset requested for non-existent email: {Email}", email);
                    // Still return 404 since I added logic to show it on frontend, but we could return 200 for security
                    return NotFound(new { message = "Email not registered in our system" });
                }

                // Generate reset token
                var resetToken = Guid.NewGuid().ToString();
                // Build reset link using FRONTEND_URL env var
                var frontendUrl = Environment.GetEnvironmentVariable("FRONTEND_URL")?.TrimEnd('/')
                                  ?? "https://portal.nbsnprojects.co.za";
                var resetLink = $"{frontendUrl}/reset-password?token={resetToken}";
                _logger.LogInformation("Generated reset token for {Email}. Link: {ResetLink}", email, resetLink);

                // Send password reset email
                var emailSent = false;
                try 
                {
                    if (systemAdmin != null)
                    {
                        // Store token for system admin
                        _resetTokens[resetToken] = new ResetTokenEntry
                        {
                            UserType = "SystemAdmin",
                            UserId = systemAdmin.Id,
                            ExpiresAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc).AddHours(1)
                        };

                        emailSent = await _emailService.SendPasswordResetEmailAsync(
                            systemAdmin.Email,
                            resetToken,
                            resetLink
                        );
                    }
                    else if (user != null)
                    {
                        // Store token for regular user
                        _resetTokens[resetToken] = new ResetTokenEntry
                        {
                            UserType = "User",
                            UserId = user.Id,
                            ExpiresAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc).AddHours(1)
                        };

                        emailSent = await _emailService.SendPasswordResetEmailAsync(
                            user.Email,
                            resetToken,
                            resetLink
                        );
                    }
                }
                catch (Exception emailEx)
                {
                    _logger.LogError(emailEx, "Exception in EmailService while sending reset link to {Email}", email);
                    return StatusCode(500, new { 
                        message = "The email server encountered an error while sending the reset link.", 
                        error = emailEx.Message,
                        details = "Please ensure your SMTP settings (App Password) are correct."
                    });
                }

                if (!emailSent)
                {
                    _logger.LogError("EmailService returned false for: {Email}", email);
                    return StatusCode(500, new { message = "Failed to send password reset email. The email service might be temporarily unavailable." });
                }

                _logger.LogInformation("Password reset email sent to: {Email}", email);
                return Ok(new { message = "A password reset link has been sent to your email address." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing forgot password request for email: {Email}", email);
                return StatusCode(500, new { message = "An error occurred while processing your request", error = ex.Message, details = ex.InnerException?.Message });
            }
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Token) || string.IsNullOrWhiteSpace(request.NewPassword))
                {
                    return BadRequest(new { message = "Token and new password are required" });
                }

                if (!_resetTokens.TryGetValue(request.Token, out var entry))
                {
                    return BadRequest(new { message = "Invalid or expired reset token" });
                }

                if (DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc) > entry.ExpiresAt)
                {
                    _resetTokens.TryRemove(request.Token, out _);
                    return BadRequest(new { message = "Invalid or expired reset token" });
                }

                if (entry.UserType == "SystemAdmin")
                {
                    var systemAdmin = await _context.SystemAdmins.FindAsync(entry.UserId);
                    if (systemAdmin == null)
                    {
                        _resetTokens.TryRemove(request.Token, out _);
                        return BadRequest(new { message = "Invalid or expired reset token" });
                    }

                    systemAdmin.PasswordHash = _passwordHashingService.HashPassword(request.NewPassword);
                    systemAdmin.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
                    await _context.SaveChangesAsync();
                }
                else if (entry.UserType == "User")
                {
                    var user = await _context.Users.FindAsync(entry.UserId);
                    if (user == null)
                    {
                        _resetTokens.TryRemove(request.Token, out _);
                        return BadRequest(new { message = "Invalid or expired reset token" });
                    }

                    user.PasswordHash = _passwordHashingService.HashPassword(request.NewPassword);
                    await _context.SaveChangesAsync();
                }
                else
                {
                    return StatusCode(500, new { message = "Unknown user type for reset token" });
                }

                _resetTokens.TryRemove(request.Token, out _);
                _logger.LogInformation("Password reset successful for {UserType} id {Id}", entry.UserType, entry.UserId);
                return Ok(new { message = "Password reset successful" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error resetting password with token: {Token}", request.Token);
                return StatusCode(500, new { message = "An error occurred while resetting the password" });
            }
        }

        private string GenerateJwtToken(User user)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var secretKey = Environment.GetEnvironmentVariable("JWT_SECRET") ?? jwtSettings["SecretKey"] ?? "YourSuperSecretKeyThatIsAtLeast32CharactersLong!";
            var issuer = Environment.GetEnvironmentVariable("JWT_ISSUER") ?? jwtSettings["Issuer"] ?? "YourAppName";
            var audience = Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? jwtSettings["Audience"] ?? "YourAppUsers";
            var expiryMinutesStr = Environment.GetEnvironmentVariable("JWT_EXPIRY_MINUTES") ?? jwtSettings["ExpiryMinutes"] ?? "60";
            var expiryMinutes = int.Parse(expiryMinutesStr);

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, $"{user.FirstName} {user.LastName}"),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role.ToString()),
                new Claim("ClientId", user.ClientId?.ToString() ?? ""),
                new Claim("SkillsDevelopmentProviderId", user.SkillsDevelopmentProviderId?.ToString() ?? ""),
                new Claim("DepartmentId", user.DepartmentId?.ToString() ?? ""),
                new Claim("UserType", "RegularUser")
            };

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc).AddMinutes(expiryMinutes),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        // ─── Learner Portal Login ───────────────────────────────────────────
        [HttpPost("learner-login")]
        [AllowAnonymous]
        public async Task<IActionResult> LearnerLogin([FromBody] LearnerLoginRequest request)
        {
            var login = request.Login?.Trim().ToLowerInvariant() ?? string.Empty;
            var password = request.Password?.Trim() ?? string.Empty;

            if (string.IsNullOrWhiteSpace(login) || string.IsNullOrWhiteSpace(password))
                return BadRequest(new { message = "Username/email and password are required" });

            try
            {
                // Accept either username or email
                var learner = await _context.Learners
                    .FirstOrDefaultAsync(l =>
                        (l.Username != null && l.Username.ToLower() == login) ||
                        (l.Email    != null && l.Email.ToLower()    == login));

                if (learner == null || string.IsNullOrWhiteSpace(learner.PasswordHash))
                    return Unauthorized(new { message = "Invalid credentials" });

                if (!_passwordHashingService.VerifyPassword(password, learner.PasswordHash))
                    return Unauthorized(new { message = "Invalid credentials" });

                // Generate JWT
                var jwtSettings = _configuration.GetSection("JwtSettings");
                var secretKey   = Environment.GetEnvironmentVariable("JWT_SECRET") ?? jwtSettings["SecretKey"] ?? "YourSuperSecretKeyThatIsAtLeast32CharactersLong!";
                var issuer      = Environment.GetEnvironmentVariable("JWT_ISSUER")   ?? jwtSettings["Issuer"]   ?? "YourAppName";
                var audience    = Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? jwtSettings["Audience"] ?? "YourAppUsers";
                var expiryMin   = int.Parse(Environment.GetEnvironmentVariable("JWT_EXPIRY_MINUTES") ?? jwtSettings["ExpiryMinutes"] ?? "480");

                var key         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
                var creds       = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

                var claims = new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, learner.Id.ToString()),
                    new Claim(ClaimTypes.Name,  $"{learner.FirstName} {learner.LastName}"),
                    new Claim(ClaimTypes.Email, learner.Email ?? ""),
                    new Claim(ClaimTypes.Role,  "Learner"),
                    new Claim("UserType",       "Learner"),
                    new Claim("LearnerId",       learner.Id.ToString()),
                    new Claim("MustChangePassword", learner.MustChangePassword.ToString())
                };

                var jwtToken = new JwtSecurityToken(issuer, audience, claims,
                    expires: DateTime.UtcNow.AddMinutes(expiryMin),
                    signingCredentials: creds);

                var tokenString = new JwtSecurityTokenHandler().WriteToken(jwtToken);

                _logger.LogInformation("Learner login successful: {Login}", login);

                return Ok(new
                {
                    token = tokenString,
                    user = new
                    {
                        id              = learner.Id,
                        name            = learner.FirstName,
                        surname         = learner.LastName,
                        email           = learner.Email,
                        username        = learner.Username,
                        role            = "Learner",
                        mustChangePassword = learner.MustChangePassword,
                        profilePhotoPath   = learner.ProfilePhotoPath
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Learner login error for {Login}", login);
                return StatusCode(500, new { message = "Login error", error = ex.Message });
            }
        }

        // ─── Learner Change Password ────────────────────────────────────────
        [HttpPost("learner-change-password")]
        public async Task<IActionResult> LearnerChangePassword([FromBody] LearnerChangePasswordRequest request)
        {
            var learnerIdClaim = User.FindFirst("LearnerId")?.Value;
            if (!int.TryParse(learnerIdClaim, out int learnerId))
                return Unauthorized(new { message = "Not authenticated as a learner" });

            var learner = await _context.Learners.FindAsync(learnerId);
            if (learner == null) return NotFound();

            if (!_passwordHashingService.VerifyPassword(request.CurrentPassword, learner.PasswordHash ?? ""))
                return BadRequest(new { message = "Current password is incorrect" });

            learner.PasswordHash = _passwordHashingService.HashPassword(request.NewPassword);
            learner.MustChangePassword = false;
            learner.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Password changed successfully" });
        }

        // ─── Learner Forgot Password ────────────────────────────────────────
        [HttpPost("learner-forgot-password")]
        [AllowAnonymous]
        public async Task<IActionResult> LearnerForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            var email = request.Email?.Trim().ToLowerInvariant() ?? string.Empty;

            if (string.IsNullOrWhiteSpace(email))
                return BadRequest(new { message = "Email is required" });

            try
            {
                var learner = await _context.Learners
                    .FirstOrDefaultAsync(l => l.Email != null && l.Email.ToLower() == email);

                // Always return success even if learner doesn't exist (security best practice)
                if (learner == null)
                {
                    _logger.LogWarning("Password reset requested for non-existent learner email: {Email}", email);
                    return Ok(new { message = "If an account exists with that email, a reset link has been sent." });
                }

                // Generate reset token (valid for 1 hour)
                var resetToken = Guid.NewGuid().ToString();
                learner.PasswordResetToken = resetToken;
                learner.PasswordResetTokenExpiry = DateTime.UtcNow.AddHours(1);
                await _context.SaveChangesAsync();

                // Send reset email
                var learnerFrontendUrl = Environment.GetEnvironmentVariable("FRONTEND_URL")?.TrimEnd('/')
                                         ?? "https://portal.nbsnprojects.co.za";
                var resetUrl = $"{learnerFrontendUrl}/learner-reset-password?token={resetToken}";
                var emailBody = $@"
                    <h2>Reset Your Learner Portal Password</h2>
                    <p>Hello {learner.FirstName},</p>
                    <p>You requested to reset your password for the NBSN Learner Portal.</p>
                    <p>Click the link below to reset your password:</p>
                    <p><a href='{resetUrl}'>Reset Password</a></p>
                    <p>This link will expire in 1 hour.</p>
                    <p>If you didn't request this, please ignore this email.</p>
                    <p>Best regards,<br/>National Building Skills Network</p>
                ";

                if (!string.IsNullOrEmpty(learner.Email))
                {
                    await _emailService.SendEmailAsync(learner.Email, "Reset Your Learner Portal Password", emailBody);
                }

                _logger.LogInformation("Password reset email sent to learner: {Email}", email);

                return Ok(new { message = "If an account exists with that email, a reset link has been sent." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing learner password reset for {Email}", email);
                return StatusCode(500, new { message = "An error occurred. Please try again later." });
            }
        }

        // ─── Learner Reset Password ─────────────────────────────────────────
        [HttpPost("learner-reset-password")]
        [AllowAnonymous]
        public async Task<IActionResult> LearnerResetPassword([FromBody] ResetPasswordRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Token) || string.IsNullOrWhiteSpace(request.NewPassword))
                return BadRequest(new { message = "Token and new password are required" });

            try
            {
                var learner = await _context.Learners
                    .FirstOrDefaultAsync(l => l.PasswordResetToken == request.Token);

                if (learner == null)
                    return BadRequest(new { message = "Invalid or expired reset token" });

                if (learner.PasswordResetTokenExpiry == null || learner.PasswordResetTokenExpiry < DateTime.UtcNow)
                    return BadRequest(new { message = "Reset token has expired. Please request a new one." });

                // Update password
                learner.PasswordHash = _passwordHashingService.HashPassword(request.NewPassword);
                learner.PasswordResetToken = null;
                learner.PasswordResetTokenExpiry = null;
                learner.MustChangePassword = false;
                learner.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                _logger.LogInformation("Password reset successful for learner: {Email}", learner.Email);

                return Ok(new { message = "Password has been reset successfully. You can now login with your new password." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error resetting learner password");
                return StatusCode(500, new { message = "An error occurred. Please try again later." });
            }
        }

        // ─── Get Learner Reset Token (for self-service without email) ──────
        [HttpPost("get-learner-reset-token")]
        [AllowAnonymous]
        public async Task<IActionResult> GetLearnerResetToken([FromBody] ForgotPasswordRequest request)
        {
            var email = request.Email?.Trim().ToLowerInvariant() ?? string.Empty;

            if (string.IsNullOrWhiteSpace(email))
                return BadRequest(new { message = "Email is required" });

            try
            {
                var learner = await _context.Learners
                    .FirstOrDefaultAsync(l => l.Email != null && l.Email.ToLower() == email);

                if (learner == null)
                    return NotFound(new { message = "No learner found with that email address" });

                if (string.IsNullOrWhiteSpace(learner.PasswordResetToken))
                    return BadRequest(new { message = "No active reset token found. Please request a password reset first via 'Forgot Password'." });

                if (learner.PasswordResetTokenExpiry == null || learner.PasswordResetTokenExpiry < DateTime.UtcNow)
                    return BadRequest(new { message = "Your reset token has expired. Please request a new one via 'Forgot Password'." });

                _logger.LogInformation("Reset token retrieved for learner: {Email}", email);

                return Ok(new
                {
                    token = learner.PasswordResetToken,
                    expiresAt = learner.PasswordResetTokenExpiry,
                    message = "Reset token found. Use it to set your new password."
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving learner reset token for {Email}", email);
                return StatusCode(500, new { message = "An error occurred. Please try again later." });
            }
        }
    }

    public class ForgotPasswordRequest
    {
        public string Email { get; set; } = string.Empty;
    }

    public class ResetPasswordRequest
    {
        public string Token { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }

    public class LoginRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string EncryptedLoginData { get; set; } = string.Empty;
    }

    public class LearnerLoginRequest
    {
        public string Login { get; set; } = string.Empty;   // username or email
        public string Password { get; set; } = string.Empty;
    }

    public class LearnerChangePasswordRequest
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }

    public class LoginPayload
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class LoginResponse
    {
        public string Token { get; set; } = string.Empty;
        public UserDto User { get; set; } = new UserDto();
    }

    public class UserDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public int? ClientId { get; set; }
        public string? ClientName { get; set; }
        public int? SkillsDevelopmentProviderId { get; set; }
        public string? SkillsDevelopmentProviderName { get; set; }
        public int? DepartmentId { get; set; }
        public string? DepartmentName { get; set; }
        
        // Project counts for SDP users
        public int? ProjectCount { get; set; }
        public int? ActiveProjectCount { get; set; }
        public int? DepartmentCount { get; set; }
    }
}