using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using backend.Models;
using backend.Services.Interfaces;

namespace backend.Controllers
{
    /// <summary>
    /// Notice-board / announcement endpoints.
    ///
    /// POST  /api/Announcements              — teacher creates a notice (fires WhatsApp + email to all class learners)
    /// GET   /api/Announcements/class/{id}   — list all notices for a class  (teacher / admin view)
    /// GET   /api/Announcements/learner/{id} — list notices for the learner's enrolled class(es)
    /// DELETE /api/Announcements/{id}        — soft-delete (teacher who created it, or admin)
    /// </summary>
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class AnnouncementsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IEmailService _email;
        private readonly IWhatsAppService _whatsApp;
        private readonly ILogger<AnnouncementsController> _logger;

        public AnnouncementsController(
            ApplicationDbContext context,
            IEmailService email,
            IWhatsAppService whatsApp,
            ILogger<AnnouncementsController> logger)
        {
            _context  = context;
            _email    = email;
            _whatsApp = whatsApp;
            _logger   = logger;
        }

        // ── POST /api/Announcements ──────────────────────────────────────────

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateAnnouncementRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Title) || string.IsNullOrWhiteSpace(req.Message))
                return BadRequest(new { message = "Title and message are required." });

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int userId))
                return Unauthorized();

            var creator = await _context.Users.AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == userId);
            if (creator == null) return Unauthorized();

            var siteClass = await _context.SiteClasses.AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == req.ClassId);
            if (siteClass == null) return NotFound(new { message = "Class not found." });

            var announcement = new Announcement
            {
                ClassId        = req.ClassId,
                CreatedByUserId = userId,
                Title          = req.Title.Trim(),
                Message        = req.Message.Trim(),
                Priority       = req.Priority ?? "Normal",
                CreatedAt      = DateTime.UtcNow,
                UpdatedAt      = DateTime.UtcNow,
            };

            _context.Announcements.Add(announcement);
            await _context.SaveChangesAsync();

            // ── Notify enrolled learners ──────────────────────────────────
            var enrollments = await _context.ClassEnrollments
                .AsNoTracking()
                .Where(ce => ce.SiteClassId == req.ClassId && ce.Status == "Active")
                .ToListAsync();

            var teacherName = $"{creator.FirstName} {creator.LastName}";
            int emailsSent = 0, waSent = 0;

            foreach (var enroll in enrollments)
            {
                var learner = await _context.Learners.AsNoTracking()
                    .FirstOrDefaultAsync(l => l.Id == enroll.LearnerId);
                if (learner == null) continue;

                var learnerName = $"{learner.FirstName} {learner.LastName}";

                // Email
                if (!string.IsNullOrWhiteSpace(learner.Email))
                {
                    var ok = await _email.SendEmailAsync(
                        learner.Email,
                        $"📢 {req.Title} — {siteClass.ClassName}",
                        BuildAnnouncementEmailBody(learnerName, teacherName, siteClass.ClassName, announcement));
                    if (ok) emailsSent++;
                }

                // WhatsApp
                if (!string.IsNullOrWhiteSpace(learner.ContactNumber))
                {
                    var ok = await _whatsApp.SendClassAnnouncementAsync(
                        learner.ContactNumber, learnerName, teacherName,
                        $"{req.Title}: {req.Message}");
                    if (ok) waSent++;
                }
            }

            _logger.LogInformation(
                "Announcement {Id} created for class {ClassId}. Notified {E} via email, {W} via WhatsApp.",
                announcement.Id, req.ClassId, emailsSent, waSent);

            return Ok(new
            {
                announcement.Id,
                announcement.Title,
                announcement.Message,
                announcement.Priority,
                announcement.CreatedAt,
                emailsSent,
                waSent,
                recipientsCount = enrollments.Count,
            });
        }

        // ── GET /api/Announcements/class/{classId} ───────────────────────────

        [HttpGet("class/{classId}")]
        public async Task<IActionResult> GetByClass(int classId)
        {
            var notices = await _context.Announcements
                .AsNoTracking()
                .Where(a => a.ClassId == classId)
                .OrderByDescending(a => a.CreatedAt)
                .Select(a => new
                {
                    a.Id, a.Title, a.Message, a.Priority, a.CreatedAt,
                    TeacherName = a.CreatedByUser != null
                        ? $"{a.CreatedByUser.FirstName} {a.CreatedByUser.LastName}"
                        : "Teacher",
                    ClassName   = a.SiteClass != null ? a.SiteClass.ClassName : $"Class {classId}",
                })
                .ToListAsync();

            return Ok(notices);
        }

        // ── GET /api/Announcements/learner/{learnerId} ───────────────────────

        [HttpGet("learner/{learnerId}")]
        public async Task<IActionResult> GetByLearner(int learnerId)
        {
            // Find all active class IDs for this learner
            var classIds = await _context.ClassEnrollments
                .AsNoTracking()
                .Where(ce => ce.LearnerId == learnerId && ce.Status == "Active")
                .Select(ce => ce.SiteClassId)
                .ToListAsync();

            if (!classIds.Any())
                return Ok(Array.Empty<object>());

            var notices = await _context.Announcements
                .AsNoTracking()
                .Where(a => classIds.Contains(a.ClassId))
                .OrderByDescending(a => a.CreatedAt)
                .Select(a => new
                {
                    a.Id, a.Title, a.Message, a.Priority, a.CreatedAt,
                    TeacherName = a.CreatedByUser != null
                        ? $"{a.CreatedByUser.FirstName} {a.CreatedByUser.LastName}"
                        : "Teacher",
                    ClassName   = a.SiteClass != null ? a.SiteClass.ClassName : $"Class {a.ClassId}",
                })
                .ToListAsync();

            return Ok(notices);
        }

        // ── DELETE /api/Announcements/{id} ───────────────────────────────────

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var ann = await _context.Announcements.FindAsync(id);
            if (ann == null) return NotFound();

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            int.TryParse(userIdClaim, out int requesterId);

            // Only allow creator or system/SDP admin
            var requester = await _context.Users.AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == requesterId);
            var isAdmin = requester?.Role is UserRole.SystemAdmin or UserRole.SDPAdministrator;

            if (ann.CreatedByUserId != requesterId && !isAdmin)
                return Forbid();

            _context.Announcements.Remove(ann);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Announcement deleted." });
        }

        // ── Email template ────────────────────────────────────────────────────

        private static string BuildAnnouncementEmailBody(
            string learnerName, string teacherName, string className, Announcement ann)
        {
            var priorityColor = ann.Priority switch
            {
                "Urgent"    => "#dc2626",
                "Important" => "#d97706",
                _           => "#0EA5E9",
            };
            var priorityBg = ann.Priority switch
            {
                "Urgent"    => "#fef2f2",
                "Important" => "#fffbeb",
                _           => "#f0f9ff",
            };

            return $@"<!DOCTYPE html>
<html>
<head><meta charset='utf-8'></head>
<body style='margin:0;padding:20px;background:#f1f5f9;font-family:Arial,sans-serif'>
  <div style='max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.1)'>

    <div style='background:#0f172a;padding:24px 30px;color:#fff'>
      <div style='font-size:28px;margin-bottom:6px'>📢</div>
      <h1 style='margin:0;font-size:20px'>Class Notice</h1>
      <p style='margin:4px 0 0;opacity:.7;font-size:13px'>{className} &nbsp;·&nbsp; {ann.CreatedAt:dd MMM yyyy HH:mm}</p>
    </div>

    <div style='padding:24px 30px'>
      <p style='color:#475569;font-size:14px;margin-top:0'>Hi <strong>{learnerName}</strong>,</p>
      <p style='color:#475569;font-size:14px'>Your teacher <strong>{teacherName}</strong> has posted a new notice for your class.</p>

      <div style='background:{priorityBg};border-left:4px solid {priorityColor};border-radius:0 8px 8px 0;padding:16px 20px;margin:16px 0'>
        <div style='display:flex;align-items:center;gap:8px;margin-bottom:8px'>
          <span style='background:{priorityColor};color:#fff;font-size:11px;font-weight:700;padding:2px 8px;border-radius:10px;text-transform:uppercase'>{ann.Priority}</span>
          <span style='font-weight:700;font-size:16px;color:#0f172a'>{ann.Title}</span>
        </div>
        <p style='margin:0;color:#334155;font-size:14px;line-height:1.6'>{ann.Message}</p>
      </div>

      <p style='color:#94a3b8;font-size:12px;margin-top:20px'>
        Log in to the NBSN Learner Portal to view all notices from your class.
      </p>
    </div>

    <div style='background:#f8fafc;padding:14px 30px;text-align:center;font-size:12px;color:#94a3b8;border-top:1px solid #e2e8f0'>
      This is an automated notification from NBSN. Do not reply to this email.
    </div>
  </div>
</body>
</html>";
        }
    }

    // ── Request DTO ────────────────────────────────────────────────────────────
    public class CreateAnnouncementRequest
    {
        public int ClassId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string? Priority { get; set; } // Normal | Important | Urgent
    }
}
