using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    [Table("ExternalUserAccess")]
    public class ExternalUserAccess
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        public int ProjectId { get; set; }

        /// <summary>
        /// Comma-separated list of allowed document types, e.g. "ID Document,Bank Confirmation,Learner Attendance"
        /// </summary>
        [Required]
        public string AllowedDocumentTypes { get; set; } = string.Empty;

        public string? OrganizationName { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("UserId")]
        public virtual User? User { get; set; }

        [ForeignKey("ProjectId")]
        public virtual Project? Project { get; set; }
    }
}
