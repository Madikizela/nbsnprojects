using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class SkillsDevelopmentProvider
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(200)]
        public string Name { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Description { get; set; }

        [StringLength(200)]
        public string? Address { get; set; }

        [Column("AccreditationNumber")]
        public string? AccreditationNumber { get; set; }

        [Column("AccreditationExpiryDate")]
        public DateTime? AccreditationExpiryDate { get; set; }

        // ContactEmail property temporarily removed due to missing column in database
        // [Required]
        // [EmailAddress]
        // [StringLength(100)]
        // public string ContactEmail { get; set; } = string.Empty;

        // ContactPhone property temporarily removed due to missing column in database
        // [StringLength(20)]
        // public string? ContactPhone { get; set; }

        [StringLength(100)]
        public string? ContactPerson { get; set; }

        [Required]
        public SDPStatus Status { get; set; } = SDPStatus.Active;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Foreign Key
        [Required]
        public int ClientId { get; set; }

        // Navigation Properties
        [ForeignKey("ClientId")]
        public virtual Client? Client { get; set; } = null;

        public virtual ICollection<User> Users { get; set; } = new List<User>();
        public virtual ICollection<Department> Departments { get; set; } = new List<Department>();
    }

    public enum SDPStatus
    {
        Active = 1,
        Inactive = 2,
        Suspended = 3,
        PendingApproval = 4
    }
}