using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    [Table("SickNotes")]
    public class SickNote
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int LearnerId { get; set; }

        [Required]
        [StringLength(200)]
        public string MedicalFacility { get; set; } = string.Empty;

        [Required]
        [StringLength(200)]
        public string PractitionerName { get; set; } = string.Empty; // Doctor or Nurse

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        [Required]
        public DateTime IssuedDate { get; set; }

        [Required]
        [StringLength(500)]
        public string EncryptedFilePath { get; set; } = string.Empty;

        [Required]
        [StringLength(500)]
        public string EncryptionIV { get; set; } = string.Empty;

        [Required]
        [StringLength(20)]
        public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected

        public int? ApprovedByUserId { get; set; }

        public DateTime? ApprovedAt { get; set; }

        [StringLength(500)]
        public string? RejectionReason { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Required]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("LearnerId")]
        public virtual Learner? Learner { get; set; }

        [ForeignKey("ApprovedByUserId")]
        public virtual User? ApprovedByUser { get; set; }
    }
}
