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
                                    inner.Item().Text(string.IsNullOrWhiteSpace(d.ClientName) ? "[Client Name]" : d.ClientName)
                                        .Bold().FontSize(12).FontColor(navyDark);
                                    inner.Item().PaddingTop(2).Text(string.IsNullOrWhiteSpace(d.ClientOrganisation) ? "[Client Organisation]" : d.ClientOrganisation).FontColor(bodyText);
                                    inner.Item().Text(string.IsNullOrWhiteSpace(d.ClientContact) ? "[Client Email / Phone]" : d.ClientContact).FontColor(bodyText);
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
                                    inner.Item().Text("Sbusiso Madikizela").Bold().FontSize(12).FontColor(navyDark);
                                    inner.Item().PaddingTop(2).Text("NBSN Projects");
                                    inner.Item().Text("Durban, KwaZulu-Natal, South Africa");
                                    inner.Item().Text("info@nbsnprojects.co.za  |  0733904588");
                                    inner.Item().Text("www.nbsnprojects.co.za");
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
                                        ("Starter",      "30–50",   "R9 000",    "R3,500", "Shared cloud hosting; standard remote support"),
                                        ("Growth",       "51–75",   "R12 500",   "R4,500", "Shared cloud hosting; standard remote support"),
                                        ("Professional", "76–100",  "R15 000",   "R5,500", "Shared cloud hosting; standard remote support"),
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
                                        ("Futronic FS88H",             "R350 per unit",         "R750 per unit",   "12 months"),
                                        ("ZKTeco standalone terminal", "R850–R1,100 per unit",   "R2,500 per unit", "12 months"),
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
                                    ("Futronic FS88H setup /\nintegration",      "R1,500 once-off",         "Subject to final implementation scope."),
                                    ("ZKTeco configuration /\nintegration",       "R2,500–R4,000 once-off",  "Subject to selected model and compatibility."),
                                    ("Onsite installation /\ncommissioning",      "From R1,500 per site",    "Travel/accommodation, if applicable, quoted separately."),
                                    ("Additional terminal\nconfiguration",        "R750 per device",         "For additional devices at the same site."),
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
                                        .Text("Name: Sbusiso Madikizela").FontSize(9).FontColor(mutedText);
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
