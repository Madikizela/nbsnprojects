using System.ComponentModel.DataAnnotations;

namespace backend.Models.DTOs
{
    public class UploadAssessmentAnswerDto
    {
        [Required]
        public int LearnerId { get; set; }

        [Required]
        public int AssessmentId { get; set; }

        [Required]
        public string AssessmentType { get; set; } = string.Empty; // "Formative" or "Summative"

        public bool IsRemedial { get; set; } = false;

        [Required]
        public int QuestionId { get; set; }

        [Required]
        public int QuestionNumber { get; set; }

        [Required]
        public int ProjectQualificationUnitStandardId { get; set; }

        public IFormFile? ScannedDocument { get; set; }

        public List<IFormFile>? ScannedDocuments { get; set; }
    }

    public class LearnerAssessmentAnswerResponseDto
    {
        public int Id { get; set; }
        public int QuestionId { get; set; }
        public int QuestionNumber { get; set; }
        public string ScannedDocumentName { get; set; } = string.Empty;
        public long? FileSize { get; set; }
        public DateTime ScannedAt { get; set; }
    }

    public class LearnerProgressResponseDto
    {
        public int Id { get; set; }
        public int ProjectQualificationUnitStandardId { get; set; }
        public int? FormativeAssessmentId { get; set; }
        public int? SummativeAssessmentId { get; set; }
        public bool FormativeCompleted { get; set; }
        public DateTime? FormativeCompletedAt { get; set; }
        public bool SummativeCompleted { get; set; }
        public DateTime? SummativeCompletedAt { get; set; }
    }

    public class MarkAnswerDto
    {
        public int AnswerId { get; set; }

        [Required]
        public decimal Mark { get; set; }

        public string? Comments { get; set; }

        [Required]
        public int AssessorId { get; set; }

        // Fields to create a new record if AnswerId is 0
        public int? LearnerId { get; set; }
        public int? AssessmentId { get; set; }
        public string? AssessmentType { get; set; }
        public int? QuestionId { get; set; }
        public int? QuestionNumber { get; set; }
        public bool? IsRemedial { get; set; }
    }

    public class ModerateAnswerDto
    {
        [Required]
        public int AnswerId { get; set; }

        [Required]
        public decimal ModeratedMark { get; set; }

        public string? Comments { get; set; }

        [Required]
        public bool IsApproved { get; set; }

        [Required]
        public int ModeratorId { get; set; }
    }
}