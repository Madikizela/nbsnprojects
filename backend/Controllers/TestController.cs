using Microsoft.AspNetCore.Mvc;
using backend.Services.Interfaces;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TestController : ControllerBase
    {
        private readonly IEmailService _emailService;
        private readonly ILogger<TestController> _logger;

        public TestController(IEmailService emailService, ILogger<TestController> logger)
        {
            _emailService = emailService;
            _logger = logger;
        }

        [HttpGet("ping")]
        public ActionResult Ping()
        {
            return Ok(new { message = "Test Controller is working!", timestamp = DateTime.UtcNow });
        }

        /// <summary>
        /// Tests SMTP configuration by sending a test email.
        /// Usage: POST /api/test/email?to=you@example.com
        /// </summary>
        [HttpPost("email")]
        public async Task<ActionResult> TestEmail([FromQuery] string to)
        {
            if (string.IsNullOrWhiteSpace(to))
                return BadRequest(new { message = "Provide ?to=recipient@email.com in the query string" });

            // Read SMTP config and report it (without leaking the password)
            var smtpHost = Environment.GetEnvironmentVariable("SMTP_HOST") ?? "(not set)";
            var smtpPort = Environment.GetEnvironmentVariable("SMTP_PORT") ?? "(not set)";
            var smtpUser = Environment.GetEnvironmentVariable("SMTP_USER") ?? "(not set)";
            var smtpPassSet = !string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("SMTP_PASS"));
            var fromEmail = Environment.GetEnvironmentVariable("FROM_EMAIL") ?? "(not set)";

            _logger.LogInformation("Email test requested. SMTP config — Host:{Host} Port:{Port} User:{User} PassSet:{PassSet}",
                smtpHost, smtpPort, smtpUser, smtpPassSet);

            var config = new
            {
                smtpHost,
                smtpPort,
                smtpUser,
                smtpPassConfigured = smtpPassSet,
                fromEmail
            };

            if (!smtpPassSet || smtpUser == "(not set)")
            {
                return Ok(new
                {
                    success = false,
                    message = "SMTP credentials not configured. Set SMTP_USER and SMTP_PASS in Railway Variables.",
                    config
                });
            }

            var sent = await _emailService.SendEmailAsync(
                to,
                "NBSN Email Test ✅",
                $@"<h2>Email Test Successful</h2>
                   <p>If you receive this, your SMTP configuration is working correctly.</p>
                   <p><strong>Sent at:</strong> {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC</p>
                   <p><strong>SMTP Host:</strong> {smtpHost}:{smtpPort}</p>
                   <p><strong>From:</strong> {fromEmail}</p>"
            );

            if (sent)
            {
                return Ok(new { success = true, message = $"Test email sent successfully to {to}", config });
            }
            else
            {
                return Ok(new
                {
                    success = false,
                    message = "Email send failed — check Railway logs for the SMTP error details.",
                    config
                });
            }
        }
    }
}
