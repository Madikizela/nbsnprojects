using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using backend.Models;
using System.Security.Claims;
using System.Text.Json;
using QuestDocument = QuestPDF.Fluent.Document;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DocumentGeneratorController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<DocumentGeneratorController> _logger;
        private readonly IWebHostEnvironment _environment;

        public DocumentGeneratorController(ApplicationDbContext context, ILogger<DocumentGeneratorController> logger, IWebHostEnvironment environment)
        {
            _context = context;
            _logger = logger;
            _environment = environment;
        }

        // GET: api/DocumentGenerator
        [HttpGet]
        public async Task<IActionResult> GetDocuments([FromQuery] string? type = null)
        {
            var query = _context.GeneratedDocuments.AsQueryable();
            if (!string.IsNullOrWhiteSpace(type)) query = query.Where(d => d.DocumentType == type);
            var docs = await query
                .OrderByDescending(d => d.GeneratedAt)
                .Select(d => new { d.Id, d.DocumentType, d.DocumentTitle, d.ReferenceNumber, d.ClientName, d.GeneratedAt, d.Status })
                .ToListAsync();
            return Ok(docs);
        }

        // GET: api/DocumentGenerator/{id}/download
        [HttpGet("{id}/download")]
        public async Task<IActionResult> Download(int id)
        {
            var doc = await _context.GeneratedDocuments.FindAsync(id);
            if (doc == null) return NotFound();
            if (string.IsNullOrEmpty(doc.PdfBase64))
                return NotFound(new { message = "PDF not available for this document." });

            var bytes = Convert.FromBase64String(doc.PdfBase64);
            var filename = $"{doc.ReferenceNumber.Replace("/", "-")}_{doc.DocumentType}.pdf";
            return File(bytes, "application/pdf", filename);
        }

        // POST: api/DocumentGenerator/quotation
        [HttpPost("quotation")]
        public async Task<IActionResult> GenerateQuotation([FromBody] QuotationFormData data)
        {
            try
            {
                var refNo = $"NBSN-Q-{DateTime.UtcNow:yyyy}-{data.QuoteNumber:D3}";
                var pdfBytes = GenerateQuotationPdf(data, refNo);
                var base64  = Convert.ToBase64String(pdfBytes);

                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var doc = new GeneratedDocument
                {
                    DocumentType     = "QUOTATION",
                    DocumentTitle    = $"Quotation — {data.ClientOrganisation}",
                    ReferenceNumber  = refNo,
                    ClientName       = data.ClientName,
                    FormDataJson     = JsonSerializer.Serialize(data),
                    PdfBase64        = base64,
                    GeneratedByUserId = userId != null ? int.Parse(userId) : null,
                    GeneratedAt      = DateTime.UtcNow,
                    Status           = "Draft"
                };
                _context.GeneratedDocuments.Add(doc);
                await _context.SaveChangesAsync();

                return Ok(new { id = doc.Id, referenceNumber = refNo, message = "Quotation generated successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating quotation");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // POST: api/DocumentGenerator/sla
        [HttpPost("sla")]
        public async Task<IActionResult> GenerateSLA([FromBody] SLAFormData data)
        {
            try
            {
                var refNo = $"SLA/NBSN/{data.ClientName.ToUpper().Replace(" ", "")}/{DateTime.UtcNow:yyyy}/{data.SlaNumber:D3}";
                var pdfBytes = GenerateSLAPdf(data, refNo);
                var base64  = Convert.ToBase64String(pdfBytes);

                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var doc = new GeneratedDocument
                {
                    DocumentType     = "SLA",
                    DocumentTitle    = $"SLA — {data.ClientName}",
                    ReferenceNumber  = refNo,
                    ClientName       = data.ClientName,
                    FormDataJson     = JsonSerializer.Serialize(data),
                    PdfBase64        = base64,
                    GeneratedByUserId = userId != null ? int.Parse(userId) : null,
                    GeneratedAt      = DateTime.UtcNow,
                    Status           = "Draft"
                };
                _context.GeneratedDocuments.Add(doc);
                await _context.SaveChangesAsync();

                return Ok(new { id = doc.Id, referenceNumber = refNo, message = "SLA generated successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating SLA");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // PUT: api/DocumentGenerator/{id}/status
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateDocStatusRequest req)
        {
            var doc = await _context.GeneratedDocuments.FindAsync(id);
            if (doc == null) return NotFound();
            doc.Status = req.Status;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Status updated." });
        }

        // DELETE: api/DocumentGenerator/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var doc = await _context.GeneratedDocuments.FindAsync(id);
            if (doc == null) return NotFound();
            _context.GeneratedDocuments.Remove(doc);
            await _context.SaveChangesAsync();
            return Ok();
        }

        // ── PDF Generation ────────────────────────────────────────────────────

        private string GetLogoPath()
        {
            // Try multiple known locations
            var paths = new[]
            {
                Path.Combine(_environment.ContentRootPath, "..", "frontend", "src", "assets", "nbsn-logo.png"),
                Path.Combine(_environment.ContentRootPath, "wwwroot", "nbsn-logo.png"),
                Path.Combine(Directory.GetCurrentDirectory(), "..", "frontend", "src", "assets", "nbsn-logo.png"),
            };
            return paths.FirstOrDefault(System.IO.File.Exists) ?? "";
        }

        private byte[] GenerateQuotationPdf(QuotationFormData d, string refNo)
        {
            var quoteDate  = d.QuoteDate  ?? DateTime.Now.ToString("dd MMMM yyyy");
            var validUntil = d.ValidUntil ?? DateTime.Now.AddDays(30).ToString("dd MMMM yyyy");
            var logoPath   = GetLogoPath();

            // Colour palette matching the screenshot
            const string navyDark  = "#0d2240";   // dark navy for headers
            const string tealDark  = "#0d7377";   // teal for section headings
            const string tealLight = "#e0f4f4";   // light teal for prepared-for bg
            const string greyBg    = "#f1f5f9";   // grey for prepared-by bg
            const string bodyText  = "#1e293b";
            const string mutedText = "#64748b";

            return QuestDocument.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.MarginHorizontal(45);
                    page.MarginVertical(36);
                    page.DefaultTextStyle(x => x.FontSize(10).FontFamily("Arial").FontColor(bodyText));

                    // ── Header ────────────────────────────────────────────────
                    page.Header().Column(col =>
                    {
                        col.Item().Row(row =>
                        {
                            // Logo + NBSN PROJECTS wordmark
                            row.RelativeItem().Row(logoRow =>
                            {
                                if (!string.IsNullOrEmpty(logoPath))
                                {
                                    logoRow.ConstantItem(60).Image(logoPath).FitArea();
                                    logoRow.ConstantItem(8);
                                }
                                logoRow.RelativeItem().Column(c =>
                                {
                                    c.Item().Text("NBSN").FontSize(26).Bold().FontColor(navyDark);
                                    c.Item().Text("PROJECTS").FontSize(10).Bold().FontColor(tealDark).LetterSpacing(0.15f);
                                });
                            });

                            // QUOTATION title + ref
                            row.RelativeItem().AlignRight().Column(c =>
                            {
                                c.Item().Text("QUOTATION").FontSize(28).Bold().FontColor(navyDark);
                                c.Item().AlignRight().Text($"Quote No: {refNo}").FontSize(9).FontColor(mutedText);
                            });
                        });

                        col.Item().PaddingTop(10).LineHorizontal(2).LineColor(tealDark);
                        col.Item().PaddingTop(2).LineHorizontal(0.4f).LineColor(tealDark);
                    });

                    // ── Content ───────────────────────────────────────────────
                    page.Content().PaddingTop(18).Column(col =>
                    {
                        // ── Prepared For / By boxes ──────────────────────────
                        col.Item().Row(row =>
                        {
                            // Prepared FOR
                            row.RelativeItem().Border(0.5f).BorderColor("#cbd5e1").Column(c =>
                            {
                                c.Item().Background(tealLight).Padding(8).Text("PREPARED FOR")
                                    .FontSize(8).Bold().FontColor(tealDark).LetterSpacing(0.1f);
                                c.Item().Padding(10).Column(inner =>
                                {
                                    inner.Item().Text(string.IsNullOrWhiteSpace(d.ClientName) ? "[Client Name]" : d.ClientName)
                                        .Bold().FontSize(12).FontColor(navyDark);
                                    inner.Item().PaddingTop(2).Text(string.IsNullOrWhiteSpace(d.ClientOrganisation) ? "[Client Organisation]" : d.ClientOrganisation)
                                        .FontColor(bodyText);
                                    inner.Item().Text(string.IsNullOrWhiteSpace(d.ClientContact) ? "[Client Email / Phone]" : d.ClientContact)
                                        .FontColor(bodyText);
                                    if (!string.IsNullOrWhiteSpace(d.OrganisationType))
                                    {
                                        inner.Item().PaddingTop(6).Text($"Organisation type:   {d.OrganisationType}").FontSize(9).FontColor(mutedText);
                                    }
                                    if (!string.IsNullOrWhiteSpace(d.TrainingCentres))
                                    {
                                        inner.Item().Text($"Training centre(s):  {d.TrainingCentres}").FontSize(9).FontColor(mutedText);
                                    }
                                    if (d.EstimatedLearners.HasValue)
                                    {
                                        inner.Item().Text($"Estimated learners:  {d.EstimatedLearners}").FontSize(9).FontColor(mutedText);
                                    }
                                });
                            });

                            row.ConstantItem(10);

                            // Prepared BY
                            row.RelativeItem().Border(0.5f).BorderColor("#cbd5e1").Column(c =>
                            {
                                c.Item().Background(greyBg).Padding(8).Text("PREPARED BY")
                                    .FontSize(8).Bold().FontColor(tealDark).LetterSpacing(0.1f);
                                c.Item().Padding(10).Column(inner =>
                                {
                                    inner.Item().Text("Sbusiso Madikizela").Bold().FontSize(12).FontColor(navyDark);
                                    inner.Item().PaddingTop(2).Text("NBSN Projects");
                                    inner.Item().Text("Durban, KwaZulu-Natal, South Africa");
                                    inner.Item().Text("info@nbsnprojects.co.za  |  0733904588");
                                    inner.Item().Text("www.nbsnprojects.co.za");
                                });
                            });
                        });

                        // ── Metadata table (Quote Date / Valid Until / Currency / System) ──
                        col.Item().PaddingTop(14).Table(table =>
                        {
                            table.ColumnsDefinition(c => { c.RelativeColumn(); c.RelativeColumn(); c.RelativeColumn(); c.RelativeColumn(); });
                            foreach (var h in new[] { "Quote Date", "Valid Until", "Currency", "System" })
                                table.Cell().Background(navyDark).Padding(7).Text(h).Bold().FontColor("#ffffff").FontSize(9);

                            foreach (var v in new[]
                            {
                                quoteDate,
                                validUntil,
                                "South African Rand (ZAR)",
                                d.SystemName ?? "Training Management & Compliance System"
                            })
                                table.Cell().Border(0.4f).BorderColor("#e2e8f0").Padding(7).Text(v).FontSize(9);
                        });

                        // ── Section helper ───────────────────────────────────
                        void Section(string number, string title, System.Action<QuestPDF.Infrastructure.IContainer> body)
                        {
                            col.Item().PaddingTop(16).Column(sc =>
                            {
                                sc.Item().Row(r =>
                                {
                                    r.ConstantItem(2).Background(tealDark);
                                    r.ConstantItem(6);
                                    r.RelativeItem().Text($"{number}. {title}").Bold().FontSize(12).FontColor(tealDark);
                                });
                                sc.Item().PaddingTop(2).LineHorizontal(0.5f).LineColor(tealDark);
                                sc.Item().PaddingTop(6).Element(body);
                            });
                        }

                        // ── 1. Overview ───────────────────────────────────────
                        Section("1", "Overview", c =>
                            c.Text(d.ProjectOverview ??
                                "NBSN Projects is pleased to submit this quotation for its Training Management & Compliance System. " +
                                "The platform is designed to help training providers and skills development organisations manage learner " +
                                "records, attendance evidence, portfolios of evidence (POEs), supporting documents and compliance " +
                                "reporting in one secure system.").FontSize(10).FontColor(bodyText));

                        // ── 2. Proposed System Scope ──────────────────────────
                        Section("2", "Proposed System Scope", c =>
                        {
                            var scopeItems = d.ScopeItems ?? new List<ScopeItem>
                            {
                                new() { Area = "Learner Management", Description = "Register and manage learner records, ID verification, enrolment tracking and profile management." },
                                new() { Area = "Attendance Management", Description = "Biometric and manual attendance capture, geolocation clocking, offline sync and attendance calendars." },
                                new() { Area = "Portfolio of Evidence (POE)", Description = "Compile, manage and export learner portfolios of evidence per qualification and unit standard." },
                                new() { Area = "Assessments & Moderation", Description = "Formative and summative assessments, marking, moderation workflow and competency tracking." },
                                new() { Area = "Document Management", Description = "Encrypted learner document upload, approval workflow and compliance document tracking." },
                                new() { Area = "Reporting & Compliance", Description = "Funder reports, attendance exports, stipend schedules, QA overview and document compliance reports." },
                                new() { Area = "Mobile Application", Description = "Flutter mobile app for teachers and field staff with offline capability, biometric clocking and document scanning." },
                                new() { Area = "Learner Portal", Description = "Self-service portal for learners to view attendance, upload documents, complete assessments and track progress." },
                            };
                            c.Table(table =>
                            {
                                table.ColumnsDefinition(tc => { tc.ConstantColumn(160); tc.RelativeColumn(); });
                                table.Header(header =>
                                {
                                    header.Cell().Background(navyDark).Padding(7).Text("FUNCTIONAL AREA").Bold().FontColor("#ffffff").FontSize(9);
                                    header.Cell().Background(navyDark).Padding(7).Text("DESCRIPTION").Bold().FontColor("#ffffff").FontSize(9);
                                });
                                for (int i = 0; i < scopeItems.Count; i++)
                                {
                                    var bg = i % 2 == 0 ? "#f8fafc" : "#ffffff";
                                    table.Cell().Background(bg).Border(0.3f).BorderColor("#e2e8f0").Padding(7)
                                        .Text(scopeItems[i].Area).Bold().FontSize(9).FontColor(navyDark);
                                    table.Cell().Background(bg).Border(0.3f).BorderColor("#e2e8f0").Padding(7)
                                        .Text(scopeItems[i].Description).FontSize(9).FontColor(bodyText);
                                }
                            });
                        });

                        // ── 3. Pricing ────────────────────────────────────────
                        Section("3", "Pricing", c =>
                        {
                            var items = d.LineItems ?? new List<QuotationLineItem>
                            {
                                new() { Description = "System setup, configuration and customisation", Amount = 5000 },
                                new() { Description = "Learner management and enrolment module", Amount = 3000 },
                                new() { Description = "Attendance management (biometric + manual)", Amount = 3500 },
                                new() { Description = "POE compilation and document management", Amount = 3000 },
                                new() { Description = "Assessments, marking and moderation", Amount = 3000 },
                                new() { Description = "Reporting, compliance exports and dashboards", Amount = 2500 },
                                new() { Description = "Mobile application (teacher + field staff)", Amount = 4000 },
                                new() { Description = "Learner self-service portal", Amount = 2500 },
                                new() { Description = "Training, onboarding and user guides", Amount = 2000 },
                                new() { Description = "12-month hosting, maintenance and support", Amount = 6000 },
                            };
                            var total = items.Sum(x => x.Amount);
                            c.Table(table =>
                            {
                                table.ColumnsDefinition(tc => { tc.ConstantColumn(30); tc.RelativeColumn(); tc.ConstantColumn(110); });
                                table.Header(header =>
                                {
                                    header.Cell().Background(navyDark).Padding(7).Text("#").Bold().FontColor("#ffffff").FontSize(9);
                                    header.Cell().Background(navyDark).Padding(7).Text("DESCRIPTION").Bold().FontColor("#ffffff").FontSize(9);
                                    header.Cell().Background(navyDark).Padding(7).Text("AMOUNT (ZAR)").Bold().FontColor("#ffffff").FontSize(9);
                                });
                                for (int i = 0; i < items.Count; i++)
                                {
                                    var bg = i % 2 == 0 ? "#f8fafc" : "#ffffff";
                                    table.Cell().Background(bg).Border(0.3f).BorderColor("#e2e8f0").Padding(7).Text($"{i + 1}").FontSize(9);
                                    table.Cell().Background(bg).Border(0.3f).BorderColor("#e2e8f0").Padding(7).Text(items[i].Description).FontSize(9);
                                    table.Cell().Background(bg).Border(0.3f).BorderColor("#e2e8f0").Padding(7)
                                        .Text($"R {items[i].Amount:N2}").FontSize(9);
                                }
                                table.Cell().ColumnSpan(2).Background(tealDark).Padding(7)
                                    .Text("TOTAL (excl. VAT)").Bold().FontColor("#ffffff").FontSize(10);
                                table.Cell().Background(tealDark).Padding(7)
                                    .Text($"R {total:N2}").Bold().FontColor("#ffffff").FontSize(10);
                            });
                            c.PaddingTop(6).Text("All amounts in South African Rand and exclude VAT.").FontSize(9).FontColor(mutedText).Italic();
                        });

                        // ── 4. Payment Terms ──────────────────────────────────
                        Section("4", "Payment Terms", c =>
                            c.Text(d.PaymentTerms ?? "50% deposit on acceptance of this quotation. 50% balance on delivery and sign-off.\nPayment by EFT. Banking details will appear on the invoice.")
                                .FontSize(10).FontColor(bodyText));

                        // ── 5. Delivery Timeline ──────────────────────────────
                        Section("5", "Delivery Timeline", c =>
                            c.Text(d.DeliveryTimeline ?? "The system will be deployed and ready for use within 10–15 working days of receiving the signed quotation and deposit payment.")
                                .FontSize(10).FontColor(bodyText));

                        // ── Acceptance / Signatures ───────────────────────────
                        col.Item().PaddingTop(20).LineHorizontal(1).LineColor(navyDark);
                        col.Item().PaddingTop(12).Row(row =>
                        {
                            row.RelativeItem().Column(c =>
                            {
                                c.Item().Text("FOR NBSN PROJECTS").Bold().FontSize(9).FontColor(tealDark);
                                c.Item().PaddingTop(18).Text("Signature: _________________________").FontSize(9);
                                c.Item().PaddingTop(4).Text("Name: Sbusiso Madikizela").FontSize(9);
                                c.Item().PaddingTop(4).Text($"Date: {DateTime.Now:dd/MM/yyyy}").FontSize(9);
                                c.Item().PaddingTop(4).Text("Stamp:").FontSize(9);
                            });
                            row.ConstantItem(40);
                            row.RelativeItem().Column(c =>
                            {
                                c.Item().Text("ACCEPTED BY CLIENT").Bold().FontSize(9).FontColor(tealDark);
                                c.Item().PaddingTop(18).Text("Signature: _________________________").FontSize(9);
                                c.Item().PaddingTop(4).Text($"Name: {(string.IsNullOrWhiteSpace(d.ClientName) ? "______________________" : d.ClientName)}").FontSize(9);
                                c.Item().PaddingTop(4).Text("Title: ______________________").FontSize(9);
                                c.Item().PaddingTop(4).Text("Date: ______________________").FontSize(9);
                            });
                        });
                        col.Item().PaddingTop(14).AlignCenter()
                            .Text("Thank you for the opportunity to work with you.")
                            .Italic().FontColor(mutedText).FontSize(9);
                    });

                    // ── Footer ────────────────────────────────────────────────
                    page.Footer().Column(fc =>
                    {
                        fc.Item().LineHorizontal(0.5f).LineColor("#cbd5e1");
                        fc.Item().PaddingTop(4).Row(row =>
                        {
                            row.RelativeItem().Text("NBSN Projects  |  info@nbsnprojects.co.za  |  0733904588  |  www.nbsnprojects.co.za")
                                .FontSize(8).FontColor(mutedText);
                            row.AutoItem().Text(txt =>
                            {
                                txt.Span("Page ").FontSize(8).FontColor(mutedText);
                                txt.CurrentPageNumber().FontSize(8).FontColor(mutedText);
                                txt.Span(" of ").FontSize(8).FontColor(mutedText);
                                txt.TotalPages().FontSize(8).FontColor(mutedText);
                            });
                        });
                    });
                });
            }).GeneratePdf();
        }

        private static byte[] GenerateSLAPdf(SLAFormData d, string refNo)
        {
            var effectiveDate = d.EffectiveDate ?? DateTime.Now.ToString("dd MMMM yyyy");

            return QuestDocument.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(40);
                    page.DefaultTextStyle(x => x.FontSize(10).FontFamily("Arial"));

                    page.Header().Column(col =>
                    {
                        col.Item().Row(row =>
                        {
                            row.RelativeItem().Column(c =>
                            {
                                c.Item().Text("SERVICE LEVEL AGREEMENT").FontSize(18).Bold().FontColor("#0d9488");
                                c.Item().Text("NBSN PROJECT — Learner Management System").FontSize(10).FontColor("#475569");
                            });
                            row.RelativeItem().AlignRight().Column(c =>
                            {
                                c.Item().Text("NBSN PROJECTS").Bold().FontSize(12);
                                c.Item().Text(refNo).FontSize(9).FontColor("#64748b");
                                c.Item().Text($"Version {d.Version ?? "1.0"}").FontSize(9).FontColor("#64748b");
                            });
                        });
                        col.Item().PaddingTop(8).LineHorizontal(1.5f).LineColor("#0d9488");
                    });

                    page.Content().PaddingTop(16).Column(col =>
                    {
                        // Agreement details box
                        col.Item().Background("#f0fdfa").Padding(12).Table(table =>
                        {
                            table.ColumnsDefinition(c => { c.RelativeColumn(); c.RelativeColumn(); });
                            void Row(string label, string value)
                            {
                                table.Cell().Padding(4).Text(label).Bold().FontSize(9).FontColor("#0d9488");
                                table.Cell().Padding(4).Text(value).FontSize(9);
                            }
                            Row("Client", d.ClientName);
                            Row("Supplier", "NBSN PROJECTS");
                            Row("Effective Date", effectiveDate);
                            Row("Initial Term", d.InitialTerm ?? "12 months");
                            Row("Agreement Reference", refNo);
                            Row("Version", d.Version ?? "1.0");
                        });

                        // Agreement particulars
                        col.Item().PaddingTop(14).Text("Agreement Particulars").Bold().FontSize(11).FontColor("#0f172a");
                        col.Item().PaddingTop(6).Column(c =>
                        {
                            void Detail(string label, string value) =>
                                c.Item().Text($"{label}: {value}").FontSize(9).FontColor("#475569");
                            Detail("Supplier legal name", "NBSN PROJECTS");
                            Detail("Supplier address", "Durban, KwaZulu-Natal, South Africa");
                            Detail("Supplier service owner", "Sbusiso Madikizela — info@nbsnprojects.co.za");
                            Detail("Client legal name", d.ClientName);
                            Detail("Client registration number", d.ClientRegistrationNumber ?? "To be inserted");
                            Detail("Client address", d.ClientAddress ?? "As stated in the Order Form");
                            Detail("Client contract owner", d.ClientContractOwner ?? "Client designated representative");
                        });

                        // Key sections
                        void Section(string title, string body)
                        {
                            col.Item().PaddingTop(12).Text(title).Bold().FontSize(11).FontColor("#0f172a");
                            col.Item().PaddingTop(4).Text(body).FontSize(9).FontColor("#475569");
                        }

                        Section("1. Purpose", "This Service Level Agreement records the operational service levels applicable to the Supplier's provision of the NBSN PROJECT Learner Management System to the Client. It supplements the SaaS Subscription and Software Licence Agreement signed by the parties.");

                        Section("2. Availability Commitment", "The Supplier targets monthly availability of 99.5% for the Production Service, measured 24/7 per Service Month. Planned maintenance window: Sundays 20:00–23:00 SAST with at least 48 hours advance notice.");

                        Section("3. Support Service", "P1 Critical: 30-minute response, 4-hour resolution target, 24/7.\nP2 High: 2-business-hour response, 1 Business Day resolution.\nP3 Medium: 4-business-hour response, 3 Business Days resolution.\nP4 Low: 1 Business Day response, 5 Business Days resolution.\nLog incidents to: info@nbsnprojects.co.za");

                        Section("4. Backup and Recovery", $"Daily full database backups. Document backup: daily. Retention: 30 days rolling. Encryption: TLS 1.2+ in transit, AES-256 at rest. Target RPO: 24 hours. Target RTO: 8 hours. Hosting region: South Africa.");

                        Section("5. Subscription and Fees", $"Subscription package: {d.SubscriptionPackage ?? "As per Order Form"}\nMonthly fee: {d.MonthlyFee ?? "As per Order Form"}\nImplementation fee: {d.ImplementationFee ?? "As per Order Form"}\nPayment terms: Net 30 days.");

                        Section("6. Data and POPIA", "The Client acts as Responsible Party for Client Data and the Supplier acts as Operator under POPIA. Client Data remains owned by the Client. The Supplier will not share or use Client Data for any purpose beyond providing the agreed services.");

                        Section("7. Term and Renewal", $"This SLA begins on {effectiveDate} for an initial term of {d.InitialTerm ?? "12 months"}, then renews automatically for successive 12-month periods unless either party gives 60 days' written notice of non-renewal.");

                        // Schedules summary
                        col.Item().PaddingTop(14).Text("Schedules Forming Part of This SLA").Bold().FontSize(11).FontColor("#0f172a");
                        col.Item().PaddingTop(4).Text("Schedule A — Selected Services and Subscription Scope\nSchedule B — Charges and Payment Terms\nSchedule C — Support Contacts and Escalation Matrix\nSchedule D — Data Processing and Security Details").FontSize(9).FontColor("#475569");

                        if (!string.IsNullOrWhiteSpace(d.AdditionalClauses))
                        {
                            Section("Additional Agreed Clauses", d.AdditionalClauses);
                        }

                        // Signatures
                        col.Item().PaddingTop(20).LineHorizontal(0.5f).LineColor("#e2e8f0");
                        col.Item().PaddingTop(10).Text("Acceptance and Signatures").Bold().FontSize(11).FontColor("#0d9488");
                        col.Item().PaddingTop(8).Row(row =>
                        {
                            row.RelativeItem().Column(c =>
                            {
                                c.Item().Text("FOR THE SUPPLIER — NBSN PROJECTS").Bold().FontSize(9).FontColor("#0d9488");
                                c.Item().PaddingTop(14).Text("Signature: _______________________").FontSize(9);
                                c.Item().PaddingTop(4).Text("Name: Sbusiso Madikizela").FontSize(9);
                                c.Item().PaddingTop(4).Text("Title: Lead Developer").FontSize(9);
                                c.Item().PaddingTop(4).Text($"Date: {DateTime.Now:dd/MM/yyyy}").FontSize(9);
                                c.Item().PaddingTop(4).Text("Place: Durban, KwaZulu-Natal").FontSize(9);
                            });
                            row.ConstantItem(32);
                            row.RelativeItem().Column(c =>
                            {
                                c.Item().Text($"FOR THE CLIENT — {d.ClientName.ToUpper()}").Bold().FontSize(9).FontColor("#0d9488");
                                c.Item().PaddingTop(14).Text("Signature: _______________________").FontSize(9);
                                c.Item().PaddingTop(4).Text($"Name: {d.ClientContractOwner ?? "____________________"}").FontSize(9);
                                c.Item().PaddingTop(4).Text("Title: ______________________").FontSize(9);
                                c.Item().PaddingTop(4).Text("Date: ______________________").FontSize(9);
                                c.Item().PaddingTop(4).Text("Place: ______________________").FontSize(9);
                            });
                        });
                    });

                    page.Footer().AlignCenter().Text(txt =>
                    {
                        txt.Span($"NBSN Projects  |  {refNo}  |  ").FontColor("#94a3b8").FontSize(8);
                        txt.CurrentPageNumber().FontColor("#94a3b8").FontSize(8);
                        txt.Span(" / ").FontColor("#94a3b8").FontSize(8);
                        txt.TotalPages().FontColor("#94a3b8").FontSize(8);
                    });
                });
            }).GeneratePdf();
        }
    }

    // ── DTOs ──────────────────────────────────────────────────────────────────

    public class QuotationLineItem
    {
        public string Description { get; set; } = string.Empty;
        public decimal Amount { get; set; }
    }

    public class ScopeItem
    {
        public string Area { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }

    public class QuotationFormData
    {
        public int QuoteNumber { get; set; } = 1;
        public string ClientName { get; set; } = string.Empty;
        public string ClientOrganisation { get; set; } = string.Empty;
        public string ClientContact { get; set; } = string.Empty;
        public string? OrganisationType { get; set; }
        public string? TrainingCentres { get; set; }
        public int? EstimatedLearners { get; set; }
        public string? SystemName { get; set; }
        public string? QuoteDate { get; set; }
        public string? ValidUntil { get; set; }
        public string? ProjectOverview { get; set; }
        public string? ScopeOfWork { get; set; }
        public string? PaymentTerms { get; set; }
        public string? DeliveryTimeline { get; set; }
        public List<QuotationLineItem>? LineItems { get; set; }
        public List<ScopeItem>? ScopeItems { get; set; }
    }

    public class SLAFormData
    {
        public int SlaNumber { get; set; } = 1;
        public string ClientName { get; set; } = string.Empty;
        public string? ClientRegistrationNumber { get; set; }
        public string? ClientAddress { get; set; }
        public string? ClientContractOwner { get; set; }
        public string? EffectiveDate { get; set; }
        public string? InitialTerm { get; set; }
        public string? Version { get; set; }
        public string? SubscriptionPackage { get; set; }
        public string? MonthlyFee { get; set; }
        public string? ImplementationFee { get; set; }
        public string? AdditionalClauses { get; set; }
    }

    public class UpdateDocStatusRequest
    {
        public string Status { get; set; } = string.Empty;
    }
}
