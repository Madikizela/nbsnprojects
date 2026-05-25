using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    [Table("LearnerAssessmentAnswers")]
    public class LearnerAssessmentAnswer
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int LearnerId { get; set; }

        [Required]
        public int AssessmentId { get; set; }

        [Required]
        [StringLength(20)]
        public string AssessmentType { get; set; } = string.Empty; // "Formative" or "Summative"

        public bool IsRemedial { get; set; } = false;

        [Required]
        public int QuestionId { get; set; }

        [Required]
        public int QuestionNumber { get; set; }

        [Required]
        public string ScannedDocumentPath { get; set; } = string.Empty;

        [Required]
        [StringLength(255)]
        public string ScannedDocumentName { get; set; } = string.Empty;

        public long? FileSize { get; set; }

        [StringLength(100)]
        public string? MimeType { get; set; }

        [Required]
        public DateTime ScannedAt { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; }

        [Required]
        public DateTime UpdatedAt { get; set; }

        // Marking Fields
        public decimal? Mark { get; set; }
        public string? AssessorComments { get; set; }
        public int? AssessorId { get; set; }
        public DateTime? MarkedAt { get; set; }
        public MarkStatus MarkStatus { get; set; } = MarkStatus.Pending;

        // Moderation Fields
        public decimal? ModeratedMark { get; set; }
        public string? ModeratorComments { get; set; }
        public int? ModeratorId { get; set; }
        public DateTime? ModeratedAt { get; set; }
        public ModerationStatus ModerationStatus { get; set; } = ModerationStatus.Pending;

        // Navigation properties
        public virtual Learner? Learner { get; set; }

        [ForeignKey("AssessorId")]
        public virtual User? Assessor { get; set; }

        [ForeignKey("ModeratorId")]
        public virtual User? Moderator { get; set; }
    }

    public enum MarkStatus
    {
        Pending = 1,
        Marked = 2,
        NeedsRevision = 3
    }

    public enum ModerationStatus
    {
        Pending = 1,
        Moderated = 2,
        ReturnedToAssessor = 3
    }
}