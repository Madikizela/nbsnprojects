using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using backend.Services.Interfaces;
using backend.Services;
using System.Security.Claims;
using System.ComponentModel.DataAnnotations;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DepartmentMembersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IPasswordHashingService _passwordHashingService;
        private readonly IEmailService _emailService;
        private readonly IDataEncryptionService _dataEncryptionService;
        private readonly ILogger<DepartmentMembersController> _logger;

        public DepartmentMembersController(
            ApplicationDbContext context,
            IPasswordHashingService passwordHashingService,
            IEmailService emailService,
            IDataEncryptionService dataEncryptionService,
            ILogger<DepartmentMembersController> logger)
        {
            _context = context;
            _passwordHashingService = passwordHashingService;
            _emailService = emailService;
            _dataEncryptionService = dataEncryptionService;
            _logger = logger;
        }

        // GET: api/DepartmentMembers/AvailableRoles
        [HttpGet("AvailableRoles")]
        public async Task<ActionResult<IEnumerable<RoleOptionDto>>> GetAvailableRoles()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(userIdClaim, out int userId))
                {
                    return Unauthorized(new { message = "Invalid user token" });
                }

                // Get current user's department
                var currentUser = await _context.Users
                    .Include(u => u.Department)
                    .FirstOrDefaultAsync(u => u.Id == userId);

                if (currentUser?.DepartmentId == null)
                {
                    return BadRequest(new { message = "User is not assigned to a department" });
                }

                var department = currentUser.Department;
                var availableRoles = new List<RoleOptionDto>();

                // Add department-specific support roles based on department type
                switch (department!.Type)
                {
                    case DepartmentType.FinancialManager:
                        availableRoles.AddRange(new[]
                        {
                            new RoleOptionDto { Value = (int)UserRole.FinanceSupport, Label = "Finance Support" }
                        });
                        break;

                    case DepartmentType.LogisticManager:
                        availableRoles.AddRange(new[]
                        {
                            new RoleOptionDto { Value = (int)UserRole.LogisticsSupport, Label = "Logistics Support" }
                        });
                        break;

                    case DepartmentType.ITManager:
                        availableRoles.AddRange(new[]
                        {
                            new RoleOptionDto { Value = (int)UserRole.ITSupport, Label = "IT Support" }
                        });
                        break;

                    case DepartmentType.QualityAssuranceManager:
                    case DepartmentType.TrainingManager:
                        availableRoles.AddRange(new[]
                        {
                            new RoleOptionDto { Value = (int)UserRole.QualityAssuranceSupport, Label = "QA / Training Support" },
                            new RoleOptionDto { Value = (int)UserRole.SDPAssessor, Label = "Assessor (Marking)" },
                            new RoleOptionDto { Value = (int)UserRole.SDPModerator, Label = "Moderator (Moderation)" }
                        });
                        break;

                    case DepartmentType.AdministratorManager:
                        availableRoles.AddRange(new[]
                        {
                            new RoleOptionDto { Value = (int)UserRole.AdministrationSupport, Label = "Administration Support" }
                        });
                        break;

                    default:
                        // Default roles for any department
                        availableRoles.AddRange(new[]
                        {
                            new RoleOptionDto { Value = (int)UserRole.Learner, Label = "Learner" }
                        });
                        break;
                }

                return Ok(availableRoles);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving available roles for user {UserId}", User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
                return StatusCode(500, new { message = "An error occurred while retrieving available roles" });
            }
        }

        // GET: api/DepartmentMembers/MyTeam
        [HttpGet("MyTeam")]
        public async Task<ActionResult<IEnumerable<TeamMemberDto>>> GetMyTeamMembers()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(userIdClaim, out int userId))
                {
                    return Unauthorized(new { message = "Invalid user token" });
                }

                // Get current user's department
                var currentUser = await _context.Users
                    .Include(u => u.Department)
                    .FirstOrDefaultAsync(u => u.Id == userId);

                if (currentUser?.DepartmentId == null)
                {
                    return BadRequest(new { message = "User is not assigned to a department" });
                }

                // Check if user is a manager of this department
                var department = await _context.Departments
                    .FirstOrDefaultAsync(d => d.Id == currentUser.DepartmentId && d.ManagerEmail == currentUser.Email);

                if (department == null)
                {
                    return Forbid("You are not authorized to manage this department");
                }

                // Get all team members in this department
                var teamMembers = await _context.Users
                    .Where(u => u.DepartmentId == currentUser.DepartmentId && u.Id != userId)
                    .Select(u => new TeamMemberDto
                    {
                        Id = u.Id,
                        FirstName = u.FirstName,
                        LastName = u.LastName,
                        Email = u.Email,
                        Role = u.Role.ToString(),
                        Status = u.Status.ToString(),
                        CreatedAt = u.CreatedAt,
                        PhoneNumber = u.PhoneNumber
                    })
                    .ToListAsync();

                return Ok(teamMembers);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving team members for user {UserId}", User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
                return StatusCode(500, new { message = "An error occurred while retrieving team members" });
            }
        }

        // POST: api/DepartmentMembers/AddMember
        [HttpPost("AddMember")]
        public async Task<ActionResult<TeamMemberDto>> AddTeamMember([FromBody] AddTeamMemberDto request)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(userIdClaim, out int userId))
                {
                    return Unauthorized(new { message = "Invalid user token" });
                }

                // Get current user's department
                var currentUser = await _context.Users
                    .Include(u => u.Department)
                    .Include(u => u.SkillsDevelopmentProvider)
                    .FirstOrDefaultAsync(u => u.Id == userId);

                if (currentUser?.DepartmentId == null)
                {
                    return BadRequest(new { message = "User is not assigned to a department" });
                }

                // Check if user is a manager of this department
                var department = await _context.Departments
                    .FirstOrDefaultAsync(d => d.Id == currentUser.DepartmentId && d.ManagerEmail == currentUser.Email);

                if (department == null)
                {
                    return Forbid("You are not authorized to manage this department");
                }

                // Check if email already exists
                var existingUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());

                if (existingUser != null)
                {
                    return BadRequest(new { message = "A user with this email already exists" });
                }

                // Generate secure random password using the encryption service
                var password = _dataEncryptionService.GenerateSecurePassword(12, true);
                var hashedPassword = _passwordHashingService.HashPassword(password);

                // Create new user
                var newUser = new User
                {
                    FirstName = request.FirstName,
                    LastName = request.LastName,
                    Username = request.Email,
                    Email = request.Email,
                    PhoneNumber = request.PhoneNumber,
                    PasswordHash = hashedPassword,
                    Role = request.Role,
                    Status = UserStatus.Active,
                    SkillsDevelopmentProviderId = currentUser.SkillsDevelopmentProviderId,
                    DepartmentId = currentUser.DepartmentId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Users.Add(newUser);
                await _context.SaveChangesAsync();

                // Add project assignments if any
                if (request.ProjectIds != null && request.ProjectIds.Any())
                {
                    var assignments = request.ProjectIds.Select(projectId => new ProjectAssignment
                    {
                        ProjectId = projectId,
                        UserId = newUser.Id,
                        Role = newUser.Role == UserRole.SDPModerator ? ProjectAssignmentRole.Moderator : ProjectAssignmentRole.Assessor,
                        AssignedAt = DateTime.UtcNow
                    });
                    _context.ProjectAssignments.AddRange(assignments);
                    await _context.SaveChangesAsync();
                }

                // Send welcome email with login credentials
                var emailSent = await SendWelcomeEmail(newUser, password, currentUser, department);

                var result = new TeamMemberDto
                {
                    Id = newUser.Id,
                    FirstName = newUser.FirstName,
                    LastName = newUser.LastName,
                    Email = newUser.Email,
                    Role = newUser.Role.ToString(),
                    Status = newUser.Status.ToString(),
                    CreatedAt = newUser.CreatedAt,
                    PhoneNumber = newUser.PhoneNumber,
                    EmailSent = emailSent,
                    // Show credentials in response if email could not be sent
                    TemporaryPassword = emailSent ? null : password
                };

                _logger.LogInformation("Team member {Email} added to department {DepartmentName} by manager {ManagerEmail}", 
                    newUser.Email, department.Name, currentUser.Email);

                return CreatedAtAction(nameof(GetMyTeamMembers), result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding team member for user {UserId}", User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
                return StatusCode(500, new { message = "An error occurred while adding the team member" });
            }
        }

        // DELETE: api/DepartmentMembers/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> RemoveTeamMember(int id)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(userIdClaim, out int userId))
                {
                    return Unauthorized(new { message = "Invalid user token" });
                }

                // Get current user's department
                var currentUser = await _context.Users
                    .Include(u => u.Department)
                    .FirstOrDefaultAsync(u => u.Id == userId);

                if (currentUser?.DepartmentId == null)
                {
                    return BadRequest(new { message = "User is not assigned to a department" });
                }

                // Check if user is a manager of this department
                var department = await _context.Departments
                    .FirstOrDefaultAsync(d => d.Id == currentUser.DepartmentId && d.ManagerEmail == currentUser.Email);

                if (department == null)
                {
                    return Forbid("You are not authorized to manage this department");
                }

                // Find the team member to remove
                var teamMember = await _context.Users
                    .FirstOrDefaultAsync(u => u.Id == id && u.DepartmentId == currentUser.DepartmentId);

                if (teamMember == null)
                {
                    return NotFound(new { message = "Team member not found or not in your department" });
                }

                // Don't allow removing yourself
                if (teamMember.Id == userId)
                {
                    return BadRequest(new { message = "You cannot remove yourself from the department" });
                }

                // Remove the user (or deactivate)
                teamMember.Status = UserStatus.Inactive;
                teamMember.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Team member {Email} removed from department {DepartmentName} by manager {ManagerEmail}", 
                    teamMember.Email, department.Name, currentUser.Email);

                return Ok(new { message = "Team member removed successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing team member {MemberId} for user {UserId}", id, User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
                return StatusCode(500, new { message = "An error occurred while removing the team member" });
            }
        }

        // GET: api/DepartmentMembers/MyAssignments
        [HttpGet("MyAssignments")]
        public async Task<ActionResult<IEnumerable<object>>> GetMyAssignments()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(userIdClaim, out int userId))
                {
                    return Unauthorized(new { message = "Invalid user token" });
                }

                var assignments = await _context.ProjectAssignments
                    .Where(pa => pa.UserId == userId)
                    .Select(pa => new
                    {
                        pa.ProjectId,
                        pa.Role
                    })
                    .ToListAsync();

                return Ok(assignments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving assignments for user {UserId}", User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
                return StatusCode(500, new { message = "An error occurred while retrieving assignments" });
            }
        }

        private string GenerateRandomPassword()
        {
            // Kept for backward compatibility — prefer _dataEncryptionService.GenerateSecurePassword
            const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
            var random = new Random();
            return new string(Enumerable.Repeat(chars, 12)
                .Select(s => s[random.Next(s.Length)]).ToArray());
        }

        private async Task<bool> SendWelcomeEmail(User newUser, string password, User manager, Department department)
        {
            try
            {
                var portalUrl = Environment.GetEnvironmentVariable("FRONTEND_URL")
                                ?? "https://portal.nbsnprojects.co.za";

                var subject = $"Welcome to {manager.SkillsDevelopmentProvider?.Name ?? "NBSN"} - Your Account Details";

                var body = $@"
                    <html>
                    <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
                        <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                            <div style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;'>
                                <h1 style='margin: 0; font-size: 28px;'>Welcome to the Team!</h1>
                                <p style='margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;'>Your account has been created successfully</p>
                            </div>
                            <div style='background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;'>
                                <h2 style='color: #495057; margin-top: 0;'>Hello {newUser.FirstName} {newUser.LastName},</h2>
                                <p>Welcome to <strong>{manager.SkillsDevelopmentProvider?.Name ?? "NBSN"}</strong>! You have been added to the <strong>{department.Name}</strong> department by <strong>{manager.FirstName} {manager.LastName}</strong>.</p>
                                <div style='background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;'>
                                    <h3 style='margin-top: 0; color: #667eea;'>Your Login Credentials</h3>
                                    <p><strong>Login URL:</strong> <a href='{portalUrl}'>{portalUrl}</a></p>
                                    <p><strong>Email / Username:</strong> {newUser.Email}</p>
                                    <p><strong>Temporary Password:</strong> <code style='background: #f1f3f4; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-size: 15px;'>{password}</code></p>
                                    <p><strong>Role:</strong> {newUser.Role}</p>
                                </div>
                                <div style='background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0;'>
                                    <h4 style='margin-top: 0; color: #856404;'>Important</h4>
                                    <ul style='margin-bottom: 0; color: #856404;'>
                                        <li>Change your password after first login</li>
                                        <li>Keep your credentials secure and confidential</li>
                                        <li>Contact your manager if you have any issues</li>
                                    </ul>
                                </div>
                                <div style='text-align: center; margin: 30px 0;'>
                                    <a href='{portalUrl}/login' style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;'>
                                        Login to Your Account
                                    </a>
                                </div>
                                <hr style='border: none; border-top: 1px solid #dee2e6; margin: 30px 0;'>
                                <div style='background: white; padding: 20px; border-radius: 8px;'>
                                    <h4 style='margin-top: 0; color: #495057;'>Department Information</h4>
                                    <p><strong>Department:</strong> {department.Name}</p>
                                    <p><strong>Manager:</strong> {manager.FirstName} {manager.LastName} ({manager.Email})</p>
                                </div>
                                <p style='margin-top: 20px; color: #6c757d; font-size: 12px; text-align: center;'>
                                    This email was sent automatically by the NBSN system. Please do not reply.
                                </p>
                            </div>
                        </div>
                    </body>
                    </html>";

                var sent = await _emailService.SendEmailAsync(newUser.Email, subject, body);
                if (sent)
                    _logger.LogInformation("Welcome email sent to {Email}", newUser.Email);
                else
                    _logger.LogWarning("Welcome email could not be delivered to {Email}", newUser.Email);
                return sent;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send welcome email to {Email}", newUser.Email);
                return false;
            }
        }

        // POST: api/DepartmentMembers/{id}/resend-credentials
        [HttpPost("{id}/resend-credentials")]
        public async Task<IActionResult> ResendCredentials(int id)
        {
            try
            {
                var member = await _context.Users
                    .Include(u => u.Department)
                    .Include(u => u.SkillsDevelopmentProvider)
                    .FirstOrDefaultAsync(u => u.Id == id);

                if (member == null)
                    return NotFound(new { message = "User not found" });

                var newPassword = _dataEncryptionService.GenerateSecurePassword(12, true);
                member.PasswordHash = _passwordHashingService.HashPassword(newPassword);
                member.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
                await _context.SaveChangesAsync();

                var portalUrl = Environment.GetEnvironmentVariable("FRONTEND_URL")
                                ?? "https://portal.nbsnprojects.co.za";
                var deptInfo = member.Department != null ? $"<p><strong>Department:</strong> {member.Department.Name}</p>" : "";
                var subject = "Welcome to NBSN - Your Account Credentials";
                var body = $@"<html><body style='font-family:Arial,sans-serif'>
                  <div style='max-width:600px;margin:auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,.1)'>
                    <div style='background:linear-gradient(135deg,#667eea,#764ba2);padding:30px;text-align:center;color:#fff'>
                      <h1 style='margin:0'>Welcome to NBSN</h1>
                    </div>
                    <div style='padding:30px'>
                      <h2>Hello {member.FirstName} {member.LastName},</h2>
                      <p>Your account has been created. Use the credentials below to log in.</p>
                      <div style='background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:20px;margin:20px 0'>
                        <p><strong>Login URL:</strong> <a href='{portalUrl}'>{portalUrl}</a></p>
                        <p><strong>Email / Username:</strong> {member.Email}</p>
                        <p><strong>Password:</strong> <code style='background:#fff;padding:4px 8px;border:1px dashed #667eea;font-size:16px;color:#667eea'>{newPassword}</code></p>
                        <p><strong>Role:</strong> {member.Role}</p>
                        {deptInfo}
                      </div>
                      <p style='color:#dc3545'><strong>Please change your password after first login.</strong></p>
                      <div style='text-align:center;margin:20px 0'>
                        <a href='{portalUrl}/login' style='background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;padding:12px 30px;text-decoration:none;border-radius:25px;font-weight:bold'>Login Now</a>
                      </div>
                      <p>Best regards,<br><strong>NBSN Team</strong></p>
                    </div>
                  </div></body></html>";

                var emailSent = await _emailService.SendEmailAsync(member.Email!, subject, body);
                if (emailSent)
                {
                    _logger.LogInformation("Credentials resent to {Email}", member.Email);
                    return Ok(new { message = $"Credentials sent to {member.Email}", emailSent = true });
                }
                return Ok(new { message = "Password reset but email could not be delivered. Share credentials manually.", emailSent = false, username = member.Email, temporaryPassword = newPassword });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error resending credentials for user {UserId}", id);
                return StatusCode(500, new { message = "An error occurred" });
            }
        }
    }

    // DTOs
    public class TeamMemberDto
    {
        public int Id { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool EmailSent { get; set; }
        public string? TemporaryPassword { get; set; }
    }

    public class AddTeamMemberDto
    {
        [Required]
        [StringLength(100, MinimumLength = 2)]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        [StringLength(100, MinimumLength = 2)]
        public string LastName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Phone]
        public string? PhoneNumber { get; set; }

        [Required]
        public UserRole Role { get; set; }

        public List<int>? ProjectIds { get; set; }
    }

    public class RoleOptionDto
    {
        public int Value { get; set; }
        public string Label { get; set; } = string.Empty;
    }
}