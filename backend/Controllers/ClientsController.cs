using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using backend.Services.Interfaces;
using backend.Services;
using System.Text.Json;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ClientsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IDataEncryptionService _dataEncryptionService;
        private readonly IEmailService _emailService;
        private readonly IPasswordHashingService _passwordHashingService;
        private readonly ILogger<ClientsController> _logger;

        public ClientsController(
            ApplicationDbContext context,
            IDataEncryptionService dataEncryptionService,
            IEmailService emailService,
            IPasswordHashingService passwordHashingService,
            ILogger<ClientsController> logger)
        {
            _context = context;
            _dataEncryptionService = dataEncryptionService;
            _emailService = emailService;
            _passwordHashingService = passwordHashingService;
            _logger = logger;
        }

        // GET: api/Clients
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Client>>> GetClients()
        {
            try
            {
                var clients = await _context.Clients
                    // .Include(c => c.Users) // Temporarily disabled to isolate serialization issue
                    // .Include(c => c.Departments) // Temporarily disabled to isolate serialization issue
                    // .Include(c => c.SkillsDevelopmentProviders) // Temporarily disabled due to database schema mismatch
                    .ToListAsync();

                return Ok(clients);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving clients");
                return StatusCode(500, "Internal server error");
            }
        }

        // GET: api/Clients/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Client>> GetClient(int id)
        {
            var client = await _context.Clients
                .Include(c => c.Users)
                // .Include(c => c.SkillsDevelopmentProviders) // Temporarily removed due to database schema mismatch
                .FirstOrDefaultAsync(c => c.Id == id);

            if (client == null)
            {
                return NotFound();
            }

            return client;
        }

        // GET: api/Clients/{id}/Users
        [HttpGet("{id}/Users")]
        public async Task<ActionResult<IEnumerable<User>>> GetClientUsers(int id)
        {
            var client = await _context.Clients
                .Include(c => c.Users)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (client == null)
            {
                return NotFound();
            }

            return Ok(client.Users);
        }

        // GET: api/Clients/{id}/SDPs
        [HttpGet("{id}/SDPs")]
        public async Task<ActionResult<IEnumerable<SkillsDevelopmentProvider>>> GetClientSDPs(int id)
        {
            var client = await _context.Clients
                // .Include(c => c.SkillsDevelopmentProviders) // Temporarily removed due to database schema mismatch
                .FirstOrDefaultAsync(c => c.Id == id);

            if (client == null)
            {
                return NotFound();
            }

            // return Ok(client.SkillsDevelopmentProviders); // Temporarily removed due to database schema mismatch
            return Ok(new List<SkillsDevelopmentProvider>()); // Return empty list temporarily
        }

        // PUT: api/Clients/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutClient(int id, Client client)
        {
            if (id != client.Id)
            {
                return BadRequest();
            }

            client.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
            _context.Entry(client).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ClientExists(id))
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

        // POST: api/Clients/register
        [HttpPost("register")]
        public async Task<ActionResult<ClientRegistrationResponse>> RegisterClient([FromBody] ClientRegistrationRequest request)
        {
            try
            {
                _logger.LogInformation("Received client registration request");

                // Resolve client data — prefer plain fields, fall back to legacy encrypted payload
                ClientRegistrationData clientData;

                if (!string.IsNullOrWhiteSpace(request.Name) && !string.IsNullOrWhiteSpace(request.Email))
                {
                    // Plain JSON path (current)
                    clientData = new ClientRegistrationData
                    {
                        Name          = request.Name,
                        Email         = request.Email,
                        Description   = request.Description,
                        Address       = request.Address,
                        PhoneNumber   = request.PhoneNumber,
                        ContactPerson = request.ContactPerson,
                        WebsiteLink   = request.WebsiteLink,
                        AttendanceType = request.AttendanceType,
                        LogoUrl       = request.LogoUrl
                    };
                }
                else if (!string.IsNullOrWhiteSpace(request.EncryptedClientData))
                {
                    // Legacy encrypted path
                    try
                    {
                        clientData = _dataEncryptionService.DecryptObject<ClientRegistrationData>(request.EncryptedClientData);
                    }
                    catch (Exception decryptEx)
                    {
                        _logger.LogError(decryptEx, "Failed to decrypt client registration data.");
                        return BadRequest(new { message = "Failed to decrypt registration data. Please ensure the encryption key matches, or send plain JSON fields instead.", error = decryptEx.Message });
                    }
                }
                else
                {
                    return BadRequest(new { message = "Client name and email are required." });
                }

                _logger.LogInformation("Client data resolved: Name={Name}, Email={Email}", clientData.Name, clientData.Email);
                
                // Validate required fields
                if (string.IsNullOrWhiteSpace(clientData.Name) || string.IsNullOrWhiteSpace(clientData.Email))
                {
                    _logger.LogWarning("Validation failed - Name: '{Name}', Email: '{Email}'", clientData.Name, clientData.Email);
                    return BadRequest("Client name and email are required");
                }

                // Check if client with same email, name, or phone number already exists
                var existingClientByEmail = await _context.Clients
                    .FirstOrDefaultAsync(c => c.Email == clientData.Email);
                
                if (existingClientByEmail != null)
                {
                    return Conflict("A client with this email address already exists");
                }

                var existingClientByName = await _context.Clients
                    .FirstOrDefaultAsync(c => c.Name.ToLower() == clientData.Name.ToLower());
                
                if (existingClientByName != null)
                {
                    return Conflict("A client with this name already exists");
                }

                // Check phone number if provided
                if (!string.IsNullOrWhiteSpace(clientData.PhoneNumber))
                {
                    var existingClientByPhone = await _context.Clients
                        .FirstOrDefaultAsync(c => c.PhoneNumber == clientData.PhoneNumber);
                    
                    if (existingClientByPhone != null)
                    {
                        return Conflict("A client with this phone number already exists");
                    }
                }

                // Create new client
                var client = new Client
                {
                    Name = clientData.Name,
                    Description = clientData.Description,
                    Address = clientData.Address,
                    PhoneNumber = clientData.PhoneNumber,
                    Email = clientData.Email,
                    ContactPerson = clientData.ContactPerson,
                    Status = ClientStatus.Active,
                    CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc),
                    UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc)
                };

                _context.Clients.Add(client);
                await _context.SaveChangesAsync();

                // Generate credentials for the client admin user
                // Use email as username to avoid conflicts
                var username = clientData.Email;
                
                var password = _dataEncryptionService.GenerateSecurePassword();
                var hashedPassword = _passwordHashingService.HashPassword(password);
                
                // Log password for testing purposes (remove in production)
                _logger.LogInformation("Generated password for client admin {Email}: {Password}", clientData.Email, password);

                // Create client admin user
                var clientAdmin = new User
                {
                    Username = username,
                    FirstName = clientData.ContactPerson ?? "Admin",
                    LastName = "",
                    Email = clientData.Email,
                    PasswordHash = hashedPassword,
                    PhoneNumber = clientData.PhoneNumber,
                    Role = UserRole.ClientAdmin,
                    Status = UserStatus.Active,
                    ClientId = client.Id,
                    CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc),
                    UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc)
                };

                _context.Users.Add(clientAdmin);
                await _context.SaveChangesAsync();

                // Send welcome email with credentials
                var emailSent = await _emailService.SendWelcomeEmailAsync(
                    clientData.Email, 
                    clientData.Name, 
                    username, 
                    password);

                if (!emailSent)
                {
                    _logger.LogWarning("Failed to send welcome email to {Email} for client {ClientName}", 
                        clientData.Email, clientData.Name);
                }

                var response = new ClientRegistrationResponse
                {
                    ClientId = client.Id,
                    ClientName = client.Name,
                    Message = emailSent
                        ? "Client registered successfully. Login credentials have been sent to the provided email."
                        : "Client registered successfully. Email delivery is pending domain verification on Resend. Credentials are shown below — please share them manually.",
                    EmailSent = emailSent,
                    CreatedAt = client.CreatedAt,
                    AdminUsername = !emailSent ? username : null,
                    TemporaryPassword = !emailSent ? password : null
                };

                return CreatedAtAction("GetClient", new { id = client.Id }, response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during client registration");
                return StatusCode(500, "An error occurred while registering the client");
            }
        }

        // POST: api/Clients
        [HttpPost]
        public async Task<ActionResult<Client>> PostClient(Client client)
        {
            // Validate required fields
            if (string.IsNullOrWhiteSpace(client.Name) || string.IsNullOrWhiteSpace(client.Email))
            {
                return BadRequest("Client name and email are required");
            }

            // Check if client with same email, name, or phone number already exists
            var existingClientByEmail = await _context.Clients
                .FirstOrDefaultAsync(c => c.Email == client.Email);
            
            if (existingClientByEmail != null)
            {
                return Conflict("A client with this email address already exists");
            }

            var existingClientByName = await _context.Clients
                .FirstOrDefaultAsync(c => c.Name.ToLower() == client.Name.ToLower());
            
            if (existingClientByName != null)
            {
                return Conflict("A client with this name already exists");
            }

            // Check phone number if provided
            if (!string.IsNullOrWhiteSpace(client.PhoneNumber))
            {
                var existingClientByPhone = await _context.Clients
                    .FirstOrDefaultAsync(c => c.PhoneNumber == client.PhoneNumber);
                
                if (existingClientByPhone != null)
                {
                    return Conflict("A client with this phone number already exists");
                }
            }

            client.CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
            client.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
            client.Status = ClientStatus.Active;
            
            _context.Clients.Add(client);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetClient", new { id = client.Id }, client);
        }

        // DELETE: api/Clients/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteClient(int id)
        {
            var client = await _context.Clients.FindAsync(id);
            if (client == null)
            {
                return NotFound();
            }

            _context.Clients.Remove(client);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // POST: api/Clients/{id}/resend-credentials
        // Resets the admin user's password and resends welcome email with new credentials
        [HttpPost("{id}/resend-credentials")]
        public async Task<IActionResult> ResendCredentials(int id)
        {
            try
            {
                var client = await _context.Clients.FindAsync(id);
                if (client == null)
                    return NotFound(new { message = "Client not found" });

                // Find the admin user for this client
                var adminUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.ClientId == id && u.Role == UserRole.ClientAdmin);

                if (adminUser == null)
                    return NotFound(new { message = "No admin user found for this client" });

                // Generate a fresh password
                var newPassword = _dataEncryptionService.GenerateSecurePassword();
                adminUser.PasswordHash = _passwordHashingService.HashPassword(newPassword);
                adminUser.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
                await _context.SaveChangesAsync();

                // Resend welcome email with new credentials
                var emailSent = await _emailService.SendWelcomeEmailAsync(
                    adminUser.Email!,
                    client.Name,
                    adminUser.Username ?? adminUser.Email!,
                    newPassword);

                if (emailSent)
                {
                    _logger.LogInformation("Credentials resent to {Email} for client {ClientName}", adminUser.Email, client.Name);
                    return Ok(new { message = $"Credentials resent successfully to {adminUser.Email}", emailSent = true });
                }
                else
                {
                    _logger.LogWarning("Failed to send credentials email to {Email}", adminUser.Email);
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
                _logger.LogError(ex, "Error resending credentials for client {ClientId}", id);
                return StatusCode(500, new { message = "An error occurred while resending credentials" });
            }
        }

        private bool ClientExists(int id)
        {
            return _context.Clients.Any(e => e.Id == id);
        }
    }
}