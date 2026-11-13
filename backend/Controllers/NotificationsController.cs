using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class NotificationsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public NotificationsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Notifications?userId=5&unreadOnly=true
        [HttpGet]
        public async Task<IActionResult> GetNotifications(
            [FromQuery] int? userId = null,
            [FromQuery] bool unreadOnly = false,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var query = _context.Notifications.AsQueryable();

            if (userId.HasValue)
                query = query.Where(n => n.UserId == userId || n.UserId == null);
            else
                query = query.Where(n => n.UserId == null); // platform-wide only

            if (unreadOnly)
                query = query.Where(n => !n.IsRead);

            var total   = await query.CountAsync();
            var unread  = await query.CountAsync(n => !n.IsRead);
            var items   = await query
                .OrderByDescending(n => n.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(n => new { n.Id, n.Type, n.Title, n.Message, n.ActionUrl, n.IsRead, n.CreatedAt, n.ReadAt })
                .ToListAsync();

            return Ok(new { total, unread, page, pageSize, notifications = items });
        }

        // GET: api/Notifications/unread-count?userId=5
        [HttpGet("unread-count")]
        public async Task<IActionResult> GetUnreadCount([FromQuery] int? userId = null)
        {
            var query = _context.Notifications.Where(n => !n.IsRead);
            if (userId.HasValue)
                query = query.Where(n => n.UserId == userId || n.UserId == null);
            else
                query = query.Where(n => n.UserId == null);

            var count = await query.CountAsync();
            return Ok(new { unreadCount = count });
        }

        // PUT: api/Notifications/{id}/read
        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkRead(int id)
        {
            var n = await _context.Notifications.FindAsync(id);
            if (n == null) return NotFound();
            n.IsRead = true;
            n.ReadAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Marked as read" });
        }

        // PUT: api/Notifications/mark-all-read?userId=5
        [HttpPut("mark-all-read")]
        public async Task<IActionResult> MarkAllRead([FromQuery] int? userId = null)
        {
            var query = _context.Notifications.Where(n => !n.IsRead);
            if (userId.HasValue)
                query = query.Where(n => n.UserId == userId || n.UserId == null);
            else
                query = query.Where(n => n.UserId == null);

            await query.ExecuteUpdateAsync(s =>
                s.SetProperty(n => n.IsRead, true)
                 .SetProperty(n => n.ReadAt, DateTime.UtcNow));

            return Ok(new { message = "All notifications marked as read" });
        }

        // POST: api/Notifications  (System Admin creates platform-wide or targeted notification)
        [HttpPost]
        public async Task<IActionResult> CreateNotification([FromBody] CreateNotificationRequest request)
        {
            var notification = new Notification
            {
                UserId     = request.UserId,
                Type       = request.Type ?? "GENERAL",
                Title      = request.Title,
                Message    = request.Message,
                ActionUrl  = request.ActionUrl,
                Metadata   = request.Metadata,
                CreatedAt  = DateTime.UtcNow
            };
            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Notification created", id = notification.Id });
        }

        // DELETE: api/Notifications/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNotification(int id)
        {
            var n = await _context.Notifications.FindAsync(id);
            if (n == null) return NotFound();
            _context.Notifications.Remove(n);
            await _context.SaveChangesAsync();
            return Ok();
        }
    }

    public class CreateNotificationRequest
    {
        public int? UserId { get; set; }
        public string? Type { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string? ActionUrl { get; set; }
        public string? Metadata { get; set; }
    }

    /// <summary>Helper for writing notifications from other controllers.</summary>
    public static class NotificationHelper
    {
        public static async Task CreateAsync(
            ApplicationDbContext context,
            string title,
            string message,
            string type = "GENERAL",
            int? userId = null,
            string? actionUrl = null,
            string? metadata = null)
        {
            context.Notifications.Add(new Notification
            {
                UserId    = userId,
                Type      = type,
                Title     = title,
                Message   = message,
                ActionUrl = actionUrl,
                Metadata  = metadata,
                CreatedAt = DateTime.UtcNow
            });
            await context.SaveChangesAsync();
        }
    }
}
