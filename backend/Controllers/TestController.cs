using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TestController : ControllerBase
    {
        [HttpGet("ping")]
        public ActionResult Ping()
        {
            return Ok(new { message = "Test Controller is working!", timestamp = DateTime.UtcNow });
        }
    }
}