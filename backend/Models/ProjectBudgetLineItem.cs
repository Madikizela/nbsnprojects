using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    [Table("project_budget_line_items")]
    public class ProjectBudgetLineItem
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public int PhaseId { get; set; }

        [Required]
        [StringLength(100)]
        public string Category { get; set; } = string.Empty;

        [Required]
        [StringLength(500)]
        public string Description { get; set; } = string.Empty;

        public decimal AllocatedAmount { get; set; }

        public decimal SpentAmount { get; set; } = 0;

        /// <summary>True when item was entered as cost-per-learner × learner count.</summary>
        public bool IsPerLearner { get; set; } = false;

        public decimal? CostPerLearner { get; set; }

        public int? LearnersCount { get; set; }

        public bool IsEditable { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("PhaseId")]
        public virtual ProjectBudgetPhase? Phase { get; set; }
    }
}
