using backend.Models;

namespace backend.Services
{
    public class PhaseTemplateService
    {
        public static List<PhaseActivityTemplate> GetDefaultPhaseActivities()
        {
            return new List<PhaseActivityTemplate>
            {
                new PhaseActivityTemplate
                {
                    Name = "Pre-training Activities",
                    ActivityCode = "1.1",
                    OrderIndex = 1,
                    SubActivities = new List<PhaseSubActivityTemplate>
                    {
                        new PhaseSubActivityTemplate { Name = "Project Profile", ActivityCode = "1.1.1", OrderIndex = 1 },
                        new PhaseSubActivityTemplate { Name = "Budget", ActivityCode = "1.1.2", OrderIndex = 2 },
                        new PhaseSubActivityTemplate { Name = "Implementation", ActivityCode = "1.1.3", OrderIndex = 3 },
                        new PhaseSubActivityTemplate { Name = "POE", ActivityCode = "1.1.4", OrderIndex = 4 },
                        new PhaseSubActivityTemplate { Name = "Sites", ActivityCode = "1.1.5", OrderIndex = 5 },
                        new PhaseSubActivityTemplate { Name = "Classes", ActivityCode = "1.1.6", OrderIndex = 6 },
                        new PhaseSubActivityTemplate { Name = "Teachers", ActivityCode = "1.1.7", OrderIndex = 7 }
                    }
                },
                new PhaseActivityTemplate
                {
                    Name = "Learner Preparation",
                    ActivityCode = "1.2",
                    OrderIndex = 2,
                    SubActivities = new List<PhaseSubActivityTemplate>
                    {
                        new PhaseSubActivityTemplate { Name = "Learner Profile", ActivityCode = "1.2.1", OrderIndex = 1 },
                        new PhaseSubActivityTemplate { Name = "Learner Documents", ActivityCode = "1.2.2", OrderIndex = 2 },
                        new PhaseSubActivityTemplate { Name = "Approvals", ActivityCode = "1.2.3", OrderIndex = 3 },
                        new PhaseSubActivityTemplate { Name = "Learner Digital Onboarding", ActivityCode = "1.2.4", OrderIndex = 4 },
                        new PhaseSubActivityTemplate { Name = "Learner Agreement", ActivityCode = "1.2.5", OrderIndex = 5 },
                        new PhaseSubActivityTemplate { Name = "Enrollment/Induction Cloaking", ActivityCode = "1.2.6", OrderIndex = 6 }
                    }
                },
                new PhaseActivityTemplate
                {
                    Name = "Execution",
                    ActivityCode = "1.3",
                    OrderIndex = 3,
                    SubActivities = new List<PhaseSubActivityTemplate>
                    {
                        new PhaseSubActivityTemplate { Name = "Cloaking and Sick-notes", ActivityCode = "1.3.1", OrderIndex = 1 },
                        new PhaseSubActivityTemplate { Name = "Acknowledgement of receipt for", ActivityCode = "1.3.2", OrderIndex = 2 },
                        new PhaseSubActivityTemplate { Name = "Learning Material", ActivityCode = "1.3.2.1", OrderIndex = 3 },
                        new PhaseSubActivityTemplate { Name = "PPE", ActivityCode = "1.3.2.2", OrderIndex = 4 },
                        new PhaseSubActivityTemplate { Name = "Toolkits", ActivityCode = "1.3.2.3", OrderIndex = 5 },
                        new PhaseSubActivityTemplate { Name = "Portfolio of Evidence submitted by:", ActivityCode = "1.3.3", OrderIndex = 6 },
                        new PhaseSubActivityTemplate { Name = "Facilitators", ActivityCode = "1.3.3.1", OrderIndex = 7 },
                        new PhaseSubActivityTemplate { Name = "Assessors", ActivityCode = "1.3.3.2", OrderIndex = 8 },
                        new PhaseSubActivityTemplate { Name = "Moderators", ActivityCode = "1.3.3.3", OrderIndex = 9 },
                        new PhaseSubActivityTemplate { Name = "Logbook", ActivityCode = "1.3.3.4", OrderIndex = 10 },
                        new PhaseSubActivityTemplate { Name = "Stipends", ActivityCode = "1.3.4", OrderIndex = 11 },
                        new PhaseSubActivityTemplate { Name = "Reporting (PIR and QFR)", ActivityCode = "1.3.5", OrderIndex = 12 }
                    }
                },
                new PhaseActivityTemplate
                {
                    Name = "Post-training Activities",
                    ActivityCode = "1.4",
                    OrderIndex = 4,
                    SubActivities = new List<PhaseSubActivityTemplate>
                    {
                        new PhaseSubActivityTemplate { Name = "Certification and Close Out", ActivityCode = "1.4.1", OrderIndex = 1 },
                        new PhaseSubActivityTemplate { Name = "External Verification", ActivityCode = "1.4.2", OrderIndex = 2 },
                        new PhaseSubActivityTemplate { Name = "Certification/Statement of Results", ActivityCode = "1.4.3", OrderIndex = 3 },
                        new PhaseSubActivityTemplate { Name = "Project Close Out", ActivityCode = "1.4.4", OrderIndex = 4 }
                    }
                }
            };
        }
    }

    public class PhaseActivityTemplate
    {
        public string Name { get; set; } = string.Empty;
        public string ActivityCode { get; set; } = string.Empty;
        public int OrderIndex { get; set; }
        public List<PhaseSubActivityTemplate> SubActivities { get; set; } = new List<PhaseSubActivityTemplate>();
    }

    public class PhaseSubActivityTemplate
    {
        public string Name { get; set; } = string.Empty;
        public string ActivityCode { get; set; } = string.Empty;
        public int OrderIndex { get; set; }
    }
}