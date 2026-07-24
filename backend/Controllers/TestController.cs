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
        /// Returns SMTP config status (no password values exposed).
        /// Usage: GET /api/test/email-config
        /// </summary>
        [HttpGet("email-config")]
        public ActionResult EmailConfig()
        {
            var smtpHost     = Environment.GetEnvironmentVariable("SMTP_HOST")  ?? "(not set)";
            var smtpPort     = Environment.GetEnvironmentVariable("SMTP_PORT")  ?? "(not set)";
            var smtpUser     = Environment.GetEnvironmentVariable("SMTP_USER")  ?? "(not set)";
            var smtpPassSet  = !string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("SMTP_PASS"));
            var fromEmail    = Environment.GetEnvironmentVariable("FROM_EMAIL") ?? "(not set)";
            var fromName     = Environment.GetEnvironmentVariable("FROM_NAME")  ?? "(not set)";

            var configured = smtpUser != "(not set)" && smtpPassSet;

            return Ok(new
            {
                configured,
                smtpHost,
                smtpPort,
                smtpUser,
                smtpPassConfigured = smtpPassSet,
                fromEmail,
                fromName,
                hint = configured ? "Credentials look set. Use POST /api/test/email?to=you@email.com to send a test." : "Set SMTP_USER and SMTP_PASS in Railway Variables."
            });
        }

        /// <summary>
        /// Sends a test email. Usage: POST /api/test/email?to=you@example.com
        /// </summary>
        [HttpPost("email")]
        public async Task<ActionResult> TestEmail([FromQuery] string to)
        {
            if (string.IsNullOrWhiteSpace(to))
                return BadRequest(new { message = "Provide ?to=recipient@email.com in the query string" });

            var resendKey   = Environment.GetEnvironmentVariable("RESEND_API_KEY");
            var smtpUser    = Environment.GetEnvironmentVariable("SMTP_USER") ?? "(not set)";
            var smtpPassSet = !string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("SMTP_PASS"));
            var fromEmail   = Environment.GetEnvironmentVariable("FROM_EMAIL") ?? "(not set)";

            var transport = !string.IsNullOrWhiteSpace(resendKey) ? "Resend API"
                : smtpUser != "(not set)" ? "SMTP"
                : "none";

            _logger.LogInformation("Email test to {To} via {Transport}", to, transport);

            var sent = await _emailService.SendEmailAsync(
                to,
                "NBSN Email Test ✅",
                $"<h2>Email test successful!</h2><p>Sent at {DateTime.UtcNow:u} via {transport}</p>"
            );

            if (sent)
                return Ok(new { success = true, message = $"✅ Email sent to {to} via {transport}. Check your inbox.", transport });

            return Ok(new
            {
                success  = false,
                message  = $"❌ Email failed via {transport}",
                transport,
                resendConfigured = !string.IsNullOrWhiteSpace(resendKey),
                smtpUser,
                smtpPassConfigured = smtpPassSet,
                fromEmail,
                tips = new[]
                {
                    "RECOMMENDED: Add RESEND_API_KEY to Railway Variables (free at resend.com) — Railway blocks outbound SMTP",
                    "If using Resend: make sure FROM_EMAIL is a verified sender in your Resend account",
                    "If FROM_EMAIL is not verified in Resend, use onboarding@resend.dev as FROM_EMAIL for testing"
                }
            });
        }
    }
}
