using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

namespace backend.Models
{
    /// <summary>
    /// System Administrator model - separate from regular users
    /// </summary>
    public class SystemAdmin
    {
        [Key]
        public int Id { get; set; }

        [Required(ErrorMessage = "First name is required")]
        [StringLength(100, MinimumLength = 2, ErrorMessage = "First name must be between 2 and 100 characters")]
        [RegularExpression(@"^[a-zA-Z\s'-]+$", ErrorMessage = "First name can only contain letters, spaces, hyphens, and apostrophes")]
        public string FirstName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Last name is required")]
        [StringLength(100, MinimumLength = 2, ErrorMessage = "Last name must be between 2 and 100 characters")]
        [RegularExpression(@"^[a-zA-Z\s'-]+$", ErrorMessage = "Last name can only contain letters, spaces, hyphens, and apostrophes")]
        public string LastName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Username is required")]
        [StringLength(50, MinimumLength = 3, ErrorMessage = "Username must be between 3 and 50 characters")]
        public string Username { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        [StringLength(255, ErrorMessage = "Email cannot exceed 255 characters")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password hash is required")]
        [StringLength(255, ErrorMessage = "Password hash cannot exceed 255 characters")]
        public string PasswordHash { get; set; } = string.Empty;

        [StringLength(20, ErrorMessage = "Phone number cannot exceed 20 characters")]
        [RegularExpression(@"^[\+]?[0-9\s\-\(\)]+$", ErrorMessage = "Invalid phone number format")]
        public string? PhoneNumber { get; set; }

        [Required]
        public SystemAdminStatus Status { get; set; } = SystemAdminStatus.Active;

        /// <summary>
        /// System admin access level (Super Admin, Admin, etc.)
        /// </summary>
        [Required]
        public SystemAdminLevel AccessLevel { get; set; } = SystemAdminLevel.Admin;

        /// <summary>
        /// Last login timestamp
        /// </summary>
        public DateTime? LastLoginAt { get; set; }

        /// <summary>
        /// Login attempt counter for security
        /// </summary>
        public int LoginAttempts { get; set; } = 0;

        /// <summary>
        /// Account locked until this time (for security)
        /// </summary>
        public DateTime? LockedUntil { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Full name property for display purposes
        /// </summary>
        public string FullName => $"{FirstName} {LastName}".Trim();

        /// <summary>
        /// Check if account is currently locked
        /// </summary>
        public bool IsLocked => LockedUntil.HasValue && LockedUntil.Value > DateTime.UtcNow;
    }

    /// <summary>
    /// System Administrator status enumeration
    /// </summary>
    public enum SystemAdminStatus
    {
        Active = 1,
        Inactive = 2,
        Suspended = 3,
        Locked = 4
    }

    /// <summary>
    /// System Administrator access level enumeration
    /// </summary>
    public enum SystemAdminLevel
    {
        SuperAdmin = 1,  // Full system access
        Admin = 2,       // Standard admin access
        ReadOnly = 3     // Read-only access
    }
}