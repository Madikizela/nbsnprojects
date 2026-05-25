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
        /// Sends a generic email
        /// </summary>
        public async Task<bool> SendEmailAsync(string to, string subject, string body)
        {
            if (!IsValidEmail(to))
            {
                _logger.LogWarning("Invalid email address provided: {Email}", to);
                return false;
            }

            try
            {
                using var client = new SmtpClient(_smtpHost, _smtpPort);
                client.EnableSsl = true;
                client.UseDefaultCredentials = false;
                client.Credentials = new NetworkCredential(_smtpUsername, _smtpPassword);
                
                // Enable verbose debug output for troubleshooting
                _logger.LogInformation("Attempting to send email to {Email} via {SmtpHost}:{SmtpPort}", to, _smtpHost, _smtpPort);

                using var message = new MailMessage();
                message.From = new MailAddress(_fromEmail, _fromName);
                message.To.Add(to);
                message.Subject = subject;
                message.Body = body;
                message.IsBodyHtml = true;

                await client.SendMailAsync(message);
                
                _logger.LogInformation("Email sent successfully to {Email}", to);
                return true;
            }
            catch (SmtpException ex)
            {
                _logger.LogError(ex, "SMTP error sending email to {Email}: {Message}", to, ex.Message);
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error sending email to {Email}", to);
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
                    <strong>Username:</strong><br/>
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
            
            <p>You can access the system at: <a href='http://localhost:5173' style='color: #007bff; text-decoration: none; font-weight: bold;'>NBSN Portal</a></p>
            
            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
            
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