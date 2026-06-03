using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace backend.Models.DTOs
{
    // Question DTO for formative assessments
    public class AssessmentQuestionDto
    {
        [Required]
        public int QuestionNumber { get; set; }
        
        [Required]
        public string QuestionText { get; set; } = string.Empty;
        
        [Required]
        public decimal AllocatedMarks { get; set; }
    }

    // Formative Assessment DTOs
    public class CreateFormativeAssessmentDto
    {
        [Required]
        public int ProjectQualificationUnitStandardId { get; set; }
        
        [Required]
        public DateTime AssessmentDate { get; set; }
        
        [StringLength(100)]
        public string? AssessmentMethod { get; set; }
        
        public decimal? Score { get; set; }
        public decimal? MaxScore { get; set; }
        
        [StringLength(255)]
        public string? AssessorName { get; set; }
        
        public string? Comments { get; set; }
        
        [StringLength(50)]
        public string Status { get; set; } = "Pending";
        
        // List of questions for this assessment
        public List<AssessmentQuestionDto> Questions { get; set; } = new List<AssessmentQuestionDto>();
    }

    // Summative Assessment DTOs
    public class CreateSummativeAssessmentDto
    {
        [Required]
        public int ProjectQualificationUnitStandardId { get; set; }
        
        [Required]
        public DateTime AssessmentDate { get; set; }
        
        public decimal? FinalScore { get; set; }
        public decimal? MaxScore { get; set; }
        
        [Required]
        [StringLength(50)]
        public string Status { get; set; } = "Pending";
        
        [StringLength(255)]
        public string? AssessorName { get; set; }
        
        [StringLength(255)]
        public string? ModeratorName { get; set; }
        
        public string? Comments { get; set; }
        public string? ModeratorComments { get; set; }
        
        // List of questions for this assessment
        public List<AssessmentQuestionDto> Questions { get; set; } = new List<AssessmentQuestionDto>();
    }

    // Logbook Entry DTOs
    public class CreateLogbookEntryDto
    {
        [Required]
        [JsonPropertyName("projectQualificationUnitStandardId")]
        public int ProjectQualificationUnitStandardId { get; set; }
        
        [JsonPropertyName("entryDate")]
        public DateTime? EntryDate { get; set; }
        
        [Required]
        [JsonPropertyName("startDate")]
        public DateTime StartDate { get; set; }
        
        [Required]
        [JsonPropertyName("endDate")]
        public DateTime EndDate { get; set; }
        
        [Required]
        [JsonPropertyName("activityDescription")]
        public string ActivityDescription { get; set; } = string.Empty;
        
        [JsonPropertyName("hoursSpent")]
        public decimal? HoursSpent { get; set; }
        
        [StringLength(255)]
        [JsonPropertyName("supervisorName")]
        public string? SupervisorName { get; set; }
        
        [StringLength(255)]
        [JsonPropertyName("supervisorSignature")]
        public string? SupervisorSignature { get; set; }
        
        [JsonPropertyName("approved")]
        public bool Approved { get; set; } = false;
        
        [JsonPropertyName("approvedDate")]
        public DateTime? ApprovedDate { get; set; }
        
        [JsonPropertyName("evidenceUrl")]
        public string? EvidenceUrl { get; set; }
        
        [JsonPropertyName("comments")]
        public string? Comments { get; set; }
    }

    // Assessment Strategy Plan DTOs
    public class AssessmentStrategyPlanDto
    {
        [Required]
        public int ProjectQualificationUnitStandardId { get; set; }
        public DateTime? AssessmentDate { get; set; }
        public string? QuestionnaireTime { get; set; }
        public string? QuestionnairePeople { get; set; }
        public string? QuestionnaireLocation { get; set; }
        public string? QuestionnaireEquipment { get; set; }
        public string? PracticalTime { get; set; }
        public string? PracticalPeople { get; set; }
        public string? PracticalLocation { get; set; }
        public string? PracticalEquipment { get; set; }
        public string? AssessorName { get; set; }
        public string? AssessorNumber { get; set; }
        public string? AssessorSignature { get; set; }
        public string? AssessorInitials { get; set; }
        public string? ModeratorName { get; set; }
        public string? ModeratorNumber { get; set; }
        public string? ModeratorSignature { get; set; }
        public string? ModeratorInitials { get; set; }

        // Candidate Preparation
        public DateTime? PrepDate { get; set; }
        public string? PrepTime { get; set; }
        public string? PrepVenue { get; set; }
        public string? PrepComments { get; set; }
        public string? PrepItemsJson { get; set; }
    }
}
