using System.Net;
using System.Net.Mail;
using System.Text.RegularExpressions;
using backend.Services.Interfaces;

namespace backend.Services
{
    /// <summary>
    /// Implementation of email service for sending notifications and credentials
    /// </summary>
    public class EmailService : IEmailService
    {
        private readonly ILogger<EmailService> _logger;
        private readonly IConfiguration _configuration;
        private readonly string _smtpHost;
        private readonly int _smtpPort;
        private readonly string _smtpUsername;
        private readonly string _smtpPassword;
        private readonly string _fromEmail;
        private readonly string _fromName;

        public EmailService(ILogger<EmailService> logger, IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;

            // Load SMTP configuration from environment variables or appsettings.json
            _smtpHost = Environment.GetEnvironmentVariable("SMTP_HOST") ?? _configuration["Email:SmtpHost"] ?? "smtp.gmail.com";
            
            var smtpPortStr = Environment.GetEnvironmentVariable("SMTP_PORT") ?? _configuration["Email:SmtpPort"] ?? "587";
            if (!int.TryParse(smtpPortStr, out _smtpPort))
            {
                _smtpPort = 587;
            }
            
            _smtpUsername = Environment.GetEnvironmentVariable("SMTP_USER") ?? _configuration["Email:SmtpUsername"] ?? "";
            _smtpPassword = Environment.GetEnvironmentVariable("SMTP_PASS") ?? _configuration["Email:SmtpPassword"] ?? "";
            _fromEmail = Environment.GetEnvironmentVariable("FROM_EMAIL") ?? _configuration["Email:FromEmail"] ?? "noreply@company.com";
            _fromName = Environment.GetEnvironmentVariable("FROM_NAME") ?? _configuration["Email:FromName"] ?? "NBSN";

            // Safety check for placeholder values
            if (_smtpUsername.Contains("YOUR_EMAIL") || _smtpPassword.Contains("YOUR_SMTP_PASSWORD"))
            {
                _logger.LogWarning("SMTP credentials contain placeholder values. Email sending may fail.");
            }

            _logger.LogInformation("EmailService initialized — SMTP: {Host}:{Port}, User: {User}, Configured: {Configured}",
                _smtpHost, _smtpPort, _smtpUsername, !string.IsNullOrWhiteSpace(_smtpUsername) && !string.IsNullOrWhiteSpace(_smtpPassword));
        }

        /// <summary>
        /// Sends welcome email with credentials to a new client
        /// </summary>
        public async Task<bool> SendWelcomeEmailAsync(string clientEmail, string clientName, string username, string password)
        {
            if (!IsValidEmail(clientEmail))
            {
                _logger.LogWarning("Invalid email address provided: {Email}", clientEmail);
                return false;
            }

            try
            {
                var subject = "Welcome to NBSN - Your Account Credentials";
                var body = GenerateWelcomeEmailBody(clientName, username, password);

                return await SendEmailAsync(clientEmail, subject, body);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending welcome email to {Email}", clientEmail);
                return false;
            }
        }

        /// <summary>
        /// Sends welcome email with login credentials to a newly registered learner
        /// </summary>
        public async Task<bool> SendLearnerWelcomeEmailAsync(string learnerEmail, string learnerName, string username, string password, string portalUrl)
        {
            if (!IsValidEmail(learnerEmail))
            {
                _logger.LogWarning("Invalid learner email address: {Email}", learnerEmail);
                return false;
            }

            try
            {
                var subject = "Welcome to NBSN Learner Portal – Your Login Credentials";
                var body = $@"
<!DOCTYPE html>
<html>
<head>
  <meta charset='utf-8'>
  <title>Welcome to NBSN</title>
  <style>
    body{{font-family:Arial,sans-serif;background:#f4f7fb;margin:0;padding:20px}}
    .wrap{{max-width:600px;margin:auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,.1)}}
    .top{{background:#0EA5E9;padding:30px;text-align:center;color:#fff}}
    .top h1{{margin:0;font-size:24px}}
    .body{{padding:30px}}
    .cred-box{{background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:20px;margin:20px 0}}
    .cred-row{{display:flex;justify-content:space-between;margin-bottom:8px}}
    .label{{color:#64748b;font-size:14px}}
    .value{{font-weight:bold;color:#0f172a;font-size:14px}}
    .btn{{display:block;background:#0EA5E9;color:#fff;text-align:center;padding:14px 0;border-radius:8px;text-decoration:none;font-weight:bold;margin:24px 0}}
    .warning{{background:#fef9c3;border:1px solid #fde68a;border-radius:8px;padding:14px;font-size:13px;color:#78350f}}
    .footer{{text-align:center;font-size:12px;color:#94a3b8;padding:20px}}
  </style>
</head>
<body>
  <div class='wrap'>
    <div class='top'>
      <div style='font-size:40px'>🎓</div>
      <h1>Welcome, {learnerName}!</h1>
      <p style='margin:4px 0;opacity:.85'>National Building Skills Network – Learner Portal</p>
    </div>
    <div class='body'>
      <p>Your learner account has been created. Use the credentials below to log in to your personal portal where you can:</p>
      <ul>
        <li>Upload and manage your documents</li>
        <li>Answer assessment questions (type or scan)</li>
        <li>Update your profile, photo and face recognition</li>
        <li>Track your progress</li>
      </ul>

      <div class='cred-box'>
        <div class='cred-row'><span class='label'>Portal URL</span><span class='value'>{portalUrl}</span></div>
        <div class='cred-row'><span class='label'>Username</span><span class='value'>{username}</span></div>
        <div class='cred-row'><span class='label'>Password</span><span class='value'>{password}</span></div>
      </div>

      <a href='{portalUrl}' class='btn'>Access My Portal →</a>

      <div class='warning'>
        ⚠️ <strong>Important:</strong> You will be asked to change your password on first login.
        Keep your credentials safe and do not share them with anyone.
      </div>

      <p>If you have any questions, please contact your facilitator or training coordinator.</p>
      <p>Best regards,<br><strong>NBSN Team</strong></p>
    </div>
    <div class='footer'>This is an automated message. Do not reply to this email.</div>
  </div>
</body>
</html>";
                return await SendEmailAsync(learnerEmail, subject, body);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending learner welcome email to {Email}", learnerEmail);
                return false;
            }
        }

        /// <summary>
        /// Sends a generic email
        /// </summary>
        public async Task<bool> SendEmailAsync(string to, string subject, string body)
        {
            if (!IsValidEmail(to))
            {
                _logger.LogWarning("Invalid email address provided: {Email}", to);
                return false;
            }

            // Fail fast with a clear log if SMTP is not configured
            if (string.IsNullOrWhiteSpace(_smtpUsername) || string.IsNullOrWhiteSpace(_smtpPassword))
            {
                _logger.LogError("Email NOT sent to {Email} — SMTP credentials are missing. " +
                    "Set SMTP_USER and SMTP_PASS environment variables in Railway.", to);
                return false;
            }

            try
            {
                using var client = new SmtpClient(_smtpHost, _smtpPort);
                client.EnableSsl = true;
                client.UseDefaultCredentials = false;
                client.Credentials = new NetworkCredential(_smtpUsername, _smtpPassword);
                
                _logger.LogInformation("Sending email to {Email} via {SmtpHost}:{SmtpPort} as {From}", 
                    to, _smtpHost, _smtpPort, _smtpUsername);

                using var message = new MailMessage();
                message.From = new MailAddress(_fromEmail, _fromName);
                message.To.Add(to);
                message.Subject = subject;
                message.Body = body;
                message.IsBodyHtml = true;

                await client.SendMailAsync(message);
                
                _logger.LogInformation("✅ Email sent successfully to {Email}", to);
                return true;
            }
            catch (SmtpException ex)
            {
                _logger.LogError(ex, "❌ SMTP error sending email to {Email}: StatusCode={StatusCode} Message={Message}", 
                    to, ex.StatusCode, ex.Message);
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Unexpected error sending email to {Email}", to);
                return false;
            }
        }

        /// <summary>
        /// Validates email address format
        /// </summary>
        public bool IsValidEmail(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return false;

            try
            {
                // Use regex pattern for email validation
                var emailPattern = @"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$";
                return Regex.IsMatch(email, emailPattern);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating email: {Email}", email);
                return false;
            }
        }

        /// <summary>
        /// Sends password reset email with reset link
        /// </summary>
        public async Task<bool> SendPasswordResetEmailAsync(string email, string resetToken, string resetLink)
        {
            if (!IsValidEmail(email))
            {
                _logger.LogWarning("Invalid email address provided for password reset: {Email}", email);
                return false;
            }

            try
            {
                var subject = "Password Reset Request - NBSN";
                var body = GeneratePasswordResetEmailBody(resetLink, resetToken);

                return await SendEmailAsync(email, subject, body);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending password reset email to {Email}", email);
                return false;
            }
        }

        /// <summary>
        /// Generates HTML body for password reset email
        /// </summary>
        private string GeneratePasswordResetEmailBody(string resetLink, string resetToken)
        {
            return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Password Reset Request</title>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f4f4f4; }}
        .container {{ max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }}
        .header {{ text-align: center; margin-bottom: 30px; }}
        .header h1 {{ color: #2c3e50; margin: 0; }}
        .content {{ margin-bottom: 30px; }}
        .reset-button {{ display: inline-block; background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
        .reset-button:hover {{ background-color: #2980b9; }}
        .warning {{ background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }}
        .footer {{ text-align: center; font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 20px; }}
        .token {{ background-color: #f8f9fa; padding: 10px; border-radius: 5px; font-family: monospace; word-break: break-all; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>Password Reset Request</h1>
        </div>
        <div class='content'>
            <h2>Hello,</h2>
            <p>We received a request to reset your password for your NBSN account.</p>
            
            <p>Click the button below to reset your password:</p>
            <p style='text-align: center;'>
                <a href='{resetLink}' class='reset-button'>Reset Password</a>
            </p>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p class='token'>{resetLink}</p>
            
            <div class='warning'>
                <p><strong>⚠️ Important Security Information:</strong></p>
                <ul>
                    <li>This link will expire in 1 hour for security reasons</li>
                    <li>If you didn't request this password reset, please ignore this email</li>
                    <li>Never share this reset link with anyone</li>
                    <li>Contact support if you have concerns about your account security</li>
                </ul>
            </div>
            
            <p>If you continue to have problems, please contact our support team.</p>
            
            <p>Best regards,<br>NBSN Team</p>
        </div>
        <div class='footer'>
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>Reset Token: {resetToken}</p>
        </div>
    </div>
</body>
</html>";
        }

        /// <summary>
        /// Generates HTML body for welcome email
        /// </summary>
        private string GenerateWelcomeEmailBody(string clientName, string username, string password)
        {
            _logger.LogInformation("Generating welcome email body for {Username}. Password length: {PassLen}", username, password?.Length ?? 0);

            // Use configured frontend URL, fall back to production Railway URL
            var portalUrl = Environment.GetEnvironmentVariable("FRONTEND_URL")
                ?? _configuration["LearnerPortal:Url"]?.Replace("/learner", "")
                ?? "https://frontend-production-91f1.up.railway.app";

            return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Welcome to NBSN</title>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #007bff; color: white; padding: 20px; text-align: center; }}
        .content {{ padding: 20px; background-color: #f8f9fa; }}
        .credentials {{ background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #dee2e6; }}
        .footer {{ text-align: center; padding: 20px; font-size: 12px; color: #666; }}
        .warning {{ color: #dc3545; font-weight: bold; }}
        .credential-item {{ margin: 10px 0; font-size: 16px; }}
        .password-box {{ background-color: #fff; padding: 8px; border: 1px dashed #007bff; font-family: monospace; font-size: 18px; color: #007bff; display: inline-block; margin-top: 5px; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>Welcome to NBSN</h1>
        </div>
        <div class='content'>
            <h2>Hello {clientName},</h2>
            <p>Welcome to NBSN! Your account has been successfully created.</p>
            
            <div class='credentials'>
                <h3 style='margin-top: 0;'>Your Login Credentials:</h3>
                <div class='credential-item'>
                    <strong>Username / Email:</strong><br/>
                    <span>{username}</span>
                </div>
                <div class='credential-item'>
                    <strong>Password:</strong><br/>
                    <div class='password-box'>{password}</div>
                </div>
            </div>
            
            <p class='warning'>⚠️ Important Security Notice:</p>
            <ul>
                <li>Please change your password after your first login</li>
                <li>Keep your credentials secure and do not share them</li>
                <li>Contact support if you suspect unauthorized access</li>
            </ul>
            
            <p>You can access the system at: <a href='{portalUrl}' style='color: #007bff; text-decoration: none; font-weight: bold;'>{portalUrl}</a></p>
            
            <p>If you have any questions or need assistance, please contact our support team.</p>
            
            <p>Best regards,<br>NBSN Team</p>
        </div>
        <div class='footer'>
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>";
        }
    }
}