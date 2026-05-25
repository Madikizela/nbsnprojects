using System.ComponentModel.DataAnnotations;

namespace backend.Models.DTOs
{
    public class CreateTaskDto
    {
        [Required]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;

        [StringLength(1000)]
        public string? Description { get; set; }

        [Required]
        public DateTime DueDate { get; set; }

        [Required]
        public TaskPriority Priority { get; set; }

        [Required]
        public int AssignedToUserId { get; set; }

        public int? ProjectId { get; set; }

        public int? DepartmentId { get; set; }

        // Reminders
        public List<CreateTaskReminderDto> Reminders { get; set; } = new List<CreateTaskReminderDto>();
    }

    public class CreateTaskReminderDto
    {
        [Required]
        public DateTime ReminderDateTime { get; set; }

        [Required]
        public ReminderType Type { get; set; }

        [StringLength(500)]
        public string? Message { get; set; }
    }

    public class UpdateTaskDto
    {
        [Required]
        public int Id { get; set; }

        [Required]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;

        [StringLength(1000)]
        public string? Description { get; set; }

        [Required]
        public DateTime DueDate { get; set; }

        [Required]
        public TaskStatus Status { get; set; }

        [Required]
        public TaskPriority Priority { get; set; }

        [Required]
        public int AssignedToUserId { get; set; }

        public int? ProjectId { get; set; }

        public int? DepartmentId { get; set; }

        [StringLength(500)]
        public string? CompletionNotes { get; set; }
    }

    public class TaskDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime DueDate { get; set; }
        public TaskStatus Status { get; set; }
        public TaskPriority Priority { get; set; }
        public int AssignedToUserId { get; set; }
        public string AssignedToUserName { get; set; } = string.Empty;
        public string AssignedToUserEmail { get; set; } = string.Empty;
        public int CreatedByUserId { get; set; }
        public string CreatedByUserName { get; set; } = string.Empty;
        public int? ProjectId { get; set; }
        public string? ProjectName { get; set; }
        public int? DepartmentId { get; set; }
        public string? DepartmentName { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public string? CompletionNotes { get; set; }
        public DateTime? CompletedAt { get; set; }
        public List<TaskReminderDto> Reminders { get; set; } = new List<TaskReminderDto>();
        public bool IsOverdue => Status != TaskStatus.Completed && DueDate < DateTime.UtcNow;
    }

    public class TaskReminderDto
    {
        public int Id { get; set; }
        public int TaskId { get; set; }
        public DateTime ReminderDateTime { get; set; }
        public ReminderType Type { get; set; }
        public string? Message { get; set; }
        public bool IsSent { get; set; }
        public DateTime? SentAt { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class TaskSummaryDto
    {
        public int TotalTasks { get; set; }
        public int PendingTasks { get; set; }
        public int InProgressTasks { get; set; }
        public int CompletedTasks { get; set; }
        public int OverdueTasks { get; set; }
        public int HighPriorityTasks { get; set; }
        public int CriticalPriorityTasks { get; set; }
    }
}