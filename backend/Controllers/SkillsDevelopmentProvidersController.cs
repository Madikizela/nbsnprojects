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
}