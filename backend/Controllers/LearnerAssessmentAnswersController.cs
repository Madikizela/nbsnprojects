using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using backend.Models.DTOs;
using Microsoft.AspNetCore.Authorization;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/LearnerAssessmentAnswers")]
    public class LearnerAssessmentAnswersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _environment;

        public LearnerAssessmentAnswersController(ApplicationDbContext context, IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
            Console.WriteLine("LearnerAssessmentAnswersController initialized");
        }

        // GET: api/LearnerAssessmentAnswers/learner/{learnerId}/assessment/{assessmentId}/{assessmentType}
        [HttpGet("learner/{learnerId}/assessment/{assessmentId}/{assessmentType}")]
        public async Task<ActionResult<IEnumerable<object>>> GetLearnerAssessmentAnswers(
            int learnerId, int assessmentId, string assessmentType, [FromQuery] bool isRemedial = false)
        {
            Console.WriteLine($"GetLearnerAssessmentAnswers called for learner {learnerId}, isRemedial: {isRemedial}");
            var answers = await _context.LearnerAssessmentAnswers
                .Where(a => a.LearnerId == learnerId && 
                           a.AssessmentId == assessmentId && 
                           a.AssessmentType == assessmentType &&
                           a.IsRemedial == isRemedial)
                .OrderBy(a => a.QuestionNumber)
                .Select(a => new
                {
                    id = a.Id,
                    questionId = a.QuestionId,
                    questionNumber = a.QuestionNumber,
                    scannedDocumentName = a.ScannedDocumentName,
                    fileSize = a.FileSize,
                    scannedAt = a.ScannedAt,
                    mark = a.Mark,
                    assessorComments = a.AssessorComments,
                    markStatus = (int)a.MarkStatus,
                    moderatedMark = a.ModeratedMark,
                    moderatorComments = a.ModeratorComments,
                    moderationStatus = (int)a.ModerationStatus,
                    isRemedial = a.IsRemedial
                })
                .ToListAsync();

            return Ok(answers);
        }

        // GET: api/LearnerAssessmentAnswers/learner/{learnerId}/progress
        [HttpGet("learner/{learnerId}/progress")]
        public async Task<ActionResult<IEnumerable<object>>> GetLearnerProgress(int learnerId)
        {
            Console.WriteLine($"GetLearnerProgress called for learner {learnerId}");
            var progress = await _context.LearnerAssessmentProgress
                .Where(p => p.LearnerId == learnerId)
                .OrderBy(p => p.ProjectQualificationUnitStandardId)
                .Select(p => new
                {
                    p.Id,
                    p.ProjectQualificationUnitStandardId,
                    p.FormativeAssessmentId,
                    p.SummativeAssessmentId,
                    p.FormativeCompleted,
                    p.FormativeCompletedAt,
                    p.FormativeModerated,
                    p.FormativeModeratedAt,
                    p.SummativeCompleted,
                    p.SummativeCompletedAt,
                    p.SummativeModerated,
                    p.SummativeModeratedAt
                })
                .ToListAsync();

            return Ok(progress);
        }

        // GET: api/LearnerAssessmentAnswers/assessment/{assessmentType}/{assessmentId}/marking
        [HttpGet("assessment/{assessmentType}/{assessmentId}/marking")]
        public async Task<ActionResult<object>> GetAssessmentSubmissionsForMarking(string assessmentType, int assessmentId, [FromQuery] bool isRemedial = false)
        {
            var normalizedType = assessmentType?.Trim();
            if (!string.Equals(normalizedType, "Formative", StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(normalizedType, "Summative", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new { message = "assessmentType must be Formative or Summative" });
            }

            var canonicalType = string.Equals(normalizedType, "Formative", StringComparison.OrdinalIgnoreCase)
                ? "Formative"
                : "Summative";

            var submissions = await _context.LearnerAssessmentAnswers
                .AsNoTracking()
                .Where(a => a.AssessmentId == assessmentId && a.AssessmentType == canonicalType && a.IsRemedial == isRemedial)
                .Join(_context.Learners.AsNoTracking(),
                    answer => answer.LearnerId,
                    learner => learner.Id,
                    (answer, learner) => new
                    {
                        Id = answer.Id,
                        LearnerId = answer.LearnerId,
                        FirstName = learner.FirstName,
                        LastName = learner.LastName,
                        QuestionId = answer.QuestionId,
                        QuestionNumber = answer.QuestionNumber,
                        ScannedDocumentName = answer.ScannedDocumentName,
                        ScannedAt = answer.ScannedAt,
                        Mark = answer.Mark,
                        AssessorComments = answer.AssessorComments,
                        MarkStatus = (int)answer.MarkStatus,
                        ModeratedMark = answer.ModeratedMark,
                        ModeratorComments = answer.ModeratorComments,
                        ModerationStatus = (int)answer.ModerationStatus,
                        IsRemedial = answer.IsRemedial
                    })
                .OrderBy(x => x.FirstName)
                .ThenBy(x => x.LastName)
                .ThenBy(x => x.QuestionNumber)
                .ToListAsync();

            if (!submissions.Any())
            {
                return Ok(new
                {
                    assessmentId,
                    assessmentType = canonicalType,
                    learners = Array.Empty<object>()
                });
            }

            Dictionary<int, (string Text, decimal Marks)> questionDetailsById;
            if (canonicalType == "Formative")
            {
                questionDetailsById = await _context.FormativeAssessmentQuestions
                    .AsNoTracking()
                    .Where(q => q.FormativeAssessmentId == assessmentId)
                    .Select(q => new { q.Id, q.QuestionText, q.AllocatedMarks })
                    .ToDictionaryAsync(q => q.Id, q => (q.QuestionText, q.AllocatedMarks));
            }
            else
            {
                questionDetailsById = await _context.SummativeAssessmentQuestions
                    .AsNoTracking()
                    .Where(q => q.SummativeAssessmentId == assessmentId)
                    .Select(q => new { q.Id, q.QuestionText, q.AllocatedMarks })
                    .ToDictionaryAsync(q => q.Id, q => (q.QuestionText, q.AllocatedMarks));
            }

            var learners = submissions
                .GroupBy(s => new { s.LearnerId, s.FirstName, s.LastName })
                .Select(g => new
                {
                    learnerId = g.Key.LearnerId,
                    learnerName = $"{g.Key.FirstName} {g.Key.LastName}".Trim(),
                    answers = g.Select(a => new
                    {
                        answerId = a.Id,
                        questionId = a.QuestionId,
                        questionNumber = a.QuestionNumber,
                        questionText = questionDetailsById.TryGetValue(a.QuestionId, out var qText) ? qText.Text : string.Empty,
                        allocatedMarks = questionDetailsById.TryGetValue(a.QuestionId, out var qMarks) ? qMarks.Marks : 0,
                        scannedDocumentName = a.ScannedDocumentName,
                        scannedAt = a.ScannedAt,
                        mark = a.Mark,
                        assessorComments = a.AssessorComments,
                        markStatus = a.MarkStatus.ToString(),
                        moderatedMark = a.ModeratedMark,
                        moderatorComments = a.ModeratorComments,
                        moderationStatus = a.ModerationStatus.ToString(),
                        isRemedial = a.IsRemedial
                    })
                })
                .OrderBy(x => x.learnerName)
                .ToList();

            return Ok(new
            {
                assessmentId,
                assessmentType = canonicalType,
                isRemedial,
                learners
            });
        }

        [HttpPost("upload")]
        public async Task<ActionResult<object>> UploadAssessmentAnswer([FromForm] UploadAssessmentAnswerDto dto)
        {
            try
            {
                // Collect all files to upload
                var filesToUpload = new List<IFormFile>();
                if (dto.ScannedDocument != null) filesToUpload.Add(dto.ScannedDocument);
                if (dto.ScannedDocuments != null) filesToUpload.AddRange(dto.ScannedDocuments);

                if (!filesToUpload.Any())
                {
                    return BadRequest("No files uploaded");
                }

                // Check if answer already exists
                var existingAnswer = await _context.LearnerAssessmentAnswers
                    .FirstOrDefaultAsync(a => a.LearnerId == dto.LearnerId &&
                                            a.AssessmentId == dto.AssessmentId &&
                                            a.AssessmentType == dto.AssessmentType &&
                                            a.QuestionId == dto.QuestionId &&
                                            a.IsRemedial == dto.IsRemedial);

                if (existingAnswer != null)
                {
                    return Conflict(new { message = "Answer already exists for this question. Delete the existing answer first." });
                }

                // Create uploads directory if it doesn't exist
                var uploadsPath = Path.Combine(_environment.WebRootPath ?? _environment.ContentRootPath, "uploads", "assessment-answers");
                Directory.CreateDirectory(uploadsPath);

                var uploadedAnswers = new List<object>();

                foreach (var file in filesToUpload)
                {
                    if (file.Length == 0) continue;

                    // Generate unique filename
                    var fileExtension = Path.GetExtension(file.FileName);
                    var fileName = $"learner_{dto.LearnerId}_assessment_{dto.AssessmentId}_{dto.AssessmentType.ToLower()}_q{dto.QuestionNumber}_{(dto.IsRemedial ? "" : "")}{DateTime.UtcNow:yyyyMMdd_HHmmss}_{Guid.NewGuid().ToString().Substring(0, 8)}{fileExtension}";
                    var filePath = Path.Combine(uploadsPath, fileName);

                    // Save file
                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await file.CopyToAsync(stream);
                    }

                    // Save to database
                    var answer = new LearnerAssessmentAnswer
                    {
                        LearnerId = dto.LearnerId,
                        AssessmentId = dto.AssessmentId,
                        AssessmentType = dto.AssessmentType,
                        IsRemedial = dto.IsRemedial,
                        QuestionId = dto.QuestionId,
                        QuestionNumber = dto.QuestionNumber,
                        ScannedDocumentPath = filePath,
                        ScannedDocumentName = fileName,
                        FileSize = file.Length,
                        MimeType = file.ContentType,
                        ScannedAt = DateTime.UtcNow,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    _context.LearnerAssessmentAnswers.Add(answer);
                    await _context.SaveChangesAsync();

                    uploadedAnswers.Add(new
                    {
                        id = answer.Id,
                        fileName = fileName,
                        fileSize = answer.FileSize
                    });
                }

                // Update progress if all questions are answered
                await UpdateAssessmentProgress(dto.LearnerId, dto.AssessmentId, dto.AssessmentType, dto.ProjectQualificationUnitStandardId, dto.IsRemedial);

                return Ok(new
                {
                    message = "Assessment answer(s) uploaded successfully",
                    uploads = uploadedAnswers
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error uploading assessment answer", error = ex.Message });
            }
        }

        // DELETE: api/LearnerAssessmentAnswers/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAssessmentAnswer(int id)
        {
            try
            {
                var answer = await _context.LearnerAssessmentAnswers.FindAsync(id);
                if (answer == null)
                {
                    return NotFound();
                }

                // Delete file from disk
                if (System.IO.File.Exists(answer.ScannedDocumentPath))
                {
                    System.IO.File.Delete(answer.ScannedDocumentPath);
                }

                // Remove from database
                _context.LearnerAssessmentAnswers.Remove(answer);
                await _context.SaveChangesAsync();

                // Update progress (might need to mark assessment as incomplete)
                await UpdateAssessmentProgress(answer.LearnerId, answer.AssessmentId, answer.AssessmentType, null, answer.IsRemedial);

                return Ok(new { message = "Assessment answer deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error deleting assessment answer", error = ex.Message });
            }
        }

        [HttpGet("{id}/download")]
        public async Task<IActionResult> DownloadAssessmentAnswer(int id)
        {
            var answer = await _context.LearnerAssessmentAnswers
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.Id == id);

            if (answer == null)
            {
                return NotFound(new { message = "Assessment answer not found" });
            }

            if (string.IsNullOrWhiteSpace(answer.ScannedDocumentPath) || !System.IO.File.Exists(answer.ScannedDocumentPath))
            {
                return NotFound(new { message = "Uploaded file not found on server" });
            }

            var bytes = await System.IO.File.ReadAllBytesAsync(answer.ScannedDocumentPath);
            var mime = string.IsNullOrWhiteSpace(answer.MimeType) ? "application/octet-stream" : answer.MimeType;
            return File(bytes, mime, answer.ScannedDocumentName);
        }

        // POST: api/learnerassessmentanswers/mark
        [HttpPost("mark")]
        [AllowAnonymous]
        public async Task<IActionResult> MarkAnswer([FromBody] MarkAnswerDto dto)
        {
            Console.WriteLine($"Marking answer {dto.AnswerId} with mark {dto.Mark}");
            try
            {
                var answer = await _context.LearnerAssessmentAnswers.FindAsync(dto.AnswerId);
                if (answer == null)
                {
                    Console.WriteLine($"Answer with ID {dto.AnswerId} not found");
                    return NotFound("Answer not found");
                }

                // Validate mark against max marks
                decimal maxMarks = 0;
                if (answer.AssessmentType == "Formative")
                {
                    var question = await _context.FormativeAssessmentQuestions.FindAsync(answer.QuestionId);
                    if (question != null) maxMarks = question.AllocatedMarks;
                }
                else if (answer.AssessmentType == "Summative")
                {
                    var question = await _context.SummativeAssessmentQuestions.FindAsync(answer.QuestionId);
                    if (question != null) maxMarks = question.AllocatedMarks;
                }

                if (dto.Mark > maxMarks)
                {
                    return BadRequest(new { message = $"Mark ({dto.Mark}) cannot exceed allocated marks ({maxMarks})" });
                }

                answer.Mark = dto.Mark;
                answer.AssessorComments = dto.Comments;
                answer.MarkStatus = MarkStatus.Marked;
                answer.AssessorId = dto.AssessorId;
                answer.MarkedAt = DateTime.UtcNow;
                answer.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                Console.WriteLine($"Successfully marked answer {dto.AnswerId}");
                return Ok(new { message = "Answer marked successfully" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error marking answer: {ex.Message}");
                return StatusCode(500, new { message = "Error marking answer", error = ex.Message });
            }
        }

        [HttpGet("ping")]
        [AllowAnonymous]
        public IActionResult Ping()
        {
            return Ok("LearnerAssessmentAnswersController is reachable");
        }

        // POST: api/LearnerAssessmentAnswers/moderate
        [HttpPost("moderate")]
        public async Task<IActionResult> ModerateAnswer([FromBody] ModerateAnswerDto dto)
        {
            try
            {
                var answer = await _context.LearnerAssessmentAnswers.FindAsync(dto.AnswerId);
                if (answer == null) return NotFound("Answer not found");

                // Validate mark against max marks
                decimal maxMarks = 0;
                if (answer.AssessmentType == "Formative")
                {
                    var question = await _context.FormativeAssessmentQuestions.FindAsync(answer.QuestionId);
                    if (question != null) maxMarks = question.AllocatedMarks;
                }
                else if (answer.AssessmentType == "Summative")
                {
                    var question = await _context.SummativeAssessmentQuestions.FindAsync(answer.QuestionId);
                    if (question != null) maxMarks = question.AllocatedMarks;
                }

                if (dto.ModeratedMark > maxMarks)
                {
                    return BadRequest(new { message = $"Moderated mark ({dto.ModeratedMark}) cannot exceed allocated marks ({maxMarks})" });
                }

                answer.ModeratedMark = dto.ModeratedMark;
                answer.ModeratorComments = dto.Comments;
                answer.ModerationStatus = dto.IsApproved ? ModerationStatus.Moderated : ModerationStatus.ReturnedToAssessor;
                
                if (!dto.IsApproved)
                {
                    answer.MarkStatus = MarkStatus.NeedsRevision;
                }

                answer.ModeratorId = dto.ModeratorId;
                answer.ModeratedAt = DateTime.UtcNow;
                answer.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                
                // Update progress for moderation
                await UpdateAssessmentProgress(answer.LearnerId, answer.AssessmentId, answer.AssessmentType, null, answer.IsRemedial);

                return Ok(new { message = dto.IsApproved ? "Answer moderated successfully" : "Answer returned to assessor" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error moderating answer", error = ex.Message });
            }
        }

        // POST: api/LearnerAssessmentAnswers/clear-moderation
        [HttpPost("clear-moderation")]
        [AllowAnonymous]
        public async Task<IActionResult> ClearModerationData()
        {
            try
            {
                // Reset all moderation fields in LearnerAssessmentAnswers
                var answers = await _context.LearnerAssessmentAnswers.ToListAsync();
                foreach (var answer in answers)
                {
                    answer.ModeratedMark = null;
                    answer.ModeratorComments = null;
                    answer.ModerationStatus = ModerationStatus.Pending;
                    answer.ModeratorId = null;
                    answer.ModeratedAt = null;
                }

                // Reset all moderation flags in LearnerAssessmentProgress
                var progresses = await _context.LearnerAssessmentProgress.ToListAsync();
                foreach (var progress in progresses)
                {
                    progress.FormativeModerated = false;
                    progress.FormativeModeratedAt = null;
                    progress.SummativeModerated = false;
                    progress.SummativeModeratedAt = null;
                }

                await _context.SaveChangesAsync();
                return Ok(new { message = "All moderation data has been cleared successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error clearing moderation data", error = ex.Message });
            }
        }

        private async Task UpdateAssessmentProgress(int learnerId, int assessmentId, string assessmentType, int? projectQualificationUnitStandardId, bool isRemedial = false)
                {
                    try
                    {
                        // ALWAYS get the ProjectQualificationUnitStandardId from the database to ensure accuracy
                        // Don't trust the parameter passed from the mobile app
                        int? correctProjectQualificationUnitStandardId = null;

                        if (assessmentType == "Formative")
                        {
                            var formativeAssessment = await _context.FormativeAssessments.FindAsync(assessmentId);
                            correctProjectQualificationUnitStandardId = formativeAssessment?.ProjectQualificationUnitStandardId;
                        }
                        else
                        {
                            var summativeAssessment = await _context.SummativeAssessments.FindAsync(assessmentId);
                            correctProjectQualificationUnitStandardId = summativeAssessment?.ProjectQualificationUnitStandardId;
                        }

                        if (correctProjectQualificationUnitStandardId == null) return;

                        // Get or create progress record using the CORRECT ProjectQualificationUnitStandardId
                        var progress = await _context.LearnerAssessmentProgress
                            .FirstOrDefaultAsync(p => p.LearnerId == learnerId && 
                                                    p.ProjectQualificationUnitStandardId == correctProjectQualificationUnitStandardId);

                        if (progress == null)
                        {
                            progress = new LearnerAssessmentProgress
                            {
                                LearnerId = learnerId,
                                ProjectQualificationUnitStandardId = correctProjectQualificationUnitStandardId.Value,
                                CreatedAt = DateTime.UtcNow,
                                UpdatedAt = DateTime.UtcNow
                            };
                            _context.LearnerAssessmentProgress.Add(progress);
                        }

                        // Check if assessment is complete
                        if (assessmentType == "Formative")
                        {
                            progress.FormativeAssessmentId = assessmentId;

                            // Count total questions for this assessment
                            var totalQuestions = await _context.FormativeAssessmentQuestions
                                .CountAsync(q => q.FormativeAssessmentId == assessmentId);

                            // Count marked questions
                            var markedQuestions = await _context.LearnerAssessmentAnswers
                                .CountAsync(a => a.LearnerId == learnerId && 
                                               a.AssessmentId == assessmentId && 
                                               a.AssessmentType == "Formative" &&
                                               a.IsRemedial == isRemedial &&
                                               a.MarkStatus == MarkStatus.Marked);

                            if (isRemedial)
                            {
                                // Remedial logic could be more complex, but for now mark as completed if all marked
                                progress.RemedialCompleted = markedQuestions >= totalQuestions;
                                if (progress.RemedialCompleted && progress.RemedialCompletedAt == null)
                                    progress.RemedialCompletedAt = DateTime.UtcNow;

                                // Update moderation flag for remedial too
                                var moderatedQuestions = await _context.LearnerAssessmentAnswers
                                    .Where(a => a.LearnerId == learnerId && 
                                               a.AssessmentId == assessmentId && 
                                               a.AssessmentType == "Formative" &&
                                               a.IsRemedial == true &&
                                               (a.ModerationStatus == ModerationStatus.Moderated || a.ModerationStatus == ModerationStatus.ReturnedToAssessor))
                                    .Select(a => a.QuestionId)
                                    .Distinct()
                                    .CountAsync();
                                
                                progress.FormativeModerated = moderatedQuestions >= totalQuestions && totalQuestions > 0;
                                if (progress.FormativeModerated && progress.FormativeModeratedAt == null)
                                    progress.FormativeModeratedAt = DateTime.UtcNow;
                            }
                            else
                            {
                                progress.FormativeCompleted = markedQuestions >= totalQuestions;
                                if (progress.FormativeCompleted && progress.FormativeCompletedAt == null)
                                {
                                    progress.FormativeCompletedAt = DateTime.UtcNow;
                                }
                                else if (!progress.FormativeCompleted)
                                {
                                    progress.FormativeCompletedAt = null;
                                }

                                // Count moderated questions (Distinct by QuestionId to handle potential duplicates)
                                var moderatedQuestions = await _context.LearnerAssessmentAnswers
                                    .Where(a => a.LearnerId == learnerId && 
                                               a.AssessmentId == assessmentId && 
                                               a.AssessmentType == "Formative" &&
                                               a.IsRemedial == isRemedial &&
                                               (a.ModerationStatus == ModerationStatus.Moderated || a.ModerationStatus == ModerationStatus.ReturnedToAssessor))
                                    .Select(a => a.QuestionId)
                                    .Distinct()
                                    .CountAsync();
                                
                                progress.FormativeModerated = moderatedQuestions >= totalQuestions && totalQuestions > 0;
                                if (progress.FormativeModerated && progress.FormativeModeratedAt == null)
                                {
                                    progress.FormativeModeratedAt = DateTime.UtcNow;
                                }
                                else if (!progress.FormativeModerated)
                                {
                                    progress.FormativeModeratedAt = null;
                                }
                            }
                        }
                        else if (assessmentType == "Summative")
                        {
                            progress.SummativeAssessmentId = assessmentId;

                            // Count total questions for this assessment
                            var totalQuestions = await _context.SummativeAssessmentQuestions
                                .CountAsync(q => q.SummativeAssessmentId == assessmentId);

                            // Count marked questions
                            var markedQuestions = await _context.LearnerAssessmentAnswers
                                .CountAsync(a => a.LearnerId == learnerId && 
                                               a.AssessmentId == assessmentId && 
                                               a.AssessmentType == "Summative" &&
                                               a.IsRemedial == isRemedial &&
                                               a.MarkStatus == MarkStatus.Marked);

                            if (isRemedial)
                            {
                                progress.RemedialCompleted = markedQuestions >= totalQuestions;
                                if (progress.RemedialCompleted && progress.RemedialCompletedAt == null)
                                    progress.RemedialCompletedAt = DateTime.UtcNow;

                                // Update moderation flag for remedial too
                                var moderatedQuestions = await _context.LearnerAssessmentAnswers
                                    .Where(a => a.LearnerId == learnerId && 
                                                   a.AssessmentId == assessmentId && 
                                                   a.AssessmentType == "Summative" &&
                                                   a.IsRemedial == true &&
                                                   (a.ModerationStatus == ModerationStatus.Moderated || a.ModerationStatus == ModerationStatus.ReturnedToAssessor))
                                    .Select(a => a.QuestionId)
                                    .Distinct()
                                    .CountAsync();

                                progress.SummativeModerated = moderatedQuestions >= totalQuestions && totalQuestions > 0;
                                if (progress.SummativeModerated && progress.SummativeModeratedAt == null)
                                    progress.SummativeModeratedAt = DateTime.UtcNow;
                            }
                            else
                            {
                                progress.SummativeCompleted = markedQuestions >= totalQuestions;
                                if (progress.SummativeCompleted && progress.SummativeCompletedAt == null)
                                {
                                    progress.SummativeCompletedAt = DateTime.UtcNow;
                                }
                                else if (!progress.SummativeCompleted)
                                {
                                    progress.SummativeCompletedAt = null;
                                }

                                // Count moderated questions (Distinct by QuestionId to handle potential duplicates)
                                var moderatedQuestions = await _context.LearnerAssessmentAnswers
                                    .Where(a => a.LearnerId == learnerId && 
                                                   a.AssessmentId == assessmentId && 
                                                   a.AssessmentType == "Summative" &&
                                                   a.IsRemedial == isRemedial &&
                                                   (a.ModerationStatus == ModerationStatus.Moderated || a.ModerationStatus == ModerationStatus.ReturnedToAssessor))
                                    .Select(a => a.QuestionId)
                                    .Distinct()
                                    .CountAsync();

                                progress.SummativeModerated = moderatedQuestions >= totalQuestions && totalQuestions > 0;
                                if (progress.SummativeModerated && progress.SummativeModeratedAt == null)
                                {
                                    progress.SummativeModeratedAt = DateTime.UtcNow;
                                }
                                else if (!progress.SummativeModerated)
                                {
                                    progress.SummativeModeratedAt = null;
                                }
                            }
                        }

                        progress.UpdatedAt = DateTime.UtcNow;
                        await _context.SaveChangesAsync();
                    }
                    catch (Exception ex)
                    {
                        // Log error but don't fail the main operation
                        Console.WriteLine($"Error updating assessment progress: {ex.Message}");
                    }
                }

    }
}