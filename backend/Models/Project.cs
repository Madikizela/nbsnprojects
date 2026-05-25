using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class Project
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        [StringLength(255)]
        public string ProjectName { get; set; } = string.Empty;
        
        [Required]
        [StringLength(255)]
        public string ContractNumber { get; set; } = string.Empty;
        
        [Required]
        [StringLength(10)]
        public string FinancialYear { get; set; } = string.Empty; // Format: yyyy/mm/dd
        
        [Required]
        public DateTime StartDate { get; set; }
        
        [Required]
        public DateTime EndDate { get; set; }
        
        [Required]
        public int NumberOfBeneficiaries { get; set; }
        
        // Project Resources
        public bool HasPPE { get; set; } = false;
        public bool HasLearningMaterial { get; set; } = false;
        public bool HasToolkit { get; set; } = false;
        public bool HasConsumables { get; set; } = false;
        
        // Location
        [Required]
        [StringLength(100)]
        public string Province { get; set; } = string.Empty;
        
        // Financial and Partner Details
        [Required]
        [StringLength(255)]
        public string ProjectFunder { get; set; } = string.Empty;
        
        [Required]
        [StringLength(255)]
        public string LeadEmployerPartner { get; set; } = string.Empty;
        
        [Required]
        public int SkillsDevelopmentProviderId { get; set; }
        
        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal BudgetAmount { get; set; }
        
        [Required]
        public int ClientId { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        [ForeignKey("ClientId")]
        public virtual Client? Client { get; set; }
        
        [ForeignKey("SkillsDevelopmentProviderId")]
        public virtual SkillsDevelopmentProvider? SkillsDevelopmentProvider { get; set; }
        
        public virtual ICollection<ProjectLearningPathway> ProjectLearningPathways { get; set; } = new List<ProjectLearningPathway>();
        public virtual ICollection<ProjectSite> ProjectSites { get; set; } = new List<ProjectSite>();
    }

    public enum ProjectStatus
    {
        Planning = 1,
        InProgress = 2,
        OnHold = 3,
        Completed = 4,
        Cancelled = 5
    }
}