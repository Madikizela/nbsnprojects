using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public enum TaskStatus
    {
        Pending = 1,
        InProgress = 2,
        Completed = 3,
        Cancelled = 4,
        Overdue = 5
    }

    public enum TaskPriority
    {
        Low = 1,
        Medium = 2,
        High = 3,
        Critical = 4
    }

    public class ProjectTask
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;

        [StringLength(1000)]
        public string? Description { get; set; }

        [Required]
        public DateTime DueDate { get; set; }

        [Required]
        public TaskStatus Status { get; set; } = TaskStatus.Pending;

        [Required]
        public TaskPriority Priority { get; set; } = TaskPriority.Medium;

        // Foreign Keys
        [Required]
        public int AssignedToUserId { get; set; }

        [Required]
        public int CreatedByUserId { get; set; }

        public int? ProjectId { get; set; }

        public int? DepartmentId { get; set; }

        // Navigation Properties
        [ForeignKey("AssignedToUserId")]
        public virtual User AssignedToUser { get; set; } = null!;

        [ForeignKey("CreatedByUserId")]
        public virtual User CreatedByUser { get; set; } = null!;

        [ForeignKey("ProjectId")]
        public virtual Project? Project { get; set; }

        [ForeignKey("DepartmentId")]
        public virtual Department? Department { get; set; }

        // Task Reminders
        public virtual ICollection<TaskReminder> Reminders { get; set; } = new List<TaskReminder>();

        // Audit Fields
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [StringLength(500)]
        public string? CompletionNotes { get; set; }

        public DateTime? CompletedAt { get; set; }
    }
}