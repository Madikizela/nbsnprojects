using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using backend.Models;
using QuestDocument = QuestPDF.Fluent.Document;
using SkiaSharp;

namespace backend.Controllers
{
    /// <summary>
    /// Generates funder/SETA-ready PDF reports and competency certificates.
    /// GET /api/FunderReport/project/{id}/pdf         — full project compliance report
    /// GET /api/FunderReport/learner/{id}/certificate — competency certificate for a learner
    /// </summary>
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class FunderReportController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<FunderReportController> _logger;

        public FunderReportController(ApplicationDbContext context,
            IWebHostEnvironment environment,
            ILogger<FunderReportController> logger)
        {
            _context = context;
            _environment = environment;
            _logger = logger;
        }

        // ── Funder PDF Report ────────────────────────────────────────────────

        /// <summary>
        /// Full project compliance report for funders/SETAs:
        /// learner headcount, attendance %, document compliance, competency rates.
        /// </summary>
        [HttpGet("project/{projectId}/pdf")]
        public async Task<IActionResult> GetProjectFunderReport(int projectId)
        {
            try
            {
                var project = await _context.Projects
                    .Include(p => p.Client)
                    .Include(p => p.SkillsDevelopmentProvider)
                    .FirstOrDefaultAsync(p => p.Id == projectId);

                if (project == null) return NotFound("Project not found");

                // ── Learners ─────────────────────────────────────────────────
                var learnerIds = await _context.ClassEnrollments
                    .AsNoTracking()
                    .Where(ce => ce.SiteClass!.ProjectSite!.ProjectId == projectId && ce.Status == "Active")
                    .Select(ce => ce.LearnerId)
                    .Distinct()
                    .ToListAsync();

                var learners = await _context.Learners.AsNoTracking()
                    .Where(l => learnerIds.Contains(l.Id))
                    .Select(l => new { l.Id, l.FirstName, l.LastName, l.IdNumber, l.Gender, l.Race })
                    .ToListAsync();

                // ── Attendance ───────────────────────────────────────────────
                var attendance = await _context.LearnerAttendances.AsNoTracking()
                    .Where(a => learnerIds.Contains(a.LearnerId) && a.Status == "Present")
                    .GroupBy(a => a.LearnerId)
                    .Select(g => new { LearnerId = g.Key, DaysPresent = g.Count() })
                    .ToListAsync();

                // Get total training days (distinct dates with at least one attendance record for project)
                var totalTrainingDays = await _context.LearnerAttendances.AsNoTracking()
                    .Where(a => learnerIds.Contains(a.LearnerId))
                    .Select(a => a.AttendanceDate)
                    .Distinct()
                    .CountAsync();

                // ── Documents ────────────────────────────────────────────────
                var docs = await _context.LearnerDocuments.AsNoTracking()
                    .Where(d => learnerIds.Contains(d.LearnerId))
                    .GroupBy(d => d.LearnerId)
                    .Select(g => new
                    {
                        LearnerId = g.Key,
                        Total = g.Count(),
                        Approved = g.Count(d => d.ApprovalStatus == "Approved")
                    })
                    .ToListAsync();

                // ── Competency ───────────────────────────────────────────────
                var progress = await _context.LearnerAssessmentProgress.AsNoTracking()
                    .Where(p => learnerIds.Contains(p.LearnerId))
                    .ToListAsync();

                var unitStandardCount = await _context.ProjectLearningPathways.AsNoTracking()
                    .Where(plp => plp.ProjectId == projectId)
                    .SelectMany(plp => plp.ProjectQualifications)
                    .SelectMany(pq => _context.ProjectQualificationUnitStandards
                        .Where(us => us.ProjectQualificationId == pq.Id))
                    .CountAsync();

                // ── Generate PDF ─────────────────────────────────────────────
                var reportDate = DateTime.Now;
                var pdfBytes = QuestDocument.Create(container =>
                {
                    container.Page(page =>
                    {
                        page.Size(PageSizes.A4);
                        page.Margin(30);
                        page.DefaultTextStyle(t => t.FontSize(10));

                        page.Header().Column(col =>
                        {
                            col.Item().Row(row =>
                            {
                                row.RelativeItem().Column(c =>
                                {
                                    c.Item().Text("NBSN Skills Development").Bold().FontSize(18).FontColor(Colors.Blue.Darken2);
                                    c.Item().Text("Project Compliance Report").FontSize(13).FontColor(Colors.Grey.Darken1);
                                });
                                row.ConstantItem(120).AlignRight().Column(c =>
                                {
                                    c.Item().Text($"Generated: {reportDate:dd MMM yyyy}").FontSize(8).FontColor(Colors.Grey.Medium);
                                    c.Item().Text($"Page {{pageNumber}} of {{totalPages}}").FontSize(8).FontColor(Colors.Grey.Medium);
                                });
                            });
                            col.Item().PaddingTop(4).LineHorizontal(2).LineColor(Colors.Blue.Darken2);
                        });

                        page.Content().PaddingTop(12).Column(col =>
                        {
                            // ── Project Info ─────────────────────────────────
                            col.Item().Background(Colors.Blue.Lighten4).Padding(10).Column(info =>
                            {
                                info.Item().Text(project.ProjectName).Bold().FontSize(14);
                                info.Item().PaddingTop(4).Row(r =>
                                {
                                    r.RelativeItem().Text($"Client: {project.Client?.Name ?? "N/A"}");
                                    r.RelativeItem().Text($"SDP: {project.SkillsDevelopmentProvider?.Name ?? "N/A"}");
                                    r.RelativeItem().Text($"Province: {project.Province ?? "N/A"}");
                                });
                                info.Item().PaddingTop(2).Row(r =>
                                {
                                    r.RelativeItem().Text($"Start: {project.StartDate:dd MMM yyyy}");
                                    r.RelativeItem().Text($"End: {project.EndDate:dd MMM yyyy}");
                                    r.RelativeItem().Text($"Budget: R{project.BudgetAmount:N0}");
                                });
                            });

                            col.Item().PaddingTop(12).PaddingBottom(4)
                                .Text("Summary Statistics").Bold().FontSize(12);

                            // ── Summary Stats ────────────────────────────────
                            var totalLearners = learners.Count;
                            var avgAttendance = totalLearners > 0 && totalTrainingDays > 0
                                ? attendance.Average(a => (double)a.DaysPresent / totalTrainingDays * 100)
                                : 0.0;
                            var docCompliant = docs.Count(d => d.Approved >= 3); // ≥3 approved docs
                            var competent = progress
                                .GroupBy(p => p.LearnerId)
                                .Count(g => unitStandardCount > 0 &&
                                    g.Count(p => p.FormativeCompleted && p.SummativeCompleted) == unitStandardCount);

                            col.Item().Table(table =>
                            {
                                table.ColumnsDefinition(c => { c.RelativeColumn(); c.RelativeColumn(); c.RelativeColumn(); c.RelativeColumn(); });
                                table.Header(h =>
                                {
                                    foreach (var hdr in new[] { "Total Learners", "Avg Attendance", "Document Compliant", "Competent" })
                                        h.Cell().Background(Colors.Blue.Darken2).Padding(6)
                                            .Text(hdr).Bold().FontColor(Colors.White);
                                });
                                table.Cell().Padding(6).AlignCenter().Text(totalLearners.ToString()).Bold().FontSize(14);
                                table.Cell().Padding(6).AlignCenter().Text($"{avgAttendance:0.0}%").Bold().FontSize(14);
                                table.Cell().Padding(6).AlignCenter().Text($"{docCompliant}/{totalLearners}").Bold().FontSize(14);
                                table.Cell().Padding(6).AlignCenter().Text($"{competent}/{totalLearners}").Bold().FontSize(14);
                            });

                            col.Item().PaddingTop(16).PaddingBottom(4)
                                .Text("Learner Detail").Bold().FontSize(12);

                            // ── Per-Learner Table ────────────────────────────
                            col.Item().Table(table =>
                            {
                                table.ColumnsDefinition(c =>
                                {
                                    c.RelativeColumn(3);
                                    c.RelativeColumn(2);
                                    c.ConstantColumn(55);
                                    c.ConstantColumn(60);
                                    c.ConstantColumn(55);
                                });

                                table.Header(h =>
                                {
                                    foreach (var hdr in new[] { "Name", "ID Number", "Attendance", "Documents", "Status" })
                                        h.Cell().Background(Colors.Grey.Darken2).Padding(5)
                                            .Text(hdr).Bold().FontColor(Colors.White).FontSize(9);
                                });

                                foreach (var (learner, idx) in learners.Select((l, i) => (l, i)))
                                {
                                    var bg = idx % 2 == 0 ? Colors.White : Colors.Grey.Lighten4;
                                    var att = attendance.FirstOrDefault(a => a.LearnerId == learner.Id);
                                    var doc = docs.FirstOrDefault(d => d.LearnerId == learner.Id);
                                    var lProgress = progress.Where(p => p.LearnerId == learner.Id).ToList();
                                    var isCompetent = unitStandardCount > 0 &&
                                        lProgress.Count(p => p.FormativeCompleted && p.SummativeCompleted) == unitStandardCount;

                                    var daysPresent = att?.DaysPresent ?? 0;
                                    var attPct = totalTrainingDays > 0
                                        ? $"{(double)daysPresent / totalTrainingDays * 100:0}%"
                                        : "N/A";

                                    table.Cell().Background(bg).Padding(4)
                                        .Text($"{learner.FirstName} {learner.LastName}").FontSize(9);
                                    table.Cell().Background(bg).Padding(4)
                                        .Text(learner.IdNumber).FontSize(9);
                                    table.Cell().Background(bg).Padding(4).AlignCenter()
                                        .Text(attPct).FontSize(9);
                                    table.Cell().Background(bg).Padding(4).AlignCenter()
                                        .Text($"{doc?.Approved ?? 0}/{doc?.Total ?? 0}").FontSize(9);
                                    table.Cell().Background(bg).Padding(4).AlignCenter()
                                        .Text(isCompetent ? "C" : "NYC")
                                        .FontSize(9).Bold()
                                        .FontColor(isCompetent ? Colors.Green.Darken2 : Colors.Red.Darken1);
                                }
                            });
                        });

                        page.Footer().PaddingTop(8).BorderTop(1).BorderColor(Colors.Grey.Lighten2)
                            .Row(row =>
                            {
                                row.RelativeItem().Text("NBSN Skills Development — Confidential").FontSize(8).FontColor(Colors.Grey.Medium);
                                row.ConstantItem(150).AlignRight()
                                    .Text(t =>
                                    {
                                        t.Span("Page ").FontSize(8).FontColor(Colors.Grey.Medium);
                                        t.CurrentPageNumber().FontSize(8).FontColor(Colors.Grey.Medium);
                                        t.Span(" of ").FontSize(8).FontColor(Colors.Grey.Medium);
                                        t.TotalPages().FontSize(8).FontColor(Colors.Grey.Medium);
                                    });
                            });
                    });
                }).GeneratePdf();

                var fileName = $"FunderReport_{project.ProjectName.Replace(" ", "_")}_{reportDate:yyyyMMdd}.pdf";
                return File(pdfBytes, "application/pdf", fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating funder report for project {ProjectId}", projectId);
                return StatusCode(500, new { message = "Error generating report", error = ex.Message });
            }
        }

        // ── Competency Certificate ───────────────────────────────────────────

        /// <summary>
        /// Generates a competency certificate PDF for a learner.
        /// Only issues if the learner is fully competent across all unit standards.
        /// </summary>
        [HttpGet("learner/{learnerId}/certificate")]
        public async Task<IActionResult> GetCompetencyCertificate(int learnerId, [FromQuery] int? projectId = null)
        {
            try
            {
                var learner = await _context.Learners.AsNoTracking()
                    .FirstOrDefaultAsync(l => l.Id == learnerId);
                if (learner == null) return NotFound("Learner not found");

                // Find the project if not specified
                int resolvedProjectId = projectId ?? 0;
                if (resolvedProjectId == 0)
                {
                    resolvedProjectId = await _context.ClassEnrollments.AsNoTracking()
                        .Where(ce => ce.LearnerId == learnerId && ce.Status == "Active")
                        .Select(ce => ce.SiteClass!.ProjectSite!.ProjectId)
                        .FirstOrDefaultAsync();
                }

                if (resolvedProjectId == 0)
                    return BadRequest("Learner is not enrolled in any active class");

                var project = await _context.Projects.AsNoTracking()
                    .Include(p => p.SkillsDevelopmentProvider)
                    .FirstOrDefaultAsync(p => p.Id == resolvedProjectId);

                if (project == null) return NotFound("Project not found");

                // Get unit standards for the project
                var unitStandards = await (
                    from plp in _context.ProjectLearningPathways.AsNoTracking()
                    join pq in _context.ProjectQualifications.AsNoTracking() on plp.Id equals pq.ProjectLearningPathwayId
                    join pqus in _context.ProjectQualificationUnitStandards.AsNoTracking() on pq.Id equals pqus.ProjectQualificationId
                    where plp.ProjectId == resolvedProjectId
                    select new { pqus.Id, pqus.UnitStandardId, pqus.UnitStandardType }
                ).Distinct().ToListAsync();

                // Verify competency for each unit standard
                var completedUS = new List<string>();
                foreach (var us in unitStandards)
                {
                    var prog = await _context.LearnerAssessmentProgress.AsNoTracking()
                        .FirstOrDefaultAsync(p => p.LearnerId == learnerId && p.ProjectQualificationUnitStandardId == us.Id);

                    if (prog?.FormativeCompleted == true && prog?.SummativeCompleted == true)
                    {
                        string usName = us.UnitStandardType == "Legacy"
                            ? (await _context.LegacyUnitStandards.FindAsync(us.UnitStandardId))?.UnitStandardName ?? $"US {us.UnitStandardId}"
                            : (await _context.OccupationalUnitStandards.FindAsync(us.UnitStandardId))?.UnitStandardName ?? $"US {us.UnitStandardId}";
                        completedUS.Add(usName);
                    }
                }

                if (!completedUS.Any())
                    return BadRequest(new { message = "Learner has not yet achieved competency in any unit standard." });

                var issueDate = DateTime.Now;
                var certificateNumber = $"NBSN-{learnerId}-{issueDate:yyyyMMdd}-{Guid.NewGuid().ToString()[..6].ToUpper()}";

                var pdfBytes = QuestDocument.Create(container =>
                {
                    container.Page(page =>
                    {
                        page.Size(PageSizes.A4.Landscape());
                        page.Margin(40);
                        page.DefaultTextStyle(t => t.FontFamily("Arial").FontSize(12));

                        page.Background().Canvas((canvas, size) =>
                        {
                            // Cast to SKCanvas — QuestPDF wraps the native canvas
                            var skCanvas = (SKCanvas)(object)canvas;

                            // Gold border
                            var borderPaint = new SKPaint
                            {
                                Color = SKColor.Parse("#B8860B"),
                                StrokeWidth = 8,
                                Style = SKPaintStyle.Stroke
                            };
                            skCanvas.DrawRect(12, 12, size.Width - 24, size.Height - 24, borderPaint);

                            var innerBorderPaint = new SKPaint
                            {
                                Color = SKColor.Parse("#DAA520"),
                                StrokeWidth = 2,
                                Style = SKPaintStyle.Stroke
                            };
                            skCanvas.DrawRect(20, 20, size.Width - 40, size.Height - 40, innerBorderPaint);
                        });

                        page.Content().PaddingHorizontal(30).Column(col =>
                        {
                            col.Item().PaddingTop(10).AlignCenter()
                                .Text("NBSN Skills Development").Bold().FontSize(22).FontColor(Colors.Blue.Darken2);

                            col.Item().PaddingTop(4).AlignCenter()
                                .Text("Certificate of Competence").FontSize(16).FontColor(Colors.Grey.Darken2);

                            col.Item().PaddingTop(6).LineHorizontal(1).LineColor(Colors.Blue.Lighten2);

                            col.Item().PaddingTop(20).AlignCenter()
                                .Text("This is to certify that").FontSize(12).Italic().FontColor(Colors.Grey.Darken1);

                            col.Item().PaddingTop(8).AlignCenter()
                                .Text($"{learner.FirstName} {learner.LastName}")
                                .Bold().FontSize(26).FontColor(Colors.Blue.Darken3);

                            col.Item().PaddingTop(4).AlignCenter()
                                .Text($"ID Number: {learner.IdNumber}").FontSize(11).FontColor(Colors.Grey.Darken1);

                            col.Item().PaddingTop(12).AlignCenter()
                                .Text("has been declared").FontSize(12).Italic().FontColor(Colors.Grey.Darken1);

                            col.Item().PaddingTop(6).AlignCenter()
                                .Text("COMPETENT").Bold().FontSize(28).FontColor(Colors.Green.Darken2);

                            col.Item().PaddingTop(4).AlignCenter()
                                .Text($"in the following unit standard(s) under the programme:")
                                .FontSize(11).FontColor(Colors.Grey.Darken1);

                            col.Item().PaddingTop(4).AlignCenter()
                                .Text(project.ProjectName).Bold().FontSize(13);

                            col.Item().PaddingTop(10).PaddingHorizontal(60).Column(usCol =>
                            {
                                foreach (var usName in completedUS)
                                {
                                    usCol.Item().Row(row =>
                                    {
                                        row.ConstantItem(16).Text("✓").FontColor(Colors.Green.Darken2).Bold();
                                        row.RelativeItem().Text(usName).FontSize(10);
                                    });
                                }
                            });

                            col.Item().PaddingTop(20).LineHorizontal(1).LineColor(Colors.Blue.Lighten2);

                            col.Item().PaddingTop(12).Row(row =>
                            {
                                row.RelativeItem().Column(c =>
                                {
                                    c.Item().Text("Issued by:").FontSize(9).FontColor(Colors.Grey.Medium);
                                    c.Item().Text(project.SkillsDevelopmentProvider?.Name ?? "NBSN").Bold().FontSize(10);
                                    c.Item().PaddingTop(2).Text($"Date: {issueDate:dd MMMM yyyy}").FontSize(9);
                                });
                                row.RelativeItem().AlignCenter().Column(c =>
                                {
                                    c.Item().AlignCenter().Text("Certificate No:").FontSize(8).FontColor(Colors.Grey.Medium);
                                    c.Item().AlignCenter().Text(certificateNumber).FontSize(9).Bold();
                                });
                                row.RelativeItem().AlignRight().Column(c =>
                                {
                                    c.Item().AlignRight().Text("Authorised Signatory").FontSize(9).FontColor(Colors.Grey.Medium);
                                    c.Item().PaddingTop(20).AlignRight()
                                        .LineHorizontal(1).LineColor(Colors.Grey.Darken1);
                                    c.Item().AlignRight().Text("Director / QA Manager").FontSize(9);
                                });
                            });
                        });
                    });
                }).GeneratePdf();

                var safeName = $"{learner.FirstName}_{learner.LastName}".Replace(" ", "_");
                return File(pdfBytes, "application/pdf", $"Certificate_{safeName}_{issueDate:yyyyMMdd}.pdf");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating certificate for learner {LearnerId}", learnerId);
                return StatusCode(500, new { message = "Error generating certificate", error = ex.Message });
            }
        }
    }
}

