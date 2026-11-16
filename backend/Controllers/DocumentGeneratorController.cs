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

        public DocumentGeneratorController(ApplicationDbContext context, ILogger<DocumentGeneratorController> logger)
        {
            _context = context;
            _logger = logger;
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

        private static byte[] GenerateQuotationPdf(QuotationFormData d, string refNo)
        {
            var quoteDate  = d.QuoteDate ?? DateTime.Now.ToString("dd MMMM yyyy");
            var validUntil = d.ValidUntil ?? DateTime.Now.AddDays(30).ToString("dd MMMM yyyy");

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
                                c.Item().Text("QUOTATION").FontSize(22).Bold().FontColor("#0d9488");
                                c.Item().Text($"Quote No: {refNo}").FontSize(10).FontColor("#64748b");
                            });
                            row.RelativeItem().AlignRight().Column(c =>
                            {
                                c.Item().Text("NBSN PROJECTS").Bold().FontSize(12);
                                c.Item().Text("Durban, KwaZulu-Natal, South Africa").FontColor("#64748b");
                                c.Item().Text("info@nbsnprojects.co.za  |  0733904588").FontColor("#64748b");
                            });
                        });
                        col.Item().PaddingTop(8).LineHorizontal(1.5f).LineColor("#0d9488");
                    });

                    page.Content().PaddingTop(16).Column(col =>
                    {
                        // Prepared for / by
                        col.Item().Row(row =>
                        {
                            row.RelativeItem().Column(c =>
                            {
                                c.Item().Background("#f0fdfa").Padding(10).Column(inner =>
                                {
                                    inner.Item().Text("PREPARED FOR").Bold().FontColor("#0d9488").FontSize(9);
                                    inner.Item().Text(d.ClientName).Bold().FontSize(11);
                                    inner.Item().Text(d.ClientOrganisation).FontColor("#475569");
                                    inner.Item().Text(d.ClientContact).FontColor("#475569");
                                });
                            });
                            row.ConstantItem(16);
                            row.RelativeItem().Column(c =>
                            {
                                c.Item().Background("#f8fafc").Padding(10).Column(inner =>
                                {
                                    inner.Item().Text("PREPARED BY").Bold().FontColor("#0d9488").FontSize(9);
                                    inner.Item().Text("Sbusiso Madikizela").Bold().FontSize(11);
                                    inner.Item().Text("NBSN Projects").FontColor("#475569");
                                    inner.Item().Text($"Quote Date: {quoteDate}").FontColor("#475569");
                                    inner.Item().Text($"Valid Until: {validUntil}").FontColor("#475569");
                                    inner.Item().Text("Currency: South African Rand (ZAR)").FontColor("#475569");
                                });
                            });
                        });

                        col.Item().PaddingTop(16).Text("1  Project Overview").Bold().FontSize(12).FontColor("#0f172a");
                        col.Item().PaddingTop(4).Text(d.ProjectOverview ?? "NBSN Projects is pleased to submit this quotation for the design and delivery of a Learner Management Information System.").FontColor("#475569");

                        // Scope
                        col.Item().PaddingTop(14).Text("2  Scope of Work").Bold().FontSize(12).FontColor("#0f172a");
                        col.Item().PaddingTop(4).Text(d.ScopeOfWork ?? "As per the agreed scope of work.").FontColor("#475569");

                        // Pricing table
                        col.Item().PaddingTop(14).Text("3  Pricing").Bold().FontSize(12).FontColor("#0f172a");
                        col.Item().PaddingTop(6).Table(table =>
                        {
                            table.ColumnsDefinition(cols => { cols.ConstantColumn(30); cols.RelativeColumn(); cols.ConstantColumn(100); });
                            table.Header(header =>
                            {
                                foreach (var h in new[] { "#", "Description", "Amount (ZAR)" })
                                    header.Cell().Background("#0d9488").Padding(6).Text(h).Bold().FontColor("#ffffff").FontSize(9);
                            });
                            var items = d.LineItems ?? new List<QuotationLineItem>
                            {
                                new() { Description = "System design and master lists", Amount = 1000 },
                                new() { Description = "Enrolment Register", Amount = 1500 },
                                new() { Description = "Attendance Register", Amount = 1000 },
                                new() { Description = "Assessment Results", Amount = 1500 },
                                new() { Description = "Verification Register", Amount = 1500 },
                                new() { Description = "Dashboard and summaries", Amount = 1000 },
                                new() { Description = "Protection, branding and user guide", Amount = 1000 },
                                new() { Description = "Testing, handover and revisions", Amount = 1500 },
                            };
                            for (int i = 0; i < items.Count; i++)
                            {
                                var bg = i % 2 == 0 ? "#f0fdfa" : "#ffffff";
                                table.Cell().Background(bg).Padding(6).Text($"{i + 1}").FontSize(9);
                                table.Cell().Background(bg).Padding(6).Text(items[i].Description).FontSize(9);
                                table.Cell().Background(bg).Padding(6).Text($"R {items[i].Amount:N2}").FontSize(9);
                            }
                            var total = items.Sum(x => x.Amount);
                            table.Cell().ColumnSpan(2).Background("#0d9488").Padding(6).Text("TOTAL (excl. VAT)").Bold().FontColor("#ffffff").FontSize(9);
                            table.Cell().Background("#0d9488").Padding(6).Text($"R {total:N2}").Bold().FontColor("#ffffff").FontSize(9);
                        });

                        // Payment terms
                        col.Item().PaddingTop(14).Text("4  Payment Terms").Bold().FontSize(12).FontColor("#0f172a");
                        col.Item().PaddingTop(4).Text(d.PaymentTerms ?? "50% deposit on acceptance. 50% balance on delivery. Payment by EFT.").FontColor("#475569");

                        // Delivery
                        col.Item().PaddingTop(14).Text("5  Delivery Timeline").Bold().FontSize(12).FontColor("#0f172a");
                        col.Item().PaddingTop(4).Text(d.DeliveryTimeline ?? "7–10 working days from receipt of signed quotation and deposit.").FontColor("#475569");

                        // Acceptance
                        col.Item().PaddingTop(20).LineHorizontal(0.5f).LineColor("#e2e8f0");
                        col.Item().PaddingTop(10).Row(row =>
                        {
                            row.RelativeItem().Column(c =>
                            {
                                c.Item().Text("FOR NBSN PROJECTS").Bold().FontSize(9).FontColor("#0d9488");
                                c.Item().PaddingTop(16).Text("Signature: _______________________").FontSize(9);
                                c.Item().PaddingTop(4).Text("Name: Sbusiso Madikizela").FontSize(9);
                                c.Item().PaddingTop(4).Text($"Date: {DateTime.Now:dd/MM/yyyy}").FontSize(9);
                            });
                            row.ConstantItem(32);
                            row.RelativeItem().Column(c =>
                            {
                                c.Item().Text("ACCEPTED BY CLIENT").Bold().FontSize(9).FontColor("#0d9488");
                                c.Item().PaddingTop(16).Text("Signature: _______________________").FontSize(9);
                                c.Item().PaddingTop(4).Text($"Name: {d.ClientName}").FontSize(9);
                                c.Item().PaddingTop(4).Text("Date: ______________________").FontSize(9);
                            });
                        });
                        col.Item().PaddingTop(16).AlignCenter().Text("Thank you for the opportunity to work with you.").Italic().FontColor("#64748b");
                    });

                    page.Footer().AlignCenter().Text(txt =>
                    {
                        txt.Span("NBSN Projects  |  info@nbsnprojects.co.za  |  0733904588  |  ").FontColor("#94a3b8").FontSize(8);
                        txt.CurrentPageNumber().FontColor("#94a3b8").FontSize(8);
                        txt.Span(" / ").FontColor("#94a3b8").FontSize(8);
                        txt.TotalPages().FontColor("#94a3b8").FontSize(8);
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

    public class QuotationFormData
    {
        public int QuoteNumber { get; set; } = 1;
        public string ClientName { get; set; } = string.Empty;
        public string ClientOrganisation { get; set; } = string.Empty;
        public string ClientContact { get; set; } = string.Empty;
        public string? QuoteDate { get; set; }
        public string? ValidUntil { get; set; }
        public string? ProjectOverview { get; set; }
        public string? ScopeOfWork { get; set; }
        public string? PaymentTerms { get; set; }
        public string? DeliveryTimeline { get; set; }
        public List<QuotationLineItem>? LineItems { get; set; }
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
