using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Controllers
{
    /// <summary>
    /// SystemAdmin-only endpoints to list and restore soft-deleted records.
    ///
    /// GET  /api/Restore               — list all soft-deleted records across supported entities
    /// PUT  /api/Restore/{entity}/{id}  — restore a single soft-deleted record by entity name + id
    ///
    /// Supported entity names (case-insensitive):
    ///   users, clients, sdps, learners, projects, projectphases, projectsites, siteclasses,
    ///   classEnrollments, announcements, notifications, learnerDocuments, generatedDocuments,
    ///   documents, formativeAssessments, summativeAssessments, logbookEntries
    /// </summary>
    [Authorize(Roles = "SystemAdmin")]
    [ApiController]
    [Route("api/[controller]")]
    public class RestoreController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<RestoreController> _logger;

        public RestoreController(ApplicationDbContext context, ILogger<RestoreController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // Supported entity names (case-insensitive lookup).
        private static readonly HashSet<string> SupportedEntities = new(StringComparer.OrdinalIgnoreCase)
        {
            "users", "clients", "sdps", "learners", "projects", "projectphases",
            "projectsites", "siteclasses", "classEnrollments", "announcements",
            "notifications", "learnerDocuments", "generatedDocuments", "documents",
            "formativeAssessments", "summativeAssessments", "logbookEntries"
        };

        // ── GET: /api/Restore ────────────────────────────────────────────────
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = new List<DeletedRecordDto>();

            // Users
            result.AddRange((await _context.Users.IgnoreQueryFilters().AsNoTracking().Where(e => e.IsDeleted).ToListAsync())
                .Select(e => new DeletedRecordDto { Entity = "users", Id = e.Id, Name = $"{e.FirstName} {e.LastName}".Trim(), DeletedAt = e.DeletedAt }));

            // Clients
            result.AddRange((await _context.Clients.IgnoreQueryFilters().AsNoTracking().Where(e => e.IsDeleted).ToListAsync())
                .Select(e => new DeletedRecordDto { Entity = "clients", Id = e.Id, Name = e.Name, DeletedAt = e.DeletedAt }));

            // Skills Development Providers (sdps)
            result.AddRange((await _context.SkillsDevelopmentProviders.IgnoreQueryFilters().AsNoTracking().Where(e => e.IsDeleted).ToListAsync())
                .Select(e => new DeletedRecordDto { Entity = "sdps", Id = e.Id, Name = e.Name, DeletedAt = e.DeletedAt }));

            // Learners
            result.AddRange((await _context.Learners.IgnoreQueryFilters().AsNoTracking().Where(e => e.IsDeleted).ToListAsync())
                .Select(e => new DeletedRecordDto { Entity = "learners", Id = e.Id, Name = $"{e.FirstName} {e.LastName}".Trim(), DeletedAt = e.DeletedAt }));

            // Projects
            result.AddRange((await _context.Projects.IgnoreQueryFilters().AsNoTracking().Where(e => e.IsDeleted).ToListAsync())
                .Select(e => new DeletedRecordDto { Entity = "projects", Id = e.Id, Name = e.ProjectName, DeletedAt = e.DeletedAt }));

            // Project Phases
            result.AddRange((await _context.ProjectPhases.IgnoreQueryFilters().AsNoTracking().Where(e => e.IsDeleted).ToListAsync())
                .Select(e => new DeletedRecordDto { Entity = "projectphases", Id = e.Id, Name = e.Name, DeletedAt = e.DeletedAt }));

            // Project Sites
            result.AddRange((await _context.ProjectSites.IgnoreQueryFilters().AsNoTracking().Where(e => e.IsDeleted).ToListAsync())
                .Select(e => new DeletedRecordDto { Entity = "projectsites", Id = e.Id, Name = e.SiteName, DeletedAt = e.DeletedAt }));

            // Site Classes
            result.AddRange((await _context.SiteClasses.IgnoreQueryFilters().AsNoTracking().Where(e => e.IsDeleted).ToListAsync())
                .Select(e => new DeletedRecordDto { Entity = "siteclasses", Id = e.Id, Name = e.ClassName, DeletedAt = e.DeletedAt }));

            // Class Enrollments
            result.AddRange((await _context.ClassEnrollments.IgnoreQueryFilters().AsNoTracking().Where(e => e.IsDeleted).ToListAsync())
                .Select(e => new DeletedRecordDto { Entity = "classEnrollments", Id = e.Id, Name = $"Enrollment #{e.Id} (Learner {e.LearnerId} \u2192 Class {e.SiteClassId})", DeletedAt = e.DeletedAt }));

            // Announcements
            result.AddRange((await _context.Announcements.IgnoreQueryFilters().AsNoTracking().Where(e => e.IsDeleted).ToListAsync())
                .Select(e => new DeletedRecordDto { Entity = "announcements", Id = e.Id, Name = e.Title, DeletedAt = e.DeletedAt }));

            // Notifications
            result.AddRange((await _context.Notifications.IgnoreQueryFilters().AsNoTracking().Where(e => e.IsDeleted).ToListAsync())
                .Select(e => new DeletedRecordDto { Entity = "notifications", Id = e.Id, Name = e.Title, DeletedAt = e.DeletedAt }));

            // Learner Documents
            result.AddRange((await _context.LearnerDocuments.IgnoreQueryFilters().AsNoTracking().Where(e => e.IsDeleted).ToListAsync())
                .Select(e => new DeletedRecordDto { Entity = "learnerDocuments", Id = e.Id, Name = e.FileName, DeletedAt = e.DeletedAt }));

            // Generated Documents
            result.AddRange((await _context.GeneratedDocuments.IgnoreQueryFilters().AsNoTracking().Where(e => e.IsDeleted).ToListAsync())
                .Select(e => new DeletedRecordDto { Entity = "generatedDocuments", Id = e.Id, Name = e.DocumentTitle, DeletedAt = e.DeletedAt }));

            // Documents
            result.AddRange((await _context.Documents.IgnoreQueryFilters().AsNoTracking().Where(e => e.IsDeleted).ToListAsync())
                .Select(e => new DeletedRecordDto { Entity = "documents", Id = e.Id, Name = e.Name, DeletedAt = e.DeletedAt }));

            // Formative Assessments
            result.AddRange((await _context.FormativeAssessments.IgnoreQueryFilters().AsNoTracking().Where(e => e.IsDeleted).ToListAsync())
                .Select(e => new DeletedRecordDto { Entity = "formativeAssessments", Id = e.Id, Name = e.AssessorName ?? $"Formative Assessment #{e.Id}", DeletedAt = e.DeletedAt }));

            // Summative Assessments
            result.AddRange((await _context.SummativeAssessments.IgnoreQueryFilters().AsNoTracking().Where(e => e.IsDeleted).ToListAsync())
                .Select(e => new DeletedRecordDto { Entity = "summativeAssessments", Id = e.Id, Name = e.AssessorName ?? $"Summative Assessment #{e.Id}", DeletedAt = e.DeletedAt }));

            // Logbook Entries
            result.AddRange((await _context.LogbookEntries.IgnoreQueryFilters().AsNoTracking().Where(e => e.IsDeleted).ToListAsync())
                .Select(e => new DeletedRecordDto { Entity = "logbookEntries", Id = e.Id, Name = e.ActivityDescription, DeletedAt = e.DeletedAt }));

            return Ok(new { total = result.Count, items = result });
        }

        // ── PUT: /api/Restore/{entity}/{id} ──────────────────────────────────
        [HttpPut("{entity}/{id}")]
        public async Task<IActionResult> Restore(string entity, int id)
        {
            if (string.IsNullOrWhiteSpace(entity))
                return BadRequest(new { message = "Entity name is required." });

            if (!SupportedEntities.Contains(entity))
                return BadRequest(new { message = $"Unsupported entity '{entity}'. Supported: {string.Join(", ", SupportedEntities)}" });

            ISoftDeletable? record = null;

            switch (entity.ToLowerInvariant())
            {
                case "users":
                    record = await _context.Users.IgnoreQueryFilters().FirstOrDefaultAsync(e => e.Id == id);
                    break;
                case "clients":
                    record = await _context.Clients.IgnoreQueryFilters().FirstOrDefaultAsync(e => e.Id == id);
                    break;
                case "sdps":
                    record = await _context.SkillsDevelopmentProviders.IgnoreQueryFilters().FirstOrDefaultAsync(e => e.Id == id);
                    break;
                case "learners":
                    record = await _context.Learners.IgnoreQueryFilters().FirstOrDefaultAsync(e => e.Id == id);
                    break;
                case "projects":
                    record = await _context.Projects.IgnoreQueryFilters().FirstOrDefaultAsync(e => e.Id == id);
                    break;
                case "projectphases":
                    record = await _context.ProjectPhases.IgnoreQueryFilters().FirstOrDefaultAsync(e => e.Id == id);
                    break;
                case "projectsites":
                    record = await _context.ProjectSites.IgnoreQueryFilters().FirstOrDefaultAsync(e => e.Id == id);
                    break;
                case "siteclasses":
                    record = await _context.SiteClasses.IgnoreQueryFilters().FirstOrDefaultAsync(e => e.Id == id);
                    break;
                case "classenrollments":
                    record = await _context.ClassEnrollments.IgnoreQueryFilters().FirstOrDefaultAsync(e => e.Id == id);
                    break;
                case "announcements":
                    record = await _context.Announcements.IgnoreQueryFilters().FirstOrDefaultAsync(e => e.Id == id);
                    break;
                case "notifications":
                    record = await _context.Notifications.IgnoreQueryFilters().FirstOrDefaultAsync(e => e.Id == id);
                    break;
                case "learnerdocuments":
                    record = await _context.LearnerDocuments.IgnoreQueryFilters().FirstOrDefaultAsync(e => e.Id == id);
                    break;
                case "generateddocuments":
                    record = await _context.GeneratedDocuments.IgnoreQueryFilters().FirstOrDefaultAsync(e => e.Id == id);
                    break;
                case "documents":
                    record = await _context.Documents.IgnoreQueryFilters().FirstOrDefaultAsync(e => e.Id == id);
                    break;
                case "formativeassessments":
                    record = await _context.FormativeAssessments.IgnoreQueryFilters().FirstOrDefaultAsync(e => e.Id == id);
                    break;
                case "summativeassessments":
                    record = await _context.SummativeAssessments.IgnoreQueryFilters().FirstOrDefaultAsync(e => e.Id == id);
                    break;
                case "logbookentries":
                    record = await _context.LogbookEntries.IgnoreQueryFilters().FirstOrDefaultAsync(e => e.Id == id);
                    break;
                default:
                    return BadRequest(new { message = $"Unsupported entity '{entity}'." });
            }

            if (record == null)
                return NotFound(new { message = $"No {entity} record found with id {id}." });

            record.Restore();

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Failed to restore {Entity} {Id}", entity, id);
                return Conflict(new
                {
                    message = $"Could not restore {entity} {id}. It may conflict with an existing active record (e.g. a duplicate email or unique key).",
                    error = ex.InnerException?.Message ?? ex.Message
                });
            }

            _logger.LogInformation("Restored {Entity} {Id}", entity, id);
            return Ok(new { message = $"{entity} {id} restored successfully." });
        }
    }

    /// <summary>Single soft-deleted record summary returned by GET /api/Restore.</summary>
    public class DeletedRecordDto
    {
        public string Entity { get; set; } = string.Empty;
        public int Id { get; set; }
        public string? Name { get; set; }
        public DateTime? DeletedAt { get; set; }
    }
}
