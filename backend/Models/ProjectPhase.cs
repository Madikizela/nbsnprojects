using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public enum PhaseStatus
    {
        Planning = 1,
        Active = 2,
        Completed = 3,
        OnHold = 4,
        Cancelled = 5
    }

    public class ProjectPhase
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(200)]
        public string Name { get; set; } = string.Empty;

        [StringLength(1000)]
        public string? Description { get; set; }

        [Required]
        public int ProjectId { get; set; }

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        [Required]
        public PhaseStatus Status { get; set; } = PhaseStatus.Planning;

        public int PlannedBeneficiaries { get; set; }

        public int ActualBeneficiaries { get; set; }

        public decimal BudgetAllocation { get; set; }

        public decimal ActualSpent { get; set; }

        // Navigation Properties
        [ForeignKey("ProjectId")]
        public virtual Project Project { get; set; } = null!;

        public virtual ICollection<ProjectPhaseQualification> PhaseQualifications { get; set; } = new List<ProjectPhaseQualification>();

        public virtual ICollection<ProjectPhaseLearningPathway> PhaseLearningPathways { get; set; } = new List<ProjectPhaseLearningPathway>();

        // Audit Fields
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [Required]
        public int CreatedByUserId { get; set; }

        [ForeignKey("CreatedByUserId")]
        public virtual User CreatedByUser { get; set; } = null!;
    }
}