using System.ComponentModel.DataAnnotations;

namespace backend.Models.DTOs
{
    public class DocumentApprovalDto
    {
        [Required]
        public int DocumentId { get; set; }

        [Required]
        [StringLength(20)]
        public string ApprovalStatus { get; set; } = string.Empty; // "Approved" or "Declined"

        [StringLength(500)]
        public string? DeclineReason { get; set; }
    }

    public class DocumentApprovalResponseDto
    {
        public int Id { get; set; }
        public int LearnerId { get; set; }
        public string LearnerFirstName { get; set; } = string.Empty;
        public string LearnerLastName { get; set; } = string.Empty;
        public string LearnerIdNumber { get; set; } = string.Empty;
        public string DocumentType { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public string MimeType { get; set; } = string.Empty;
        public DateTime UploadedAt { get; set; }
        public string? UploadedByUserName { get; set; }
        public string ApprovalStatus { get; set; } = string.Empty;
        public DateTime? ApprovedAt { get; set; }
        public string? ApprovedByUserName { get; set; }
        public string? DeclineReason { get; set; }
    }

    public class ProjectDocumentSummaryDto
    {
        public int ProjectId { get; set; }
        public string ProjectName { get; set; } = string.Empty;
        public int TotalDocuments { get; set; }
        public int PendingDocuments { get; set; }
        public int ApprovedDocuments { get; set; }
        public int DeclinedDocuments { get; set; }
        public List<LearnerDocumentSummaryDto> Learners { get; set; } = new List<LearnerDocumentSummaryDto>();
    }

    public class LearnerDocumentSummaryDto
    {
        public int LearnerId { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string IdNumber { get; set; } = string.Empty;
        public int TotalDocuments { get; set; }
        public int PendingDocuments { get; set; }
        public int ApprovedDocuments { get; set; }
        public int DeclinedDocuments { get; set; }
        public List<DocumentApprovalResponseDto> Documents { get; set; } = new List<DocumentApprovalResponseDto>();
    }

    public class DocumentApprovalStatsDto
    {
        public int TotalDocuments { get; set; }
        public int PendingDocuments { get; set; }
        public int ApprovedDocuments { get; set; }
        public int DeclinedDocuments { get; set; }
        public double ApprovalRate { get; set; }
        public double DeclineRate { get; set; }
        public int TotalProjects { get; set; }
        public int ProjectsWithPendingDocuments { get; set; }
        public int TotalLearners { get; set; }
        public List<DocumentTypeStatsDto> DocumentTypeBreakdown { get; set; } = new List<DocumentTypeStatsDto>();
    }

    public class DocumentTypeStatsDto
    {
        public string DocumentType { get; set; } = string.Empty;
        public int TotalLearners { get; set; }
        public int ExpectedDocuments { get; set; }
        public int SubmittedDocuments { get; set; }
        public int PendingDocuments { get; set; }
        public int ApprovedDocuments { get; set; }
        public int DeclinedDocuments { get; set; }
        public int MissingDocuments { get; set; }
        public double ComplianceRate { get; set; }
        public double ApprovalRate { get; set; }
    }
}