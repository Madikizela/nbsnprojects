using System.ComponentModel.DataAnnotations;

namespace backend.Models.DTOs
{
    public class UpdateTeacherProfileDTO
    {
        [Required(ErrorMessage = "First name is required")]
        [StringLength(100, MinimumLength = 2, ErrorMessage = "First name must be between 2 and 100 characters")]
        [RegularExpression(@"^[a-zA-Z\s'-]+$", ErrorMessage = "First name can only contain letters, spaces, hyphens, and apostrophes")]
        public string FirstName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Last name is required")]
        [StringLength(100, MinimumLength = 2, ErrorMessage = "Last name must be between 2 and 100 characters")]
        [RegularExpression(@"^[a-zA-Z\s'-]+$", ErrorMessage = "Last name can only contain letters, spaces, hyphens, and apostrophes")]
        public string LastName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        [StringLength(255, ErrorMessage = "Email cannot exceed 255 characters")]
        public string Email { get; set; } = string.Empty;

        [StringLength(20, ErrorMessage = "Phone number cannot exceed 20 characters")]
        [RegularExpression(@"^[\+]?[0-9\s\-\(\)]+$", ErrorMessage = "Invalid phone number format")]
        public string? PhoneNumber { get; set; }

        [StringLength(255, ErrorMessage = "Address line 1 cannot exceed 255 characters")]
        public string? AddressLine1 { get; set; }

        [StringLength(255, ErrorMessage = "Address line 2 cannot exceed 255 characters")]
        public string? AddressLine2 { get; set; }

        [StringLength(100, ErrorMessage = "City cannot exceed 100 characters")]
        public string? City { get; set; }

        [StringLength(100, ErrorMessage = "Province cannot exceed 100 characters")]
        public string? Province { get; set; }

        [StringLength(20, ErrorMessage = "Postal code cannot exceed 20 characters")]
        public string? PostalCode { get; set; }

        // Base64 encoded image
        public string? ProfileImage { get; set; }

        // Base64 encoded signature
        public string? Signature { get; set; }
        
        [StringLength(50, ErrorMessage = "Practice number cannot exceed 50 characters")]
        public string? PracticeNumber { get; set; }
    }

    public class TeacherProfileResponseDTO
    {
        public int Id { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public string? AddressLine1 { get; set; }
        public string? AddressLine2 { get; set; }
        public string? City { get; set; }
        public string? Province { get; set; }
        public string? PostalCode { get; set; }
        public string? ProfileImage { get; set; }
        public string? Signature { get; set; }
        public string? PracticeNumber { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
