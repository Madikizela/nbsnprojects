using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using backend.Services.Interfaces;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DepartmentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IEmailService _emailService;
        private readonly IPasswordHashingService _passwordHashingService;
        private readonly IDataEncryptionService _dataEncryptionService;
        private readonly ILogger<DepartmentsController> _logger;

        public DepartmentsController(
            ApplicationDbContext context,
            IEmailService emailService,
            IPasswordHashingService passwordHashingService,
            IDataEncryptionService dataEncryptionService,
            ILogger<DepartmentsController> logger)
        {
            _context = context;
            _emailService = emailService;
            _passwordHashingService = passwordHashingService;
            _dataEncryptionService = dataEncryptionService;
            _logger = logger;
        }

        // GET: api/Departments
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Department>>> GetDepartments()
        {
            return await _context.Departments
                .Include(d => d.SkillsDevelopmentProvider)
                .Include(d => d.Users)
                .ToListAsync();
        }

        // GET: api/Departments/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Department>> GetDepartment(int id)
        {
            var department = await _context.Departments
                .Include(d => d.SkillsDevelopmentProvider)
                .Include(d => d.Users)
                .FirstOrDefaultAsync(d => d.Id == id);

            if (department == null)
            {
                return NotFound();
            }

            return department;
        }

        // GET: api/Departments/ByClient/{clientId}
        [HttpGet("ByClient/{clientId}")]
        public async Task<ActionResult<IEnumerable<Department>>> GetDepartmentsByClient(int clientId)
        {
            return await _context.Departments
                .Where(d => d.SkillsDevelopmentProvider != null && d.SkillsDevelopmentProvider.ClientId == clientId)
                .Include(d => d.SkillsDevelopmentProvider)
                .Include(d => d.Users)
                .ToListAsync();
        }

        // GET: api/Departments/ByType/{type}
        [HttpGet("ByType/{type}")]
        public async Task<ActionResult<IEnumerable<Department>>> GetDepartmentsByType(DepartmentType type)
        {
            return await _context.Departments
                .Where(d => d.Type == type)
                .Include(d => d.SkillsDevelopmentProvider)
                .Include(d => d.Users)
                .ToListAsync();
        }

        // GET: api/Departments/BySDP/{sdpId}
        [HttpGet("BySDP/{sdpId}")]
        public async Task<ActionResult<IEnumerable<Department>>> GetDepartmentsBySDP(int sdpId)
        {
            return await _context.Departments
                .Where(d => d.SkillsDevelopmentProviderId == sdpId)
                .Include(d => d.SkillsDevelopmentProvider)
                .Include(d => d.Users)
                .ToListAsync();
        }

        // GET: api/Departments/{id}/Users
        [HttpGet("{id}/Users")]
        public async Task<ActionResult<IEnumerable<User>>> GetDepartmentUsers(int id)
        {
            var department = await _context.Departments
                .Include(d => d.Users)
                .FirstOrDefaultAsync(d => d.Id == id);

            if (department == null)
            {
                return NotFound();
            }

            return Ok(department.Users);
        }

        // GET: api/Departments/{id}/Users/ByRole/{role}
        [HttpGet("{id}/Users/ByRole/{role}")]
        public async Task<ActionResult<IEnumerable<User>>> GetDepartmentUsersByRole(int id, UserRole role)
        {
            var department = await _context.Departments
                .Include(d => d.Users.Where(u => u.Role == role))
                .FirstOrDefaultAsync(d => d.Id == id);

            if (department == null)
            {
                return NotFound();
            }

            return Ok(department.Users);
        }

        // PUT: api/Departments/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutDepartment(int id, Department department)
        {
            if (id != department.Id)
            {
                return BadRequest();
            }

            department.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
            _context.Entry(department).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!DepartmentExists(id))
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

        // POST: api/Departments
        [HttpPost]
        public async Task<ActionResult<Department>> PostDepartment(DepartmentCreateRequest request)
        {
            try
            {
                _logger.LogInformation("Creating department: {DepartmentName} for SDP ID: {SdpId}", request.Name, request.SkillsDevelopmentProviderId);

                // Check if manager email already exists
                if (!string.IsNullOrEmpty(request.ManagerEmail))
                {
                    var existingUser = await _context.Users
                        .FirstOrDefaultAsync(u => u.Email == request.ManagerEmail);
                    
                    if (existingUser != null)
                    {
                        _logger.LogWarning("User with email {Email} already exists", request.ManagerEmail);
                        return BadRequest(new { message = "A user with this email already exists" });
                    }
                }

                // Create department from request
                var department = new Department
                {
                    Name = request.Name,
                    Description = request.Description,
                    Type = request.Type,
                    ManagerFirstName = request.ManagerFirstName,
                    ManagerSurname = request.ManagerSurname,
                    ManagerEmail = request.ManagerEmail,
                    SkillsDevelopmentProviderId = request.SkillsDevelopmentProviderId,
                    Status = DepartmentStatus.Active,
                    CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc),
                    UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc)
                };
                
                _context.Departments.Add(department);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Department created with ID: {DepartmentId}", department.Id);

                // Create user account for department manager if manager details are provided
                if (!string.IsNullOrEmpty(department.ManagerEmail) && 
                    !string.IsNullOrEmpty(department.ManagerFirstName) && 
                    !string.IsNullOrEmpty(department.ManagerSurname))
                {
                    // Generate credentials
                    var username = department.ManagerEmail; // Use email as username
                    var password = _dataEncryptionService.GenerateSecurePassword();
                    var hashedPassword = _passwordHashingService.HashPassword(password);

                    // Determine user role based on department type
                    UserRole userRole = department.Type switch
                    {
                        DepartmentType.AdministratorManager => UserRole.SDPAdministrator,
                        DepartmentType.LogisticManager => UserRole.SDPLogistics,
                        DepartmentType.FinancialManager => UserRole.SDPFinance,
                        DepartmentType.QualityAssuranceManager => UserRole.TrainingManager,
                        DepartmentType.ITManager => UserRole.SDPIT,
                        DepartmentType.TrainingManager => UserRole.TrainingManager,
                        _ => UserRole.SDPAdministrator
                    };

                    // Create user account
                    var managerUser = new User
                    {
                        FirstName = department.ManagerFirstName,
                        LastName = department.ManagerSurname,
                        Username = username,
                        Email = department.ManagerEmail,
                        PasswordHash = hashedPassword,
                        Role = userRole,
                        Status = UserStatus.Active,
                        SkillsDevelopmentProviderId = department.SkillsDevelopmentProviderId,
                        DepartmentId = department.Id,
                        CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc),
                        UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc)
                    };

                    _context.Users.Add(managerUser);
                    await _context.SaveChangesAsync();
                    _logger.LogInformation("Manager user created with ID: {UserId} for department {DepartmentId}", managerUser.Id, department.Id);

                    // Send welcome email with credentials
                    bool emailSent = false;
                    try 
                    {
                        emailSent = await _emailService.SendWelcomeEmailAsync(
                            department.ManagerEmail,
                            $"{department.ManagerFirstName} {department.ManagerSurname}",
                            username,
                            password
                        );

                        if (!emailSent)
                        {
                            _logger.LogWarning("Failed to send welcome email to {Email} for department {DepartmentName}", 
                                department.ManagerEmail, department.Name);
                        }
                    }
                    catch (Exception emailEx)
                    {
                        _logger.LogError(emailEx, "Exception while sending welcome email to {Email}", department.ManagerEmail);
                    }

                    // Include credentials in response if email failed so admin can share manually
                    if (!emailSent)
                    {
                        var createdWithCreds = await _context.Departments
                            .Include(d => d.SkillsDevelopmentProvider)
                            .Include(d => d.Users)
                            .FirstOrDefaultAsync(d => d.Id == department.Id);

                        return CreatedAtAction("GetDepartment", new { id = department.Id }, new
                        {
                            department = createdWithCreds ?? (object)department,
                            emailSent = false,
                            message = "Department created. Email could not be sent — save these credentials:",
                            adminUsername = username,
                            temporaryPassword = password
                        });
                    }
                }

                // Reload the department with relationships
                var createdDepartment = await _context.Departments
                    .Include(d => d.SkillsDevelopmentProvider)
                    .Include(d => d.Users)
                    .FirstOrDefaultAsync(d => d.Id == department.Id);

                return CreatedAtAction("GetDepartment", new { id = department.Id }, createdDepartment ?? department);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating department: {DepartmentName}", request.Name);
                return StatusCode(500, new { message = "An error occurred while creating the department", error = ex.Message });
            }
        }

        // DELETE: api/Departments/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDepartment(int id)
        {
            var department = await _context.Departments.FindAsync(id);
            if (department == null)
            {
                return NotFound();
            }

            _context.Departments.Remove(department);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool DepartmentExists(int id)
        {
            return _context.Departments.Any(e => e.Id == id);
        }

        // POST: api/Departments/{id}/resend-credentials
        [HttpPost("{id}/resend-credentials")]
        public async Task<IActionResult> ResendCredentials(int id)
        {
            try
            {
                var department = await _context.Departments.FindAsync(id);
                if (department == null)
                    return NotFound(new { message = "Department not found" });

                if (string.IsNullOrEmpty(department.ManagerEmail))
                    return BadRequest(new { message = "No manager email on record for this department" });

                var managerUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email == department.ManagerEmail && u.DepartmentId == id);

                if (managerUser == null)
                    return NotFound(new { message = "No user account found for this department manager" });

                var newPassword = _dataEncryptionService.GenerateSecurePassword();
                managerUser.PasswordHash = _passwordHashingService.HashPassword(newPassword);
                managerUser.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
                await _context.SaveChangesAsync();

                var emailSent = await _emailService.SendWelcomeEmailAsync(
                    managerUser.Email!,
                    $"{department.ManagerFirstName} {department.ManagerSurname}",
                    managerUser.Username ?? managerUser.Email!,
                    newPassword);

                if (emailSent)
                    return Ok(new { message = $"Credentials resent to {managerUser.Email}", emailSent = true });

                _logger.LogWarning("Email failed for department manager {Email} — RESEND_API_KEY set: {HasKey}, FROM_EMAIL: {From}",
                    managerUser.Email,
                    !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("RESEND_API_KEY")),
                    Environment.GetEnvironmentVariable("FROM_EMAIL") ?? "(not set)");

                return Ok(new
                {
                    message = "Password reset but email could not be sent. Save these credentials:",
                    emailSent = false,
                    adminUsername = managerUser.Username ?? managerUser.Email,
                    temporaryPassword = newPassword
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error resending credentials for department {DepartmentId}", id);
                return StatusCode(500, new { message = "An error occurred" });
            }
        }
    }
}