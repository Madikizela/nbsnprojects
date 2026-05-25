using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class ProjectPhaseQualification
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ProjectPhaseId { get; set; }

        [Required]
        public int ProjectQualificationId { get; set; }

        public int PlannedLearners { get; set; }

        public int ActualLearners { get; set; }

        public int CompletedLearners { get; set; }

        // Navigation Properties
        [ForeignKey("ProjectPhaseId")]
        public virtual ProjectPhase ProjectPhase { get; set; } = null!;

        [ForeignKey("ProjectQualificationId")]
        public virtual ProjectQualification ProjectQualification { get; set; } = null!;

        // Audit Fields
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}