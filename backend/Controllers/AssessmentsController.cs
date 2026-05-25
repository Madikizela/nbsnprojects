using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using backend.Models.DTOs;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/assessments")]
    public class AssessmentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AssessmentsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // ==================== FORMATIVE ASSESSMENTS ====================

        // GET: api/Assessments/formative/unit-standard/{unitStandardId}
        [HttpGet("formative/unit-standard/{unitStandardId}")]
        public async Task<ActionResult<IEnumerable<FormativeAssessment>>> GetFormativeAssessments(int unitStandardId)
        {
            return await _context.FormativeAssessments
                .Where(fa => fa.ProjectQualificationUnitStandardId == unitStandardId)
                .OrderByDescending(fa => fa.AssessmentDate)
                .ToListAsync();
        }

        // GET: api/Assessments/formative/{id}/questions
        [HttpGet("formative/{id}/questions")]
        public async Task<ActionResult<IEnumerable<FormativeAssessmentQuestion>>> GetFormativeAssessmentQuestions(int id)
        {
            return await _context.FormativeAssessmentQuestions
                .Where(q => q.FormativeAssessmentId == id)
                .OrderBy(q => q.QuestionNumber)
                .ToListAsync();
        }
        // GET: api/Assessments/formative/{id}/unit-standard
        [HttpGet("formative/{id}/unit-standard")]
        public async Task<ActionResult<object>> GetFormativeAssessmentUnitStandard(int id)
        {
            var assessment = await _context.FormativeAssessments.FindAsync(id);
            if (assessment == null)
            {
                return NotFound();
            }

            return Ok(new {
                id = assessment.Id,
                projectQualificationUnitStandardId = assessment.ProjectQualificationUnitStandardId
            });
        }

        // GET: api/Assessments/summative/{id}/unit-standard
        [HttpGet("summative/{id}/unit-standard")]
        public async Task<ActionResult<object>> GetSummativeAssessmentUnitStandard(int id)
        {
            var assessment = await _context.SummativeAssessments.FindAsync(id);
            if (assessment == null)
            {
                return NotFound();
            }

            return Ok(new {
                id = assessment.Id,
                projectQualificationUnitStandardId = assessment.ProjectQualificationUnitStandardId
            });
        }


        // POST: api/Assessments/formative
        [HttpPost("formative")]
        public async Task<ActionResult<FormativeAssessment>> CreateFormativeAssessment(CreateFormativeAssessmentDto dto)
        {
            var assessment = new FormativeAssessment
            {
                ProjectQualificationUnitStandardId = dto.ProjectQualificationUnitStandardId,
                AssessmentDate = DateTime.SpecifyKind(dto.AssessmentDate, DateTimeKind.Utc),
                AssessmentMethod = dto.AssessmentMethod,
                Score = dto.Score,
                MaxScore = dto.MaxScore,
                AssessorName = dto.AssessorName,
                Comments = dto.Comments,
                Status = dto.Status,
                CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc),
                UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc)
            };

            _context.FormativeAssessments.Add(assessment);
            await _context.SaveChangesAsync();

            // Save questions if provided
            if (dto.Questions != null && dto.Questions.Count > 0)
            {
                foreach (var questionDto in dto.Questions)
                {
                    var question = new FormativeAssessmentQuestion
                    {
                        FormativeAssessmentId = assessment.Id,
                        QuestionNumber = questionDto.QuestionNumber,
                        QuestionText = questionDto.QuestionText,
                        AllocatedMarks = questionDto.AllocatedMarks,
                        CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc),
                        UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc)
                    };
                    _context.FormativeAssessmentQuestions.Add(question);
                }
                await _context.SaveChangesAsync();
            }

            return CreatedAtAction(nameof(GetFormativeAssessments), new { unitStandardId = assessment.ProjectQualificationUnitStandardId }, assessment);
        }

        // PUT: api/Assessments/formative/{id}
        [HttpPut("formative/{id}")]
        public async Task<IActionResult> UpdateFormativeAssessment(int id, CreateFormativeAssessmentDto dto)
        {
            var assessment = await _context.FormativeAssessments.FindAsync(id);
            if (assessment == null)
            {
                return NotFound();
            }

            assessment.AssessmentDate = DateTime.SpecifyKind(dto.AssessmentDate, DateTimeKind.Utc);
            assessment.AssessmentMethod = dto.AssessmentMethod;
            assessment.Score = dto.Score;
            assessment.MaxScore = dto.MaxScore;
            assessment.AssessorName = dto.AssessorName;
            assessment.Comments = dto.Comments;
            assessment.Status = dto.Status;
            assessment.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/Assessments/formative/{id}
        [HttpDelete("formative/{id}")]
        public async Task<IActionResult> DeleteFormativeAssessment(int id)
        {
            var assessment = await _context.FormativeAssessments.FindAsync(id);
            if (assessment == null)
            {
                return NotFound();
            }

            _context.FormativeAssessments.Remove(assessment);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // ==================== SUMMATIVE ASSESSMENTS ====================

        // GET: api/Assessments/summative/unit-standard/{unitStandardId}
        [HttpGet("summative/unit-standard/{unitStandardId}")]
        public async Task<ActionResult<IEnumerable<SummativeAssessment>>> GetSummativeAssessments(int unitStandardId)
        {
            return await _context.SummativeAssessments
                .Where(sa => sa.ProjectQualificationUnitStandardId == unitStandardId)
                .OrderByDescending(sa => sa.AssessmentDate)
                .ToListAsync();
        }

        // GET: api/Assessments/summative/{id}/questions
        [HttpGet("summative/{id}/questions")]
        public async Task<ActionResult<IEnumerable<SummativeAssessmentQuestion>>> GetSummativeAssessmentQuestions(int id)
        {
            return await _context.SummativeAssessmentQuestions
                .Where(q => q.SummativeAssessmentId == id)
                .OrderBy(q => q.QuestionNumber)
                .ToListAsync();
        }

        // POST: api/Assessments/summative
        [HttpPost("summative")]
        public async Task<ActionResult<SummativeAssessment>> CreateSummativeAssessment(CreateSummativeAssessmentDto dto)
        {
            var assessment = new SummativeAssessment
            {
                ProjectQualificationUnitStandardId = dto.ProjectQualificationUnitStandardId,
                AssessmentDate = DateTime.SpecifyKind(dto.AssessmentDate, DateTimeKind.Utc),
                FinalScore = dto.FinalScore,
                MaxScore = dto.MaxScore,
                Status = dto.Status,
                AssessorName = dto.AssessorName,
                ModeratorName = dto.ModeratorName,
                Comments = dto.Comments,
                ModeratorComments = dto.ModeratorComments,
                CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc),
                UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc)
            };

            _context.SummativeAssessments.Add(assessment);
            await _context.SaveChangesAsync();

            // Save questions if provided
            if (dto.Questions != null && dto.Questions.Count > 0)
            {
                foreach (var questionDto in dto.Questions)
                {
                    var question = new SummativeAssessmentQuestion
                    {
                        SummativeAssessmentId = assessment.Id,
                        QuestionNumber = questionDto.QuestionNumber,
                        QuestionText = questionDto.QuestionText,
                        AllocatedMarks = questionDto.AllocatedMarks,
                        CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc),
                        UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc)
                    };
                    _context.SummativeAssessmentQuestions.Add(question);
                }
                await _context.SaveChangesAsync();
            }

            return CreatedAtAction(nameof(GetSummativeAssessments), new { unitStandardId = assessment.ProjectQualificationUnitStandardId }, assessment);
        }

        // PUT: api/Assessments/summative/{id}
        [HttpPut("summative/{id}")]
        public async Task<IActionResult> UpdateSummativeAssessment(int id, CreateSummativeAssessmentDto dto)
        {
            var assessment = await _context.SummativeAssessments.FindAsync(id);
            if (assessment == null)
            {
                return NotFound();
            }

            assessment.AssessmentDate = DateTime.SpecifyKind(dto.AssessmentDate, DateTimeKind.Utc);
            assessment.FinalScore = dto.FinalScore;
            assessment.MaxScore = dto.MaxScore;
            assessment.Status = dto.Status;
            assessment.AssessorName = dto.AssessorName;
            assessment.ModeratorName = dto.ModeratorName;
            assessment.Comments = dto.Comments;
            assessment.ModeratorComments = dto.ModeratorComments;
            assessment.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/Assessments/summative/{id}
        [HttpDelete("summative/{id}")]
        public async Task<IActionResult> DeleteSummativeAssessment(int id)
        {
            var assessment = await _context.SummativeAssessments.FindAsync(id);
            if (assessment == null)
            {
                return NotFound();
            }

            _context.SummativeAssessments.Remove(assessment);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // ==================== LOGBOOK ENTRIES ====================

        // GET: api/Assessments/logbook/unit-standard/{unitStandardId}
        [HttpGet("logbook/unit-standard/{unitStandardId}")]
        public async Task<ActionResult<IEnumerable<LogbookEntry>>> GetLogbookEntries(int unitStandardId)
        {
            return await _context.LogbookEntries
                .Where(le => le.ProjectQualificationUnitStandardId == unitStandardId)
                .OrderByDescending(le => le.EntryDate)
                .ToListAsync();
        }

        // POST: api/Assessments/logbook
        [HttpPost("logbook")]
        public async Task<ActionResult<LogbookEntry>> CreateLogbookEntry(CreateLogbookEntryDto dto)
        {
            // Debug logging
            Console.WriteLine($"=== LOGBOOK DTO RECEIVED ===");
            Console.WriteLine($"ProjectQualificationUnitStandardId: {dto.ProjectQualificationUnitStandardId}");
            Console.WriteLine($"StartDate: {dto.StartDate}");
            Console.WriteLine($"EndDate: {dto.EndDate}");
            Console.WriteLine($"EntryDate: {dto.EntryDate}");
            Console.WriteLine($"ActivityDescription: {dto.ActivityDescription}");
            Console.WriteLine($"============================");

            var entry = new LogbookEntry
            {
                ProjectQualificationUnitStandardId = dto.ProjectQualificationUnitStandardId,
                EntryDate = dto.EntryDate.HasValue ? DateTime.SpecifyKind(dto.EntryDate.Value, DateTimeKind.Utc) : null,
                StartDate = DateTime.SpecifyKind(dto.StartDate, DateTimeKind.Utc),
                EndDate = DateTime.SpecifyKind(dto.EndDate, DateTimeKind.Utc),
                ActivityDescription = dto.ActivityDescription,
                HoursSpent = dto.HoursSpent,
                SupervisorName = dto.SupervisorName,
                SupervisorSignature = dto.SupervisorSignature,
                Approved = dto.Approved,
                ApprovedDate = dto.ApprovedDate.HasValue ? DateTime.SpecifyKind(dto.ApprovedDate.Value, DateTimeKind.Utc) : null,
                EvidenceUrl = dto.EvidenceUrl,
                Comments = dto.Comments,
                CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc),
                UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc)
            };

            _context.LogbookEntries.Add(entry);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetLogbookEntries), new { unitStandardId = entry.ProjectQualificationUnitStandardId }, entry);
        }

        // PUT: api/Assessments/logbook/{id}
        [HttpPut("logbook/{id}")]
        public async Task<IActionResult> UpdateLogbookEntry(int id, CreateLogbookEntryDto dto)
        {
            var entry = await _context.LogbookEntries.FindAsync(id);
            if (entry == null)
            {
                return NotFound();
            }

            entry.EntryDate = dto.EntryDate.HasValue ? DateTime.SpecifyKind(dto.EntryDate.Value, DateTimeKind.Utc) : null;
            entry.StartDate = DateTime.SpecifyKind(dto.StartDate, DateTimeKind.Utc);
            entry.EndDate = DateTime.SpecifyKind(dto.EndDate, DateTimeKind.Utc);
            entry.ActivityDescription = dto.ActivityDescription;
            entry.HoursSpent = dto.HoursSpent;
            entry.SupervisorName = dto.SupervisorName;
            entry.SupervisorSignature = dto.SupervisorSignature;
            entry.Approved = dto.Approved;
            entry.ApprovedDate = dto.ApprovedDate.HasValue ? DateTime.SpecifyKind(dto.ApprovedDate.Value, DateTimeKind.Utc) : null;
            entry.EvidenceUrl = dto.EvidenceUrl;
            entry.Comments = dto.Comments;
            entry.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/Assessments/logbook/{id}
        [HttpDelete("logbook/{id}")]
        public async Task<IActionResult> DeleteLogbookEntry(int id)
        {
            var entry = await _context.LogbookEntries.FindAsync(id);
            if (entry == null)
            {
                return NotFound();
            }

            _context.LogbookEntries.Remove(entry);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // ==================== POE HIERARCHY ====================

        // GET: api/Assessments/poe-hierarchy/class/{classId}
        // [HttpGet("poe-hierarchy/class/{classId}")]
        // public async Task<IActionResult> GetPOEHierarchy(int classId)
        // {
        //     // Temporarily disabled due to Entity Framework model issues
        //     return NotFound(new { message = "POE hierarchy endpoint temporarily disabled" });
        // }

        // GET: api/Assessments/types
        [HttpGet("types")]
        [Microsoft.AspNetCore.Authorization.AllowAnonymous]
        public IActionResult GetAssessmentTypes()
        {
            Console.WriteLine("=== GET /api/Assessments/types called ===");
            var defaultTypes = new List<object> 
            { 
                new { id = 1, name = "Formative", description = "Formative Assessment" },
                new { id = 2, name = "Summative", description = "Summative Assessment" }
            };
            return Ok(defaultTypes);
        }

        // ==================== ASSESSMENT STRATEGY PLANS ====================

        // GET: api/Assessments/strategy-plans
        [HttpGet("strategy-plans")]
        public async Task<ActionResult<IEnumerable<AssessmentStrategyPlan>>> GetAllStrategyPlans()
        {
            return await _context.AssessmentStrategyPlans.ToListAsync();
        }

        // GET: api/Assessments/strategy-plans/unit-standard/{unitStandardId}
        [HttpGet("strategy-plans/unit-standard/{unitStandardId}")]
        public async Task<ActionResult<AssessmentStrategyPlan>> GetStrategyPlanByUnitStandard(int unitStandardId)
        {
            var plan = await _context.AssessmentStrategyPlans
                .FirstOrDefaultAsync(p => p.ProjectQualificationUnitStandardId == unitStandardId);

            if (plan == null)
            {
                return NotFound();
            }

            return plan;
        }

        // POST: api/Assessments/strategy-plans
        [HttpPost("strategy-plans")]
        public async Task<ActionResult<AssessmentStrategyPlan>> SaveStrategyPlan(AssessmentStrategyPlanDto planDto)
        {
            var existingPlan = await _context.AssessmentStrategyPlans
                .FirstOrDefaultAsync(p => p.ProjectQualificationUnitStandardId == planDto.ProjectQualificationUnitStandardId);

            if (existingPlan != null)
            {
                // Update existing plan
                existingPlan.AssessmentDate = planDto.AssessmentDate;
                existingPlan.QuestionnaireTime = planDto.QuestionnaireTime;
                existingPlan.QuestionnairePeople = planDto.QuestionnairePeople;
                existingPlan.QuestionnaireLocation = planDto.QuestionnaireLocation;
                existingPlan.QuestionnaireEquipment = planDto.QuestionnaireEquipment;
                existingPlan.PracticalTime = planDto.PracticalTime;
                existingPlan.PracticalPeople = planDto.PracticalPeople;
                existingPlan.PracticalLocation = planDto.PracticalLocation;
                existingPlan.PracticalEquipment = planDto.PracticalEquipment;
                existingPlan.AssessorName = planDto.AssessorName;
                existingPlan.AssessorNumber = planDto.AssessorNumber;
                existingPlan.AssessorSignature = planDto.AssessorSignature;
                existingPlan.ModeratorName = planDto.ModeratorName;
                existingPlan.ModeratorNumber = planDto.ModeratorNumber;
                existingPlan.ModeratorSignature = planDto.ModeratorSignature;
                
                // Update Prep fields
                existingPlan.PrepDate = planDto.PrepDate;
                existingPlan.PrepTime = planDto.PrepTime;
                existingPlan.PrepVenue = planDto.PrepVenue;
                existingPlan.PrepComments = planDto.PrepComments;
                existingPlan.PrepItemsJson = planDto.PrepItemsJson;

                existingPlan.UpdatedAt = DateTime.UtcNow;

                _context.Entry(existingPlan).State = EntityState.Modified;
            }
            else
            {
                // Create new plan
                var newPlan = new AssessmentStrategyPlan
                {
                    ProjectQualificationUnitStandardId = planDto.ProjectQualificationUnitStandardId,
                     AssessmentDate = planDto.AssessmentDate,
                     QuestionnaireTime = planDto.QuestionnaireTime,
                     QuestionnairePeople = planDto.QuestionnairePeople,
                     QuestionnaireLocation = planDto.QuestionnaireLocation,
                     QuestionnaireEquipment = planDto.QuestionnaireEquipment,
                     PracticalTime = planDto.PracticalTime,
                     PracticalPeople = planDto.PracticalPeople,
                     PracticalLocation = planDto.PracticalLocation,
                     PracticalEquipment = planDto.PracticalEquipment,
                     AssessorName = planDto.AssessorName,
                     AssessorNumber = planDto.AssessorNumber,
                     AssessorSignature = planDto.AssessorSignature,
                     ModeratorName = planDto.ModeratorName,
                     ModeratorNumber = planDto.ModeratorNumber,
                     ModeratorSignature = planDto.ModeratorSignature,
                     
                     // New Prep fields
                     PrepDate = planDto.PrepDate,
                     PrepTime = planDto.PrepTime,
                     PrepVenue = planDto.PrepVenue,
                     PrepComments = planDto.PrepComments,
                     PrepItemsJson = planDto.PrepItemsJson,

                     CreatedAt = DateTime.UtcNow,
                     UpdatedAt = DateTime.UtcNow
                 };

                _context.AssessmentStrategyPlans.Add(newPlan);
                existingPlan = newPlan;
            }

            await _context.SaveChangesAsync();

            return Ok(existingPlan);
        }
    }
}
