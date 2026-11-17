using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using backend.Services.Interfaces;
using System.Security.Claims;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]  // All endpoints require authentication
    public class UsersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IPasswordHashingService _passwordHashingService;

        public UsersController(ApplicationDbContext context, IPasswordHashingService passwordHashingService)
        {
            _context = context;
            _passwordHashingService = passwordHashingService;
        }

        // Safe user DTO — never exposes PasswordHash
        private static object ToSafeDto(User u) => new
        {
            u.Id, u.FirstName, u.LastName, u.Email, u.Username, u.PhoneNumber,
            Role = u.Role.ToString(), Status = u.Status.ToString(),
            u.SkillsDevelopmentProviderId,
            SkillsDevelopmentProviderName = u.SkillsDevelopmentProvider?.Name,
            u.ClientId, ClientName = u.Client?.Name,
            u.DepartmentId, DepartmentName = u.Department?.Name,
            u.CreatedAt, u.UpdatedAt, u.LastLoginAt, u.MustChangePassword
        };

        // GET: api/Users
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetUsers()
        {
            var users = await _context.Users
                .Include(u => u.Client)
                .Include(u => u.SkillsDevelopmentProvider)
                .Include(u => u.Department)
                .ToListAsync();
            return Ok(users.Select(ToSafeDto));
        }

        // GET: api/Users/5
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetUser(int id)
        {
            var user = await _context.Users
                .Include(u => u.Client)
                .Include(u => u.SkillsDevelopmentProvider)
                .Include(u => u.Department)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null) return NotFound();
            return Ok(ToSafeDto(user));
        }

        // GET: api/Users/ByRole/{role}
        [HttpGet("ByRole/{role}")]
        public async Task<ActionResult<IEnumerable<object>>> GetUsersByRole(UserRole role)
        {
            var users = await _context.Users
                .Where(u => u.Role == role)
                .Include(u => u.Client)
                .Include(u => u.SkillsDevelopmentProvider)
                .Include(u => u.Department)
                .ToListAsync();
            return Ok(users.Select(ToSafeDto));
        }

        // GET: api/Users/ByClient/{clientId}
        [HttpGet("ByClient/{clientId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetUsersByClient(int clientId)
        {
            var users = await _context.Users
                .Where(u => u.ClientId == clientId)
                .Include(u => u.Client)
                .Include(u => u.SkillsDevelopmentProvider)
                .Include(u => u.Department)
                .Select(u => new {
                    u.Id, u.FirstName, u.LastName, u.Email,
                    Role = u.Role.ToString(), Status = u.Status.ToString(),
                    DepartmentName = u.Department != null ? u.Department.Name : null
                })
                .ToListAsync();

            return Ok(users);
        }

        // GET: api/Users/BySDP/{sdpId}
        [HttpGet("BySDP/{sdpId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetUsersBySDP(int sdpId)
        {
            var users = await _context.Users
                .Where(u => u.SkillsDevelopmentProviderId == sdpId)
                .Include(u => u.Client)
                .Include(u => u.SkillsDevelopmentProvider)
                .Include(u => u.Department)
                .ToListAsync();
            return Ok(users.Select(ToSafeDto));
        }

        // GET: api/Users/ByDepartment/{departmentId}
        [HttpGet("ByDepartment/{departmentId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetUsersByDepartment(int departmentId)
        {
            var users = await _context.Users
                .Where(u => u.DepartmentId == departmentId)
                .Include(u => u.Client)
                .Include(u => u.SkillsDevelopmentProvider)
                .Include(u => u.Department)
                .ToListAsync();
            return Ok(users.Select(ToSafeDto));
        }

        // PUT: api/Users/5
        [HttpPut("{id}")]
        [Authorize(Roles = "SystemAdmin,SDPAdministrator")]
        public async Task<IActionResult> PutUser(int id, User user)
        {
            if (id != user.Id) return BadRequest();

            user.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
            _context.Entry(user).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!UserExists(id)) return NotFound();
                throw;
            }

            return NoContent();
        }

        // POST: api/Users
        [HttpPost]
        [Authorize(Roles = "SystemAdmin,SDPAdministrator")]
        public async Task<ActionResult<object>> PostUser(User user)
        {
            user.CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
            user.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetUser", new { id = user.Id }, ToSafeDto(user));
        }

        // DELETE: api/Users/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "SystemAdmin")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            user.SoftDelete(userId != null ? int.Parse(userId) : null);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool UserExists(int id)
        {
            return _context.Users.Any(e => e.Id == id);
        }

        // PUT: api/Users/{id}/status
        [HttpPut("{id}/status")]
        [Authorize(Roles = "SystemAdmin")]
        public async Task<IActionResult> SetUserStatus(int id, [FromBody] SetUserStatusRequest request)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
                return NotFound(new { message = "User not found" });

            if (user.Role == UserRole.SystemAdmin)
                return BadRequest(new { message = "System admin accounts cannot be managed through this endpoint" });

            var previousStatus = user.Status.ToString();
            var newStatus = request.Active ? UserStatus.Active : UserStatus.Inactive;
            user.Status = newStatus;
            user.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);

            await _context.SaveChangesAsync();

            var adminEmail = User.FindFirst(ClaimTypes.Email)?.Value ?? "System Admin";
            var action = request.Active ? "USER_ENABLED" : "USER_DISABLED";
            var description = $"User '{user.FirstName} {user.LastName}' ({user.Email}) was {(request.Active ? "enabled" : "disabled")} by {adminEmail}. Previous status: {previousStatus}.";
            await AuditLogHelper.LogAsync(_context, action, description, "User", user.Id,
                $"{user.FirstName} {user.LastName}", adminEmail,
                metadata: $"{{\"previousStatus\":\"{previousStatus}\",\"newStatus\":\"{newStatus}\"}}");

            return Ok(new { message = $"User '{user.FirstName} {user.LastName}' is now {newStatus}.", userId = user.Id, status = newStatus.ToString() });
        }

        // PUT: api/Users/{id}/change-password
        [HttpPut("{id}/change-password")]
        public async Task<IActionResult> ChangePassword(int id, [FromBody] ChangePasswordRequest request)
        {
            // Users can only change their own password; SystemAdmin can change any
            var callerIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var callerRole  = User.FindFirst(ClaimTypes.Role)?.Value;
            if (!int.TryParse(callerIdStr, out int callerId))
                return Unauthorized();
            if (callerId != id && callerRole != "SystemAdmin")
                return Forbid();

            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound(new { message = "User not found" });

            if (!_passwordHashingService.VerifyPassword(request.CurrentPassword, user.PasswordHash))
                return BadRequest(new { message = "Current password is incorrect" });

            var policy = PasswordPolicy.Validate(request.NewPassword);
            if (!policy.IsValid)
                return BadRequest(new { message = policy.Error });

            user.PasswordHash       = _passwordHashingService.HashPassword(request.NewPassword);
            user.MustChangePassword = false;
            user.UpdatedAt          = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Password changed successfully" });
        }
    }

    // DTO for individual user status toggle
    public class SetUserStatusRequest
    {
        public bool Active { get; set; }
    }

    public class ChangePasswordRequest
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }
}
