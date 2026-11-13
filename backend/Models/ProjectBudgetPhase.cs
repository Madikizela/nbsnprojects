using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    [Table("project_budget_phases")]
    public class ProjectBudgetPhase
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public int ProjectId { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Description { get; set; }

        public decimal AllocatedBudget { get; set; }

        public decimal SpentBudget { get; set; } = 0;

        [StringLength(20)]
        public string? StartDate { get; set; }

        [StringLength(20)]
        public string? EndDate { get; set; }

        public int PhaseOrder { get; set; } = 1;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("ProjectId")]
        public virtual Project? Project { get; set; }

        public virtual ICollection<ProjectBudgetLineItem> LineItems { get; set; } = new List<ProjectBudgetLineItem>();
    }
}
