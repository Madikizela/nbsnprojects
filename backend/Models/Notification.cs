using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    [Table("notifications")]
    public class Notification
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        /// <summary>Who the notification is for. Null = platform-wide broadcast.</summary>
        public int? UserId { get; set; }

        /// <summary>Type: ATTENDANCE_ALERT, DOCUMENT_PENDING, SDP_APPROVED, SDP_REJECTED, GENERAL</summary>
        [Required]
        [StringLength(50)]
        public string Type { get; set; } = "GENERAL";

        [Required]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [StringLength(1000)]
        public string Message { get; set; } = string.Empty;

        /// <summary>Optional link the user can navigate to on click.</summary>
        [StringLength(500)]
        public string? ActionUrl { get; set; }

        /// <summary>Optional extra data (JSON).</summary>
        [StringLength(2000)]
        public string? Metadata { get; set; }

        public bool IsRead { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? ReadAt { get; set; }

        [ForeignKey("UserId")]
        public virtual User? User { get; set; }
    }
}
