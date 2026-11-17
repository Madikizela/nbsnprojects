using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using System.Security.Claims;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public NotificationsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Notifications — returns notifications for the authenticated caller only
        [HttpGet]
        public async Task<IActionResult> GetNotifications(
            [FromQuery] bool unreadOnly = false,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            // Extract caller ID from JWT — never trust a client-supplied userId
            var callerIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var callerRole  = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
            int.TryParse(callerIdStr, out int callerId);

            var query = _context.Notifications.AsQueryable();

            // SystemAdmin sees platform-wide; everyone else only sees their own + platform-wide
            if (callerRole == "SystemAdmin")
                query = query; // all notifications
            else
                query = query.Where(n => n.UserId == null || n.UserId == callerId);

            if (unreadOnly)
                query = query.Where(n => !n.IsRead);

            var total  = await query.CountAsync();
            var unread = await query.CountAsync(n => !n.IsRead);
            var items  = await query
                .OrderByDescending(n => n.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(n => new { n.Id, n.Type, n.Title, n.Message, n.ActionUrl, n.IsRead, n.CreatedAt, n.ReadAt })
                .ToListAsync();

            return Ok(new { total, unread, page, pageSize, notifications = items });
        }

        // GET: api/Notifications/unread-count — count for the authenticated caller
        [HttpGet("unread-count")]
        public async Task<IActionResult> GetUnreadCount()
        {
            var callerIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var callerRole  = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
            int.TryParse(callerIdStr, out int callerId);

            var query = _context.Notifications.Where(n => !n.IsRead);
            if (callerRole != "SystemAdmin")
                query = query.Where(n => n.UserId == null || n.UserId == callerId);

            var count = await query.CountAsync();
            return Ok(new { unreadCount = count });
        }

        // PUT: api/Notifications/{id}/read
        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkRead(int id)
        {
            var callerIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var callerRole  = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
            int.TryParse(callerIdStr, out int callerId);

            var n = await _context.Notifications.FindAsync(id);
            if (n == null) return NotFound();

            // Only allow reading own notifications (or admin reads any)
            if (callerRole != "SystemAdmin" && n.UserId.HasValue && n.UserId != callerId)
                return Forbid();

            n.IsRead = true;
            n.ReadAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Marked as read" });
        }

        // PUT: api/Notifications/mark-all-read — marks caller's notifications as read
        [HttpPut("mark-all-read")]
        public async Task<IActionResult> MarkAllRead()
        {
            var callerIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var callerRole  = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
            int.TryParse(callerIdStr, out int callerId);

            var query = _context.Notifications.Where(n => !n.IsRead);
            if (callerRole != "SystemAdmin")
                query = query.Where(n => n.UserId == null || n.UserId == callerId);

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
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            n.SoftDelete(userId != null ? int.Parse(userId) : null);
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
