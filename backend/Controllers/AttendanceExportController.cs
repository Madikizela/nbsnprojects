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
    }
}
