using System.Collections.Generic;

namespace backend.Models.DTOs
{
    public class CompetencyReportDto
    {
        public int ProjectId { get; set; }
        public string ProjectName { get; set; } = string.Empty;
        public List<UnitStandardReportDto> UnitStandards { get; set; } = new();
        public List<LearnerCompetencyDto> Learners { get; set; } = new();
    }

    public class UnitStandardReportDto
    {
        public int Id { get; set; }
        public string UnitStandardId { get; set; } = string.Empty;
        public string UnitStandardName { get; set; } = string.Empty;
    }

    public class LearnerCompetencyDto
    {
        public int LearnerId { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string IdNumber { get; set; } = string.Empty;
        public List<UnitStandardStatusDto> UnitStandardStatuses { get; set; } = new();
        public string OverallStatus { get; set; } = string.Empty;
    }

    public class UnitStandardStatusDto
    {
        public int UnitStandardId { get; set; }
        public string UnitStandardCode { get; set; } = string.Empty;
        public decimal FormativeScore { get; set; }
        public decimal FormativeMaxScore { get; set; }
        public string FormativeStatus { get; set; } = string.Empty; // C or NYC
        public decimal SummativeScore { get; set; }
        public decimal SummativeMaxScore { get; set; }
        public string SummativeStatus { get; set; } = string.Empty; // C or NYC
        public string FinalStatus { get; set; } = string.Empty; // C or NYC
        public bool RemedialRequired { get; set; }
        public bool RemedialCompleted { get; set; }
    }
}
