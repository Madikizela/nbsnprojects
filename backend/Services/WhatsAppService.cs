using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using backend.Services.Interfaces;

namespace backend.Services
{
    /// <summary>
    /// WhatsApp Business API notification service using Meta Cloud API.
    ///
    /// Setup requirements:
    ///   1. Create a Meta App at https://developers.facebook.com
    ///   2. Add the WhatsApp product and get a Phone Number ID + permanent Access Token
    ///   3. Create and get approval for each message template in the Meta Business Manager
    ///   4. Set WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, and WHATSAPP_BUSINESS_ACCOUNT_ID
    ///      in your .env / appsettings
    ///
    /// Template names used (must match what you create in Meta Business Manager):
    ///   learner_welcome, document_approved, document_declined,
    ///   assessment_submitted, competency_achieved, attendance_clockin, class_announcement
    /// </summary>
    public class WhatsAppService : IWhatsAppService
    {
        private readonly ILogger<WhatsAppService> _logger;
        private readonly HttpClient _http;
        private readonly string? _phoneNumberId;
        private readonly string? _accessToken;
        private readonly bool _isConfigured;

        // Meta Cloud API base URL
        private const string ApiBase = "https://graph.facebook.com/v19.0";

        public WhatsAppService(ILogger<WhatsAppService> logger,
            IConfiguration configuration,
            IHttpClientFactory httpClientFactory)
        {
            _logger = logger;
            _http = httpClientFactory.CreateClient("WhatsApp");

            _phoneNumberId = configuration["WhatsApp:PhoneNumberId"];
            _accessToken = configuration["WhatsApp:AccessToken"];

            _isConfigured = !string.IsNullOrWhiteSpace(_phoneNumberId) &&
                            !string.IsNullOrWhiteSpace(_accessToken);

            if (!_isConfigured)
                _logger.LogWarning("WhatsApp service is not configured. " +
                    "Set WhatsApp:PhoneNumberId and WhatsApp:AccessToken to enable notifications.");
        }

        // ── Public interface ────────────────────────────────────────────────

        public async Task<bool> SendLearnerWelcomeAsync(string phoneNumber, string learnerName,
            string username, string temporaryPassword, string portalUrl)
        {
            var to = NormalisePhoneNumber(phoneNumber);
            if (to == null) return false;

            // Template params: {{1}} learnerName, {{2}} username, {{3}} password, {{4}} portalUrl
            return await SendTemplateAsync(to, "learner_welcome", "en_ZA", new[]
            {
                learnerName, username, temporaryPassword, portalUrl
            });
        }

        public async Task<bool> SendDocumentApprovedAsync(string phoneNumber, string learnerName,
            string documentType)
        {
            var to = NormalisePhoneNumber(phoneNumber);
            if (to == null) return false;

            // Template params: {{1}} learnerName, {{2}} documentType
            return await SendTemplateAsync(to, "document_approved", "en_ZA", new[]
            {
                learnerName, documentType
            });
        }

        public async Task<bool> SendDocumentDeclinedAsync(string phoneNumber, string learnerName,
            string documentType, string reason)
        {
            var to = NormalisePhoneNumber(phoneNumber);
            if (to == null) return false;

            // Template params: {{1}} learnerName, {{2}} documentType, {{3}} reason
            return await SendTemplateAsync(to, "document_declined", "en_ZA", new[]
            {
                learnerName, documentType, reason
            });
        }

        public async Task<bool> SendAssessmentSubmittedAsync(string phoneNumber, string learnerName,
            string assessmentType, string unitStandardName)
        {
            var to = NormalisePhoneNumber(phoneNumber);
            if (to == null) return false;

            // Template params: {{1}} learnerName, {{2}} assessmentType, {{3}} unitStandardName
            return await SendTemplateAsync(to, "assessment_submitted", "en_ZA", new[]
            {
                learnerName, assessmentType, unitStandardName
            });
        }

        public async Task<bool> SendCompetencyAchievedAsync(string phoneNumber, string learnerName,
            string unitStandardName, string qualificationName)
        {
            var to = NormalisePhoneNumber(phoneNumber);
            if (to == null) return false;

            // Template params: {{1}} learnerName, {{2}} unitStandardName, {{3}} qualificationName
            return await SendTemplateAsync(to, "competency_achieved", "en_ZA", new[]
            {
                learnerName, unitStandardName, qualificationName
            });
        }

        public async Task<bool> SendClockInConfirmationAsync(string phoneNumber, string learnerName,
            string className, string clockTime)
        {
            var to = NormalisePhoneNumber(phoneNumber);
            if (to == null) return false;

            // Template params: {{1}} learnerName, {{2}} className, {{3}} clockTime
            return await SendTemplateAsync(to, "attendance_clockin", "en_ZA", new[]
            {
                learnerName, className, clockTime
            });
        }

        public async Task<bool> SendClassAnnouncementAsync(string phoneNumber, string learnerName,
            string teacherName, string message)
        {
            var to = NormalisePhoneNumber(phoneNumber);
            if (to == null) return false;

            // Template params: {{1}} learnerName, {{2}} teacherName, {{3}} message
            return await SendTemplateAsync(to, "class_announcement", "en_ZA", new[]
            {
                learnerName, teacherName, message
            });
        }

        public async Task<bool> SendTextMessageAsync(string phoneNumber, string message)
        {
            var to = NormalisePhoneNumber(phoneNumber);
            if (to == null) return false;

            if (!_isConfigured)
            {
                _logger.LogInformation("[WhatsApp STUB] To: {To} | Message: {Message}", to, message);
                return true;
            }

            var payload = new
            {
                messaging_product = "whatsapp",
                recipient_type = "individual",
                to,
                type = "text",
                text = new { preview_url = false, body = message }
            };

            return await PostMessageAsync(payload);
        }

        // ── Phone number normalisation ──────────────────────────────────────

        public string? NormalisePhoneNumber(string? phoneNumber)
        {
            if (string.IsNullOrWhiteSpace(phoneNumber)) return null;

            // Strip spaces, dashes, brackets
            var digits = Regex.Replace(phoneNumber, @"[\s\-\(\)]", "");

            // South African local format: 0XX XXX XXXX → +27XX XXX XXXX
            if (digits.StartsWith("0") && digits.Length == 10)
                digits = "27" + digits.Substring(1);

            // Already has country code without +
            if (digits.StartsWith("27") && digits.Length == 11)
                return digits;

            // Strip + if present
            if (digits.StartsWith("+"))
                digits = digits.Substring(1);

            // Validate: must be all digits, 7–15 chars (E.164 without +)
            if (Regex.IsMatch(digits, @"^\d{7,15}$"))
                return digits;

            _logger.LogWarning("Could not normalise phone number: {Phone}", phoneNumber);
            return null;
        }

        // ── Private helpers ─────────────────────────────────────────────────

        private async Task<bool> SendTemplateAsync(string to, string templateName,
            string languageCode, string[] parameters)
        {
            if (!_isConfigured)
            {
                // In development/staging without credentials, log what would be sent
                _logger.LogInformation(
                    "[WhatsApp STUB] Template: {Template} | To: {To} | Params: {Params}",
                    templateName, to, string.Join(", ", parameters));
                return true;
            }

            var components = parameters.Length > 0
                ? new object[]
                  {
                      new
                      {
                          type = "body",
                          parameters = parameters.Select(p => new { type = "text", text = p }).ToArray()
                      }
                  }
                : Array.Empty<object>();

            var payload = new
            {
                messaging_product = "whatsapp",
                recipient_type = "individual",
                to,
                type = "template",
                template = new
                {
                    name = templateName,
                    language = new { code = languageCode },
                    components
                }
            };

            return await PostMessageAsync(payload);
        }

        private async Task<bool> PostMessageAsync(object payload)
        {
            try
            {
                var json = JsonSerializer.Serialize(payload);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var request = new HttpRequestMessage(
                    HttpMethod.Post,
                    $"{ApiBase}/{_phoneNumberId}/messages")
                {
                    Content = content
                };
                request.Headers.Authorization =
                    new AuthenticationHeaderValue("Bearer", _accessToken);

                var response = await _http.SendAsync(request);
                var responseBody = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("WhatsApp message sent successfully. Response: {Body}",
                        responseBody);
                    return true;
                }

                _logger.LogWarning("WhatsApp API error {Status}: {Body}",
                    response.StatusCode, responseBody);
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending WhatsApp message");
                return false;
            }
        }
    }
}
