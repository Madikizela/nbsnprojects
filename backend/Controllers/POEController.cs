using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using QuestPDF.Drawing;
using backend.Models;
using backend.Services.Interfaces;
using System.IO;
using SkiaSharp;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class POEController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _environment;
        private readonly ILearnerDocumentEncryptionService _encryptionService;

        public POEController(ApplicationDbContext context, IWebHostEnvironment environment, ILearnerDocumentEncryptionService encryptionService)
        {
            _context = context;
            _environment = environment;
            _encryptionService = encryptionService;

            // Enable debugging for layout issues
            QuestPDF.Settings.EnableDebugging = true;

            // Register Lato font if available
            var fontPath = Path.Combine(_environment.ContentRootPath, "bin", "Debug", "net9.0", "LatoFont");
            if (!Directory.Exists(fontPath))
            {
                fontPath = Path.Combine(_environment.ContentRootPath, "LatoFont");
            }

            if (Directory.Exists(fontPath))
             {
                 try
                 {
                     foreach (var file in Directory.GetFiles(fontPath, "*.ttf"))
                     {
                         using var fontStream = System.IO.File.OpenRead(file);
                         FontManager.RegisterFont(fontStream);
                     }
                 }
                 catch { }
             }
        }

        private class UnitStandardInfo
        {
            public int ProjectQualificationUnitStandardId { get; set; }
            public string Id { get; set; } = string.Empty;
            public string Title { get; set; } = string.Empty;
            public int Credits { get; set; }
        }

        private class AnswerWithQuestion
        {
            public LearnerAssessmentAnswer Answer { get; set; } = null!;
            public string QuestionText { get; set; } = string.Empty;
            public decimal AllocatedMarks { get; set; }
            public int ProjectQualificationUnitStandardId { get; set; }
        }

        private class PrepItem
        {
            public int Id { get; set; }
            public string Text { get; set; } = string.Empty;
            public string Docs { get; set; } = string.Empty;
            public bool Agreed { get; set; }
            public string Action { get; set; } = string.Empty;
        }

        private byte[]? GetRoundImage(string path, int size)
        {
            try
            {
                if (!System.IO.File.Exists(path)) return null;

                using var input = System.IO.File.OpenRead(path);
                using var codec = SKCodec.Create(input);
                if (codec == null) return null;

                // Handle orientation
                var origin = codec.EncodedOrigin;
                using var original = SKBitmap.Decode(codec);
                if (original == null) return null;

                // Rotate if necessary
                var oriented = original;
                if (origin != SKEncodedOrigin.TopLeft)
                {
                    oriented = RotateBitmap(original, origin);
                }

                // Create a square canvas for the round output
                using var surface = SKSurface.Create(new SKImageInfo(size, size));
                var canvas = surface.Canvas;
                canvas.Clear(SKColors.Transparent);

                // Create circular clip
                using var clipPath = new SKPath();
                clipPath.AddCircle(size / 2f, size / 2f, size / 2f);
                canvas.ClipPath(clipPath, SKClipOperation.Intersect, true);

                // Calculate scaling to "Cover" the circle (no empty spaces)
                float aspect = (float)oriented.Width / oriented.Height;
                SKRect destRect;
                if (aspect > 1) // Landscape
                {
                    float width = size * aspect;
                    destRect = new SKRect(-(width - size) / 2f, 0, size + (width - size) / 2f, size);
                }
                else // Portrait or Square
                {
                    float height = size / aspect;
                    destRect = new SKRect(0, -(height - size) / 2f, size, size + (height - size) / 2f);
                }

                using var paint = new SKPaint { IsAntialias = true, FilterQuality = SKFilterQuality.High };
                canvas.DrawBitmap(oriented, destRect, paint);

                // Add a professional blue border ring
                using var borderPaint = new SKPaint
                {
                    Color = SKColor.Parse("#2196F3"), // Blue Medium
                    IsAntialias = true,
                    Style = SKPaintStyle.Stroke,
                    StrokeWidth = size * 0.02f // 2% of size
                };
                canvas.DrawCircle(size / 2f, size / 2f, (size / 2f) - (borderPaint.StrokeWidth / 2f), borderPaint);

                // Cleanup oriented if it's a new instance
                if (oriented != original) oriented.Dispose();

                using var image = surface.Snapshot();
                using var data = image.Encode(SKEncodedImageFormat.Png, 100);
                return data.ToArray();
            }
            catch
            {
                return null;
            }
        }

        private SKBitmap RotateBitmap(SKBitmap bitmap, SKEncodedOrigin origin)
        {
            int width = bitmap.Width;
            int height = bitmap.Height;
            bool swap = origin == SKEncodedOrigin.LeftTop || origin == SKEncodedOrigin.RightTop || 
                        origin == SKEncodedOrigin.RightBottom || origin == SKEncodedOrigin.LeftBottom;

            var rotated = new SKBitmap(swap ? height : width, swap ? width : height);

            using (var canvas = new SKCanvas(rotated))
            {
                canvas.Translate(rotated.Width / 2f, rotated.Height / 2f);
                
                float degrees = 0;
                switch (origin)
                {
                    case SKEncodedOrigin.BottomRight: degrees = 180; break;
                    case SKEncodedOrigin.RightTop: degrees = 90; break;
                    case SKEncodedOrigin.LeftBottom: degrees = -90; break;
                    // Add more cases if needed, but these cover common rotations
                }
                
                canvas.RotateDegrees(degrees);
                canvas.Translate(-width / 2f, -height / 2f);
                canvas.DrawBitmap(bitmap, 0, 0);
            }
            return rotated;
        }

        [HttpGet("compile/{learnerId}")]
        [AllowAnonymous]
        public async Task<IActionResult> CompilePOE(int learnerId)
        {
            try
            {
                var learner = await _context.Learners
                    .Include(l => l.ClassEnrollments)
                        .ThenInclude(e => e.SiteClass)
                            .ThenInclude(sc => sc.ProjectSite)
                                .ThenInclude(ps => ps.Project)
                    .Include(l => l.LearnerDocuments)
                    .FirstOrDefaultAsync(l => l.Id == learnerId);

                if (learner == null) return NotFound("Learner not found");

                // Fetch ID and Qualification documents
                var idDoc = learner.LearnerDocuments.FirstOrDefault(d => d.DocumentType == "ID Document" || d.DocumentType == "Identity Document");
                var qualDoc = learner.LearnerDocuments.FirstOrDefault(d => d.DocumentType == "Qualifications" || d.DocumentType == "Qualification");

                byte[]? idDocBytes = null;
                byte[]? qualDocBytes = null;

                if (idDoc != null)
                {
                    try { idDocBytes = await _encryptionService.DecryptFileAsync(idDoc.EncryptedFilePath, idDoc.EncryptionIV); } catch { }
                }
                if (qualDoc != null)
                {
                    try { qualDocBytes = await _encryptionService.DecryptFileAsync(qualDoc.EncryptedFilePath, qualDoc.EncryptionIV); } catch { }
                }

                // Find the project and qualification info
                var enrollment = learner.ClassEnrollments.FirstOrDefault();
                var project = enrollment?.SiteClass?.ProjectSite?.Project;
                
                ProjectLearningPathway? projectPathway = null;
                ProjectQualification? projectQual = null;
                string qualificationName = "N/A";
                string pathwayName = "N/A";

                if (project != null)
                {
                    projectPathway = await _context.ProjectLearningPathways
                        .Include(p => p.LearningPathway)
                        .Include(p => p.ProjectQualifications)
                        .FirstOrDefaultAsync(p => p.ProjectId == project.Id);
                    
                    pathwayName = projectPathway?.LearningPathway?.Name ?? "N/A";
                    projectQual = projectPathway?.ProjectQualifications.FirstOrDefault();

                    if (projectQual != null)
                    {
                        if (projectQual.OccupationalQualificationId.HasValue)
                        {
                            var oq = await _context.OccupationalQualifications.FindAsync(projectQual.OccupationalQualificationId.Value);
                            if (oq != null)
                            {
                                qualificationName = oq.Name + " (" + oq.QualificationId.ToString() + ")";
                            }
                            else qualificationName = "N/A";
                        }
                        else if (projectQual.LegacyQualificationId.HasValue)
                        {
                            var lq = await _context.LegacyQualifications.FindAsync(projectQual.LegacyQualificationId.Value);
                            if (lq != null)
                            {
                                var qId = lq.QualificationId.HasValue ? lq.QualificationId.Value.ToString() : lq.Id.ToString();
                                qualificationName = lq.Name + " (" + qId + ")";
                            }
                            else qualificationName = "N/A";
                        }
                    }
                }

                var unitStandards = new List<UnitStandardInfo>();
                if (projectQual != null)
                {
                    var pqUnitStandards = await _context.ProjectQualificationUnitStandards
                        .Where(pqus => pqus.ProjectQualificationId == projectQual.Id)
                        .ToListAsync();

                    foreach (var pqus in pqUnitStandards)
                    {
                        if (pqus.UnitStandardType == "Legacy")
                        {
                            var us = await _context.LegacyUnitStandards.FindAsync(pqus.UnitStandardId);
                            if (us != null) unitStandards.Add(new UnitStandardInfo 
                            { 
                                ProjectQualificationUnitStandardId = pqus.Id,
                                Id = us.UnitStandardId?.ToString() ?? us.Id.ToString(), 
                                Title = us.UnitStandardName ?? "N/A", 
                                Credits = us.Credits ?? 0 
                            });
                        }
                        else
                        {
                            var us = await _context.OccupationalUnitStandards.FindAsync(pqus.UnitStandardId);
                            if (us != null) unitStandards.Add(new UnitStandardInfo 
                            { 
                                ProjectQualificationUnitStandardId = pqus.Id,
                                Id = us.Id.ToString(), 
                                Title = us.UnitStandardName ?? "N/A", 
                                Credits = us.Credits ?? 0 
                            });
                        }
                    }
                }

                // Fetch assessment answers and questions
                var allAnswers = await _context.LearnerAssessmentAnswers
                    .Where(a => a.LearnerId == learnerId)
                    .OrderBy(a => a.QuestionNumber)
                    .ThenBy(a => a.ScannedAt)
                    .ToListAsync();

                // Fetch Assessment Strategy Plans for all Unit Standards in this qualification
                var pqUsIds = unitStandards.Select(us => us.ProjectQualificationUnitStandardId).ToList();
                var strategyPlans = await _context.AssessmentStrategyPlans
                    .Where(p => pqUsIds.Contains(p.ProjectQualificationUnitStandardId))
                    .ToListAsync();

                var logPath2 = Path.Combine(_environment.ContentRootPath, "poe_error.log");
                System.IO.File.AppendAllText(logPath2, $"[{DateTime.Now}] Processing {allAnswers.Count} answers for learner {learnerId}\n");

                var answersWithQuestions = new List<AnswerWithQuestion>();
                foreach (var answer in allAnswers)
                {
                    string qText = "Question";
                    decimal allocatedMarks = 0;
                    int pqUsId = 0;
                    
                    // Get question details based on type
                    if (answer.AssessmentType == "Formative")
                    {
                        var q = await _context.FormativeAssessmentQuestions
                            .Include(f => f.FormativeAssessment)
                            .FirstOrDefaultAsync(f => f.Id == answer.QuestionId);
                        if (q != null) 
                        {
                            qText = q.QuestionText;
                            allocatedMarks = q.AllocatedMarks;
                            pqUsId = q.FormativeAssessment?.ProjectQualificationUnitStandardId ?? 0;
                        }
                        System.IO.File.AppendAllText(logPath2, $"  Answer {answer.Id} (Formative Q{answer.QuestionId}): question_found={q!=null}, pqUsId={pqUsId}, fileExists={System.IO.File.Exists(answer.ScannedDocumentPath)}, path={answer.ScannedDocumentPath}\n");
                    }
                    else
                    {
                        var q = await _context.SummativeAssessmentQuestions
                            .Include(s => s.SummativeAssessment)
                            .FirstOrDefaultAsync(s => s.Id == answer.QuestionId);
                        if (q != null)
                        {
                            qText = q.QuestionText;
                            allocatedMarks = q.AllocatedMarks;
                            pqUsId = q.SummativeAssessment?.ProjectQualificationUnitStandardId ?? 0;
                        }
                        System.IO.File.AppendAllText(logPath2, $"  Answer {answer.Id} (Summative Q{answer.QuestionId}): question_found={q!=null}, pqUsId={pqUsId}, fileExists={System.IO.File.Exists(answer.ScannedDocumentPath)}, path={answer.ScannedDocumentPath}\n");
                    }

                    // IMPORTANT: If multiple files exist for the same question, only the first one should show the full mark.
                    // Subsequent ones should show "Continuation" to avoid double-counting in the UI view.
                    var isContinuation = allAnswers.Any(a => 
                        a.QuestionId == answer.QuestionId && 
                        a.AssessmentType == answer.AssessmentType && 
                        a.ScannedAt < answer.ScannedAt);

                    answersWithQuestions.Add(new AnswerWithQuestion 
                    { 
                        Answer = answer, 
                        QuestionText = isContinuation ? "(Continuation of previous page)" : qText, 
                        AllocatedMarks = isContinuation ? 0 : allocatedMarks,
                        ProjectQualificationUnitStandardId = pqUsId
                    });
                }

                // Log unit standard IDs to cross-check with answer pqUsIds
                System.IO.File.AppendAllText(logPath2, $"[{DateTime.Now}] Unit standard pqUsIds in this qualification: {string.Join(", ", pqUsIds)}\n");
                System.IO.File.AppendAllText(logPath2, $"[{DateTime.Now}] Answer pqUsIds resolved: {string.Join(", ", answersWithQuestions.Select(a => a.ProjectQualificationUnitStandardId).Distinct())}\n");

                // Generate initials for the footer
                string initials = "";
                if (!string.IsNullOrEmpty(learner.FirstName)) initials += learner.FirstName[0] + ". ";
                if (!string.IsNullOrEmpty(learner.LastName)) initials += learner.LastName[0] + ".";
                initials = initials.Trim();

                // Get first assessor plan for footer signatures if available
                var firstPlan = strategyPlans.FirstOrDefault(p => !string.IsNullOrEmpty(p.AssessorSignature));
                string assessorInitials = firstPlan?.AssessorSignature?.Length <= 5 ? (firstPlan.AssessorSignature ?? "") : ""; 

                var firstModeratorPlan = strategyPlans.FirstOrDefault(p => !string.IsNullOrEmpty(p.ModeratorSignature));
                string moderatorInitials = firstModeratorPlan?.ModeratorSignature?.Length <= 5 ? (firstModeratorPlan.ModeratorSignature ?? "") : "";

                var pdf = QuestPDF.Fluent.Document.Create(container =>
                {
                    container.Page(page =>
                    {
                        page.Size(PageSizes.A4);
                        page.Margin(1, Unit.Centimetre);
                        page.PageColor(Colors.White);
                        page.DefaultTextStyle(x => x.FontSize(10).FontFamily("Lato"));

                        // Cover Page
                        page.Content().Column(col =>
                        {
                            // Outer Container for Cover
                            col.Item().Padding(10).Column(coverCol => 
                            {
                                // Logo and Title Row
                                coverCol.Item().Row(row => {
                                    // Logo if exists
                                    var logoPath = Path.Combine(_environment.ContentRootPath, "..", "frontend", "src", "assets", "nbsn-logo.png");
                                    var roundLogo = GetRoundImage(logoPath, 200); // High res source
                                    if (roundLogo != null)
                                    {
                                        row.ConstantItem(80).Height(80).Width(80).Image(roundLogo); 
                                    }
                                    
                                    row.RelativeItem().Column(titleCol => {
                                        titleCol.Item().AlignRight().Text("PORTFOLIO OF EVIDENCE").FontSize(24).Bold().FontColor(Colors.Blue.Medium);
                                        titleCol.Item().AlignRight().Text("Skills Development & Training").FontSize(12).Italic();
                                    });
                                });

                                coverCol.Item().PaddingTop(1, Unit.Centimetre).AlignCenter().Column(photoCol => {
                                    // Profile photo - Bigger
                                    var roundPhoto = GetRoundImage(learner.ProfilePhotoPath ?? "", 600); // High res source
                                    if (roundPhoto != null)
                                    {
                                        photoCol.Item().AlignCenter().Width(250).Height(250).Image(roundPhoto); 
                                    }
                                    else
                                    {
                                        photoCol.Item().AlignCenter().Width(250).Height(250).Placeholder("Learner Profile Photo");
                                    }
                                });

                                coverCol.Item().PaddingTop(1.0f, Unit.Centimetre).AlignCenter().Text($"{learner.FirstName} {learner.LastName}").FontSize(26).Bold();
                                coverCol.Item().AlignCenter().Text($"ID Number: {learner.IdNumber}").FontSize(16);

                                coverCol.Item().PaddingTop(1, Unit.Centimetre).Background(Colors.Blue.Lighten5).Padding(15).Column(projCol => {
                                    projCol.Item().Text("QUALIFICATION DETAILS").FontSize(10).Bold().FontColor(Colors.Blue.Medium).AlignCenter();
                                    projCol.Item().PaddingTop(5).Text(qualificationName).FontSize(18).Bold().AlignCenter();
                                    
                                    if (project != null) {
                                        projCol.Item().PaddingTop(15).Text("PROJECT NAME").FontSize(10).Bold().FontColor(Colors.Blue.Medium).AlignCenter();
                                        projCol.Item().PaddingTop(5).Text(project.ProjectName).FontSize(18).Bold().AlignCenter();
                                    }
                                });

                                coverCol.Item().PaddingTop(1, Unit.Centimetre).AlignRight().Text($"Document ID: POE-{learnerId}-{DateTime.Now:yyyyMMdd}").FontSize(8).Italic();
                            });
                            
                            col.Item().PageBreak();

                            // Table of Contents
                            col.Item().Text("TABLE OF CONTENTS").FontSize(18).Bold().Underline();
                            col.Item().PaddingTop(20).Column(toc =>
                            {
                                toc.Item().PaddingVertical(5).Row(row => {
                                    row.RelativeItem().Text("1. Learner Information");
                                    row.ConstantItem(50).AlignRight().Text("Page 2");
                                });
                                toc.Item().PaddingVertical(5).Row(row => {
                                    row.RelativeItem().Text("2. Supporting Documents - Identity Document");
                                    row.ConstantItem(50).AlignRight().Text("Page 3");
                                });
                                toc.Item().PaddingVertical(5).Row(row => {
                                    row.RelativeItem().Text("3. Supporting Documents - Qualification Document");
                                    row.ConstantItem(50).AlignRight().Text("Page 4");
                                });
                                toc.Item().PaddingVertical(5).Row(row => {
                                    row.RelativeItem().Text("4. Qualification Information");
                                    row.ConstantItem(50).AlignRight().Text("Page 5");
                                });
                                toc.Item().PaddingVertical(5).Row(row => {
                                    row.RelativeItem().Text("5. Unit Standards Covered");
                                    row.ConstantItem(50).AlignRight().Text("Page 5");
                                });
                                toc.Item().PaddingVertical(5).Row(row => {
                                    row.RelativeItem().Text("6. Unit Standard Evidence & Documentation");
                                    row.ConstantItem(50).AlignRight().Text("Page 6+");
                                });
                            });

                            col.Item().PageBreak();

                            // Learner Information Page
                            col.Item().Background(Colors.Blue.Medium).Padding(10).Text("1. LEARNER INFORMATION").FontSize(16).Bold().FontColor(Colors.White);
                            col.Item().PaddingTop(15).Table(table =>
                            {
                                table.ColumnsDefinition(columns =>
                                {
                                    columns.RelativeColumn(1);
                                    columns.RelativeColumn(2);
                                });

                                // Custom helper for consistent row styling
                                void AddRow(string label, string value, bool isEven)
                                {
                                    table.Cell().Background(isEven ? Colors.Grey.Lighten5 : Colors.White).BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(8).Text(label).Bold().FontSize(10);
                                    table.Cell().Background(isEven ? Colors.Grey.Lighten5 : Colors.White).BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(8).Text(value).FontSize(10);
                                }

                                AddRow("Full Name", $"{learner.FirstName} {learner.LastName}", false);
                                AddRow("ID Number", learner.IdNumber, true);
                                AddRow("Date of Birth", learner.DateOfBirth?.ToString("yyyy-MM-dd") ?? "N/A", false);
                                AddRow("Phone Number", learner.ContactNumber ?? "N/A", true);
                                AddRow("Email Address", learner.Email ?? "N/A", false);
                                AddRow("Age", learner.Age?.ToString() ?? "N/A", true);
                                AddRow("Gender", learner.Gender ?? "N/A", false);
                                AddRow("Race", learner.Race ?? "N/A", true);
                                AddRow("Language", learner.HomeLanguage ?? "N/A", false);
                                AddRow("Disability", learner.Disability ?? "No", true);
                                AddRow("High School", learner.HighSchoolName ?? "N/A", false);
                            });

                            // 2. Identity Document Page
                            col.Item().PageBreak();
                            col.Item().Text("2. IDENTITY DOCUMENT").FontSize(16).Bold().AlignCenter();
                            col.Item().PaddingTop(20).Column(idCol => {
                                if (idDocBytes != null) {
                                    if (idDoc.MimeType.StartsWith("image/")) {
                                        idCol.Item().AlignCenter().Width(450).Image(idDocBytes).FitArea();
                                    } else {
                                        idCol.Item().AlignCenter().Text($"Document '{idDoc.FileName}' is attached to the portfolio record.").FontSize(12);
                                    }
                                } else {
                                    idCol.Item().AlignCenter().Text("Identity Document not yet uploaded").FontSize(14).FontColor(Colors.Red.Medium);
                                }
                            });

                            // 3. Qualification Document Page
                            col.Item().PageBreak();
                            col.Item().Text("3. QUALIFICATION DOCUMENT").FontSize(16).Bold().AlignCenter();
                            col.Item().PaddingTop(20).Column(qCol => {
                                if (qualDocBytes != null) {
                                    if (qualDoc.MimeType.StartsWith("image/")) {
                                        qCol.Item().AlignCenter().Width(450).Image(qualDocBytes).FitArea();
                                    } else {
                                        qCol.Item().AlignCenter().Text($"Document '{qualDoc.FileName}' is attached to the portfolio record.").FontSize(12);
                                    }
                                } else {
                                    qCol.Item().AlignCenter().Text("Qualification Document not yet uploaded").FontSize(14).FontColor(Colors.Red.Medium);
                                }
                            });

                            col.Item().PageBreak();

                            // Qualification Information
                            col.Item().Background(Colors.Blue.Medium).Padding(10).Text("4. QUALIFICATION INFORMATION").FontSize(16).Bold().FontColor(Colors.White);
                            col.Item().PaddingTop(15).Table(table =>
                            {
                                table.ColumnsDefinition(columns =>
                                {
                                    columns.RelativeColumn(1);
                                    columns.RelativeColumn(2);
                                });

                                table.Cell().Background(Colors.Grey.Lighten5).BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(8).Text("Learning Pathway").Bold().FontSize(10);
                                table.Cell().Background(Colors.Grey.Lighten5).BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(8).Text(pathwayName).FontSize(10);

                                table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(8).Text("Qualification").Bold().FontSize(10);
                                table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(8).Text(qualificationName).FontSize(10);
                            });

                            col.Item().PaddingTop(30).Background(Colors.Blue.Medium).Padding(10).Text("5. UNIT STANDARDS COVERED").FontSize(16).Bold().FontColor(Colors.White);
                            col.Item().PaddingTop(15).Table(table =>
                            {
                                table.ColumnsDefinition(columns =>
                                {
                                    columns.ConstantColumn(80);
                                    columns.RelativeColumn();
                                    columns.ConstantColumn(60);
                                });

                                table.Header(header =>
                                {
                                    header.Cell().Background(Colors.Blue.Lighten4).Padding(8).Text("US ID").Bold().FontSize(10).FontColor(Colors.Blue.Medium);
                                    header.Cell().Background(Colors.Blue.Lighten4).Padding(8).Text("Title").Bold().FontSize(10).FontColor(Colors.Blue.Medium);
                                    header.Cell().Background(Colors.Blue.Lighten4).Padding(8).Text("Credits").Bold().FontSize(10).FontColor(Colors.Blue.Medium);
                                });

                                bool isEven = false;
                                foreach (var us in unitStandards)
                                {
                                    var bgColor = isEven ? Colors.Grey.Lighten5 : Colors.White;
                                    table.Cell().Background(bgColor).BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(8).Text(us.Id).FontSize(9);
                                    table.Cell().Background(bgColor).BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(8).Text(us.Title).FontSize(9);
                                    table.Cell().Background(bgColor).BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(8).Text(us.Credits.ToString()).FontSize(9);
                                    isEven = !isEven;
                                }
                            });

                            // 6. UNIT STANDARD EVIDENCE & DOCUMENTATION
                            col.Item().PageBreak();
                            col.Item().Text("6. UNIT STANDARD EVIDENCE & DOCUMENTATION").FontSize(16).Bold();
                            col.Item().PaddingTop(10).Text("This section contains the candidate preparation, assessment plans, and evidence of competence for each unit standard in this qualification.").FontSize(11);

                            foreach (var us in unitStandards)
                            {
                                col.Item().PageBreak();

                                // Unit Standard Header
                                col.Item().Background(Colors.Blue.Medium).Padding(10).Row(row => {
                                    row.RelativeItem().Text($"UNIT STANDARD: {us.Title}").Bold().FontColor(Colors.White).FontSize(12);
                                    row.ConstantItem(100).AlignRight().Text($"US ID: {us.Id}").Bold().FontColor(Colors.White).FontSize(10);
                                });

                                var plan = strategyPlans.FirstOrDefault(p => p.ProjectQualificationUnitStandardId == us.ProjectQualificationUnitStandardId);

                                // 6.1 Candidate Preparation
                                col.Item().PaddingTop(15).Text("A. CANDIDATE PREPARATION").FontSize(11).Bold().Underline();
                                col.Item().PaddingTop(10).Column(usPrepCol => {
                                    if (plan != null && !string.IsNullOrEmpty(plan.PrepItemsJson))
                                    {
                                        usPrepCol.Item().PaddingBottom(5).Background(Colors.Grey.Lighten5).Padding(8).Row(row => {
                                            row.RelativeItem().Column(c => {
                                                c.Item().Text(x => { x.Span("Prep Date: ").Bold().FontSize(9); x.Span(plan.PrepDate?.ToShortDateString() ?? "N/A").FontSize(9); });
                                                c.Item().Text(x => { x.Span("Prep Time: ").Bold().FontSize(9); x.Span(plan.PrepTime ?? "N/A").FontSize(9); });
                                                c.Item().Text(x => { x.Span("Venue: ").Bold().FontSize(9); x.Span(plan.PrepVenue ?? "N/A").FontSize(9); });
                                            });
                                            if (!string.IsNullOrEmpty(plan.PrepComments))
                                            {
                                                row.RelativeItem().AlignRight().Text(x => { x.Span("Comments: ").Bold().FontSize(8); x.Span(plan.PrepComments).FontSize(8).Italic(); });
                                            }
                                        });

                                        List<PrepItem> items = new List<PrepItem>();
                                        try { items = System.Text.Json.JsonSerializer.Deserialize<List<PrepItem>>(plan.PrepItemsJson, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new List<PrepItem>(); } catch { }

                                        usPrepCol.Item().PaddingTop(5).Table(table => {
                                            table.ColumnsDefinition(cols => {
                                                cols.RelativeColumn(3);
                                                cols.RelativeColumn(2);
                                                cols.ConstantColumn(50);
                                                cols.RelativeColumn(2);
                                            });
                                            
                                            table.Header(h => {
                                                h.Cell().Background(Colors.Blue.Lighten4).Padding(5).Text("Preparation Item").Bold().FontSize(9).FontColor(Colors.Blue.Medium);
                                                h.Cell().Background(Colors.Blue.Lighten4).Padding(5).Text("Documents").Bold().FontSize(9).FontColor(Colors.Blue.Medium);
                                                h.Cell().Background(Colors.Blue.Lighten4).Padding(5).AlignCenter().Text("Agreed").Bold().FontSize(9).FontColor(Colors.Blue.Medium);
                                                h.Cell().Background(Colors.Blue.Lighten4).Padding(5).Text("Action").Bold().FontSize(9).FontColor(Colors.Blue.Medium);
                                            });

                                            bool isEven = false;
                                            foreach (var item in items)
                                            {
                                                var bgColor = isEven ? Colors.Grey.Lighten5 : Colors.White;
                                                table.Cell().Background(bgColor).BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(5).Text(item.Text).FontSize(8);
                                                table.Cell().Background(bgColor).BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(5).Text(item.Docs).FontSize(8);
                                                table.Cell().Background(bgColor).BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(5).AlignCenter().Text(item.Agreed ? "Yes" : "No").FontSize(8).FontColor(item.Agreed ? Colors.Green.Medium : Colors.Red.Medium).Bold();
                                                table.Cell().Background(bgColor).BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(5).Text(item.Action).FontSize(8);
                                                isEven = !isEven;
                                            }
                                        });
                                    }
                                    else
                                    {
                                        usPrepCol.Item().PaddingTop(5).Border(1).Padding(10).AlignCenter().Text("No candidate preparation record has been recorded for this unit standard.").Italic().FontSize(9);
                                    }
                                });

                                // 6.2 Assessment Plan
                                col.Item().PaddingTop(20).Text("B. ASSESSMENT PLAN").FontSize(11).Bold().Underline();
                                col.Item().PaddingTop(10).Column(usPlanCol => {
                                    if (plan != null && plan.AssessmentDate.HasValue)
                                    {
                                        usPlanCol.Item().Table(table => {
                                            table.ColumnsDefinition(cols => {
                                                cols.RelativeColumn();
                                                cols.RelativeColumn();
                                                cols.RelativeColumn();
                                            });
                                            
                                            table.Header(h => {
                                                h.Cell().Background(Colors.Blue.Lighten4).Padding(5).Text("Strategy").Bold().FontSize(9).FontColor(Colors.Blue.Medium);
                                                h.Cell().Background(Colors.Blue.Lighten4).Padding(5).Text("Details").Bold().FontSize(9).FontColor(Colors.Blue.Medium);
                                                h.Cell().Background(Colors.Blue.Lighten4).Padding(5).Text("Resources").Bold().FontSize(9).FontColor(Colors.Blue.Medium);
                                            });

                                            table.Cell().Background(Colors.Grey.Lighten5).BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(5).Text("Questionnaire").Bold().FontSize(8);
                                            table.Cell().Background(Colors.Grey.Lighten5).BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(5).Column(c => {
                                                c.Item().Text($"Time: {plan.QuestionnaireTime ?? "N/A"}").FontSize(8);
                                                c.Item().Text($"Location: {plan.QuestionnaireLocation ?? "N/A"}").FontSize(8);
                                            });
                                            table.Cell().Background(Colors.Grey.Lighten5).BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(5).Text(plan.QuestionnaireEquipment ?? "N/A").FontSize(8);

                                            table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(5).Text("Practical").Bold().FontSize(8);
                                            table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(5).Column(c => {
                                                c.Item().Text($"Time: {plan.PracticalTime ?? "N/A"}").FontSize(8);
                                                c.Item().Text($"Location: {plan.PracticalLocation ?? "N/A"}").FontSize(8);
                                            });
                                            table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(5).Text(plan.PracticalEquipment ?? "N/A").FontSize(8);
                                        });

                                        usPlanCol.Item().PaddingTop(5).Background(Colors.Grey.Lighten5).Padding(8).Row(row => {
                                            row.RelativeItem().Column(c => {
                                                c.Item().Text(x => { x.Span("Assessment Date: ").Bold().FontSize(9); x.Span(plan.AssessmentDate?.ToShortDateString() ?? "N/A").FontSize(9); });
                                                c.Item().PaddingTop(5).Text("ASSESSOR DETAILS").Bold().FontSize(8).FontColor(Colors.Blue.Medium);
                                                c.Item().Text(x => { x.Span("Assessor: ").Bold().FontSize(9); x.Span(plan.AssessorName ?? "N/A").FontSize(9); });
                                                c.Item().Text(x => { x.Span("Assessor Reg #: ").Bold().FontSize(9); x.Span(plan.AssessorNumber ?? "N/A").FontSize(9); });
                                                
                                                if (!string.IsNullOrEmpty(plan.AssessorSignature) && plan.AssessorSignature.StartsWith("data:image"))
                                                {
                                                    try
                                                    {
                                                        var base64Data = plan.AssessorSignature.Split(',')[1];
                                                        var imageBytes = Convert.FromBase64String(base64Data);
                                                        c.Item().PaddingTop(2).Height(30).Image(imageBytes).FitHeight();
                                                    }
                                                    catch { }
                                                }
                                                else if (!string.IsNullOrEmpty(plan.AssessorSignature))
                                                {
                                                    c.Item().Text(plan.AssessorSignature).FontSize(9).Italic();
                                                }
                                            });
                                            
                                            row.RelativeItem().AlignRight().Column(c => {
                                                c.Item().AlignRight().Text("MODERATOR DETAILS").Bold().FontSize(8).FontColor(Colors.Blue.Medium);
                                                c.Item().AlignRight().Text(x => { x.Span("Moderator: ").Bold().FontSize(9); x.Span(plan.ModeratorName ?? "N/A").FontSize(9); });
                                                c.Item().AlignRight().Text(x => { x.Span("Moderator Reg #: ").Bold().FontSize(9); x.Span(plan.ModeratorNumber ?? "N/A").FontSize(9); });
                                                
                                                if (!string.IsNullOrEmpty(plan.ModeratorSignature) && plan.ModeratorSignature.StartsWith("data:image"))
                                                {
                                                    try
                                                    {
                                                        var base64Data = plan.ModeratorSignature.Split(',')[1];
                                                        var imageBytes = Convert.FromBase64String(base64Data);
                                                        c.Item().AlignRight().PaddingTop(2).Height(30).Image(imageBytes).FitHeight();
                                                    }
                                                    catch { }
                                                }
                                                else if (!string.IsNullOrEmpty(plan.ModeratorSignature))
                                                {
                                                    c.Item().AlignRight().Text(plan.ModeratorSignature).FontSize(9).Italic();
                                                }
                                            });
                                        });
                                    }
                                    else
                                    {
                                        usPlanCol.Item().PaddingTop(5).Border(1).Padding(10).AlignCenter().Text("No assessment strategy plan has been recorded for this unit standard.").Italic().FontSize(9);
                                    }
                                });

                                // 6.3 Evidence of Competence
                                col.Item().PaddingTop(20).Text("C. EVIDENCE OF COMPETENCE").FontSize(11).Bold().Underline();
                                
                                // Filter answers for THIS unit standard
                                var usAnswers = answersWithQuestions.Where(a => a.ProjectQualificationUnitStandardId == us.ProjectQualificationUnitStandardId).ToList();

                                if (usAnswers.Any())
                                {
                                    var usGroups = usAnswers
                                        .GroupBy(a => a.Answer.AssessmentType)
                                        .OrderByDescending(g => g.Key == "Formative") // Formative first
                                        .ToList();

                                    foreach (var group in usGroups)
                                    {
                                        col.Item().PaddingTop(10).Background(group.Key == "Formative" ? Colors.Blue.Lighten4 : Colors.Green.Lighten4).Padding(5).Text($"{group.Key.ToUpper()} ASSESSMENTS").FontSize(10).Bold().FontColor(group.Key == "Formative" ? Colors.Blue.Medium : Colors.Green.Medium).AlignCenter();

                                        decimal groupTotalScored = 0;
                                        decimal groupTotalAllocated = 0;

                                        foreach (var item in group)
                                        {
                                            var answer = item.Answer;
                                            var questionText = item.QuestionText;
                                            var allocatedMarks = item.AllocatedMarks;

                                            groupTotalScored += answer.ModeratedMark ?? answer.Mark ?? 0;
                                            groupTotalAllocated += allocatedMarks;

                                            col.Item().PaddingTop(10).Column(ansCol =>
                                            {
                                                // Question Header - Styled like a small sub-header
                                                ansCol.Item().Background(Colors.Grey.Lighten4).PaddingHorizontal(10).PaddingVertical(5).Row(row =>
                                                {
                                                    row.RelativeItem().Column(qTextCol =>
                                                    {
                                                        qTextCol.Item().Text($"Question {answer.QuestionNumber}").Bold().FontSize(10).FontColor(Colors.Blue.Medium);
                                                        qTextCol.Item().Text(questionText).FontSize(9).Italic();
                                                    });
                                                    row.ConstantItem(100).AlignRight().Text($"Marks: {(answer.ModeratedMark ?? answer.Mark ?? 0):0.##} / {allocatedMarks:0.##}").FontSize(10).Bold();
                                                });

                                                if (!string.IsNullOrEmpty(answer.AssessorComments))
                                                {
                                                    ansCol.Item().PaddingHorizontal(10).PaddingTop(5).Text($"Assessor Comments: {answer.AssessorComments}").FontSize(9).Italic().FontColor(Colors.Blue.Medium);
                                                }

                                                // Resolve full path — may be just a filename (new style) or a full absolute path (legacy)
                                                var resolvedPath = !string.IsNullOrEmpty(answer.ScannedDocumentPath) && Path.IsPathRooted(answer.ScannedDocumentPath)
                                                    ? answer.ScannedDocumentPath
                                                    : Path.Combine(_environment.ContentRootPath, "uploads", "assessment-answers", answer.ScannedDocumentPath ?? "");

                                                if (!string.IsNullOrEmpty(resolvedPath) && System.IO.File.Exists(resolvedPath))
                                                {
                                                    // Determine if the file is an image or plain text
                                                    var mimeType = answer.MimeType ?? "";
                                                    var fileExt = Path.GetExtension(resolvedPath).ToLowerInvariant();
                                                    var isImage = mimeType.StartsWith("image/") ||
                                                                  fileExt == ".jpg" || fileExt == ".jpeg" ||
                                                                  fileExt == ".png" || fileExt == ".gif" ||
                                                                  fileExt == ".webp" || fileExt == ".bmp";

                                                    if (isImage)
                                                    {
                                                        try
                                                        {
                                                            var answerBytes = System.IO.File.ReadAllBytes(resolvedPath);
                                                            ansCol.Item().PaddingTop(5).AlignCenter().Image(answerBytes).FitArea();
                                                        }
                                                        catch (Exception imgEx)
                                                        {
                                                            ansCol.Item().PaddingTop(5).Border(1).BorderColor(Colors.Red.Lighten2).Padding(10).AlignCenter()
                                                                .Text($"[Error loading image: {imgEx.Message}]").FontSize(9).FontColor(Colors.Red.Medium).Italic();
                                                        }
                                                    }
                                                    else
                                                    {
                                                        // Plain text answer (typed via web portal)
                                                        var textContent = System.IO.File.ReadAllText(resolvedPath);
                                                        ansCol.Item().PaddingTop(5)
                                                            .Border(1).BorderColor(Colors.Grey.Lighten2)
                                                            .Background(Colors.Grey.Lighten5)
                                                            .Padding(12)
                                                            .Column(txtCol =>
                                                            {
                                                                txtCol.Item()
                                                                    .Text("Typed Answer:")
                                                                    .FontSize(8).Bold().FontColor(Colors.Grey.Darken1);
                                                                txtCol.Item().PaddingTop(4)
                                                                    .Text(textContent)
                                                                    .FontSize(10);
                                                            });
                                                    }
                                                }
                                                else
                                                {
                                                    // File missing on disk — show placeholder so POE still renders
                                                    ansCol.Item().PaddingTop(5).Background(Colors.Grey.Lighten4).Border(1).BorderColor(Colors.Grey.Lighten2)
                                                        .Padding(15).AlignCenter().Column(missing => {
                                                            missing.Item().AlignCenter().Text("📄").FontSize(24);
                                                            missing.Item().PaddingTop(5).AlignCenter().Text("Evidence document not available on this server.").FontSize(9).Italic().FontColor(Colors.Grey.Darken1);
                                                            missing.Item().AlignCenter().Text($"File: {answer.ScannedDocumentName}").FontSize(8).FontColor(Colors.Grey.Medium);
                                                        });
                                                }
                                                
                                                ansCol.Item().PaddingVertical(5).LineHorizontal(1f).LineColor(Colors.Grey.Lighten2);
                                            });
                                        }

                                        // Group Summary for this US
                                        var status = groupTotalScored >= (groupTotalAllocated / 2) ? "PASSED" : "NOT YET COMPETENT";
                                        var statusColor = groupTotalScored >= (groupTotalAllocated / 2) ? Colors.Green.Medium : Colors.Red.Medium;

                                        col.Item().PaddingTop(10).Background(Colors.Grey.Lighten4).Padding(8).Row(row =>
                                        {
                                            row.RelativeItem().Text($"{group.Key} Total Marks:").Bold().FontSize(11);
                                            row.RelativeItem().AlignCenter().Text($"{groupTotalScored:0.##} / {groupTotalAllocated:0.##}").Bold().FontSize(11);
                                            row.RelativeItem().AlignRight().Text(status).Bold().FontColor(statusColor).FontSize(11);
                                        });
                                    }
                                }
                                else
                                {
                                    col.Item().PaddingTop(10).Border(1).Padding(15).AlignCenter().Text("No evidence of competence has been uploaded for this unit standard.").Italic().FontSize(10);
                                }
                            }
                        });

                        // Footer on every page
                        page.Footer().Column(footerCol => {
                            footerCol.Item().Row(row =>
                            {
                                // Learner Section (Left)
                                row.RelativeItem().Column(c => {
                                    if (!string.IsNullOrEmpty(learner.SignaturePath) && System.IO.File.Exists(learner.SignaturePath))
                                    {
                                        try 
                                        { 
                                            var sigBytes = System.IO.File.ReadAllBytes(learner.SignaturePath);
                                            if (sigBytes.Length > 0)
                                                c.Item().Height(25).Width(80).Image(sigBytes); 
                                        } 
                                        catch (Exception sigEx) 
                                        {
                                            System.IO.File.AppendAllText(Path.Combine(_environment.ContentRootPath, "poe_error.log"), $"Signature error: {sigEx.Message}\n");
                                        }
                                    }
                                    else
                                    {
                                        c.Item().Height(25).Width(80).BorderBottom(1).PaddingBottom(2);
                                    }
                                    c.Item().Text($"{initials} (Learner Initials)").FontSize(7).Italic();
                                });

                                // Assessor Section (Center)
                                row.RelativeItem().AlignCenter().Column(c => {
                                    if (firstPlan != null && !string.IsNullOrEmpty(firstPlan.AssessorSignature) && firstPlan.AssessorSignature.StartsWith("data:image"))
                                    {
                                        try
                                        {
                                            var base64Data = firstPlan.AssessorSignature.Split(',')[1];
                                            var imageBytes = Convert.FromBase64String(base64Data);
                                            c.Item().AlignCenter().Height(25).Width(80).Image(imageBytes).FitHeight();
                                        }
                                        catch { c.Item().AlignCenter().Height(25).Width(80).BorderBottom(1); }
                                    }
                                    else
                                    {
                                        c.Item().AlignCenter().Height(25).Width(80).BorderBottom(1);
                                    }
                                    c.Item().AlignCenter().Text($"{(string.IsNullOrEmpty(assessorInitials) ? "Assessor" : assessorInitials)} Initials").FontSize(7).Italic();
                                });

                                // Moderator Section (Right)
                                row.RelativeItem().AlignRight().Column(c => {
                                    if (firstModeratorPlan != null && !string.IsNullOrEmpty(firstModeratorPlan.ModeratorSignature) && firstModeratorPlan.ModeratorSignature.StartsWith("data:image"))
                                    {
                                        try
                                        {
                                            var base64Data = firstModeratorPlan.ModeratorSignature.Split(',')[1];
                                            var imageBytes = Convert.FromBase64String(base64Data);
                                            c.Item().AlignRight().Height(25).Width(80).Image(imageBytes).FitHeight();
                                        }
                                        catch { c.Item().AlignRight().Height(25).Width(80).BorderBottom(1); }
                                    }
                                    else
                                    {
                                        c.Item().AlignRight().Height(25).Width(80).BorderBottom(1);
                                    }
                                    c.Item().AlignRight().Text($"{(string.IsNullOrEmpty(moderatorInitials) ? "Moderator" : moderatorInitials)} Initials").FontSize(7).Italic();
                                });
                            });

                            footerCol.Item().PaddingTop(5).Row(row => {
                                row.RelativeItem().Text(x => {
                                    x.Span("Page ");
                                    x.CurrentPageNumber();
                                    x.Span(" of ");
                                    x.TotalPages();
                                });
                                
                                row.RelativeItem().AlignRight().Text($"POE Compiled: {DateTime.Now:yyyy-MM-dd HH:mm}").FontSize(8).Italic();
                            });
                        });
                    });
                });

                using (var stream = new MemoryStream())
                {
                    var logPath = Path.Combine(_environment.ContentRootPath, "poe_error.log");
                    System.IO.File.AppendAllText(logPath, $"[{DateTime.Now}] Starting PDF generation for learner {learnerId}\n");
                    System.IO.File.AppendAllText(logPath, $"Qualification: {qualificationName} | Pathway: {pathwayName}\n");
                    System.IO.File.AppendAllText(logPath, $"UnitStandards: {unitStandards.Count} | Answers: {allAnswers.Count} | StrategyPlans: {strategyPlans.Count}\n");
                    System.IO.File.AppendAllText(logPath, $"IDDocBytes: {(idDocBytes!=null?idDocBytes.Length:0)} | QualDocBytes: {(qualDocBytes!=null?qualDocBytes.Length:0)}\n");
                    
                    pdf.GeneratePdf(stream);
                    
                    System.IO.File.AppendAllText(logPath, $"[{DateTime.Now}] PDF generated successfully for learner {learnerId}\n");

                    var fileName = $"POE_{learner.FirstName}_{learner.LastName}_{DateTime.Now:yyyyMMdd}.pdf";
                    // Sanitize filename
                    foreach (var c in Path.GetInvalidFileNameChars())
                    {
                        fileName = fileName.Replace(c, '_');
                    }

                    return File(stream.ToArray(), "application/pdf", fileName);
                }
            }
            catch (Exception ex)
            {
                var logPath = Path.Combine(_environment.ContentRootPath, "poe_error.log");
                var errorMsg = $"[{DateTime.Now}] Error compiling POE for learner {learnerId}:\n{ex.Message}\n{ex.StackTrace}\n\n";
                System.IO.File.AppendAllText(logPath, errorMsg);
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
    }
}
