using System.ComponentModel.DataAnnotations;

namespace backend.Models.DTOs
{
    public class SDPDashboardData
    {
        public int TotalProjects { get; set; }
        public int ActiveProjects { get; set; }
        public int CompletedProjects { get; set; }
        public int TotalBeneficiaries { get; set; }
        public int ActualBeneficiaries { get; set; }
        public List<ProjectSummaryDto> RecentProjects { get; set; } = new List<ProjectSummaryDto>();
        public List<ProjectMetricDto> ProjectMetrics { get; set; } = new List<ProjectMetricDto>();
    }

    public class ProjectSummaryDto
    {
        public int Id { get; set; }
        public string ProjectName { get; set; } = string.Empty;
        public string ContractNumber { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public ProjectStatus Status { get; set; }
        public int PlannedBeneficiaries { get; set; }
        public int ActualBeneficiaries { get; set; }
        public decimal CompletionPercentage { get; set; }
    }

    public class ProjectDetailsDto
    {
        public int Id { get; set; }
        public string ProjectName { get; set; } = string.Empty;
        public string ContractNumber { get; set; } = string.Empty;
        public string FinancialYear { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int PlannedBeneficiaries { get; set; }
        public int ActualBeneficiaries { get; set; }
        public ProjectStatus Status { get; set; }
        public string? ProgressNotes { get; set; }
        public decimal BudgetAmount { get; set; }
        public string Province { get; set; } = string.Empty;
        public string ProjectFunder { get; set; } = string.Empty;
        public string LeadEmployerPartner { get; set; } = string.Empty;
        public List<LearningPathwayDto> LearningPathways { get; set; } = new List<LearningPathwayDto>();
        public ProjectResourcesDto Resources { get; set; } = new ProjectResourcesDto();
        public bool CanEdit { get; set; }
        public DateTime? LastUpdatedBySDPAt { get; set; }
        public string? LastUpdatedBySDPUser { get; set; }
    }

    public class ProjectMetricDto
    {
        public int ProjectId { get; set; }
        public string ProjectName { get; set; } = string.Empty;
        public decimal CompletionPercentage { get; set; }
        public int DaysRemaining { get; set; }
        public bool IsOverdue { get; set; }
    }

    public class LearningPathwayDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int CompletedBeneficiaries { get; set; }
        public decimal CompletionPercentage { get; set; }
        public List<QualificationProgressDto> Qualifications { get; set; } = new List<QualificationProgressDto>();
    }

    public class QualificationProgressDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty; // "Occupational" or "Legacy"
        public int CompletedBeneficiaries { get; set; }
        public decimal CompletionPercentage { get; set; }
        public DateTime? LastUpdated { get; set; }
    }

    public class ProjectResourcesDto
    {
        public bool HasPPE { get; set; }
        public bool HasLearningMaterial { get; set; }
        public bool HasToolkit { get; set; }
        public bool HasConsumables { get; set; }
        public bool PPEAvailable { get; set; }
        public bool LearningMaterialAvailable { get; set; }
        public bool ToolkitAvailable { get; set; }
        public bool ConsumablesAvailable { get; set; }
    }

    public class ProjectStatusUpdateDto
    {
        [Required]
        public ProjectStatus Status { get; set; }
        
        [StringLength(1000)]
        public string? ProgressNotes { get; set; }
        
        [Range(0, int.MaxValue)]
        public int? ActualBeneficiaries { get; set; }
    }

    public class BeneficiaryUpdateDto
    {
        [Required]
        [Range(0, int.MaxValue, ErrorMessage = "Actual beneficiaries must be a positive number")]
        public int ActualBeneficiaries { get; set; }
        
        [StringLength(500)]
        public string? Notes { get; set; }
    }

    public class QualificationUpdateDto
    {
        [Required]
        [Range(0, int.MaxValue)]
        public int CompletedBeneficiaries { get; set; }
        
        [StringLength(500)]
        public string? Notes { get; set; }
    }

    public class ResourceUpdateDto
    {
        public bool PPEAvailable { get; set; }
        public bool LearningMaterialAvailable { get; set; }
        public bool ToolkitAvailable { get; set; }
        public bool ConsumablesAvailable { get; set; }
        
        [StringLength(500)]
        public string? Notes { get; set; }
    }
}