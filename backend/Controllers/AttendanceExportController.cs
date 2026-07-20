using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using backend.Models;
using ClosedXML.Excel;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AttendanceExportController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<AttendanceExportController> _logger;

        public AttendanceExportController(ApplicationDbContext context, ILogger<AttendanceExportController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet("project/{projectId}/monthly")]
        public async Task<IActionResult> ExportMonthlyAttendance(int projectId, [FromQuery] int year, [FromQuery] int month)
        {
            try
            {
                if (year <= 0 || month <= 0 || month > 12)
                {
                    return BadRequest("Invalid year or month");
                }

                var project = await _context.Projects.FindAsync(projectId);
                if (project == null) return NotFound("Project not found");

                var startDate = new DateTime(year, month, 1);
                var endDate = startDate.AddMonths(1).AddDays(-1);
                var daysInMonth = DateTime.DaysInMonth(year, month);

                var learnerIds = await _context.ClassEnrollments
                    .Include(ce => ce.SiteClass)
                        .ThenInclude(sc => sc!.ProjectSite)
                    .Where(ce => ce.SiteClass != null && 
                                 ce.SiteClass.ProjectSite != null && 
                                 ce.SiteClass.ProjectSite.ProjectId == projectId && 
                                 ce.Status == "Active")
                    .Select(ce => ce.LearnerId)
                    .Distinct()
                    .ToListAsync();

                var learners = await _context.Learners
                    .Where(l => learnerIds.Contains(l.Id))
                    .ToListAsync();

                var attendances = await _context.LearnerAttendances
                    .Where(la => la.AttendanceDate >= startDate && la.AttendanceDate <= endDate && 
                                 _context.ClassEnrollments.Any(ce => ce.LearnerId == la.LearnerId && 
                                                                  ce.SiteClass != null && 
                                                                  ce.SiteClass.ProjectSite != null && 
                                                                  ce.SiteClass.ProjectSite.ProjectId == projectId))
                    .ToListAsync();

                using (var workbook = new XLWorkbook())
                {
                    var worksheet = workbook.Worksheets.Add("Monthly Attendance");
                    
                    // Header
                    worksheet.Cell(1, 1).SetValue($"Attendance Report - {project.ProjectName}");
                    worksheet.Cell(1, 1).Style.Font.Bold = true;
                    worksheet.Cell(1, 1).Style.Font.FontSize = 14;
                    worksheet.Range(1, 1, 1, daysInMonth + 3).Merge().Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

                    worksheet.Cell(2, 1).SetValue($"Month: {startDate:MMMM yyyy}");
                    worksheet.Range(2, 1, 2, daysInMonth + 3).Merge().Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

                    // Table Headers
                    worksheet.Cell(4, 1).SetValue("Learner Name");
                    worksheet.Cell(4, 2).SetValue("ID Number");
                    for (int i = 1; i <= daysInMonth; i++)
                    {
                        worksheet.Cell(4, i + 2).SetValue(i);
                    }
                    worksheet.Cell(4, daysInMonth + 3).SetValue("Total Present");

                    var headerRange = worksheet.Range(4, 1, 4, daysInMonth + 3);
                    headerRange.Style.Font.Bold = true;
                    headerRange.Style.Fill.BackgroundColor = XLColor.LightGray;
                    headerRange.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;

                    // Data
                    int row = 5;
                    foreach (var learner in learners)
                    {
                        if (learner == null) continue;

                        worksheet.Cell(row, 1).SetValue($"{learner.FirstName} {learner.LastName}");
                        worksheet.Cell(row, 2).SetValue(learner.IdNumber);

                        int presentCount = 0;
                        for (int i = 1; i <= daysInMonth; i++)
                        {
                            var date = new DateTime(year, month, i);
                            var att = attendances.FirstOrDefault(a => a.LearnerId == learner.Id && a.AttendanceDate.Date == date.Date);
                            
                            if (att != null && (att.ClockInTime.HasValue || att.Status == "Present"))
                            {
                                worksheet.Cell(row, i + 2).SetValue("P");
                                worksheet.Cell(row, i + 2).Style.Font.FontColor = XLColor.Green;
                                presentCount++;
                            }
                            else
                            {
                                worksheet.Cell(row, i + 2).SetValue("A");
                                worksheet.Cell(row, i + 2).Style.Font.FontColor = XLColor.Red;
                            }
                        }
                        worksheet.Cell(row, daysInMonth + 3).SetValue(presentCount);
                        row++;
                    }

                    worksheet.Columns().AdjustToContents();

                    using (var stream = new MemoryStream())
                    {
                        workbook.SaveAs(stream);
                        var content = stream.ToArray();
                        return File(content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"Attendance_{project.ProjectName}_{year}_{month}.xlsx");
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error exporting monthly attendance for project {ProjectId}, year {Year}, month {Month}", projectId, year, month);
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("project/{projectId}/stipend")]
        public async Task<IActionResult> ExportStipendSchedule(int projectId, [FromQuery] int year, [FromQuery] int month, [FromQuery] decimal dailyRate = 150)
        {
            try
            {
                if (year <= 0 || month <= 0 || month > 12)
                {
                    return BadRequest("Invalid year or month");
                }

                var project = await _context.Projects.FindAsync(projectId);
                if (project == null) return NotFound("Project not found");

                var startDate = new DateTime(year, month, 1);
                var endDate = startDate.AddMonths(1).AddDays(-1);

                var learnerIds = await _context.ClassEnrollments
                    .Include(ce => ce.SiteClass)
                        .ThenInclude(sc => sc!.ProjectSite)
                    .Where(ce => ce.SiteClass != null && 
                                 ce.SiteClass.ProjectSite != null && 
                                 ce.SiteClass.ProjectSite.ProjectId == projectId && 
                                 ce.Status == "Active")
                    .Select(ce => ce.LearnerId)
                    .Distinct()
                    .ToListAsync();

                var learners = await _context.Learners
                    .Where(l => learnerIds.Contains(l.Id))
                    .ToListAsync();

                var attendances = await _context.LearnerAttendances
                    .Where(la => la.AttendanceDate >= startDate && la.AttendanceDate <= endDate && 
                                 _context.ClassEnrollments.Any(ce => ce.LearnerId == la.LearnerId && 
                                                                  ce.SiteClass != null && 
                                                                  ce.SiteClass.ProjectSite != null && 
                                                                  ce.SiteClass.ProjectSite.ProjectId == projectId))
                    .ToListAsync();

                using (var workbook = new XLWorkbook())
                {
                    var worksheet = workbook.Worksheets.Add("Stipend Schedule");

                    // Header
                    worksheet.Cell(1, 1).SetValue($"Stipend Schedule - {project.ProjectName}");
                    worksheet.Cell(1, 1).Style.Font.Bold = true;
                    worksheet.Cell(1, 1).Style.Font.FontSize = 14;
                    worksheet.Range(1, 1, 1, 8).Merge().Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

                    worksheet.Cell(2, 1).SetValue($"Period: {startDate:MMMM yyyy}");
                    worksheet.Range(2, 1, 2, 8).Merge().Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

                    // Table Headers
                    worksheet.Cell(4, 1).SetValue("Learner Name");
                    worksheet.Cell(4, 2).SetValue("ID Number");
                    worksheet.Cell(4, 3).SetValue("Bank Name");
                    worksheet.Cell(4, 4).SetValue("Account Number");
                    worksheet.Cell(4, 5).SetValue("Branch Code");
                    worksheet.Cell(4, 6).SetValue("Days Present");
                    worksheet.Cell(4, 7).SetValue("Daily Rate");
                    worksheet.Cell(4, 8).SetValue("Total Amount");

                    var headerRange = worksheet.Range(4, 1, 4, 8);
                    headerRange.Style.Font.Bold = true;
                    headerRange.Style.Fill.BackgroundColor = XLColor.LightGray;
                    headerRange.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;

                    // Data
                    int row = 5;
                    foreach (var learner in learners)
                    {
                        if (learner == null) continue;

                        int presentCount = attendances.Count(a => a.LearnerId == learner.Id && (a.ClockInTime.HasValue || a.Status == "Present"));
                        decimal totalAmount = presentCount * dailyRate;

                        worksheet.Cell(row, 1).SetValue($"{learner.FirstName} {learner.LastName}");
                        worksheet.Cell(row, 2).SetValue(learner.IdNumber);
                        worksheet.Cell(row, 3).SetValue(learner.BankName ?? "N/A");
                        worksheet.Cell(row, 4).SetValue(learner.AccountNumber ?? "N/A");
                        worksheet.Cell(row, 5).SetValue(learner.BranchCode ?? "N/A");
                        worksheet.Cell(row, 6).SetValue(presentCount);
                        worksheet.Cell(row, 7).SetValue(dailyRate);
                        worksheet.Cell(row, 8).SetValue(totalAmount);
                        worksheet.Cell(row, 8).Style.NumberFormat.Format = "R #,##0.00";
                        row++;
                    }

                    worksheet.Columns().AdjustToContents();

                    using (var stream = new MemoryStream())
                    {
                        workbook.SaveAs(stream);
                        var content = stream.ToArray();
                        return File(content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"Stipend_{project.ProjectName}_{year}_{month}.xlsx");
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error exporting stipend schedule for project {ProjectId}, year {Year}, month {Month}", projectId, year, month);
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // ─── Bulk download: ALL projects for an SDP as a ZIP ─────────────────
        [HttpGet("bulk-download")]
        public async Task<IActionResult> BulkDownloadAttendance(
            [FromQuery] int year,
            [FromQuery] int month,
            [FromQuery] int? sdpId = null,
            [FromQuery] string? projectIds = null,
            [FromQuery] bool includeStipend = false,
            [FromQuery] decimal dailyRate = 150)
        {
            try
            {
                if (year <= 0 || month <= 0 || month > 12)
                    return BadRequest("Invalid year or month");

                // Resolve which projects to export
                List<Project> projects;
                if (!string.IsNullOrEmpty(projectIds))
                {
                    var ids = projectIds.Split(',').Select(s => int.TryParse(s.Trim(), out var n) ? n : 0).Where(n => n > 0).ToList();
                    projects = await _context.Projects.Where(p => ids.Contains(p.Id)).ToListAsync();
                }
                else if (sdpId.HasValue)
                {
                    projects = await _context.Projects.Where(p => p.SkillsDevelopmentProviderId == sdpId.Value).ToListAsync();
                }
                else
                {
                    return BadRequest("Either projectIds or sdpId must be supplied");
                }

                if (projects.Count == 0)
                    return NotFound("No projects found");

                var startDate = new DateTime(year, month, 1);
                var endDate = startDate.AddMonths(1).AddDays(-1);
                var daysInMonth = DateTime.DaysInMonth(year, month);
                var monthLabel = startDate.ToString("MMMM_yyyy");

                using var zipStream = new MemoryStream();
                using (var archive = new System.IO.Compression.ZipArchive(zipStream, System.IO.Compression.ZipArchiveMode.Create, true))
                {
                    foreach (var project in projects)
                    {
                        var safeProjectName = string.Concat(project.ProjectName.Split(Path.GetInvalidFileNameChars()));

                        // ── Fetch learners ────────────────────────────────────
                        var learnerIds = await _context.ClassEnrollments
                            .Include(ce => ce.SiteClass!).ThenInclude(sc => sc!.ProjectSite)
                            .Where(ce => ce.SiteClass != null &&
                                         ce.SiteClass.ProjectSite != null &&
                                         ce.SiteClass.ProjectSite.ProjectId == project.Id &&
                                         ce.Status == "Active")
                            .Select(ce => ce.LearnerId).Distinct().ToListAsync();

                        var learners = await _context.Learners.Where(l => learnerIds.Contains(l.Id)).ToListAsync();

                        var attendances = await _context.LearnerAttendances
                            .Where(la => la.AttendanceDate >= startDate && la.AttendanceDate <= endDate &&
                                         _context.ClassEnrollments.Any(ce =>
                                             ce.LearnerId == la.LearnerId &&
                                             ce.SiteClass != null &&
                                             ce.SiteClass.ProjectSite != null &&
                                             ce.SiteClass.ProjectSite.ProjectId == project.Id))
                            .ToListAsync();

                        // ── Monthly attendance Excel ──────────────────────────
                        using var wb1 = new XLWorkbook();
                        var ws1 = wb1.Worksheets.Add("Monthly Attendance");

                        ws1.Cell(1, 1).SetValue($"Attendance Report - {project.ProjectName}");
                        ws1.Cell(1, 1).Style.Font.Bold = true;
                        ws1.Cell(1, 1).Style.Font.FontSize = 14;
                        ws1.Range(1, 1, 1, daysInMonth + 3).Merge().Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                        ws1.Cell(2, 1).SetValue($"Month: {startDate:MMMM yyyy}");
                        ws1.Range(2, 1, 2, daysInMonth + 3).Merge().Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

                        ws1.Cell(4, 1).SetValue("Learner Name");
                        ws1.Cell(4, 2).SetValue("ID Number");
                        for (int d = 1; d <= daysInMonth; d++) ws1.Cell(4, d + 2).SetValue(d);
                        ws1.Cell(4, daysInMonth + 3).SetValue("Total Present");
                        ws1.Range(4, 1, 4, daysInMonth + 3).Style.Font.Bold = true;
                        ws1.Range(4, 1, 4, daysInMonth + 3).Style.Fill.BackgroundColor = XLColor.LightBlue;

                        int row1 = 5;
                        foreach (var learner in learners)
                        {
                            if (learner == null) continue;
                            ws1.Cell(row1, 1).SetValue($"{learner.FirstName} {learner.LastName}");
                            ws1.Cell(row1, 2).SetValue(learner.IdNumber);
                            int presentCount = 0;
                            for (int d = 1; d <= daysInMonth; d++)
                            {
                                var date = new DateTime(year, month, d);
                                var att = attendances.FirstOrDefault(a => a.LearnerId == learner.Id && a.AttendanceDate.Date == date.Date);
                                if (att != null && (att.ClockInTime.HasValue || att.Status == "Present"))
                                {
                                    ws1.Cell(row1, d + 2).SetValue("P");
                                    ws1.Cell(row1, d + 2).Style.Font.FontColor = XLColor.Green;
                                    presentCount++;
                                }
                                else
                                {
                                    ws1.Cell(row1, d + 2).SetValue("A");
                                    ws1.Cell(row1, d + 2).Style.Font.FontColor = XLColor.Red;
                                }
                            }
                            ws1.Cell(row1, daysInMonth + 3).SetValue(presentCount);
                            row1++;
                        }
                        ws1.Columns().AdjustToContents();

                        using var ms1 = new MemoryStream();
                        wb1.SaveAs(ms1);
                        var entry1 = archive.CreateEntry($"{safeProjectName}/Attendance_{safeProjectName}_{monthLabel}.xlsx");
                        using (var entryStream = entry1.Open()) await entryStream.WriteAsync(ms1.ToArray());

                        // ── Stipend Excel (optional) ──────────────────────────
                        if (includeStipend)
                        {
                            using var wb2 = new XLWorkbook();
                            var ws2 = wb2.Worksheets.Add("Stipend Schedule");
                            ws2.Cell(1, 1).SetValue($"Stipend Schedule - {project.ProjectName}");
                            ws2.Cell(1, 1).Style.Font.Bold = true;
                            ws2.Range(1, 1, 1, 8).Merge().Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                            ws2.Cell(2, 1).SetValue($"Period: {startDate:MMMM yyyy}");
                            ws2.Range(2, 1, 2, 8).Merge().Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

                            ws2.Cell(4, 1).SetValue("Learner Name");
                            ws2.Cell(4, 2).SetValue("ID Number");
                            ws2.Cell(4, 3).SetValue("Bank Name");
                            ws2.Cell(4, 4).SetValue("Account Number");
                            ws2.Cell(4, 5).SetValue("Branch Code");
                            ws2.Cell(4, 6).SetValue("Days Present");
                            ws2.Cell(4, 7).SetValue("Daily Rate");
                            ws2.Cell(4, 8).SetValue("Total Amount");
                            ws2.Range(4, 1, 4, 8).Style.Font.Bold = true;
                            ws2.Range(4, 1, 4, 8).Style.Fill.BackgroundColor = XLColor.LightGreen;

                            int row2 = 5;
                            foreach (var learner in learners)
                            {
                                if (learner == null) continue;
                                int presentDays = 0;
                                for (int d = 1; d <= daysInMonth; d++)
                                {
                                    var att = attendances.FirstOrDefault(a => a.LearnerId == learner.Id && a.AttendanceDate.Date == new DateTime(year, month, d).Date);
                                    if (att != null && (att.ClockInTime.HasValue || att.Status == "Present")) presentDays++;
                                }
                                var total = presentDays * dailyRate;
                                ws2.Cell(row2, 1).SetValue($"{learner.FirstName} {learner.LastName}");
                                ws2.Cell(row2, 2).SetValue(learner.IdNumber);
                                ws2.Cell(row2, 3).SetValue(learner.BankName ?? "N/A");
                                ws2.Cell(row2, 4).SetValue(learner.AccountNumber ?? "N/A");
                                ws2.Cell(row2, 5).SetValue(learner.BranchCode ?? "N/A");
                                ws2.Cell(row2, 6).SetValue(presentDays);
                                ws2.Cell(row2, 7).SetValue(dailyRate);
                                ws2.Cell(row2, 8).SetValue(total);
                                ws2.Cell(row2, 8).Style.NumberFormat.Format = "R #,##0.00";
                                row2++;
                            }
                            ws2.Columns().AdjustToContents();

                            using var ms2 = new MemoryStream();
                            wb2.SaveAs(ms2);
                            var entry2 = archive.CreateEntry($"{safeProjectName}/Stipend_{safeProjectName}_{monthLabel}.xlsx");
                            using (var entryStream = entry2.Open()) await entryStream.WriteAsync(ms2.ToArray());
                        }
                    }
                }

                zipStream.Seek(0, SeekOrigin.Begin);
                var zipName = $"Bulk_Attendance_{monthLabel}_{DateTime.Now:yyyyMMddHHmm}.zip";
                return File(zipStream.ToArray(), "application/zip", zipName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in bulk attendance download");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
    }
}

