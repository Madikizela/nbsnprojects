using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TestDbController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public TestDbController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("systemadmin")]
        public async Task<IActionResult> GetSystemAdmin()
        {
            try
            {
                var systemAdmin = await _context.SystemAdmins
                    .FirstOrDefaultAsync(sa => sa.Email.ToLower() == "admin@system.local");

                if (systemAdmin == null)
                {
                    return NotFound(new { message = "SystemAdmin not found" });
                }

                return Ok(new 
                { 
                    Id = systemAdmin.Id,
                    Email = systemAdmin.Email,
                    Username = systemAdmin.Username,
                    Status = systemAdmin.Status
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Database error", error = ex.Message, stackTrace = ex.StackTrace });
            }
        }

        [HttpGet("test")]
        public IActionResult Test()
        {
            return Ok(new { message = "Test endpoint working" });
        }
    }
}