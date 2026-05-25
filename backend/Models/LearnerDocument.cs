using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    [Table("LearnerDocuments")]
    public class LearnerDocument
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int LearnerId { get; set; }

        [Required]
        [StringLength(100)]
        public string DocumentType { get; set; } = string.Empty;

        [Required]
        [StringLength(255)]
        public string FileName { get; set; } = string.Empty;

        [Required]
        [StringLength(500)]
        public string EncryptedFilePath { get; set; } = string.Empty;

        [Required]
        public long FileSize { get; set; }

        [Required]
        [StringLength(100)]
        public string MimeType { get; set; } = string.Empty;

        [Required]
        [StringLength(500)]
        public string EncryptionIV { get; set; } = string.Empty; // Initialization Vector

        [Required]
        [StringLength(500)]
        public string FileHash { get; set; } = string.Empty; // SHA256 hash

        [Required]
        public DateTime UploadedAt { get; set; }

        public int? UploadedByUserId { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; }

        [Required]
        public DateTime UpdatedAt { get; set; }

        // Approval fields
        [StringLength(20)]
        public string ApprovalStatus { get; set; } = "Pending"; // Pending, Approved, Declined

        public int? ApprovedByUserId { get; set; }

        public DateTime? ApprovedAt { get; set; }

        [StringLength(500)]
        public string? DeclineReason { get; set; }

        // Navigation properties
        [ForeignKey("LearnerId")]
        public virtual Learner? Learner { get; set; }

        [ForeignKey("UploadedByUserId")]
        public virtual User? UploadedByUser { get; set; }

        [ForeignKey("ApprovedByUserId")]
        public virtual User? ApprovedByUser { get; set; }
    }
}
