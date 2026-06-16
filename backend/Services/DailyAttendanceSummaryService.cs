using Microsoft.EntityFrameworkCore;
using backend.Models;
using backend.Services.Interfaces;

namespace backend.Services
{
    /// <summary>
    /// Hosted background service that sends a daily attendance summary email
    /// to all SDP admins / managers at a configurable time (default 17:00 SAST).
    ///
    /// Configuration (appsettings.json or environment variables):
    ///   AttendanceSummary:SendHourUtc   — UTC hour to send (default 15 = 17:00 SAST)
    ///   AttendanceSummary:RecipientRole — role number whose members receive the mail (default 3 = SDP Admin)
    ///   AttendanceSummary:AdminEmail    — fallback recipient if no role-based users found
    /// </summary>
    public class DailyAttendanceSummaryService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<DailyAttendanceSummaryService> _logger;
        private readonly IConfiguration _configuration;

        // Default: 15:00 UTC = 17:00 SAST (UTC+2)
        private readonly int _sendHourUtc;
        private readonly int _recipientRole;
        private readonly string? _fallbackEmail;

        public DailyAttendanceSummaryService(
            IServiceScopeFactory scopeFactory,
            ILogger<DailyAttendanceSummaryService> logger,
            IConfiguration configuration)
        {
            _scopeFactory  = scopeFactory;
            _logger        = logger;
            _configuration = configuration;

            _sendHourUtc   = int.TryParse(configuration["AttendanceSummary:SendHourUtc"],  out var h) ? h : 15;
            _recipientRole = int.TryParse(configuration["AttendanceSummary:RecipientRole"], out var r) ? r : 3;
            _fallbackEmail = configuration["AttendanceSummary:AdminEmail"];
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("DailyAttendanceSummaryService started. Will send at {Hour}:00 UTC each day.", _sendHourUtc);

            while (!stoppingToken.IsCancellationRequested)
            {
                var delay = CalculateDelayUntilNextSend();
                _logger.LogInformation("Next attendance summary email in {Minutes} minutes.", (int)delay.TotalMinutes);

                try
                {
                    await Task.Delay(delay, stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    break;
                }

                if (stoppingToken.IsCancellationRequested) break;

                await SendSummaryAsync(stoppingToken);
            }

            _logger.LogInformation("DailyAttendanceSummaryService stopped.");
        }

        // ── helpers ──────────────────────────────────────────────────────────

        private TimeSpan CalculateDelayUntilNextSend()
        {
            var now     = DateTime.UtcNow;
            var nextRun = new DateTime(now.Year, now.Month, now.Day, _sendHourUtc, 0, 0, DateTimeKind.Utc);
            if (now >= nextRun)
                nextRun = nextRun.AddDays(1);
            return nextRun - now;
        }

        private async Task SendSummaryAsync(CancellationToken ct)
        {
            _logger.LogInformation("Building daily attendance summary…");

            try
            {
                using var scope       = _scopeFactory.CreateScope();
                var context           = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var emailService      = scope.ServiceProvider.GetRequiredService<IEmailService>();

                var today = DateTime.UtcNow.Date;

                // ── collect attendance data for today ─────────────────────────
                var records = await context.LearnerAttendances
                    .AsNoTracking()
                    .Where(a => a.AttendanceDate.Date == today)
                    .Include(a => a.Learner)
                    .Include(a => a.SiteClass)
                    .ToListAsync(ct);

                if (!records.Any())
                {
                    _logger.LogInformation("No attendance records found for today ({Date}), skipping email.", today);
                    return;
                }

                // ── per-class summary ─────────────────────────────────────────
                var classSummaries = records
                    .GroupBy(r => r.ClassId)
                    .Select(g => new ClassSummary
                    {
                        ClassName    = g.First().SiteClass?.ClassName ?? $"Class {g.Key}",
                        Present      = g.Count(r => r.Status == "Present"),
                        Absent       = g.Count(r => r.Status == "Absent"),
                        Late         = g.Count(r => r.Status == "Late"),
                        Excused      = g.Count(r => r.Status == "Excused"),
                        Total        = g.Count(),
                        LearnerRows  = g.OrderBy(r => r.Learner?.LastName)
                                        .Select(r => new LearnerRow
                                        {
                                            Name      = r.Learner != null
                                                        ? $"{r.Learner.FirstName} {r.Learner.LastName}"
                                                        : $"Learner #{r.LearnerId}",
                                            Status    = r.Status,
                                            ClockIn   = r.ClockInTime?.ToString("HH:mm") ?? "—",
                                            ClockOut  = r.ClockOutTime?.ToString("HH:mm") ?? "—",
                                        }).ToList(),
                    }).ToList();

                var totalPresent = records.Count(r => r.Status == "Present");
                var totalAll     = records.Count;
                var overallPct   = totalAll > 0 ? (double)totalPresent / totalAll * 100 : 0;

                // ── recipients ────────────────────────────────────────────────
                var recipients = await context.Users
                    .AsNoTracking()
                    .Where(u => (int)u.Role == _recipientRole && u.Email != null && u.Email != "")
                    .Select(u => u.Email!)
                    .Distinct()
                    .ToListAsync(ct);

                if (!recipients.Any() && !string.IsNullOrWhiteSpace(_fallbackEmail))
                    recipients.Add(_fallbackEmail!);

                if (!recipients.Any())
                {
                    _logger.LogWarning("No recipients found for daily attendance summary. Configure AttendanceSummary:AdminEmail.");
                    return;
                }

                // ── build email ───────────────────────────────────────────────
                var subject = $"📋 Daily Attendance Summary — {today:dd MMMM yyyy}";
                var body    = BuildEmailBody(today, classSummaries, totalPresent, totalAll, overallPct);

                int sent = 0;
                foreach (var email in recipients)
                {
                    var ok = await emailService.SendEmailAsync(email, subject, body);
                    if (ok) sent++;
                    else _logger.LogWarning("Failed to send summary email to {Email}", email);
                }

                _logger.LogInformation(
                    "Daily attendance summary sent to {Sent}/{Total} recipients for {Date}.",
                    sent, recipients.Count, today);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending daily attendance summary.");
            }
        }

        // ── email template ────────────────────────────────────────────────────

        private static string BuildEmailBody(
            DateTime date,
            List<ClassSummary> classes,
            int totalPresent,
            int totalAll,
            double overallPct)
        {
            var classSections = string.Concat(classes.Select(cls =>
            {
                var clsPct  = cls.Total > 0 ? (double)cls.Present / cls.Total * 100 : 0;
                var rows    = string.Concat(cls.LearnerRows.Select(l =>
                    $@"<tr style='border-bottom:1px solid #e2e8f0'>
                         <td style='padding:6px 10px'>{l.Name}</td>
                         <td style='padding:6px 10px;text-align:center;font-weight:600;color:{StatusColor(l.Status)}'>{l.Status}</td>
                         <td style='padding:6px 10px;text-align:center'>{l.ClockIn}</td>
                         <td style='padding:6px 10px;text-align:center'>{l.ClockOut}</td>
                       </tr>"));

                return $@"
                  <div style='margin-bottom:24px'>
                    <h3 style='margin:0 0 8px;color:#1e293b;font-size:15px'>{cls.ClassName}</h3>
                    <div style='display:flex;gap:12px;margin-bottom:10px;flex-wrap:wrap'>
                      <span style='background:#dcfce7;color:#166534;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600'>✓ Present: {cls.Present}</span>
                      <span style='background:#fee2e2;color:#991b1b;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600'>✗ Absent: {cls.Absent}</span>
                      <span style='background:#fef9c3;color:#854d0e;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600'>⏰ Late: {cls.Late}</span>
                      <span style='background:#e0f2fe;color:#075985;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600'>📋 Excused: {cls.Excused}</span>
                      <span style='background:#f1f5f9;color:#475569;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600'>Attendance: {clsPct:0.0}%</span>
                    </div>
                    <table style='width:100%;border-collapse:collapse;font-size:13px;background:#f8fafc;border-radius:8px;overflow:hidden'>
                      <thead>
                        <tr style='background:#334155;color:#fff'>
                          <th style='padding:8px 10px;text-align:left'>Learner</th>
                          <th style='padding:8px 10px;text-align:center'>Status</th>
                          <th style='padding:8px 10px;text-align:center'>Clock In</th>
                          <th style='padding:8px 10px;text-align:center'>Clock Out</th>
                        </tr>
                      </thead>
                      <tbody>{rows}</tbody>
                    </table>
                  </div>";
            }));

            var pctColor = overallPct >= 80 ? "#166534" : overallPct >= 60 ? "#854d0e" : "#991b1b";
            var pctBg    = overallPct >= 80 ? "#dcfce7"  : overallPct >= 60 ? "#fef9c3"  : "#fee2e2";

            return $@"<!DOCTYPE html>
<html>
<head><meta charset='utf-8'><title>Daily Attendance Summary</title></head>
<body style='margin:0;padding:20px;background:#f1f5f9;font-family:Arial,sans-serif'>
  <div style='max-width:700px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.1)'>

    <div style='background:#0f172a;padding:24px 30px;color:#fff'>
      <div style='font-size:28px;margin-bottom:6px'>📋</div>
      <h1 style='margin:0;font-size:20px'>Daily Attendance Summary</h1>
      <p style='margin:4px 0 0;opacity:.7;font-size:13px'>{date:dddd, dd MMMM yyyy} &nbsp;·&nbsp; NBSN Skills Development</p>
    </div>

    <div style='padding:24px 30px'>

      <!-- Overall stat banner -->
      <div style='background:{pctBg};border-radius:10px;padding:16px 20px;display:flex;align-items:center;gap:16px;margin-bottom:24px'>
        <div style='font-size:36px;font-weight:700;color:{pctColor}'>{overallPct:0.0}%</div>
        <div>
          <div style='font-weight:700;color:{pctColor};font-size:15px'>Overall Attendance Rate</div>
          <div style='color:#475569;font-size:13px'>{totalPresent} present out of {totalAll} learners across {classes.Count} class(es)</div>
        </div>
      </div>

      {classSections}

    </div>

    <div style='background:#f8fafc;padding:16px 30px;text-align:center;font-size:12px;color:#94a3b8;border-top:1px solid #e2e8f0'>
      This is an automated daily attendance report from NBSN. Do not reply to this email.
    </div>
  </div>
</body>
</html>";
        }

        private static string StatusColor(string status) => status switch
        {
            "Present" => "#166534",
            "Absent"  => "#991b1b",
            "Late"    => "#854d0e",
            "Excused" => "#075985",
            _         => "#475569",
        };

        // ── inner DTOs ────────────────────────────────────────────────────────

        private class ClassSummary
        {
            public string ClassName { get; set; } = "";
            public int Present   { get; set; }
            public int Absent    { get; set; }
            public int Late      { get; set; }
            public int Excused   { get; set; }
            public int Total     { get; set; }
            public List<LearnerRow> LearnerRows { get; set; } = new();
        }

        private class LearnerRow
        {
            public string Name     { get; set; } = "";
            public string Status   { get; set; } = "";
            public string ClockIn  { get; set; } = "—";
            public string ClockOut { get; set; } = "—";
        }
    }
}
