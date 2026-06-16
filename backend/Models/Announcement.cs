using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    /// <summary>
    /// A notice/announcement posted by a teacher to a specific class.
    /// Stored in the database so learners can read it in their portal,
    /// and also pushed to each learner via WhatsApp and email on creation.
    /// </summary>
    [Table("Announcements")]
    public class Announcement
    {
        [Key]
        public int Id { get; set; }

        /// <summary>Class the announcement is targeted at.</summary>
        [Required]
        public int ClassId { get; set; }

        /// <summary>User (Teacher) who created the announcement.</summary>
        [Required]
        public int CreatedByUserId { get; set; }

        [Required]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [StringLength(2000)]
        public string Message { get; set; } = string.Empty;

        /// <summary>
        /// Optional priority: Normal | Important | Urgent
        /// </summary>
        [StringLength(20)]
        public string Priority { get; set; } = "Normal";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        [ForeignKey("ClassId")]
        public virtual SiteClass? SiteClass { get; set; }

        [ForeignKey("CreatedByUserId")]
        public virtual User? CreatedByUser { get; set; }
    }
}
