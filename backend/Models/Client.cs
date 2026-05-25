using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class Client
    {
        [Key]
        public int Id { get; set; }

        [Required(ErrorMessage = "Client name is required")]
        [StringLength(200, MinimumLength = 2, ErrorMessage = "Client name must be between 2 and 200 characters")]
        [RegularExpression(@"^[a-zA-Z0-9\s\-\.\&\(\)]+$", ErrorMessage = "Client name contains invalid characters")]
        public string Name { get; set; } = string.Empty;

        [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
        public string? Description { get; set; }

        [StringLength(200, ErrorMessage = "Address cannot exceed 200 characters")]
        public string? Address { get; set; }

        [StringLength(20, ErrorMessage = "Phone number cannot exceed 20 characters")]
        [RegularExpression(@"^[\+]?[0-9\s\-\(\)]+$", ErrorMessage = "Invalid phone number format")]
        public string? PhoneNumber { get; set; }

        [EmailAddress(ErrorMessage = "Invalid email format")]
        [StringLength(255, ErrorMessage = "Email cannot exceed 255 characters")]
        public string? Email { get; set; }

        [StringLength(100, MinimumLength = 2, ErrorMessage = "Contact person name must be between 2 and 100 characters")]
        [RegularExpression(@"^[a-zA-Z\s'-]+$", ErrorMessage = "Contact person name can only contain letters, spaces, hyphens, and apostrophes")]
        public string? ContactPerson { get; set; }

        [Required]
        public ClientStatus Status { get; set; } = ClientStatus.Active;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        public virtual ICollection<User> Users { get; set; } = new List<User>();
        // SkillsDevelopmentProviders navigation property temporarily removed due to database schema mismatch
        // public virtual ICollection<SkillsDevelopmentProvider> SkillsDevelopmentProviders { get; set; } = new List<SkillsDevelopmentProvider>();
    }

    public enum ClientStatus
    {
        Active = 1,
        Inactive = 2,
        Suspended = 3
    }
}