using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public enum ActivityStatus
    {
        NotStarted = 1,
        InProgress = 2,
        Completed = 3,
        OnHold = 4,
        Cancelled = 5
    }

    public class PhaseActivity
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ProjectPhaseId { get; set; }

        [Required]
        [StringLength(200)]
        public string Name { get; set; } = string.Empty;

        [StringLength(1000)]
        public string? Description { get; set; }

        [Required]
        public string ActivityCode { get; set; } = string.Empty; // e.g., "1.1", "1.2", "1.3"

        public int OrderIndex { get; set; }

        public DateTime? StartDate { get; set; }

        public DateTime? EndDate { get; set; }

        [Required]
        public ActivityStatus Status { get; set; } = ActivityStatus.NotStarted;

        public int? AssignedToUserId { get; set; }

        // Navigation Properties
        [ForeignKey("ProjectPhaseId")]
        public virtual ProjectPhase ProjectPhase { get; set; } = null!;

        [ForeignKey("AssignedToUserId")]
        public virtual User? AssignedToUser { get; set; }

        public virtual ICollection<PhaseSubActivity> SubActivities { get; set; } = new List<PhaseSubActivity>();

        // Audit Fields
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}