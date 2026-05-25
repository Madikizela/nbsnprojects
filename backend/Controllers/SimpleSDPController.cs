using Microsoft.AspNetCore.Mvc;
using backend.Models;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SimpleSDPController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SimpleSDPController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("ping")]
        public ActionResult Ping()
        {
            return Ok(new { message = "Simple SDP Controller is working!", timestamp = DateTime.UtcNow });
        }

        [HttpGet("debug")]
        public async Task<ActionResult> Debug()
        {
            try
            {
                var projectCount = _context.Projects.Count();
                var userCount = _context.Users.Count();
                
                return Ok(new { 
                    message = "Simple SDP Debug", 
                    projectCount = projectCount,
                    userCount = userCount,
                    timestamp = DateTime.UtcNow 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error occurred", error = ex.Message });
            }
        }
    }
}