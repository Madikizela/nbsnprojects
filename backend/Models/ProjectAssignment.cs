using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class ProjectAssignment
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ProjectId { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        public ProjectAssignmentRole Role { get; set; }

        public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        [ForeignKey("ProjectId")]
        public virtual Project? Project { get; set; }

        [ForeignKey("UserId")]
        public virtual User? User { get; set; }
    }

    public enum ProjectAssignmentRole
    {
        Assessor = 1,
        Moderator = 2,
        Facilitator = 3,
        Teacher = 4
    }
}
