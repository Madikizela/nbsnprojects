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

        // GET: api/DocumentGenerator/sdps  — lightweight SDP list for auto-fill
        [HttpGet("sdps")]
        public async Task<IActionResult> GetSdpList()
        {
            var sdps = await _context.SkillsDevelopmentProviders
                .Where(s => s.Status == SDPStatus.Active)
                .OrderBy(s => s.Name)
                .Select(s => new
                {
                    s.Id,
                    s.Name,
                    s.Address,
                    s.ContactPerson,
                    ContactEmail = s.Users
                        .OrderBy(u => u.Id)
                        .Select(u => u.Email)
                        .FirstOrDefault() ?? "",
                    ContactPhone = s.Users
                        .OrderBy(u => u.Id)
                        .Select(u => u.PhoneNumber)
                        .FirstOrDefault() ?? "",
                })
                .ToListAsync();

            return Ok(sdps);
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

        // POST: api/DocumentGenerator/licence
        [HttpPost("licence")]
        public async Task<IActionResult> GenerateLicence([FromBody] LicenceFormData data)
        {
            try
            {
                var clientCode = data.ClientName.ToUpper().Replace(" ", "").Replace("-", "").Substring(0, Math.Min(8, data.ClientName.Length));
                var refNo = $"NBSN-Projects-{clientCode}-{DateTime.UtcNow:yyyy}-{data.LicenceNumber:D3}";
                var pdfBytes = GenerateLicencePdf(data, refNo);
                var base64   = Convert.ToBase64String(pdfBytes);

                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var doc = new GeneratedDocument
                {
                    DocumentType      = "LICENCE",
                    DocumentTitle     = $"Licence Certificate — {data.ClientName}",
                    ReferenceNumber   = refNo,
                    ClientName        = data.ClientName,
                    FormDataJson      = JsonSerializer.Serialize(data),
                    PdfBase64         = base64,
                    GeneratedByUserId = userId != null ? int.Parse(userId) : null,
                    GeneratedAt       = DateTime.UtcNow,
                    Status            = "Draft"
                };
                _context.GeneratedDocuments.Add(doc);
                await _context.SaveChangesAsync();

                return Ok(new { id = doc.Id, referenceNumber = refNo, message = "Licence certificate generated successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating licence certificate");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // POST: api/DocumentGenerator/invoice
        [HttpPost("invoice")]
        public async Task<IActionResult> GenerateInvoice([FromBody] InvoiceFormData data)
        {
            try
            {
                var refNo = $"INV-NBSN-{DateTime.UtcNow:yyyy}-{data.InvoiceNumber:D4}";
                var pdfBytes = GenerateInvoicePdf(data, refNo);
                var base64   = Convert.ToBase64String(pdfBytes);

                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var doc = new GeneratedDocument
                {
                    DocumentType      = "INVOICE",
                    DocumentTitle     = $"Invoice — {data.BillToName}",
                    ReferenceNumber   = refNo,
                    ClientName        = data.BillToName,
                    FormDataJson      = JsonSerializer.Serialize(data),
                    PdfBase64         = base64,
                    GeneratedByUserId = userId != null ? int.Parse(userId) : null,
                    GeneratedAt       = DateTime.UtcNow,
                    Status            = "Draft"
                };
                _context.GeneratedDocuments.Add(doc);
                await _context.SaveChangesAsync();

                return Ok(new { id = doc.Id, referenceNumber = refNo, message = "Invoice generated successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating invoice");
                return StatusCode(500, new { error = ex.Message });
            }
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

            const string navyDark  = "#0d2240";
            const string tealDark  = "#0d7377";
            const string tealLight = "#e0f4f4";
            const string greyBg    = "#f1f5f9";
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
                            // Logo + wordmark
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
                            row.RelativeItem().Border(0.5f).BorderColor("#cbd5e1").Column(c =>
                            {
                                c.Item().Background(tealLight).Padding(8).Text("PREPARED FOR")
                                    .FontSize(8).Bold().FontColor(tealDark).LetterSpacing(0.1f);
                                c.Item().Padding(10).Column(inner =>
                                {
                                    inner.Item().Text(string.IsNullOrWhiteSpace(d.ClientName) ? "—" : d.ClientName)
                                        .Bold().FontSize(12).FontColor(navyDark);
                                    inner.Item().PaddingTop(2).Text(string.IsNullOrWhiteSpace(d.ClientOrganisation) ? "" : d.ClientOrganisation).FontColor(bodyText);
                                    inner.Item().Text(string.IsNullOrWhiteSpace(d.ClientContact) ? "" : d.ClientContact).FontColor(bodyText);
                                    inner.Item().PaddingTop(6).Text($"Organisation type:   {(string.IsNullOrWhiteSpace(d.OrganisationType) ? "" : d.OrganisationType)}").FontSize(9).FontColor(mutedText);
                                    inner.Item().Text($"Training centre(s):  {(string.IsNullOrWhiteSpace(d.TrainingCentres) ? "" : d.TrainingCentres)}").FontSize(9).FontColor(mutedText);
                                    inner.Item().Text($"Estimated learners:  {(d.EstimatedLearners.HasValue ? d.EstimatedLearners.ToString() : "")}").FontSize(9).FontColor(mutedText);
                                });
                            });
                            row.ConstantItem(10);
                            row.RelativeItem().Border(0.5f).BorderColor("#cbd5e1").Column(c =>
                            {
                                c.Item().Background(greyBg).Padding(8).Text("PREPARED BY")
                                    .FontSize(8).Bold().FontColor(tealDark).LetterSpacing(0.1f);
                                c.Item().Padding(10).Column(inner =>
                                {
                                    inner.Item().Text(d.PreparedByName).Bold().FontSize(12).FontColor(navyDark);
                                    inner.Item().PaddingTop(2).Text(d.PreparedByTitle).FontColor(bodyText);
                                    inner.Item().Text(d.PreparedByCity).FontColor(bodyText);
                                    inner.Item().Text($"{d.PreparedByEmail}  |  {d.PreparedByPhone}").FontColor(bodyText);
                                    inner.Item().Text(d.PreparedByWeb).FontColor(bodyText);
                                });
                            });
                        });

                        // ── Metadata table ────────────────────────────────────
                        col.Item().PaddingTop(14).Table(table =>
                        {
                            table.ColumnsDefinition(c => { c.RelativeColumn(); c.RelativeColumn(); c.RelativeColumn(); c.RelativeColumn(); });
                            foreach (var h in new[] { "Quote Date", "Valid Until", "Currency", "System" })
                                table.Cell().Background(navyDark).Padding(7).Text(h).Bold().FontColor("#ffffff").FontSize(9);
                            foreach (var v in new[] { quoteDate, validUntil, "South African Rand (ZAR)", d.SystemName ?? "Training Management & Compliance System" })
                                table.Cell().Border(0.4f).BorderColor("#e2e8f0").Padding(7).Text(v).FontSize(9);
                        });

                        // ── Section helper ────────────────────────────────────
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

                        // Helper: bullet list
                        void Bullets(QuestPDF.Infrastructure.IContainer c, IEnumerable<string> items)
                        {
                            c.Column(bc =>
                            {
                                foreach (var item in items)
                                    bc.Item().Row(r =>
                                    {
                                        r.ConstantItem(14).Text("•").FontColor(tealDark).Bold();
                                        r.RelativeItem().Text(item).FontSize(10).FontColor(bodyText);
                                    });
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
                                new() { Area = "Learner and programme records",  Description = "Centralised learner profiles and programme-related information." },
                                new() { Area = "Attendance management",          Description = "Digital attendance capture, with fingerprint verification where compatible hardware is selected and configured." },
                                new() { Area = "POE progress tracking",          Description = "Track learner portfolio progress and outstanding evidence." },
                                new() { Area = "Document management",            Description = "Store and manage learner documents and supporting records with role-based access." },
                                new() { Area = "Registers and reports",          Description = "Generate downloadable attendance registers and management/compliance reports." },
                                new() { Area = "Audit support",                  Description = "Organise records and reporting to support internal reviews and audit preparation." },
                            };
                            c.Column(col2 =>
                            {
                                col2.Item().Table(table =>
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
                                col2.Item().PaddingTop(8).Text(
                                    "Final functionality is subject to the agreed configuration, selected hardware model, technical compatibility " +
                                    "testing and implementation scope signed off by both parties.")
                                    .FontSize(9).FontColor(bodyText);
                            });
                        });

                        // ── 3. Software Subscription Packages ────────────────
                        Section("3", "Software Subscription Packages", c =>
                        {
                            c.Column(col2 =>
                            {
                                col2.Item().Text(
                                    "Choose the package aligned to the expected active learner count. These are proposed standard rates and " +
                                    "must be confirmed by NBSN Projects before issuing a client-specific quotation.")
                                    .FontSize(10).FontColor(bodyText);
                                col2.Item().PaddingTop(8).Table(table =>
                                {
                                    table.ColumnsDefinition(tc =>
                                    {
                                        tc.RelativeColumn(2); tc.RelativeColumn(); tc.RelativeColumn(2); tc.RelativeColumn(2); tc.RelativeColumn(3);
                                    });
                                    foreach (var h in new[] { "PACKAGE", "LEARNERS", "SETUP FEE\n(ONCE-OFF)", "SUBSCRIPTION\n(PER MONTH)", "INCLUDED" })
                                        table.Cell().Background(navyDark).Padding(7).Text(h).Bold().FontColor("#ffffff").FontSize(9);
                                    var pkgs = new[]
                                    {
                                        ("Starter",      "30–50",   $"R{d.StarterSetup:N0}",   $"R{d.StarterMonthly:N0}", "Shared cloud hosting; standard remote support"),
                                        ("Growth",       "51–75",   $"R{d.GrowthSetup:N0}",    $"R{d.GrowthMonthly:N0}", "Shared cloud hosting; standard remote support"),
                                        ("Professional", "76–100",  $"R{d.ProSetup:N0}",       $"R{d.ProMonthly:N0}",    "Shared cloud hosting; standard remote support"),
                                    };
                                    for (int i = 0; i < pkgs.Length; i++)
                                    {
                                        var bg = i % 2 == 0 ? "#f8fafc" : "#ffffff";
                                        table.Cell().Background(bg).Border(0.3f).BorderColor("#e2e8f0").Padding(7).Text(pkgs[i].Item1).Bold().FontSize(9).FontColor(navyDark);
                                        table.Cell().Background(bg).Border(0.3f).BorderColor("#e2e8f0").Padding(7).Text(pkgs[i].Item2).FontSize(9);
                                        table.Cell().Background(bg).Border(0.3f).BorderColor("#e2e8f0").Padding(7).Text(pkgs[i].Item3).FontSize(9);
                                        table.Cell().Background(bg).Border(0.3f).BorderColor("#e2e8f0").Padding(7).Text(pkgs[i].Item4).FontSize(9);
                                        table.Cell().Background(bg).Border(0.3f).BorderColor("#e2e8f0").Padding(7).Text(pkgs[i].Item5).FontSize(9);
                                    }
                                });
                                col2.Item().PaddingTop(8).Text(
                                    "Subscription includes access to the configured system, shared cloud hosting and standard remote " +
                                    "technical support. Material increases in learner numbers may require a package adjustment.")
                                    .FontSize(9).FontColor(bodyText);
                            });
                        });

                        // ── 4. Hardware Options ───────────────────────────────
                        Section("4", "Hardware Options", c =>
                        {
                            c.Column(col2 =>
                            {
                                col2.Item().Text(
                                    "Learners will scan fingerprints at a central attendance point at the training centre. Device allocation " +
                                    "depends on learner numbers, arrival patterns and site requirements. One standalone attendance terminal " +
                                    "is the proposed starting point for a typical centre; an additional terminal may be recommended where " +
                                    "queues or throughput require it. NBSN Projects will provide scanners on a rental basis only; outright " +
                                    "scanner purchases are not offered.")
                                    .FontSize(10).FontColor(bodyText);

                                col2.Item().PaddingTop(10).Text("4.1 Rental rates and contract terms")
                                    .Bold().FontSize(10).FontColor(navyDark);
                                col2.Item().PaddingTop(6).Table(table =>
                                {
                                    table.ColumnsDefinition(tc => { tc.RelativeColumn(2); tc.RelativeColumn(2); tc.RelativeColumn(2); tc.RelativeColumn(); });
                                    foreach (var h in new[] { "DEVICE", "MONTHLY RENTAL", "REFUNDABLE\nDEPOSIT", "MINIMUM TERM" })
                                        table.Cell().Background(navyDark).Padding(7).Text(h).Bold().FontColor("#ffffff").FontSize(9);
                                    var devices = new[]
                                    {
                                        ("Futronic FS88H",             d.FutronicMonthly, d.FutronicDeposit, "12 months"),
                                        ("ZKTeco standalone terminal", d.ZKTecoMonthly,   d.ZKTecoDeposit,   "12 months"),
                                    };
                                    for (int i = 0; i < devices.Length; i++)
                                    {
                                        var bg = i % 2 == 0 ? "#f8fafc" : "#ffffff";
                                        table.Cell().Background(bg).Border(0.3f).BorderColor("#e2e8f0").Padding(7).Text(devices[i].Item1).Bold().FontSize(9).FontColor(navyDark);
                                        table.Cell().Background(bg).Border(0.3f).BorderColor("#e2e8f0").Padding(7).Text(devices[i].Item2).FontSize(9);
                                        table.Cell().Background(bg).Border(0.3f).BorderColor("#e2e8f0").Padding(7).Text(devices[i].Item3).FontSize(9);
                                        table.Cell().Background(bg).Border(0.3f).BorderColor("#e2e8f0").Padding(7).Text(devices[i].Item4).FontSize(9);
                                    }
                                });

                                // Compatibility note box
                                col2.Item().PaddingTop(10).Border(0.5f).BorderColor(tealDark)
                                    .BorderLeft(3).Background("#f0fdfa").Padding(10).Column(nb =>
                                    {
                                        nb.Item().Text(txt =>
                                        {
                                            txt.Span("Hardware compatibility note: ").Bold().FontSize(9).FontColor(navyDark);
                                            txt.Span(
                                                "The Futronic FS88H is a USB-connected reader, not a standalone attendance terminal. " +
                                                "The exact ZKTeco model must be selected and tested for integration, attendance-log " +
                                                "retrieval, network connectivity, capacity and required software functions. " +
                                                "Model-specific capabilities and live synchronisation must not be guaranteed until validated.")
                                                .FontSize(9).FontColor(bodyText);
                                        });
                                    });
                            });
                        });

                        // ── 5. Setup, Integration and Installation Fees ───────
                        Section("5", "Setup, Integration and Installation Fees", c =>
                        {
                            c.Table(table =>
                            {
                                table.ColumnsDefinition(tc => { tc.RelativeColumn(2); tc.RelativeColumn(2); tc.RelativeColumn(3); });
                                foreach (var h in new[] { "SERVICE", "PROPOSED FEE", "NOTES" })
                                    table.Cell().Background(navyDark).Padding(7).Text(h).Bold().FontColor("#ffffff").FontSize(9);
                                var fees = new[]
                                {
                                    ("Futronic FS88H setup /\nintegration",      d.FutronicSetupFee,  "Subject to final implementation scope."),
                                    ("ZKTeco configuration /\nintegration",       d.ZKTecoSetupFee,    "Subject to selected model and compatibility."),
                                    ("Onsite installation /\ncommissioning",      d.OnsiteFee,         "Travel/accommodation, if applicable, quoted separately."),
                                    ("Additional terminal\nconfiguration",        d.AdditionalTermFee, "For additional devices at the same site."),
                                    ("Delivery / courier",                        "At cost / quoted separately", "Based on destination and supplier."),
                                };
                                for (int i = 0; i < fees.Length; i++)
                                {
                                    var bg = i % 2 == 0 ? "#f8fafc" : "#ffffff";
                                    table.Cell().Background(bg).Border(0.3f).BorderColor("#e2e8f0").Padding(7).Text(fees[i].Item1).Bold().FontSize(9).FontColor(navyDark);
                                    table.Cell().Background(bg).Border(0.3f).BorderColor("#e2e8f0").Padding(7).Text(fees[i].Item2).FontSize(9);
                                    table.Cell().Background(bg).Border(0.3f).BorderColor("#e2e8f0").Padding(7).Text(fees[i].Item3).FontSize(9);
                                }
                            });
                        });

                        // ── 6. Payment Terms ──────────────────────────────────
                        Section("6", "Payment Terms", c =>
                            Bullets(c, new[]
                            {
                                "Software setup and once-off implementation charges are payable as stated on the final invoice, ordinarily before implementation begins.",
                                "Monthly software subscriptions are payable monthly in advance from the agreed service commencement date.",
                                "Scanner rentals are payable monthly in advance. The applicable refundable deposit is payable before equipment is released.",
                                "Hardware rentals are payable monthly in advance. The refundable deposit is payable before equipment is released.",
                                "Custom development, additional integrations, data migration, extra training and additional onsite visits are outside the standard package unless expressly included; these will be separately quoted and require written approval.",
                            }));

                        // ── 7. Hardware Rental Conditions ─────────────────────
                        Section("7", "Hardware Rental Conditions", c =>
                            Bullets(c, new[]
                            {
                                "Minimum scanner rental contract: 3 months. This minimum term is intended to accommodate short-term training courses.",
                                "All rented equipment remains the property of NBSN Projects. The client must take reasonable care of the equipment and keep it secure.",
                                "The refundable deposit will be returned after equipment is returned and inspected, less agreed deductions for loss, theft, physical damage, missing accessories or outstanding amounts.",
                                "The client is responsible for loss, theft, negligence, misuse or physical damage. Ordinary hardware faults not caused by misuse will be assessed and handled in accordance with the applicable supplier warranty and agreed support process.",
                                "The client must provide suitable power, network access and a secure installation point, and promptly report faults or suspected tampering.",
                                "Cancellation, early termination, collection and return arrangements must be confirmed in the signed rental agreement or final quotation.",
                            }));

                        // ── 8. Client Responsibilities and Conditions ─────────
                        Section("8", "Client Responsibilities and Conditions", c =>
                            Bullets(c, new[]
                            {
                                "Provide accurate learner, programme and staff information required for configuration and onboarding.",
                                "Nominate authorised users and keep access permissions up to date.",
                                "Provide reliable internet connectivity and suitable power at the training centre where required by the selected equipment.",
                                "Before biometric processing begins, the parties must agree appropriate POPIA-compliant notices, access controls, security, retention and deletion arrangements for biometric information.",
                                "Hardware integration and final device quantities are subject to technical/site assessment and confirmation of the selected model.",
                                "Third-party licence, SMS, data, connectivity or supplier charges not expressly included will be charged separately with the client's approval.",
                            }));

                        // ── 9. Validity and Acceptance ────────────────────────
                        Section("9", "Validity and Acceptance", c =>
                        {
                            c.Column(col2 =>
                            {
                                col2.Item().Text(
                                    "This quotation is valid until the date stated in the quotation details. Hardware prices are provisional " +
                                    "planning estimates until confirmed against supplier availability and the final selected model. Changes to " +
                                    "scope, quantities, specifications or supplier pricing may require a revised quotation. Work will commence " +
                                    "once the quotation is accepted, required payment is received and implementation details are agreed.")
                                    .FontSize(10).FontColor(bodyText);

                                col2.Item().PaddingTop(10).Text("CLIENT ACCEPTANCE")
                                    .Bold().FontSize(9).FontColor(tealDark).LetterSpacing(0.1f);

                                col2.Item().PaddingTop(6).Table(table =>
                                {
                                    table.ColumnsDefinition(tc => { tc.RelativeColumn(); tc.RelativeColumn(); });
                                    // Header row
                                    table.Cell().Background(navyDark).Padding(8).Text("Accepted by (Client)").Bold().FontColor("#ffffff").FontSize(9);
                                    table.Cell().Background(navyDark).Padding(8).Text("For NBSN Projects").Bold().FontColor("#ffffff").FontSize(9);
                                    // Name row
                                    table.Cell().Border(0.4f).BorderColor("#e2e8f0").Padding(10)
                                        .Text($"Name: {(string.IsNullOrWhiteSpace(d.ClientName) ? "" : d.ClientName)}").FontSize(9).FontColor(mutedText);
                                    table.Cell().Border(0.4f).BorderColor("#e2e8f0").Padding(10)
                                        .Text($"Name: {d.PreparedByName}").FontSize(9).FontColor(mutedText);
                                    // Signature row
                                    table.Cell().Border(0.4f).BorderColor("#e2e8f0").MinHeight(40).Padding(10)
                                        .Text("Signature:").FontSize(9).FontColor(mutedText);
                                    table.Cell().Border(0.4f).BorderColor("#e2e8f0").MinHeight(40).Padding(10)
                                        .Text("Signature:").FontSize(9).FontColor(mutedText);
                                    // Date row
                                    table.Cell().Border(0.4f).BorderColor("#e2e8f0").Padding(10)
                                        .Text("Date:").FontSize(9).FontColor(mutedText);
                                    table.Cell().Border(0.4f).BorderColor("#e2e8f0").Padding(10)
                                        .Text($"Date: {DateTime.Now:dd/MM/yyyy}").FontSize(9).FontColor(mutedText);
                                });

                                col2.Item().PaddingTop(16).AlignCenter()
                                    .Text("Thank you for considering NBSN Projects.")
                                    .Bold().FontSize(11).FontColor(navyDark);
                            });
                        });
                    });

                    // ── Footer ────────────────────────────────────────────────
                    page.Footer().Column(fc =>
                    {
                        fc.Item().LineHorizontal(0.5f).LineColor("#cbd5e1");
                        fc.Item().PaddingTop(4).Row(row =>
                        {
                            row.RelativeItem().Text(txt =>
                            {
                                txt.Span("NBSN Projects  •  www.nbsnprojects.co.za  •  Confidential quotation  •  Page ").FontSize(8).FontColor(mutedText);
                                txt.CurrentPageNumber().FontSize(8).FontColor(mutedText);
                            });
                            row.AutoItem().Text(txt =>
                            {
                                txt.Span($"NBSN PROJECTS").FontSize(8).Bold().FontColor(navyDark);
                            });
                        });
                    });
                });
            }).GeneratePdf();
        }

        private byte[] GenerateLicencePdf(LicenceFormData d, string refNo)
        {
            const string navy    = "#0d2240";
            const string teal    = "#0d7377";
            const string gold    = "#b8960c";
            const string goldLight = "#fdf6e3";
            const string body    = "#1e293b";
            const string muted   = "#64748b";
            const string lightBg = "#f8fafc";
            const string borderG = "#c9a227";

            var logoPath = GetLogoPath();

            return QuestDocument.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.MarginHorizontal(0);
                    page.MarginTop(0);
                    page.MarginBottom(32);
                    page.DefaultTextStyle(x => x.FontSize(10).FontFamily("Arial").FontColor(body));

                    // ── Header — navy band with logo ──────────────────────────
                    page.Header().Column(col =>
                    {
                        col.Item().Background(navy).PaddingHorizontal(36).PaddingVertical(14).Row(row =>
                        {
                            row.RelativeItem().Row(lr =>
                            {
                                if (!string.IsNullOrEmpty(logoPath))
                                {
                                    lr.ConstantItem(48).Image(logoPath).FitArea();
                                    lr.ConstantItem(10);
                                }
                                lr.RelativeItem().Column(c =>
                                {
                                    c.Item().Text("NBSN PROJECTS").Bold().FontSize(14).FontColor("#ffffff");
                                    c.Item().Text("Skills Development Solutions").FontSize(8).FontColor("#94c5cc").LetterSpacing(0.08f);
                                });
                            });
                            row.AutoItem().AlignMiddle().Column(c =>
                            {
                                c.Item().AlignRight().Text("SOFTWARE LICENCE CERTIFICATE").Bold().FontSize(10).FontColor(gold).LetterSpacing(0.1f);
                                c.Item().AlignRight().Text(refNo).FontSize(8).FontColor("#94c5cc");
                            });
                        });
                        col.Item().Height(4).Background(teal);
                    });

                    page.Content().PaddingHorizontal(36).PaddingTop(20).Column(col =>
                    {
                        // ── Page 1: Certificate ───────────────────────────────

                        // Title block
                        col.Item().AlignCenter().Column(tc =>
                        {
                            tc.Item().AlignCenter().Text("SOFTWARE LICENCE CERTIFICATE")
                                .Bold().FontSize(22).FontColor(navy);
                            tc.Item().PaddingTop(4).AlignCenter()
                                .Text("NBSN-Projects Learner Management System")
                                .FontSize(12).FontColor(teal);
                            tc.Item().PaddingTop(8).LineHorizontal(1.5f).LineColor(teal);
                            tc.Item().PaddingTop(1).LineHorizontal(0.4f).LineColor(gold);
                        });

                        // Gold-bordered licence number certificate box
                        col.Item().PaddingTop(18).Border(1.5f).BorderColor(borderG)
                            .Background(lightBg).Column(nb =>
                            {
                                nb.Item().Background(gold).PaddingHorizontal(16).PaddingVertical(7)
                                    .AlignCenter().Text("LICENCE NUMBER")
                                    .Bold().FontSize(8).FontColor("#ffffff").LetterSpacing(0.15f);
                                nb.Item().PaddingVertical(14).AlignCenter()
                                    .Text(refNo).Bold().FontSize(17).FontColor(navy);
                            });

                        // Certifies paragraph
                        col.Item().PaddingTop(16).AlignCenter().Text(txt =>
                        {
                            txt.Span("This certifies that ").FontSize(10).FontColor(body);
                            txt.Span(d.ClientName.ToUpper()).Bold().FontSize(10).FontColor(navy);
                            txt.Span(
                                " is authorised to access and use the NBSN-Projects Learner Management System " +
                                "under the conditions stated in this certificate, the Software Licence Agreement " +
                                "and the applicable Service Level Agreement.")
                                .FontSize(10).FontColor(body);
                        });

                        // Details table
                        col.Item().PaddingTop(16).Table(table =>
                        {
                            table.ColumnsDefinition(c => { c.ConstantColumn(185); c.RelativeColumn(); });

                            void Row(string label, string value, bool hl = false)
                            {
                                table.Cell()
                                    .Background(hl ? navy : lightBg)
                                    .Border(0.4f).BorderColor("#dde3ea")
                                    .Padding(8)
                                    .Text(label).Bold().FontSize(9)
                                    .FontColor(hl ? "#ffffff" : body);
                                table.Cell()
                                    .Background(hl ? "#e8f4f8" : "#ffffff")
                                    .Border(0.4f).BorderColor("#dde3ea")
                                    .Padding(8)
                                    .Text(value).FontSize(9)
                                    .FontColor(hl ? navy : body);
                            }

                            Row("Licensed client",              d.ClientName,                                              true);
                            Row("Client registration number",   d.ClientRegNumber ?? "");
                            Row("Software supplier",            d.SupplierName,                                            true);
                            Row("Supplier registration number", d.SupplierRegNumber);
                            Row("Licence type",                 d.LicenceType,                                             true);
                            Row("Licence status",               d.LicenceStatus);
                            Row("Effective date",               d.EffectiveDate ?? DateTime.Now.ToString("dd/MM/yyyy"),    true);
                            Row("Expiry / renewal date",        d.ExpiryDate ?? "");
                            Row("Authorised usage",             d.AuthorisedUsage ?? "",                                   true);
                            Row("Related invoice",              d.RelatedInvoice ?? "");
                            Row("Related SLA",                  d.RelatedSLA ?? "",                                        true);
                        });

                        // Licensed service scope
                        col.Item().PaddingTop(14).Column(sc =>
                        {
                            sc.Item().Background(navy).PaddingHorizontal(10).PaddingVertical(7)
                                .Text("Licensed service scope")
                                .Bold().FontSize(9).FontColor("#ffffff").LetterSpacing(0.06f);
                            sc.Item().Border(0.4f).BorderColor("#dde3ea").Padding(10)
                                .Text(d.ServiceScope ??
                                    "NBSN-Projects web and mobile access; learner registration and administration; " +
                                    "attendance management; agreed biometric and location functions; learner document and POE management; " +
                                    "assessment, moderation, quality-assurance workflows; reporting; hosting; backups; and support, " +
                                    "only to the extent selected in the signed SLA or order form.")
                                .FontSize(9).FontColor(body);
                        });

                        // Signature table
                        col.Item().PaddingTop(16).Table(table =>
                        {
                            table.ColumnsDefinition(c => { c.RelativeColumn(); c.RelativeColumn(); });
                            table.Cell().Background(navy).Padding(8).Text("Authorised for the Supplier").Bold().FontColor("#ffffff").FontSize(9);
                            table.Cell().Background(navy).Padding(8).Text($"Accepted for {d.ClientName}").Bold().FontColor("#ffffff").FontSize(9);

                            table.Cell().Border(0.4f).BorderColor("#dde3ea").MinHeight(72).Padding(10).Column(c =>
                            {
                                c.Item().Text($"Name and title:  {d.SupplierSignatoryName}").FontSize(9).FontColor(muted);
                                c.Item().PaddingTop(14).Text("Signature: ___________________________").FontSize(9).FontColor(muted);
                                c.Item().PaddingTop(10).Text($"Date:  {d.EffectiveDate ?? DateTime.Now.ToString("dd/MM/yyyy")}").FontSize(9).FontColor(muted);
                            });
                            table.Cell().Border(0.4f).BorderColor("#dde3ea").MinHeight(72).Padding(10).Column(c =>
                            {
                                c.Item().Text("Name and title: ___________________________").FontSize(9).FontColor(muted);
                                c.Item().PaddingTop(14).Text("Signature: ___________________________").FontSize(9).FontColor(muted);
                                c.Item().PaddingTop(10).Text("Date: _____________________________").FontSize(9).FontColor(muted);
                            });
                        });

                        // Disclaimer
                        col.Item().PaddingTop(10).Background("#fff8e1").Border(0.4f).BorderColor(gold)
                            .PaddingHorizontal(12).PaddingVertical(7).Text(txt =>
                            {
                                txt.Span("Note: ").FontColor(gold).Bold().FontSize(9);
                                txt.Span("This certificate is evidence of a contractual software licence. " +
                                    "It is not SETA, QCTO or government accreditation.")
                                    .Italic().FontSize(8).FontColor(muted);
                            });

                        // ── Page break → Schedule on page 2 ──────────────────
                        col.Item().PageBreak();

                        // Schedule heading with logo
                        col.Item().Row(hrow =>
                        {
                            hrow.RelativeItem().Column(c =>
                            {
                                c.Item().Text("Licence Schedule and Conditions").Bold().FontSize(16).FontColor(navy);
                                c.Item().PaddingTop(2).Text($"Certificate reference: {refNo}").FontSize(9).FontColor(muted);
                            });
                            if (!string.IsNullOrEmpty(logoPath))
                                hrow.ConstantItem(50).AlignRight().Image(logoPath).FitArea();
                        });
                        col.Item().PaddingTop(8).LineHorizontal(2).LineColor(navy);
                        col.Item().PaddingTop(1).LineHorizontal(0.4f).LineColor(teal);

                        // Schedule helper
                        void Clause(string num, string title, System.Action<QuestPDF.Infrastructure.IContainer> content)
                        {
                            col.Item().PaddingTop(14).Column(sc =>
                            {
                                sc.Item().Row(r =>
                                {
                                    r.ConstantItem(28).Background(teal).AlignMiddle().AlignCenter()
                                        .Text(num).Bold().FontSize(9).FontColor("#ffffff");
                                    r.ConstantItem(8);
                                    r.RelativeItem().Text(title).Bold().FontSize(11).FontColor(navy);
                                });
                                sc.Item().PaddingTop(3).LineHorizontal(0.4f).LineColor("#dde3ea");
                                sc.Item().PaddingTop(5).Element(content);
                            });
                        }

                        void Bullets(QuestPDF.Infrastructure.IContainer c, IEnumerable<string> items)
                        {
                            c.Column(bc =>
                            {
                                foreach (var item in items)
                                    bc.Item().PaddingBottom(3).Row(r =>
                                    {
                                        r.ConstantItem(16).PaddingTop(1).Text("•").Bold().FontColor(teal).FontSize(10);
                                        r.RelativeItem().Text(item).FontSize(10).FontColor(body);
                                    });
                            });
                        }

                        Clause("1", "Licence grant", c => c.Text(
                            $"Subject to payment and continued compliance with the applicable agreements, the Supplier grants {d.ClientName} " +
                            "a limited, non-exclusive, non-transferable and revocable right during the licence term to access and use " +
                            $"NBSN-Projects solely for {d.ClientName}'s authorised internal learner-management and training-administration activities.")
                            .FontSize(10).FontColor(body));

                        Clause("2", "Permitted users and scope", c => Bullets(c, new[]
                        {
                            $"Only users authorised by {d.ClientName} and provisioned under the agreed subscription may access the system.",
                            "Usage is limited to the learner, user, project, site, storage and module limits recorded on the certificate, SLA, order form or invoice.",
                            "Additional users, learners, projects, modules, storage or integrations require written approval and may attract additional charges.",
                        }));

                        Clause("3", "Restrictions", c => Bullets(c, new[]
                        {
                            $"{d.ClientName} may not copy, resell, sublicense, lease, distribute, reverse engineer or commercially exploit NBSN-Projects, except where expressly authorised in writing or permitted by law.",
                            $"{d.ClientName} may not interfere with system security, bypass usage restrictions, share user credentials or allow unauthorised third parties to access the service.",
                            "The licence does not transfer ownership of NBSN-Projects, its source code, architecture, documentation, templates, updates or other Supplier intellectual property.",
                        }));

                        Clause("4", "Client data and POPIA", c => c.Text(
                            $"{d.ClientName} retains its rights and responsibilities in relation to its learner and operational data. " +
                            "The parties must process Personal Information in accordance with POPIA and the signed data-processing and service agreements. " +
                            $"{d.ClientName} is responsible for establishing the lawful basis, notices and permissions required for learner, child, biometric and location information used in its deployment.")
                            .FontSize(10).FontColor(body));

                        Clause("5", "Support and service levels", c => c.Text(
                            "Hosting, availability, maintenance, backup, recovery, support priority, response target, security-incident and escalation commitments " +
                            "are governed by the signed SLA. This certificate does not replace or expand those commitments.")
                            .FontSize(10).FontColor(body));

                        Clause("6", "Payment, validity and termination", c => c.Text(
                            "The licence remains valid only for the stated term and while applicable fees are paid. Renewal, suspension, cancellation, termination " +
                            "and data-export arrangements are governed by the signed agreements. A paid invoice or official receipt must be retained with this certificate " +
                            "as evidence of payment; the certificate itself is not proof that payment was received.")
                            .FontSize(10).FontColor(body));

                        Clause("7", "Verification", c => c.Table(table =>
                        {
                            table.ColumnsDefinition(tc => { tc.ConstantColumn(220); tc.RelativeColumn(); });
                            void VRow(string label, string value, bool hl = false)
                            {
                                table.Cell().Background(hl ? lightBg : "#ffffff").Border(0.4f).BorderColor("#dde3ea")
                                    .Padding(8).Text(label).Bold().FontSize(9).FontColor(hl ? navy : body);
                                table.Cell().Background(hl ? "#ffffff" : lightBg).Border(0.4f).BorderColor("#dde3ea")
                                    .Padding(8).Text(value).FontSize(9).FontColor(body);
                            }
                            VRow("Supplier verification contact", $"{d.SupplierSignatoryName},  {d.SupplierPhone}", true);
                            VRow("Client verification contact",   d.ClientVerificationContact ?? "");
                            VRow("Issue date",                    d.EffectiveDate ?? DateTime.Now.ToString("dd/MM/yyyy"), true);
                            VRow("Document version",              d.DocumentVersion);
                            VRow("Internal licence register ref", refNo, true);
                        }));
                    });

                    // ── Footer ────────────────────────────────────────────────
                    page.Footer().Column(fc =>
                    {
                        fc.Item().PaddingHorizontal(36).LineHorizontal(0.4f).LineColor("#dde3ea");
                        fc.Item().PaddingHorizontal(36).PaddingTop(5).Row(row =>
                        {
                            row.RelativeItem().Text(txt =>
                            {
                                txt.Span("NBSN Projects  •  info@nbsnprojects.co.za  •  www.nbsnprojects.co.za  •  Confidential  •  Page ")
                                    .FontSize(7).FontColor(muted);
                                txt.CurrentPageNumber().FontSize(7).FontColor(muted);
                            });
                            row.AutoItem().Text("Reg: 2023 / 200156 / 07").FontSize(7).FontColor(muted);
                        });
                    });
                });
            }).GeneratePdf();
        }

        private byte[] GenerateInvoicePdf(InvoiceFormData d, string refNo)
        {
            const string navy     = "#0d2240";
            const string teal     = "#0d7377";
            const string bodyText = "#1e293b";
            const string mutedText= "#64748b";
            const string lightBg  = "#f8fafc";
            const string white    = "#ffffff";
            const string rowAlt   = "#f0f4f8";

            var invoiceDate = d.InvoiceDate ?? DateTime.Now.ToString("dd MMMM yyyy");
            var dueDate     = d.DueDate     ?? DateTime.Now.AddDays(7).ToString("dd MMMM yyyy");
            var logoPath    = GetLogoPath();

            var items    = d.LineItems ?? new List<InvoiceLineItem>();
            var subtotal = items.Sum(x => x.Quantity * x.UnitPrice);
            var vatAmt   = d.IncludeVat ? Math.Round(subtotal * (d.VatRate / 100m), 2) : 0m;
            var total    = subtotal + vatAmt;

            return QuestDocument.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.MarginHorizontal(0);
                    page.MarginTop(0);
                    page.MarginBottom(32);
                    page.DefaultTextStyle(x => x.FontSize(10).FontFamily("Arial").FontColor(bodyText));

                    // ── Header — navy band with logo ──────────────────────────
                    page.Header().Column(col =>
                    {
                        col.Item().Background(navy).PaddingHorizontal(36).PaddingVertical(14).Row(row =>
                        {
                            row.RelativeItem().Row(lr =>
                            {
                                if (!string.IsNullOrEmpty(logoPath))
                                {
                                    lr.ConstantItem(48).Image(logoPath).FitArea();
                                    lr.ConstantItem(10);
                                }
                                lr.RelativeItem().Column(c =>
                                {
                                    c.Item().Text("NBSN PROJECTS").Bold().FontSize(14).FontColor(white);
                                    c.Item().Text("Skills Development Solutions").FontSize(8).FontColor("#94c5cc").LetterSpacing(0.08f);
                                });
                            });
                            row.AutoItem().AlignMiddle().Column(c =>
                            {
                                c.Item().AlignRight().Text("INVOICE").Bold().FontSize(22).FontColor(white);
                                c.Item().AlignRight().Text(refNo).FontSize(8).FontColor("#94c5cc");
                            });
                        });
                        col.Item().Height(4).Background(teal);
                    });

                    page.Content().PaddingHorizontal(36).PaddingTop(20).Column(col =>
                    {
                        // ── Invoice metadata row ──────────────────────────────
                        col.Item().Row(row =>
                        {
                            // Bill To
                            row.RelativeItem().Border(0.5f).BorderColor("#dde3ea").Column(c =>
                            {
                                c.Item().Background(navy).PaddingHorizontal(10).PaddingVertical(7)
                                    .Text("BILL TO").Bold().FontSize(8).FontColor(white).LetterSpacing(0.1f);
                                c.Item().Padding(10).Column(inner =>
                                {
                                    inner.Item().Text(string.IsNullOrWhiteSpace(d.BillToName) ? "—" : d.BillToName)
                                        .Bold().FontSize(12).FontColor(navy);
                                    if (!string.IsNullOrWhiteSpace(d.BillToOrganisation))
                                        inner.Item().PaddingTop(2).Text(d.BillToOrganisation).FontColor(bodyText);
                                    if (!string.IsNullOrWhiteSpace(d.BillToAddress))
                                        inner.Item().Text(d.BillToAddress).FontColor(bodyText);
                                    if (!string.IsNullOrWhiteSpace(d.BillToEmail))
                                        inner.Item().Text(d.BillToEmail).FontColor(mutedText).FontSize(9);
                                });
                            });

                            row.ConstantItem(14);

                            // Invoice details
                            row.ConstantItem(200).Border(0.5f).BorderColor("#dde3ea").Column(c =>
                            {
                                c.Item().Background(teal).PaddingHorizontal(10).PaddingVertical(7)
                                    .Text("INVOICE DETAILS").Bold().FontSize(8).FontColor(white).LetterSpacing(0.1f);
                                c.Item().Padding(10).Table(table =>
                                {
                                    table.ColumnsDefinition(tc => { tc.RelativeColumn(); tc.RelativeColumn(); });
                                    void DR(string label, string value)
                                    {
                                        table.Cell().PaddingBottom(4).Text(label).Bold().FontSize(9).FontColor(mutedText);
                                        table.Cell().PaddingBottom(4).Text(value).FontSize(9).FontColor(bodyText);
                                    }
                                    DR("Invoice No:",  refNo);
                                    DR("Invoice Date:", invoiceDate);
                                    DR("Due Date:",    dueDate);
                                    if (!string.IsNullOrWhiteSpace(d.PurchaseOrderNo))
                                        DR("PO Number:", d.PurchaseOrderNo);
                                    if (!string.IsNullOrWhiteSpace(d.RelatedQuotation))
                                        DR("Quotation Ref:", d.RelatedQuotation);
                                    if (!string.IsNullOrWhiteSpace(d.RelatedSLA))
                                        DR("SLA Ref:", d.RelatedSLA);
                                });
                            });
                        });

                        // ── Line items table ──────────────────────────────────
                        col.Item().PaddingTop(20).Table(table =>
                        {
                            table.ColumnsDefinition(tc =>
                            {
                                tc.ConstantColumn(30);    // #
                                tc.RelativeColumn();       // Description
                                tc.ConstantColumn(60);    // Qty
                                tc.ConstantColumn(100);   // Unit Price
                                tc.ConstantColumn(110);   // Amount
                            });

                            // Header
                            foreach (var h in new[] { "#", "DESCRIPTION", "QTY", "UNIT PRICE", "AMOUNT (ZAR)" })
                                table.Cell().Background(navy).Padding(8).Text(h).Bold().FontColor(white).FontSize(9);

                            if (items.Count == 0)
                            {
                                table.Cell().ColumnSpan(5).Background(lightBg).Padding(12)
                                    .Text("No line items added.").FontSize(9).FontColor(mutedText).Italic();
                            }
                            else
                            {
                                for (int i = 0; i < items.Count; i++)
                                {
                                    var bg = i % 2 == 0 ? lightBg : white;
                                    var lineTotal = items[i].Quantity * items[i].UnitPrice;
                                    table.Cell().Background(bg).Border(0.3f).BorderColor("#e2e8f0").Padding(8)
                                        .Text($"{i + 1}").FontSize(9);
                                    table.Cell().Background(bg).Border(0.3f).BorderColor("#e2e8f0").Padding(8)
                                        .Text(items[i].Description).FontSize(9);
                                    table.Cell().Background(bg).Border(0.3f).BorderColor("#e2e8f0").Padding(8)
                                        .Text($"{items[i].Quantity:G}").FontSize(9);
                                    table.Cell().Background(bg).Border(0.3f).BorderColor("#e2e8f0").Padding(8)
                                        .Text($"R {items[i].UnitPrice:N2}").FontSize(9);
                                    table.Cell().Background(bg).Border(0.3f).BorderColor("#e2e8f0").Padding(8)
                                        .Text($"R {lineTotal:N2}").FontSize(9);
                                }
                            }
                        });

                        // ── Totals block ──────────────────────────────────────
                        col.Item().PaddingTop(4).AlignRight().Column(tc =>
                        {
                            tc.Item().Width(240).Table(table =>
                            {
                                table.ColumnsDefinition(c => { c.RelativeColumn(); c.ConstantColumn(110); });

                                void TRow(string label, string value, bool bold = false, string? bg = null)
                                {
                                    var background = bg ?? white;
                                    var labelCell = table.Cell().Background(background).Border(0.3f).BorderColor("#e2e8f0")
                                        .PaddingHorizontal(10).PaddingVertical(6);
                                    var valueCell = table.Cell().Background(background).Border(0.3f).BorderColor("#e2e8f0")
                                        .PaddingHorizontal(10).PaddingVertical(6);
                                    if (bold)
                                    {
                                        labelCell.Text(label).FontSize(9).Bold().FontColor(navy);
                                        valueCell.Text(value).FontSize(9).Bold().FontColor(navy);
                                    }
                                    else
                                    {
                                        labelCell.Text(label).FontSize(9).FontColor(mutedText);
                                        valueCell.Text(value).FontSize(9).FontColor(bodyText);
                                    }
                                }

                                TRow("Subtotal (excl. VAT)", $"R {subtotal:N2}");
                                if (d.IncludeVat)
                                    TRow($"VAT ({d.VatRate:G}%)", $"R {vatAmt:N2}");

                                // Total row — teal background, white text, special rendering
                                table.Cell().Background(teal).Border(0.3f).BorderColor("#e2e8f0")
                                    .PaddingHorizontal(10).PaddingVertical(8)
                                    .Text("TOTAL DUE").Bold().FontSize(10).FontColor(white);
                                table.Cell().Background(teal).Border(0.3f).BorderColor("#e2e8f0")
                                    .PaddingHorizontal(10).PaddingVertical(8)
                                    .Text($"R {total:N2}").Bold().FontSize(10).FontColor(white);
                            });
                        });

                        // ── Banking details ───────────────────────────────────
                        col.Item().PaddingTop(20).Column(bc =>
                        {
                            bc.Item().Row(r =>
                            {
                                r.ConstantItem(3).Background(teal);
                                r.ConstantItem(8);
                                r.RelativeItem().Text("Banking Details").Bold().FontSize(11).FontColor(navy);
                            });
                            bc.Item().PaddingTop(6).Table(table =>
                            {
                                table.ColumnsDefinition(c => { c.ConstantColumn(140); c.RelativeColumn(); c.ConstantColumn(140); c.RelativeColumn(); });
                                void BRow(string l1, string v1, string l2, string v2)
                                {
                                    table.Cell().Background(lightBg).Border(0.3f).BorderColor("#e2e8f0").Padding(7)
                                        .Text(l1).Bold().FontSize(9).FontColor(mutedText);
                                    table.Cell().Border(0.3f).BorderColor("#e2e8f0").Padding(7)
                                        .Text(v1).FontSize(9).FontColor(bodyText);
                                    table.Cell().Background(lightBg).Border(0.3f).BorderColor("#e2e8f0").Padding(7)
                                        .Text(l2).Bold().FontSize(9).FontColor(mutedText);
                                    table.Cell().Border(0.3f).BorderColor("#e2e8f0").Padding(7)
                                        .Text(v2).FontSize(9).FontColor(bodyText);
                                }
                                BRow("Bank",           d.BankName,      "Account Name", d.AccountName);
                                BRow("Account Number", d.AccountNumber,  "Account Type", d.AccountType);
                                BRow("Branch Code",    d.BranchCode,    "Reference",    string.IsNullOrWhiteSpace(d.Reference) ? refNo : d.Reference);
                            });
                        });

                        // ── Payment terms + notes ─────────────────────────────
                        col.Item().PaddingTop(16).Column(nc =>
                        {
                            if (!string.IsNullOrWhiteSpace(d.PaymentTerms))
                            {
                                nc.Item().Background("#fff8e1").Border(0.4f).BorderColor("#e9c46a")
                                    .PaddingHorizontal(12).PaddingVertical(8).Column(pc =>
                                    {
                                        pc.Item().Text("Payment Terms").Bold().FontSize(9).FontColor("#92400e");
                                        pc.Item().PaddingTop(2).Text(d.PaymentTerms).FontSize(9).FontColor(bodyText);
                                    });
                            }
                            if (!string.IsNullOrWhiteSpace(d.Notes))
                            {
                                nc.Item().PaddingTop(8).Background(lightBg).Border(0.4f).BorderColor("#dde3ea")
                                    .PaddingHorizontal(12).PaddingVertical(8).Column(oc =>
                                    {
                                        oc.Item().Text("Notes").Bold().FontSize(9).FontColor(mutedText);
                                        oc.Item().PaddingTop(2).Text(d.Notes).FontSize(9).FontColor(bodyText);
                                    });
                            }
                        });

                        // ── Thank you line ────────────────────────────────────
                        col.Item().PaddingTop(20).AlignCenter()
                            .Text("Thank you for your business with NBSN Projects.")
                            .Italic().FontSize(9).FontColor(mutedText);
                    });

                    // ── Footer ────────────────────────────────────────────────
                    page.Footer().Column(fc =>
                    {
                        fc.Item().PaddingHorizontal(36).LineHorizontal(0.4f).LineColor("#dde3ea");
                        fc.Item().PaddingHorizontal(36).PaddingTop(5).Row(row =>
                        {
                            row.RelativeItem().Text(txt =>
                            {
                                txt.Span("NBSN Projects  •  info@nbsnprojects.co.za  •  www.nbsnprojects.co.za  •  Reg: 2023 / 200156 / 07  •  Page ")
                                    .FontSize(7).FontColor(mutedText);
                                txt.CurrentPageNumber().FontSize(7).FontColor(mutedText);
                            });
                        });
                    });
                });
            }).GeneratePdf();
        }

        private byte[] GenerateSLAPdf(SLAFormData d, string refNo)
        {
            var effectiveDate = d.EffectiveDate ?? DateTime.Now.ToString("dd MMMM yyyy");

            const string navy     = "#0d2240";
            const string teal     = "#0d7377";
            const string bodyText = "#1e293b";
            const string mutedText= "#64748b";
            const string lightBg  = "#f0fdfa";
            const string white    = "#ffffff";
            const string rowAlt   = "#f8fafc";

            var logoPath = GetLogoPath();

            return QuestDocument.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.MarginHorizontal(0);
                    page.MarginTop(0);
                    page.MarginBottom(32);
                    page.DefaultTextStyle(x => x.FontSize(10).FontFamily("Arial").FontColor(bodyText));

                    // ── Header — navy band with logo ──────────────────────────
                    page.Header().Column(col =>
                    {
                        col.Item().Background(navy).PaddingHorizontal(36).PaddingVertical(14).Row(row =>
                        {
                            row.RelativeItem().Row(lr =>
                            {
                                if (!string.IsNullOrEmpty(logoPath))
                                {
                                    lr.ConstantItem(48).Image(logoPath).FitArea();
                                    lr.ConstantItem(10);
                                }
                                lr.RelativeItem().Column(c =>
                                {
                                    c.Item().Text("NBSN PROJECTS").Bold().FontSize(14).FontColor(white);
                                    c.Item().Text("Skills Development Solutions").FontSize(8).FontColor("#94c5cc").LetterSpacing(0.08f);
                                });
                            });
                            row.AutoItem().AlignMiddle().Column(c =>
                            {
                                c.Item().AlignRight().Text("SERVICE LEVEL AGREEMENT").Bold().FontSize(10).FontColor(teal).LetterSpacing(0.1f);
                                c.Item().AlignRight().Text(refNo).FontSize(8).FontColor("#94c5cc");
                                c.Item().AlignRight().Text($"Version {d.Version ?? "1.0"}").FontSize(8).FontColor("#94c5cc");
                            });
                        });
                        col.Item().Height(4).Background(teal);
                    });

                    page.Content().PaddingHorizontal(36).PaddingTop(20).Column(col =>
                    {
                        // ── Title block ───────────────────────────────────────
                        col.Item().Column(tc =>
                        {
                            tc.Item().Text("SERVICE LEVEL AGREEMENT")
                                .Bold().FontSize(24).FontColor(navy);
                            tc.Item().PaddingTop(2).Text("NBSN Projects — Learner Management System")
                                .FontSize(11).FontColor(teal);
                            tc.Item().PaddingTop(8).LineHorizontal(2).LineColor(teal);
                            tc.Item().PaddingTop(1).LineHorizontal(0.4f).LineColor(teal);
                        });

                        // ── Summary card ──────────────────────────────────────
                        col.Item().PaddingTop(16).Background(lightBg).Border(0.5f).BorderColor("#b2dfdb")
                            .Padding(0).Table(table =>
                            {
                                table.ColumnsDefinition(c => { c.ConstantColumn(170); c.RelativeColumn(); });

                                void SRow(string label, string value, bool last = false)
                                {
                                    var bot = last ? 0f : 0.4f;
                                    table.Cell().BorderBottom(bot).BorderColor("#cce8e4")
                                        .PaddingHorizontal(14).PaddingVertical(9)
                                        .Text(label).Bold().FontSize(10).FontColor(teal);
                                    table.Cell().BorderBottom(bot).BorderColor("#cce8e4")
                                        .PaddingHorizontal(14).PaddingVertical(9)
                                        .Text(value).FontSize(10).FontColor(bodyText);
                                }

                                SRow("Client",              d.ClientName);
                                SRow("Supplier",            "NBSN Projects (Pty) Ltd.");
                                SRow("Effective Date",      effectiveDate);
                                SRow("Initial Term",        d.InitialTerm ?? "12 months");
                                SRow("Agreement Reference", refNo);
                                SRow("Version",             d.Version ?? "1.0", true);
                            });

                        // ── Agreement Particulars — 2-column table ────────────
                        col.Item().PaddingTop(20).Column(ap =>
                        {
                            ap.Item().Row(hr =>
                            {
                                hr.ConstantItem(3).Background(navy);
                                hr.ConstantItem(8);
                                hr.RelativeItem().Text("Agreement Particulars").Bold().FontSize(12).FontColor(navy);
                            });
                            ap.Item().PaddingTop(4).Table(table =>
                            {
                                table.ColumnsDefinition(c => { c.ConstantColumn(185); c.RelativeColumn(); });

                                void PRow(string label, string value, bool hl = false)
                                {
                                    table.Cell()
                                        .Background(hl ? rowAlt : white)
                                        .Border(0.3f).BorderColor("#e2e8f0")
                                        .Padding(8).Text(label).Bold().FontSize(9).FontColor(mutedText);
                                    table.Cell()
                                        .Background(hl ? rowAlt : white)
                                        .Border(0.3f).BorderColor("#e2e8f0")
                                        .Padding(8).Text(value).FontSize(9).FontColor(bodyText);
                                }

                                PRow("Supplier legal name",    "NBSN Projects (Pty) Ltd.",                      true);
                                PRow("Supplier registration",  "2023 / 200156 / 07");
                                PRow("Supplier address",       "Durban, KwaZulu-Natal, South Africa",            true);
                                PRow("Supplier service owner", "Sbusiso Madikizela  —  info@nbsnprojects.co.za");
                                PRow("Client legal name",      d.ClientName,                                     true);
                                if (!string.IsNullOrWhiteSpace(d.ClientRegistrationNumber))
                                    PRow("Client registration", d.ClientRegistrationNumber);
                                if (!string.IsNullOrWhiteSpace(d.ClientAddress))
                                    PRow("Client address",     d.ClientAddress, true);
                                if (!string.IsNullOrWhiteSpace(d.ClientContractOwner))
                                    PRow("Client contract owner", d.ClientContractOwner);
                            });
                        });

                        // ── Section helper ────────────────────────────────────
                        void Section(string num, string title, System.Action<QuestPDF.Infrastructure.IContainer> content)
                        {
                            col.Item().PaddingTop(16).Column(sc =>
                            {
                                sc.Item().Row(r =>
                                {
                                    r.ConstantItem(28).Background(navy).AlignMiddle().AlignCenter()
                                        .Text(num).Bold().FontSize(9).FontColor(white);
                                    r.ConstantItem(8);
                                    r.RelativeItem().Text(title).Bold().FontSize(12).FontColor(navy);
                                });
                                sc.Item().PaddingTop(3).LineHorizontal(0.5f).LineColor("#e2e8f0");
                                sc.Item().PaddingTop(6).Element(content);
                            });
                        }

                        void Bullets(QuestPDF.Infrastructure.IContainer c, IEnumerable<string> items)
                        {
                            c.Column(bc =>
                            {
                                foreach (var item in items)
                                    bc.Item().PaddingBottom(4).Row(r =>
                                    {
                                        r.ConstantItem(16).PaddingTop(1).Text("•").Bold().FontColor(teal).FontSize(10);
                                        r.RelativeItem().Text(item).FontSize(10).FontColor(bodyText);
                                    });
                            });
                        }

                        // ── 1. Purpose ────────────────────────────────────────
                        Section("1", "Purpose", c => c.Text(
                            "This Service Level Agreement records the operational service levels applicable to the Supplier's provision of the " +
                            "NBSN Projects Learner Management System to the Client. It supplements the SaaS Subscription and Software Licence " +
                            "Agreement signed by the parties.")
                            .FontSize(10).FontColor(bodyText));

                        // ── 2. Availability ───────────────────────────────────
                        Section("2", "Availability Commitment", c => c.Column(bc =>
                        {
                            bc.Item().Text(
                                "The Supplier targets monthly availability of 99.5% for the Production Service, measured 24/7 per Service Month.")
                                .FontSize(10).FontColor(bodyText);
                            bc.Item().PaddingTop(4).Text(
                                "Planned maintenance window: Sundays 20:00–23:00 SAST with at least 48 hours advance notice.")
                                .FontSize(10).FontColor(bodyText);
                        }));

                        // ── 3. Support ────────────────────────────────────────
                        Section("3", "Support Service", c => c.Table(table =>
                        {
                            table.ColumnsDefinition(tc => { tc.ConstantColumn(80); tc.RelativeColumn(); tc.RelativeColumn(); });
                            foreach (var h in new[] { "Priority", "Response Target", "Resolution Target" })
                                table.Cell().Background(navy).Padding(7).Text(h).Bold().FontColor(white).FontSize(9);
                            var rows = new[]
                            {
                                ("P1 Critical", "30 minutes", "4 hours — 24/7"),
                                ("P2 High",     "2 business hours", "1 Business Day"),
                                ("P3 Medium",   "1 Business Day", "3 Business Days"),
                                ("P4 Low",      "2 Business Days", "5 Business Days"),
                            };
                            for (int i = 0; i < rows.Length; i++)
                            {
                                var bg = i % 2 == 0 ? rowAlt : white;
                                table.Cell().Background(bg).Border(0.3f).BorderColor("#e2e8f0").Padding(7)
                                    .Text(rows[i].Item1).Bold().FontSize(9).FontColor(navy);
                                table.Cell().Background(bg).Border(0.3f).BorderColor("#e2e8f0").Padding(7)
                                    .Text(rows[i].Item2).FontSize(9).FontColor(bodyText);
                                table.Cell().Background(bg).Border(0.3f).BorderColor("#e2e8f0").Padding(7)
                                    .Text(rows[i].Item3).FontSize(9).FontColor(bodyText);
                            }
                        }));

                        // ── 4. Subscription ───────────────────────────────────
                        Section("4", "Subscription Package", c =>
                        {
                            c.Column(col2 =>
                            {
                                bool hasData = !string.IsNullOrWhiteSpace(d.SubscriptionPackage)
                                           || !string.IsNullOrWhiteSpace(d.MonthlyFee)
                                           || !string.IsNullOrWhiteSpace(d.ImplementationFee);

                                if (hasData)
                                {
                                    col2.Item().Table(table =>
                                    {
                                        table.ColumnsDefinition(tc => { tc.ConstantColumn(185); tc.RelativeColumn(); });
                                        void FRow(string label, string value, bool hl = false)
                                        {
                                            table.Cell().Background(hl ? rowAlt : white).Border(0.3f).BorderColor("#e2e8f0")
                                                .Padding(8).Text(label).Bold().FontSize(9).FontColor(mutedText);
                                            table.Cell().Background(hl ? rowAlt : white).Border(0.3f).BorderColor("#e2e8f0")
                                                .Padding(8).Text(value).FontSize(10).FontColor(bodyText);
                                        }
                                        if (!string.IsNullOrWhiteSpace(d.SubscriptionPackage))
                                            FRow("Package", d.SubscriptionPackage, true);
                                        if (!string.IsNullOrWhiteSpace(d.MonthlyFee))
                                            FRow("Monthly subscription fee", $"R {d.MonthlyFee}  (excl. VAT)");
                                        if (!string.IsNullOrWhiteSpace(d.ImplementationFee))
                                            FRow("Implementation fee", $"R {d.ImplementationFee}  (once-off, excl. VAT)", true);
                                    });
                                }
                                col2.Item().PaddingTop(8).Background("#fff8e1").Border(0.4f).BorderColor("#e9c46a")
                                    .PaddingHorizontal(10).PaddingVertical(7).Text(
                                    "Fees are subject to annual review. Any increase will be notified at least 30 days in advance. " +
                                    "All fees exclude VAT unless stated otherwise.")
                                    .FontSize(9).FontColor(mutedText).Italic();
                            });
                        });

                        // ── 5. Data and Security ──────────────────────────────
                        Section("5", "Data and Security", c => Bullets(c, new[]
                        {
                            "Client data is stored encrypted at rest using AES-256 and in transit using TLS 1.2+.",
                            "Daily automated backups are retained for a minimum of 30 days.",
                            "The Supplier will notify the Client within 72 hours of a confirmed data breach.",
                            "Personal Information is processed in accordance with POPIA and the data-processing addendum.",
                        }));

                        // ── 6. POPIA ──────────────────────────────────────────
                        Section("6", "POPIA and Data Processing", c => c.Text(
                            "Both parties are responsible for compliance with the Protection of Personal Information Act, 4 of 2013 (POPIA). " +
                            "The Client is the Responsible Party for learner, staff and third-party personal information loaded into the system. " +
                            "The Supplier acts as Operator and processes personal information only on the Client's documented instructions.")
                            .FontSize(10).FontColor(bodyText));

                        // ── 7. Exclusions ─────────────────────────────────────
                        Section("7", "Exclusions from SLA", c => Bullets(c, new[]
                        {
                            "Scheduled maintenance windows notified in advance.",
                            "Events beyond the Supplier's reasonable control (force majeure).",
                            "Outages caused by the Client's network, hardware or third-party services.",
                            "Issues arising from Client modifications, misuse or unauthorised access.",
                        }));

                        // ── 8. Termination ────────────────────────────────────
                        Section("8", "Term and Termination", c => c.Text(
                            $"This agreement commences on {effectiveDate} and continues for the initial term of {d.InitialTerm ?? "12 months"}, " +
                            "renewing automatically on a month-to-month basis unless either party provides 30 days' written notice of termination. " +
                            "On termination the Supplier will make Client data available for export for 30 days, after which it may be deleted.")
                            .FontSize(10).FontColor(bodyText));

                        // ── Additional clauses ────────────────────────────────
                        if (!string.IsNullOrWhiteSpace(d.AdditionalClauses))
                        {
                            Section("9", "Additional Agreed Terms", c =>
                                c.Text(d.AdditionalClauses).FontSize(10).FontColor(bodyText));
                        }

                        // ── Signature block ───────────────────────────────────
                        col.Item().PaddingTop(20).LineHorizontal(1.5f).LineColor(navy);
                        col.Item().PaddingTop(14).Table(table =>
                        {
                            table.ColumnsDefinition(c => { c.RelativeColumn(); c.RelativeColumn(); });
                            table.Cell().Background(navy).Padding(8)
                                .Text("For NBSN Projects").Bold().FontSize(9).FontColor(white);
                            table.Cell().Background(navy).Padding(8)
                                .Text($"For {d.ClientName}").Bold().FontSize(9).FontColor(white);

                            table.Cell().Border(0.4f).BorderColor("#e2e8f0").MinHeight(80).Padding(12).Column(c =>
                            {
                                c.Item().Text("Name: Sbusiso Madikizela").FontSize(9).FontColor(mutedText);
                                c.Item().PaddingTop(14).Text("Signature: ___________________________").FontSize(9).FontColor(mutedText);
                                c.Item().PaddingTop(10).Text($"Date: {effectiveDate}").FontSize(9).FontColor(mutedText);
                            });
                            table.Cell().Border(0.4f).BorderColor("#e2e8f0").MinHeight(80).Padding(12).Column(c =>
                            {
                                var clientSig = string.IsNullOrWhiteSpace(d.ClientContractOwner)
                                    ? "Name: ___________________________"
                                    : $"Name: {d.ClientContractOwner}";
                                c.Item().Text(clientSig).FontSize(9).FontColor(mutedText);
                                c.Item().PaddingTop(14).Text("Signature: ___________________________").FontSize(9).FontColor(mutedText);
                                c.Item().PaddingTop(10).Text("Date: _____________________________").FontSize(9).FontColor(mutedText);
                            });
                        });
                    });

                    // ── Footer ────────────────────────────────────────────────
                    page.Footer().Column(fc =>
                    {
                        fc.Item().PaddingHorizontal(36).LineHorizontal(0.4f).LineColor("#dde3ea");
                        fc.Item().PaddingHorizontal(36).PaddingTop(5).Row(row =>
                        {
                            row.RelativeItem().Text(txt =>
                            {
                                txt.Span("NBSN Projects  •  info@nbsnprojects.co.za  •  www.nbsnprojects.co.za  •  Confidential  •  Page ")
                                    .FontSize(7).FontColor(mutedText);
                                txt.CurrentPageNumber().FontSize(7).FontColor(mutedText);
                            });
                            row.AutoItem().Text("Reg: 2023 / 200156 / 07").FontSize(7).FontColor(mutedText);
                        });
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

        // ── Prepared By (NBSN side) ──
        public string PreparedByName  { get; set; } = "NBSN Projects";
        public string PreparedByTitle { get; set; } = "Skills Development Solutions";
        public string PreparedByEmail { get; set; } = "info@nbsnprojects.co.za";
        public string PreparedByPhone { get; set; } = "0733904588";
        public string PreparedByWeb   { get; set; } = "www.nbsnprojects.co.za";
        public string PreparedByCity  { get; set; } = "Durban, KwaZulu-Natal, South Africa";

        // ── Subscription package pricing (editable) ──
        public decimal StarterSetup    { get; set; } = 9000;
        public decimal StarterMonthly  { get; set; } = 3500;
        public decimal GrowthSetup     { get; set; } = 12500;
        public decimal GrowthMonthly   { get; set; } = 4500;
        public decimal ProSetup        { get; set; } = 15000;
        public decimal ProMonthly      { get; set; } = 5500;

        // ── Hardware rental pricing (editable) ──
        public string FutronicMonthly   { get; set; } = "R350 per unit";
        public string FutronicDeposit   { get; set; } = "R750 per unit";
        public string ZKTecoMonthly     { get; set; } = "R850–R1,100 per unit";
        public string ZKTecoDeposit     { get; set; } = "R2,500 per unit";

        // ── Setup / integration fees (editable) ──
        public string FutronicSetupFee  { get; set; } = "R1,500 once-off";
        public string ZKTecoSetupFee    { get; set; } = "R2,500–R4,000 once-off";
        public string OnsiteFee         { get; set; } = "From R1,500 per site";
        public string AdditionalTermFee { get; set; } = "R750 per device";
    }

    public class LicenceFormData
    {
        public int     LicenceNumber              { get; set; } = 1;
        public string  ClientName                 { get; set; } = string.Empty;
        public string? ClientRegNumber            { get; set; }
        public string  SupplierName               { get; set; } = "NBSN Projects (Pty) Ltd.";
        public string  SupplierRegNumber          { get; set; } = "2023 / 200156 / 07";
        public string  LicenceType                { get; set; } = "Non-exclusive, non-transferable SaaS subscription licence";
        public string  LicenceStatus              { get; set; } = "ACTIVE - subject to payment and agreement compliance";
        public string? EffectiveDate              { get; set; }
        public string? ExpiryDate                 { get; set; }
        public string? AuthorisedUsage            { get; set; }   // e.g. "6 users | 100 learners | 3 sites | 2 Projects"
        public string? RelatedInvoice             { get; set; }
        public string? RelatedSLA                 { get; set; }
        public string? ServiceScope               { get; set; }
        public string  SupplierSignatoryName      { get; set; } = "Sbusiso Madikizela - Director";
        public string  SupplierPhone              { get; set; } = "0733904588";
        public string? ClientVerificationContact  { get; set; }
        public string  DocumentVersion            { get; set; } = "1.0";
        public int?    AuthorisedUsers            { get; set; }
        public int?    AuthorisedLearners         { get; set; }
        public int?    AuthorisedSites            { get; set; }
        public int?    AuthorisedProjects         { get; set; }
    }

    public class InvoiceFormData
    {
        public int     InvoiceNumber     { get; set; } = 1;
        public string? InvoiceDate       { get; set; }
        public string? DueDate           { get; set; }
        // Bill To
        public string  BillToName        { get; set; } = string.Empty;
        public string? BillToOrganisation { get; set; }
        public string? BillToAddress     { get; set; }
        public string? BillToEmail       { get; set; }
        // Related documents
        public string? RelatedQuotation  { get; set; }
        public string? RelatedSLA        { get; set; }
        public string? PurchaseOrderNo   { get; set; }
        // Line items
        public List<InvoiceLineItem>? LineItems { get; set; }
        // Financial
        public bool    IncludeVat        { get; set; } = false;
        public decimal VatRate           { get; set; } = 15m;
        // Banking details (pre-populated from NBSN)
        public string  BankName          { get; set; } = "First National Bank (FNB)";
        public string  AccountName       { get; set; } = "NBSN Projects";
        public string  AccountNumber     { get; set; } = "";
        public string  AccountType       { get; set; } = "Business Cheque";
        public string  BranchCode        { get; set; } = "250655";
        public string  Reference         { get; set; } = "";
        // Notes
        public string? Notes             { get; set; }
        public string  PaymentTerms      { get; set; } = "Payment due within 7 days of invoice date.";
    }

    public class InvoiceLineItem
    {
        public string  Description { get; set; } = string.Empty;
        public decimal Quantity    { get; set; } = 1;
        public decimal UnitPrice   { get; set; }
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
