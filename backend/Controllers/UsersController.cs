using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public UsersController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Users
        [HttpGet]
        public async Task<ActionResult<IEnumerable<User>>> GetUsers()
        {
            return await _context.Users
                .Include(u => u.Client)
                .Include(u => u.SkillsDevelopmentProvider)
                .Include(u => u.Department)
                .ToListAsync();
        }

        // GET: api/Users/5
        [HttpGet("{id}")]
        public async Task<ActionResult<User>> GetUser(int id)
        {
            var user = await _context.Users
                .Include(u => u.Client)
                .Include(u => u.SkillsDevelopmentProvider)
                .Include(u => u.Department)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null)
            {
                return NotFound();
            }

            return user;
        }

        // GET: api/Users/ByRole/{role}
        [HttpGet("ByRole/{role}")]
        public async Task<ActionResult<IEnumerable<User>>> GetUsersByRole(UserRole role)
        {
            return await _context.Users
                .Where(u => u.Role == role)
                .Include(u => u.Client)
                .Include(u => u.SkillsDevelopmentProvider)
                .Include(u => u.Department)
                .ToListAsync();
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
                    u.Id,
                    u.FirstName,
                    u.LastName,
                    u.Email,
                    Role = u.Role.ToString(),
                    Status = u.Status.ToString(),
                    DepartmentName = u.Department != null ? u.Department.Name : null
                })
                .ToListAsync();

            return Ok(users);
        }

        // GET: api/Users/BySDP/{sdpId}
        [HttpGet("BySDP/{sdpId}")]
        public async Task<ActionResult<IEnumerable<User>>> GetUsersBySDP(int sdpId)
        {
            return await _context.Users
                .Where(u => u.SkillsDevelopmentProviderId == sdpId)
                .Include(u => u.Client)
                .Include(u => u.SkillsDevelopmentProvider)
                .Include(u => u.Department)
                .ToListAsync();
        }

        // GET: api/Users/ByDepartment/{departmentId}
        [HttpGet("ByDepartment/{departmentId}")]
        public async Task<ActionResult<IEnumerable<User>>> GetUsersByDepartment(int departmentId)
        {
            return await _context.Users
                .Where(u => u.DepartmentId == departmentId)
                .Include(u => u.Client)
                .Include(u => u.SkillsDevelopmentProvider)
                .Include(u => u.Department)
                .ToListAsync();
        }

        // PUT: api/Users/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutUser(int id, User user)
        {
            if (id != user.Id)
            {
                return BadRequest();
            }

            user.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
            _context.Entry(user).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!UserExists(id))
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

        // PUT: api/Users/Profile/5
        [HttpPut("Profile/{id}")]
        public async Task<IActionResult> UpdateProfile(int id, [FromBody] dynamic profileUpdate)
        {
            try
            {
                string profileJson = profileUpdate.ToString();
                Console.WriteLine($"UpdateProfile called for user {id}. Data: {profileJson}");
                
                var user = await _context.Users.FindAsync(id);
                if (user == null)
                {
                    return NotFound(new { message = "User not found" });
                }

                // Extract fields manually from dynamic to avoid validation issues
                var data = System.Text.Json.JsonSerializer.Deserialize<System.Text.Json.JsonElement>(profileJson);
                
                if (data.TryGetProperty("firstName", out var firstName)) user.FirstName = firstName.GetString() ?? user.FirstName;
                if (data.TryGetProperty("lastName", out var lastName)) user.LastName = lastName.GetString() ?? user.LastName;
                if (data.TryGetProperty("practiceNumber", out var practiceNumber)) user.PracticeNumber = practiceNumber.GetString();
                if (data.TryGetProperty("initials", out var initials)) user.Initials = initials.GetString();
                if (data.TryGetProperty("signature", out var signature)) user.Signature = signature.GetString();
                
                user.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);

                await _context.SaveChangesAsync();
                return Ok(user);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating profile: {ex.Message}");
                return StatusCode(500, new { message = "Error updating profile", error = ex.Message });
            }
        }

        // POST: api/Users
        [HttpPost]
        public async Task<ActionResult<User>> PostUser(User user)
        {
            user.CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
            user.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
            
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetUser", new { id = user.Id }, user);
        }

        // DELETE: api/Users/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound();
            }

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool UserExists(int id)
        {
            return _context.Users.Any(e => e.Id == id);
        }
    }
}