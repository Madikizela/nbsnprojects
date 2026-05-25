using System.Collections.Generic;

namespace backend.Models.DTOs
{
    public class CompetencyReportDto
    {
        public int ProjectId { get; set; }
        public string ProjectName { get; set; }
        public List<UnitStandardReportDto> UnitStandards { get; set; }
        public List<LearnerCompetencyDto> Learners { get; set; }
    }

    public class UnitStandardReportDto
    {
        public int Id { get; set; }
        public string UnitStandardId { get; set; }
        public string UnitStandardName { get; set; }
    }

    public class LearnerCompetencyDto
    {
        public int LearnerId { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string IdNumber { get; set; }
        public List<UnitStandardStatusDto> UnitStandardStatuses { get; set; }
        public string OverallStatus { get; set; }
    }

    public class UnitStandardStatusDto
    {
        public int UnitStandardId { get; set; }
        public string UnitStandardCode { get; set; }
        public decimal FormativeScore { get; set; }
        public decimal FormativeMaxScore { get; set; }
        public string FormativeStatus { get; set; } // C or NYC
        public decimal SummativeScore { get; set; }
        public decimal SummativeMaxScore { get; set; }
        public string SummativeStatus { get; set; } // C or NYC
        public string FinalStatus { get; set; } // C or NYC
        public bool RemedialRequired { get; set; }
        public bool RemedialCompleted { get; set; }
    }
}
