using System.ComponentModel.DataAnnotations;

namespace backend.Models.DTOs
{
    public class CreateProjectDto
    {
        [Required]
        [StringLength(255)]
        public string ProjectName { get; set; } = string.Empty;
        
        [Required]
        [StringLength(255)]
        public string ContractNumber { get; set; } = string.Empty;
        
        [Required]
        [StringLength(10)]
        public string FinancialYear { get; set; } = string.Empty;
        
        [Required]
        public DateTime StartDate { get; set; }
        
        [Required]
        public DateTime EndDate { get; set; }
        
        [Required]
        public int NumberOfBeneficiaries { get; set; }
        
        public bool HasPPE { get; set; } = false;
        public bool HasLearningMaterial { get; set; } = false;
        public bool HasToolkit { get; set; } = false;
        public bool HasConsumables { get; set; } = false;
        
        [Required]
        [StringLength(100)]
        public string Province { get; set; } = string.Empty;
        
        [Required]
        [StringLength(255)]
        public string ProjectFunder { get; set; } = string.Empty;
        
        [Required]
        [StringLength(255)]
        public string LeadEmployerPartner { get; set; } = string.Empty;
        
        [Required]
        public int SkillsDevelopmentProviderId { get; set; }
        
        [Required]
        public decimal BudgetAmount { get; set; }
        
        public int? ClientId { get; set; }
        
        public List<CreateProjectLearningPathwayDto> LearningPathways { get; set; } = new List<CreateProjectLearningPathwayDto>();
    }

    public class CreateProjectLearningPathwayDto
    {
        [Required]
        public int PathwayId { get; set; }
        
        public List<CreateProjectQualificationDto> Qualifications { get; set; } = new List<CreateProjectQualificationDto>();
    }

    public class CreateProjectQualificationDto
    {
        [Required]
        public int QualificationTypeId { get; set; }
        
        public int? OccupationalQualificationId { get; set; }
        public int? LegacyQualificationId { get; set; }
        
        [StringLength(50)]
        public string? EmploymentType { get; set; }
        
        public int NumberOfBeneficiaries { get; set; } = 0;
        
        public List<int> SelectedUnitStandards { get; set; } = new List<int>();
    }

    public class ProjectResponseDto
    {
        public int Id { get; set; }
        public string ProjectName { get; set; } = string.Empty;
        public string ContractNumber { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public int LearningPathwaysCount { get; set; }
        public int QualificationsCount { get; set; }
    }
}