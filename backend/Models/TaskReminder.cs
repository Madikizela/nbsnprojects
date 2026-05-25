using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public enum ReminderType
    {
        Email = 1,
        InApp = 2,
        Both = 3
    }

    public class TaskReminder
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int TaskId { get; set; }

        [Required]
        public DateTime ReminderDateTime { get; set; }

        [Required]
        public ReminderType Type { get; set; } = ReminderType.Both;

        [StringLength(500)]
        public string? Message { get; set; }

        public bool IsSent { get; set; } = false;

        public DateTime? SentAt { get; set; }

        // Navigation Properties
        [ForeignKey("TaskId")]
        public virtual ProjectTask Task { get; set; } = null!;

        // Audit Fields
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}