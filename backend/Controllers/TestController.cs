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

            var smtpHost    = Environment.GetEnvironmentVariable("SMTP_HOST")  ?? "(not set)";
            var smtpPort    = Environment.GetEnvironmentVariable("SMTP_PORT")  ?? "(not set)";
            var smtpUser    = Environment.GetEnvironmentVariable("SMTP_USER")  ?? "(not set)";
            var smtpPassSet = !string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("SMTP_PASS"));
            var fromEmail   = Environment.GetEnvironmentVariable("FROM_EMAIL") ?? "(not set)";

            var config = new { smtpHost, smtpPort, smtpUser, smtpPassConfigured = smtpPassSet, fromEmail };

            if (!smtpPassSet || smtpUser == "(not set)")
                return Ok(new { success = false, message = "SMTP credentials not configured.", config });

            // Send directly with SmtpClient so we can capture the exact error
            string? errorDetail = null;
            bool sent = false;
            try
            {
                using var client = new System.Net.Mail.SmtpClient(smtpHost, int.Parse(smtpPort == "(not set)" ? "587" : smtpPort));
                client.EnableSsl = true;
                client.UseDefaultCredentials = false;
                client.Credentials = new System.Net.NetworkCredential(
                    smtpUser,
                    Environment.GetEnvironmentVariable("SMTP_PASS"));

                using var msg = new System.Net.Mail.MailMessage();
                msg.From = new System.Net.Mail.MailAddress(fromEmail, "NBSN Test");
                msg.To.Add(to);
                msg.Subject = "NBSN Email Test ✅";
                msg.Body = $"<h2>Email test successful!</h2><p>Sent at {DateTime.UtcNow:u}</p>";
                msg.IsBodyHtml = true;

                await client.SendMailAsync(msg);
                sent = true;
            }
            catch (Exception ex)
            {
                errorDetail = ex.InnerException?.Message ?? ex.Message;
                _logger.LogError(ex, "Test email failed: {Error}", errorDetail);
            }

            if (sent)
                return Ok(new { success = true, message = $"✅ Email sent to {to}. Check your inbox.", config });

            return Ok(new
            {
                success = false,
                message = "❌ Email failed",
                error = errorDetail,
                config,
                tips = new[]
                {
                    "If error contains '5.7.8' or 'BadCredentials' → wrong App Password",
                    "If error contains '5.7.0' or 'not enabled' → enable 2FA and create an App Password",
                    "If error contains 'connection' → port 587 may be blocked, try SMTP_PORT=465",
                    "Make sure SMTP_PASS is the 16-char App Password (no spaces), NOT your Gmail login password"
                }
            });
        }
    }
}
