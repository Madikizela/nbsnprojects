namespace backend.Services.Interfaces
{
    /// <summary>
    /// Interface for email service operations
    /// </summary>
    public interface IEmailService
    {
        /// <summary>
        /// Sends welcome email with credentials to a new client
        /// </summary>
        /// <param name="clientEmail">Client's email address</param>
        /// <param name="clientName">Client's name</param>
        /// <param name="username">Generated username</param>
        /// <param name="password">Generated password</param>
        /// <returns>True if email was sent successfully</returns>
        Task<bool> SendWelcomeEmailAsync(string clientEmail, string clientName, string username, string password);

        /// <summary>
        /// Sends welcome email with credentials to a new learner
        /// </summary>
        Task<bool> SendLearnerWelcomeEmailAsync(string learnerEmail, string learnerName, string username, string password, string portalUrl);

        /// <summary>
        /// Sends a generic email
        /// </summary>
        /// <param name="to">Recipient email address</param>
        /// <param name="subject">Email subject</param>
        /// <param name="body">Email body (HTML)</param>
        /// <returns>True if email was sent successfully</returns>
        Task<bool> SendEmailAsync(string to, string subject, string body);

        /// <summary>
        /// Sends password reset email with reset link
        /// </summary>
        /// <param name="email">User's email address</param>
        /// <param name="resetToken">Password reset token</param>
        /// <param name="resetLink">Password reset link</param>
        /// <returns>True if email was sent successfully</returns>
        Task<bool> SendPasswordResetEmailAsync(string email, string resetToken, string resetLink);

        /// <summary>
        /// Validates email address format
        /// </summary>
        /// <param name="email">Email address to validate</param>
        /// <returns>True if email format is valid</returns>
        bool IsValidEmail(string email);
    }
}