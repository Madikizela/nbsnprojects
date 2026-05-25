using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using backend.Models.DTOs;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AssessmentReportsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AssessmentReportsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("project/{projectId}")]
        public async Task<ActionResult<CompetencyReportDto>> GetProjectCompetencyReport(int projectId)
        {
            var project = await _context.Projects.FindAsync(projectId);
            if (project == null) return NotFound("Project not found");

            // 1. Get all unit standards for the project
            var rawUnitStandards = await (
                from plp in _context.ProjectLearningPathways
                join pq in _context.ProjectQualifications on plp.Id equals pq.ProjectLearningPathwayId
                join pqus in _context.ProjectQualificationUnitStandards on pq.Id equals pqus.ProjectQualificationId
                where plp.ProjectId == projectId
                select new
                {
                    pqus.Id,
                    pqus.UnitStandardId,
                    pqus.UnitStandardType
                }
            ).Distinct().ToListAsync();

            var unitStandards = new List<UnitStandardReportDto>();

            foreach (var raw in rawUnitStandards)
            {
                string code = "";
                string name = "";

                if (raw.UnitStandardType == "Occupational")
                {
                    var ous = await _context.OccupationalUnitStandards.FindAsync(raw.UnitStandardId);
                    code = ous?.ModuleCode ?? "";
                    name = ous?.UnitStandardName ?? "";
                }
                else
                {
                    var lus = await _context.LegacyUnitStandards.FindAsync(raw.UnitStandardId);
                    code = lus?.UnitStandardId?.ToString() ?? "";
                    name = lus?.UnitStandardName ?? "";
                }

                unitStandards.Add(new UnitStandardReportDto
                {
                    Id = raw.Id,
                    UnitStandardId = code,
                    UnitStandardName = name
                });
            }

            // 2. Get all learners for the project
            var learners = await (
                from ce in _context.ClassEnrollments
                join sc in _context.SiteClasses on ce.SiteClassId equals sc.Id
                join ps in _context.ProjectSites on sc.ProjectSiteId equals ps.Id
                join l in _context.Learners on ce.LearnerId equals l.Id
                where ps.ProjectId == projectId
                select new
                {
                    l.Id,
                    l.FirstName,
                    l.LastName,
                    l.IdNumber
                }
            ).Distinct().ToListAsync();

            var report = new CompetencyReportDto
            {
                ProjectId = projectId,
                ProjectName = project.ProjectName,
                UnitStandards = unitStandards,
                Learners = new List<LearnerCompetencyDto>()
            };

            foreach (var learner in learners)
            {
                var learnerDto = new LearnerCompetencyDto
                {
                    LearnerId = learner.Id,
                    FirstName = learner.FirstName,
                    LastName = learner.LastName,
                    IdNumber = learner.IdNumber,
                    UnitStandardStatuses = new List<UnitStandardStatusDto>(),
                    OverallStatus = "In Progress"
                };

                bool allCompetent = true;
                bool anyInProgress = false;

                foreach (var us in unitStandards)
                {
                    var statusDto = await GetLearnerUnitStandardStatus(learner.Id, us.Id);
                    learnerDto.UnitStandardStatuses.Add(statusDto);

                    if (statusDto.FinalStatus == "NYC") allCompetent = false;
                    if (statusDto.FinalStatus == "Pending") anyInProgress = true;
                }

                if (allCompetent && !anyInProgress) learnerDto.OverallStatus = "Competent";
                else learnerDto.OverallStatus = "In Progress";

                report.Learners.Add(learnerDto);
            }

            return Ok(report);
        }

        private async Task<UnitStandardStatusDto> GetLearnerUnitStandardStatus(int learnerId, int pqusId)
        {
            var pqus = await _context.ProjectQualificationUnitStandards.FindAsync(pqusId);
            
            var statusDto = new UnitStandardStatusDto
            {
                UnitStandardId = pqusId,
                UnitStandardCode = "", // Will be set below
                FormativeStatus = "NYC",
                SummativeStatus = "NYC",
                FinalStatus = "NYC",
                RemedialRequired = false,
                RemedialCompleted = false
            };

            if (pqus != null)
            {
                if (pqus.UnitStandardType == "Occupational")
                {
                    var ous = await _context.OccupationalUnitStandards.FindAsync(pqus.UnitStandardId);
                    statusDto.UnitStandardCode = ous?.ModuleCode ?? "";
                }
                else
                {
                    var lus = await _context.LegacyUnitStandards.FindAsync(pqus.UnitStandardId);
                    statusDto.UnitStandardCode = lus?.UnitStandardId?.ToString() ?? "";
                }
            }

            // Get Formative Marks
            var formativeAssessments = await _context.FormativeAssessments
                .Where(fa => fa.ProjectQualificationUnitStandardId == pqusId)
                .ToListAsync();

            if (formativeAssessments.Any())
            {
                decimal totalMark = 0;
                decimal totalMax = 0;

                foreach (var fa in formativeAssessments)
                {
                    var marks = await _context.LearnerAssessmentAnswers
                        .Where(a => a.LearnerId == learnerId && a.AssessmentId == fa.Id && a.AssessmentType == "Formative" && !a.IsRemedial)
                        .SumAsync(a => a.Mark ?? 0);
                    
                    var max = await _context.FormativeAssessmentQuestions
                        .Where(q => q.FormativeAssessmentId == fa.Id)
                        .SumAsync(q => q.AllocatedMarks);

                    totalMark += marks;
                    totalMax += max;
                }

                statusDto.FormativeScore = totalMark;
                statusDto.FormativeMaxScore = totalMax;
                
                if (totalMax > 0)
                {
                    var percentage = (totalMark / totalMax) * 100;
                    statusDto.FormativeStatus = percentage >= 50 ? "C" : "NYC";
                }
            }

            // Get Summative Marks
            var summativeAssessments = await _context.SummativeAssessments
                .Where(sa => sa.ProjectQualificationUnitStandardId == pqusId)
                .ToListAsync();

            if (summativeAssessments.Any())
            {
                decimal totalMark = 0;
                decimal totalMax = 0;

                foreach (var sa in summativeAssessments)
                {
                    var marks = await _context.LearnerAssessmentAnswers
                        .Where(a => a.LearnerId == learnerId && a.AssessmentId == sa.Id && a.AssessmentType == "Summative" && !a.IsRemedial)
                        .SumAsync(a => a.Mark ?? 0);
                    
                    var max = await _context.SummativeAssessmentQuestions
                        .Where(q => q.SummativeAssessmentId == sa.Id)
                        .SumAsync(q => q.AllocatedMarks);

                    totalMark += marks;
                    totalMax += max;
                }

                statusDto.SummativeScore = totalMark;
                statusDto.SummativeMaxScore = totalMax;

                if (totalMax > 0)
                {
                    var percentage = (totalMark / totalMax) * 100;
                    statusDto.SummativeStatus = percentage >= 50 ? "C" : "NYC";
                }
            }

            // Final Status
            if (statusDto.FormativeStatus == "C" && statusDto.SummativeStatus == "C")
            {
                statusDto.FinalStatus = "C";
            }
            else
            {
                statusDto.FinalStatus = "NYC";
                statusDto.RemedialRequired = true;

                // Check if remedial is completed
                var remedialAnswers = await _context.LearnerAssessmentAnswers
                    .AnyAsync(a => a.LearnerId == learnerId && a.IsRemedial && 
                                  (from fa in _context.FormativeAssessments where fa.ProjectQualificationUnitStandardId == pqusId select fa.Id).Contains(a.AssessmentId) ||
                                  (from sa in _context.SummativeAssessments where sa.ProjectQualificationUnitStandardId == pqusId select sa.Id).Contains(a.AssessmentId));
                
                statusDto.RemedialCompleted = remedialAnswers;

                // If remedial is completed, recalculate with remedial marks
                if (remedialAnswers)
                {
                    // For now, let's just mark it as C if remedial is done, 
                    // or we could do a more complex calculation here.
                    // The user said "so that the learner will re-upload on the unit standards they failed without removing the ones they failed"
                    // This implies the remedial marks should be used if they exist.
                    
                    // Recalculate Formative with Remedial
                    decimal totalMark = 0;
                    decimal totalMax = 0;
                    foreach (var fa in formativeAssessments)
                    {
                        var questions = await _context.FormativeAssessmentQuestions
                            .Where(q => q.FormativeAssessmentId == fa.Id)
                            .ToListAsync();

                        foreach (var q in questions)
                        {
                            var remedialMark = await _context.LearnerAssessmentAnswers
                                .Where(a => a.LearnerId == learnerId && a.AssessmentId == fa.Id && a.AssessmentType == "Formative" && a.QuestionId == q.Id && a.IsRemedial)
                                .Select(a => a.Mark)
                                .FirstOrDefaultAsync();

                            var originalMark = await _context.LearnerAssessmentAnswers
                                .Where(a => a.LearnerId == learnerId && a.AssessmentId == fa.Id && a.AssessmentType == "Formative" && a.QuestionId == q.Id && !a.IsRemedial)
                                .Select(a => a.Mark)
                                .FirstOrDefaultAsync();

                            totalMark += remedialMark ?? originalMark ?? 0;
                            totalMax += q.AllocatedMarks;
                        }
                    }
                    if (totalMax > 0 && (totalMark / totalMax) * 100 >= 50) statusDto.FormativeStatus = "C";

                    // Recalculate Summative with Remedial
                    totalMark = 0;
                    totalMax = 0;
                    foreach (var sa in summativeAssessments)
                    {
                        var questions = await _context.SummativeAssessmentQuestions
                            .Where(q => q.SummativeAssessmentId == sa.Id)
                            .ToListAsync();

                        foreach (var q in questions)
                        {
                            var remedialMark = await _context.LearnerAssessmentAnswers
                                .Where(a => a.LearnerId == learnerId && a.AssessmentId == sa.Id && a.AssessmentType == "Summative" && a.QuestionId == q.Id && a.IsRemedial)
                                .Select(a => a.Mark)
                                .FirstOrDefaultAsync();

                            var originalMark = await _context.LearnerAssessmentAnswers
                                .Where(a => a.LearnerId == learnerId && a.AssessmentId == sa.Id && a.AssessmentType == "Summative" && a.QuestionId == q.Id && !a.IsRemedial)
                                .Select(a => a.Mark)
                                .FirstOrDefaultAsync();

                            totalMark += remedialMark ?? originalMark ?? 0;
                            totalMax += q.AllocatedMarks;
                        }
                    }
                    if (totalMax > 0 && (totalMark / totalMax) * 100 >= 50) statusDto.SummativeStatus = "C";

                    if (statusDto.FormativeStatus == "C" && statusDto.SummativeStatus == "C")
                    {
                        statusDto.FinalStatus = "C";
                    }
                }
            }

            return statusDto;
        }
    }
}
