using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class PhaseSubActivity
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int PhaseActivityId { get; set; }

        [Required]
        [StringLength(200)]
        public string Name { get; set; } = string.Empty;

        [StringLength(1000)]
        public string? Description { get; set; }

        [Required]
        public string ActivityCode { get; set; } = string.Empty; // e.g., "1.1.1", "1.1.2", "1.3.2.1"

        public int OrderIndex { get; set; }

        public DateTime? StartDate { get; set; }

        public DateTime? EndDate { get; set; }

        [Required]
        public ActivityStatus Status { get; set; } = ActivityStatus.NotStarted;

        public int? AssignedToUserId { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }

        // Navigation Properties
        [ForeignKey("PhaseActivityId")]
        public virtual PhaseActivity PhaseActivity { get; set; } = null!;

        [ForeignKey("AssignedToUserId")]
        public virtual User? AssignedToUser { get; set; }

        // Audit Fields
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}