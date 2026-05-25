using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class Department
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(200)]
        public string Name { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Description { get; set; }

        [Required]
        public DepartmentType Type { get; set; }

        [Required]
        public DepartmentStatus Status { get; set; } = DepartmentStatus.Active;

        // Manager Information
        [Required]
        [StringLength(100)]
        public string ManagerFirstName { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string ManagerSurname { get; set; } = string.Empty;

        [Required]
        [StringLength(255)]
        [EmailAddress]
        public string ManagerEmail { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Foreign Key
        [Required]
        public int SkillsDevelopmentProviderId { get; set; }

        // Navigation Properties
        [ForeignKey("SkillsDevelopmentProviderId")]
        public virtual SkillsDevelopmentProvider? SkillsDevelopmentProvider { get; set; }

        public virtual ICollection<User> Users { get; set; } = new List<User>();
    }

    public enum DepartmentType
    {
        AdministratorManager = 1,
        LogisticManager = 2,
        FinancialManager = 3,
        QualityAssuranceManager = 4,
        ITManager = 5,
        TrainingManager = 6
    }

    public enum DepartmentStatus
    {
        Active = 1,
        Inactive = 2,
        Suspended = 3
    }
}