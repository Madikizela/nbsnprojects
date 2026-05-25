using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    /// <summary>
    /// Data Transfer Object for client registration requests with encrypted data
    /// </summary>
    public class ClientRegistrationRequest
    {
        [Required(ErrorMessage = "Encrypted client data is required")]
        public string EncryptedClientData { get; set; } = string.Empty;
    }

    /// <summary>
    /// Plain client data structure for encryption/decryption
    /// </summary>
    public class ClientRegistrationData
    {
        [Required(ErrorMessage = "Client name is required")]
        [StringLength(200, MinimumLength = 2, ErrorMessage = "Client name must be between 2 and 200 characters")]
        public string Name { get; set; } = string.Empty;

        [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
        public string? Description { get; set; }

        [StringLength(200, ErrorMessage = "Address cannot exceed 200 characters")]
        public string? Address { get; set; }

        [StringLength(20, ErrorMessage = "Phone number cannot exceed 20 characters")]
        public string? PhoneNumber { get; set; }

        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        [StringLength(255, ErrorMessage = "Email cannot exceed 255 characters")]
        public string Email { get; set; } = string.Empty;

        [StringLength(100, MinimumLength = 2, ErrorMessage = "Contact person name must be between 2 and 100 characters")]
        public string? ContactPerson { get; set; }
    }

    /// <summary>
    /// Response model for successful client registration
    /// </summary>
    public class ClientRegistrationResponse
    {
        public int ClientId { get; set; }
        public string ClientName { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public bool EmailSent { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}