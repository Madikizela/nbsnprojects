using System.ComponentModel.DataAnnotations;

namespace backend.Models.DTOs
{
    public class CreateProjectPhaseDto
    {
        [Required]
        [StringLength(200)]
        public string Name { get; set; } = string.Empty;

        [StringLength(1000)]
        public string? Description { get; set; }

        [Required]
        public int ProjectId { get; set; }

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        public int PlannedBeneficiaries { get; set; }

        public decimal BudgetAllocation { get; set; }

        // Learning Pathways and Qualifications
        public List<PhaseQualificationDto> Qualifications { get; set; } = new List<PhaseQualificationDto>();
        public List<PhaseLearningPathwayDto> LearningPathways { get; set; } = new List<PhaseLearningPathwayDto>();
    }

    public class PhaseQualificationDto
    {
        public int ProjectQualificationId { get; set; }
        public int PlannedLearners { get; set; }
    }

    public class PhaseLearningPathwayDto
    {
        public int ProjectLearningPathwayId { get; set; }
        public int PlannedLearners { get; set; }
    }

    public class ProjectPhaseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int ProjectId { get; set; }
        public string ProjectName { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public PhaseStatus Status { get; set; }
        public int PlannedBeneficiaries { get; set; }
        public int ActualBeneficiaries { get; set; }
        public decimal BudgetAllocation { get; set; }
        public decimal ActualSpent { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public string CreatedByUserName { get; set; } = string.Empty;

        // Related data
        public List<PhaseQualificationDetailDto> Qualifications { get; set; } = new List<PhaseQualificationDetailDto>();
        public List<PhaseLearningPathwayDetailDto> LearningPathways { get; set; } = new List<PhaseLearningPathwayDetailDto>();
    }

    public class PhaseQualificationDetailDto
    {
        public int Id { get; set; }
        public int ProjectQualificationId { get; set; }
        public string QualificationName { get; set; } = string.Empty;
        public string QualificationCode { get; set; } = string.Empty;
        public int PlannedLearners { get; set; }
        public int ActualLearners { get; set; }
        public int CompletedLearners { get; set; }
        public int RemainingCapacity { get; set; }
        public int TotalCapacity { get; set; }
    }

    public class PhaseLearningPathwayDetailDto
    {
        public int Id { get; set; }
        public int ProjectLearningPathwayId { get; set; }
        public string PathwayName { get; set; } = string.Empty;
        public int PlannedLearners { get; set; }
        public int ActualLearners { get; set; }
    }

    public class AvailableQualificationDto
    {
        public int ProjectQualificationId { get; set; }
        public string QualificationName { get; set; } = string.Empty;
        public string QualificationCode { get; set; } = string.Empty;
        public string QualificationType { get; set; } = string.Empty;
        public int TotalCapacity { get; set; }
        public int UsedCapacity { get; set; }
        public int RemainingCapacity { get; set; }
        public string DisplayText { get; set; } = string.Empty; // e.g., "24173 - Construction Roadworks (8000/8000 remaining)"
    }

    public class AvailableLearningPathwayDto
    {
        public int ProjectLearningPathwayId { get; set; }
        public string PathwayName { get; set; } = string.Empty;
        public int PathwayId { get; set; }
    }
}