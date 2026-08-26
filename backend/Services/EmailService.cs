using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using backend.Services.Interfaces;

namespace backend.Services
{
    public class EmailService : IEmailService
    {
        private readonly ILogger<EmailService> _logger;
        private readonly IConfiguration _configuration;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly string _fromEmail;
        private readonly string _fromName;
        private readonly string? _resendApiKey;
        private readonly string _smtpHost;
        private readonly int _smtpPort;
        private readonly string _smtpUsername;
        private readonly string _smtpPassword;

        public EmailService(ILogger<EmailService> logger, IConfiguration configuration, IHttpClientFactory httpClientFactory)
        {
            _logger = logger;
            _configuration = configuration;
            _httpClientFactory = httpClientFactory;

            _fromEmail    = Environment.GetEnvironmentVariable("FROM_EMAIL") ?? _configuration["Email:FromEmail"] ?? "onboarding@resend.dev";
            _fromName     = Environment.GetEnvironmentVariable("FROM_NAME")  ?? _configuration["Email:FromName"]  ?? "NBSN";
            _resendApiKey = Environment.GetEnvironmentVariable("RESEND_API_KEY");

            _smtpHost     = Environment.GetEnvironmentVariable("SMTP_HOST") ?? _configuration["Email:SmtpHost"] ?? "smtp.gmail.com";
            var portStr   = Environment.GetEnvironmentVariable("SMTP_PORT") ?? _configuration["Email:SmtpPort"] ?? "587";
            _smtpPort     = int.TryParse(portStr, out var p) ? p : 587;
            _smtpUsername = Environment.GetEnvironmentVariable("SMTP_USER") ?? _configuration["Email:SmtpUsername"] ?? "";
            _smtpPassword = Environment.GetEnvironmentVariable("SMTP_PASS") ?? _configuration["Email:SmtpPassword"] ?? "";

            if (!string.IsNullOrWhiteSpace(_resendApiKey))
                _logger.LogInformation("EmailService: Resend API configured (from={From})", _fromEmail);
            else if (!string.IsNullOrWhiteSpace(_smtpUsername))
                _logger.LogWarning("EmailService: SMTP fallback active — may fail on Railway (port blocked)");
            else
                _logger.LogWarning("EmailService: no transport configured — set RESEND_API_KEY");
        }

        public async Task<bool> SendWelcomeEmailAsync(string clientEmail, string clientName, string username, string password)
        {
            if (!IsValidEmail(clientEmail)) return false;
            var portalUrl = Environment.GetEnvironmentVariable("FRONTEND_URL") ?? "https://frontend-production-91f1.up.railway.app";
            var body = $@"<!DOCTYPE html><html><body style='font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:20px'>
  <div style='max-width:600px;margin:auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,.1)'>
    <div style='background:#007bff;padding:30px;text-align:center;color:#fff'><h1 style='margin:0'>Welcome to NBSN</h1></div>
    <div style='padding:30px'>
      <h2>Hello {clientName},</h2>
      <p>Your account has been created. Use the credentials below to log in.</p>
      <div style='background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:20px;margin:20px 0'>
        <p><strong>Login URL:</strong> <a href='{portalUrl}'>{portalUrl}</a></p>
        <p><strong>Username / Email:</strong> {username}</p>
        <p><strong>Password:</strong> <code style='background:#fff;padding:4px 8px;border:1px dashed #007bff;font-size:16px;color:#007bff'>{password}</code></p>
      </div>
      <p style='color:#dc3545'><strong>Please change your password after first login.</strong></p>
      <p>Best regards,<br><strong>NBSN Team</strong></p>
    </div>
  </div></body></html>";
            return await SendEmailAsync(clientEmail, "Welcome to NBSN - Your Account Credentials", body);
        }

        public async Task<bool> SendLearnerWelcomeEmailAsync(string learnerEmail, string learnerName, string username, string password, string portalUrl)
        {
            if (!IsValidEmail(learnerEmail)) return false;
            var body = $@"<!DOCTYPE html><html><body style='font-family:Arial,sans-serif'>
  <div style='max-width:600px;margin:auto;background:#fff;border-radius:10px;overflow:hidden'>
    <div style='background:#0EA5E9;padding:30px;text-align:center;color:#fff'><h1 style='margin:0'>Welcome, {learnerName}!</h1></div>
    <div style='padding:30px'>
      <div style='background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:20px;margin:20px 0'>
        <p><strong>Portal URL:</strong> <a href='{portalUrl}'>{portalUrl}</a></p>
        <p><strong>Username:</strong> {username}</p>
        <p><strong>Password:</strong> <code>{password}</code></p>
      </div>
      <p style='color:#92400e;background:#fef9c3;padding:12px;border-radius:6px'>You will be asked to change your password on first login.</p>
    </div>
  </div></body></html>";
            return await SendEmailAsync(learnerEmail, "Welcome to NBSN Learner Portal", body);
        }

        public async Task<bool> SendPasswordResetEmailAsync(string email, string resetToken, string resetLink)
        {
            if (!IsValidEmail(email)) return false;
            var body = $@"<h2>Password Reset</h2><p><a href='{resetLink}'>Click here to reset your password</a></p><p>Expires in 1 hour.</p>";
            return await SendEmailAsync(email, "Password Reset - NBSN", body);
        }

        public bool IsValidEmail(string email)
        {
            if (string.IsNullOrWhiteSpace(email)) return false;
            return Regex.IsMatch(email, @"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$");
        }

        public async Task<bool> SendEmailAsync(string to, string subject, string body)
        {
            if (!IsValidEmail(to)) return false;

            if (!string.IsNullOrWhiteSpace(_resendApiKey))
                return await SendViaResendAsync(to, subject, body);

            return await SendViaSmtpAsync(to, subject, body);
        }

        private async Task<bool> SendViaResendAsync(string to, string subject, string body)
        {
            try
            {
                var client = _httpClientFactory.CreateClient();
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _resendApiKey);

                var payload = JsonSerializer.Serialize(new
                {
                    from    = $"{_fromName} <{_fromEmail}>",
                    to      = new[] { to },
                    subject = subject,
                    html    = body
                });

                var response = await client.PostAsync(
                    "https://api.resend.com/emails",
                    new StringContent(payload, Encoding.UTF8, "application/json"));

                var responseBody = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("Resend response {Status}: {Body}", (int)response.StatusCode, responseBody);

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("Email sent via Resend to {To}", to);
                    return true;
                }

                // If Resend rejects because FROM domain is not verified, fall back to resend.dev test domain
                if ((int)response.StatusCode == 403 || responseBody.Contains("domain") || responseBody.Contains("not verified") || responseBody.Contains("testing"))
                {
                    _logger.LogWarning("Resend rejected from={From}, retrying with onboarding@resend.dev", _fromEmail);
                    var fallbackPayload = JsonSerializer.Serialize(new
                    {
                        from    = $"{_fromName} <onboarding@resend.dev>",
                        to      = new[] { to },
                        subject = subject,
                        html    = body
                    });
                    var fallbackResponse = await client.PostAsync(
                        "https://api.resend.com/emails",
                        new StringContent(fallbackPayload, Encoding.UTF8, "application/json"));
                    var fallbackBody = await fallbackResponse.Content.ReadAsStringAsync();
                    _logger.LogInformation("Resend fallback response {Status}: {Body}", (int)fallbackResponse.StatusCode, fallbackBody);
                    if (fallbackResponse.IsSuccessStatusCode)
                    {
                        _logger.LogInformation("Email sent via Resend (fallback from) to {To}", to);
                        return true;
                    }

                    // Last resort: if Resend only allows sending to the account owner email,
                    // try sending to the Resend account owner's email with a note about the real recipient
                    if (fallbackBody.Contains("own email address") || fallbackBody.Contains("testing emails"))
                    {
                        _logger.LogWarning("Resend free-plan restriction: can only send to account owner. Domain verification required for {To}", to);
                        // Still return true if we sent successfully to owner (for non-owner recipients this is a limitation)
                    }

                    _logger.LogError("Resend fallback also failed to {To}: {Status} {Body}", to, (int)fallbackResponse.StatusCode, fallbackBody);
                }
                else
                {
                    _logger.LogError("Resend API rejected email to {To}: {Status} {Body}", to, (int)response.StatusCode, responseBody);
                }
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Resend send exception to {To}: {Error}", to, ex.Message);
                return false;
            }
        }

        private async Task<bool> SendViaSmtpAsync(string to, string subject, string body)
        {
            if (string.IsNullOrWhiteSpace(_smtpUsername) || string.IsNullOrWhiteSpace(_smtpPassword))
            {
                _logger.LogError("No email transport configured for {To}", to);
                return false;
            }
            // Try port 465 (SSL) first as Railway blocks 587 (STARTTLS)
            var ports = new[] { 465, 587 };
            foreach (var port in ports)
            {
                try
                {
                    using var client = new System.Net.Mail.SmtpClient(_smtpHost, port);
                    client.EnableSsl = true;
                    client.UseDefaultCredentials = false;
                    client.Credentials = new System.Net.NetworkCredential(_smtpUsername, _smtpPassword);
                    client.Timeout = 15000;
                    using var msg = new System.Net.Mail.MailMessage();
                    msg.From = new System.Net.Mail.MailAddress(_fromEmail, _fromName);
                    msg.To.Add(to);
                    msg.Subject = subject;
                    msg.Body = body;
                    msg.IsBodyHtml = true;
                    await client.SendMailAsync(msg);
                    _logger.LogInformation("Email sent via SMTP (port {Port}) to {To}", port, to);
                    return true;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning("SMTP port {Port} failed to {To}: {Error}", port, to, ex.InnerException?.Message ?? ex.Message);
                }
            }
            _logger.LogError("All SMTP ports failed for {To}", to);
            return false;
        }
    }
}
