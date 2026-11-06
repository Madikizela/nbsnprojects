using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuditLogController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AuditLogController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/AuditLog?page=1&pageSize=50&action=SDP_DISABLED&entity=SDP
        [HttpGet]
        public async Task<IActionResult> GetLogs(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50,
            [FromQuery] string? action = null,
            [FromQuery] string? entityType = null,
            [FromQuery] string? search = null)
        {
            var query = _context.AdminAuditLogs.AsQueryable();

            if (!string.IsNullOrWhiteSpace(action))
                query = query.Where(l => l.Action == action);

            if (!string.IsNullOrWhiteSpace(entityType))
                query = query.Where(l => l.EntityType == entityType);

            if (!string.IsNullOrWhiteSpace(search))
                query = query.Where(l =>
                    l.Description.Contains(search) ||
                    l.EntityName.Contains(search) ||
                    l.PerformedBy.Contains(search));

            var total = await query.CountAsync();
            var logs = await query
                .OrderByDescending(l => l.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(new { total, page, pageSize, logs });
        }

        // GET: api/AuditLog/recent?count=10
        [HttpGet("recent")]
        public async Task<IActionResult> GetRecent([FromQuery] int count = 10)
        {
            var logs = await _context.AdminAuditLogs
                .OrderByDescending(l => l.CreatedAt)
                .Take(count)
                .ToListAsync();
            return Ok(logs);
        }
    }

    /// <summary>Helper service for writing audit log entries from any controller.</summary>
    public static class AuditLogHelper
    {
        public static async Task LogAsync(
            ApplicationDbContext context,
            string action,
            string description,
            string entityType,
            int? entityId,
            string entityName,
            string performedBy = "System Admin",
            string? metadata = null)
        {
            context.AdminAuditLogs.Add(new AdminAuditLog
            {
                Action = action,
                Description = description,
                EntityType = entityType,
                EntityId = entityId,
                EntityName = entityName,
                PerformedBy = performedBy,
                Metadata = metadata,
                CreatedAt = DateTime.UtcNow
            });
            await context.SaveChangesAsync();
        }
    }
}
