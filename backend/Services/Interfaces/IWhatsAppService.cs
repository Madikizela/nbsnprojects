namespace backend.Services.Interfaces
{
    /// <summary>
    /// Interface for WhatsApp Business API (Meta Cloud API) notification service.
    /// All outbound messages use pre-approved Meta message templates so they work
    /// outside the 24-hour customer service window.
    /// </summary>
    public interface IWhatsAppService
    {
        /// <summary>
        /// Sends learner welcome message with portal login credentials.
        /// Template: learner_welcome
        /// </summary>
        Task<bool> SendLearnerWelcomeAsync(string phoneNumber, string learnerName,
            string username, string temporaryPassword, string portalUrl);

        /// <summary>
        /// Notifies a learner that a document has been approved.
        /// Template: document_approved
        /// </summary>
        Task<bool> SendDocumentApprovedAsync(string phoneNumber, string learnerName,
            string documentType);

        /// <summary>
        /// Notifies a learner that a document has been declined with a reason.
        /// Template: document_declined
        /// </summary>
        Task<bool> SendDocumentDeclinedAsync(string phoneNumber, string learnerName,
            string documentType, string reason);

        /// <summary>
        /// Confirms to a learner that their assessment answers were received.
        /// Template: assessment_submitted
        /// </summary>
        Task<bool> SendAssessmentSubmittedAsync(string phoneNumber, string learnerName,
            string assessmentType, string unitStandardName);

        /// <summary>
        /// Notifies a learner they are now Competent for a unit standard.
        /// Template: competency_achieved
        /// </summary>
        Task<bool> SendCompetencyAchievedAsync(string phoneNumber, string learnerName,
            string unitStandardName, string qualificationName);

        /// <summary>
        /// Confirms a clock-in event to the learner.
        /// Template: attendance_clockin
        /// </summary>
        Task<bool> SendClockInConfirmationAsync(string phoneNumber, string learnerName,
            string className, string clockTime);

        /// <summary>
        /// Sends a class announcement to a learner from a teacher.
        /// Template: class_announcement
        /// </summary>
        Task<bool> SendClassAnnouncementAsync(string phoneNumber, string learnerName,
            string teacherName, string message);

        /// <summary>
        /// Sends a generic free-text message (only valid within 24h service window).
        /// </summary>
        Task<bool> SendTextMessageAsync(string phoneNumber, string message);

        /// <summary>
        /// Validates and normalises a South African phone number to E.164 format (+27...).
        /// Returns null if the number cannot be normalised.
        /// </summary>
        string? NormalisePhoneNumber(string? phoneNumber);
    }
}
