using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using backend.Models.DTOs;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DocumentApprovalsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public DocumentApprovalsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/DocumentApprovals/stats
        [HttpGet("stats")]
        public async Task<ActionResult<DocumentApprovalStatsDto>> GetApprovalStats()
        {
            var totalDocuments = await _context.LearnerDocuments.CountAsync();
            var pendingDocuments = await _context.LearnerDocuments.CountAsync(d => d.ApprovalStatus == "Pending");
            var approvedDocuments = await _context.LearnerDocuments.CountAsync(d => d.ApprovalStatus == "Approved");
            var declinedDocuments = await _context.LearnerDocuments.CountAsync(d => d.ApprovalStatus == "Declined");

            var totalProjects = await _context.Projects.CountAsync();
            
            // Count projects with pending documents using a simpler approach
            var projectsWithPendingDocuments = await _context.LearnerDocuments
                .Where(d => d.ApprovalStatus == "Pending")
                .Join(_context.ClassEnrollments, d => d.LearnerId, e => e.LearnerId, (d, e) => e.SiteClassId)
                .Join(_context.SiteClasses, scId => scId, sc => sc.Id, (scId, sc) => sc.ProjectSiteId)
                .Join(_context.ProjectSites, psId => psId, ps => ps.Id, (psId, ps) => ps.ProjectId)
                .Distinct()
                .CountAsync();

            // Get total learners count
            var totalLearners = await _context.Learners.CountAsync();

            // Get document type breakdown
            var documentTypeBreakdown = await GetDocumentTypeBreakdown();

            var stats = new DocumentApprovalStatsDto
            {
                TotalDocuments = totalDocuments,
                PendingDocuments = pendingDocuments,
                ApprovedDocuments = approvedDocuments,
                DeclinedDocuments = declinedDocuments,
                ApprovalRate = totalDocuments > 0 ? Math.Round((double)approvedDocuments / totalDocuments * 100, 2) : 0,
                DeclineRate = totalDocuments > 0 ? Math.Round((double)declinedDocuments / totalDocuments * 100, 2) : 0,
                TotalProjects = totalProjects,
                ProjectsWithPendingDocuments = projectsWithPendingDocuments,
                TotalLearners = totalLearners,
                DocumentTypeBreakdown = documentTypeBreakdown
            };

            return Ok(stats);
        }

        private async Task<List<DocumentTypeStatsDto>> GetDocumentTypeBreakdown()
        {
            // Get all learners who are enrolled in classes (active learners)
            var activeLearners = await _context.ClassEnrollments
                .Select(ce => ce.LearnerId)
                .Distinct()
                .CountAsync();

            // Get document statistics by type
            var documentStats = await _context.LearnerDocuments
                .GroupBy(d => d.DocumentType)
                .Select(g => new
                {
                    DocumentType = g.Key,
                    SubmittedDocuments = g.Count(),
                    PendingDocuments = g.Count(d => d.ApprovalStatus == "Pending"),
                    ApprovedDocuments = g.Count(d => d.ApprovalStatus == "Approved"),
                    DeclinedDocuments = g.Count(d => d.ApprovalStatus == "Declined")
                })
                .ToListAsync();

            // Define expected document types (you can make this configurable)
            var expectedDocumentTypes = new[]
            {
                "ID Document",
                "Bank Confirmation Letter", 
                "CV",
                "Proof of Residence",
                "Qualifications"
            };

            var breakdown = new List<DocumentTypeStatsDto>();

            foreach (var docType in expectedDocumentTypes)
            {
                var stats = documentStats.FirstOrDefault(s => s.DocumentType == docType);
                var submittedCount = stats?.SubmittedDocuments ?? 0;
                var pendingCount = stats?.PendingDocuments ?? 0;
                var approvedCount = stats?.ApprovedDocuments ?? 0;
                var declinedCount = stats?.DeclinedDocuments ?? 0;
                var missingCount = Math.Max(0, activeLearners - submittedCount);

                breakdown.Add(new DocumentTypeStatsDto
                {
                    DocumentType = docType,
                    TotalLearners = activeLearners,
                    ExpectedDocuments = activeLearners,
                    SubmittedDocuments = submittedCount,
                    PendingDocuments = pendingCount,
                    ApprovedDocuments = approvedCount,
                    DeclinedDocuments = declinedCount,
                    MissingDocuments = missingCount,
                    ComplianceRate = activeLearners > 0 ? Math.Round((double)submittedCount / activeLearners * 100, 2) : 0,
                    ApprovalRate = submittedCount > 0 ? Math.Round((double)approvedCount / submittedCount * 100, 2) : 0
                });
            }

            return breakdown;
        }

        // GET: api/DocumentApprovals/projects
        [HttpGet("projects")]
        public async Task<ActionResult<IEnumerable<ProjectDocumentSummaryDto>>> GetProjectsWithDocuments()
        {
            // Get projects that have learners with documents
            var projectsWithDocuments = await (from p in _context.Projects
                                             join ps in _context.ProjectSites on p.Id equals ps.ProjectId
                                             join sc in _context.SiteClasses on ps.Id equals sc.ProjectSiteId
                                             join ce in _context.ClassEnrollments on sc.Id equals ce.SiteClassId
                                             join ld in _context.LearnerDocuments on ce.LearnerId equals ld.LearnerId
                                             group ld by new { p.Id, p.ProjectName } into g
                                             select new ProjectDocumentSummaryDto
                                             {
                                                 ProjectId = g.Key.Id,
                                                 ProjectName = g.Key.ProjectName,
                                                 TotalDocuments = g.Count(),
                                                 PendingDocuments = g.Count(d => d.ApprovalStatus == "Pending"),
                                                 ApprovedDocuments = g.Count(d => d.ApprovalStatus == "Approved"),
                                                 DeclinedDocuments = g.Count(d => d.ApprovalStatus == "Declined")
                                             })
                                             .OrderByDescending(p => p.PendingDocuments)
                                             .ThenBy(p => p.ProjectName)
                                             .ToListAsync();

            return Ok(projectsWithDocuments);
        }

        // GET: api/DocumentApprovals/projects/{projectId}/learners
        [HttpGet("projects/{projectId}/learners")]
        public async Task<ActionResult<IEnumerable<LearnerDocumentSummaryDto>>> GetProjectLearnerDocuments(int projectId)
        {
            var learnersInProject = await (from ce in _context.ClassEnrollments
                                         join l in _context.Learners on ce.LearnerId equals l.Id
                                         join sc in _context.SiteClasses on ce.SiteClassId equals sc.Id
                                         join ps in _context.ProjectSites on sc.ProjectSiteId equals ps.Id
                                         where ps.ProjectId == projectId
                                         select l)
                                         .Distinct()
                                         .ToListAsync();

            var learnerIds = learnersInProject.Select(l => l.Id).ToList();

            var allDocuments = await _context.LearnerDocuments
                .Where(ld => learnerIds.Contains(ld.LearnerId))
                .ToListAsync();

            var result = learnersInProject.Select(l => {
                var docs = allDocuments.Where(d => d.LearnerId == l.Id).ToList();
                return new LearnerDocumentSummaryDto
                {
                    LearnerId = l.Id,
                    FirstName = l.FirstName,
                    LastName = l.LastName,
                    IdNumber = l.IdNumber,
                    TotalDocuments = docs.Count,
                    PendingDocuments = docs.Count(d => d.ApprovalStatus == "Pending"),
                    ApprovedDocuments = docs.Count(d => d.ApprovalStatus == "Approved"),
                    DeclinedDocuments = docs.Count(d => d.ApprovalStatus == "Declined"),
                    Documents = docs.Select(d => new DocumentApprovalResponseDto
                    {
                        Id = d.Id,
                        LearnerId = d.LearnerId,
                        LearnerFirstName = l.FirstName,
                        LearnerLastName = l.LastName,
                        LearnerIdNumber = l.IdNumber,
                        DocumentType = d.DocumentType,
                        FileName = d.FileName,
                        FileSize = d.FileSize,
                        MimeType = d.MimeType,
                        UploadedAt = d.UploadedAt,
                        ApprovalStatus = d.ApprovalStatus,
                        ApprovedAt = d.ApprovedAt,
                        DeclineReason = d.DeclineReason
                    }).OrderByDescending(d => d.UploadedAt).ToList()
                };
            })
            .OrderByDescending(l => l.PendingDocuments)
            .ThenBy(l => l.TotalDocuments == 0 ? 0 : 1) // Put learners with no documents after those with documents
            .ThenBy(l => l.LastName)
            .ThenBy(l => l.FirstName)
            .ToList();

            return Ok(result);
        }

        // POST: api/DocumentApprovals/approve
        [HttpPost("approve")]
        public async Task<IActionResult> ApproveDocument([FromBody] DocumentApprovalDto approvalDto)
        {
            if (approvalDto.ApprovalStatus != "Approved" && approvalDto.ApprovalStatus != "Declined")
            {
                return BadRequest("ApprovalStatus must be 'Approved' or 'Declined'");
            }

            if (approvalDto.ApprovalStatus == "Declined" && string.IsNullOrWhiteSpace(approvalDto.DeclineReason))
            {
                return BadRequest("DeclineReason is required when declining a document");
            }

            var document = await _context.LearnerDocuments.FindAsync(approvalDto.DocumentId);
            if (document == null)
            {
                return NotFound("Document not found");
            }

            try
            {
                // Get user ID from claims (authentication)
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                int currentUserId;
                
                if (int.TryParse(userIdClaim, out int parsedUserId))
                {
                    currentUserId = parsedUserId;
                }
                else
                {
                    // Fallback to the first available user for testing if not authenticated
                    // In production, this should require authentication
                    var firstUser = await _context.Users.OrderBy(u => u.Id).FirstOrDefaultAsync();
                    if (firstUser == null)
                    {
                        return StatusCode(500, "No users found in database to perform approval");
                    }
                    currentUserId = firstUser.Id;
                }

                document.ApprovalStatus = approvalDto.ApprovalStatus;
                document.ApprovedByUserId = currentUserId;
                document.ApprovedAt = DateTime.UtcNow;
                document.DeclineReason = approvalDto.ApprovalStatus == "Declined" ? approvalDto.DeclineReason : null;
                document.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                return Ok(new { message = $"Document {approvalDto.ApprovalStatus.ToLower()} successfully", approvedBy = currentUserId });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating document approval status", error = ex.Message, innerError = ex.InnerException?.Message });
            }
        }

        // GET: api/DocumentApprovals/document/{documentId}
        [HttpGet("document/{documentId}")]
        public async Task<ActionResult<DocumentApprovalResponseDto>> GetDocumentDetails(int documentId)
        {
            var document = await _context.LearnerDocuments
                .Include(d => d.Learner)
                .Include(d => d.UploadedByUser)
                .Include(d => d.ApprovedByUser)
                .Where(d => d.Id == documentId)
                .Select(d => new DocumentApprovalResponseDto
                {
                    Id = d.Id,
                    LearnerId = d.LearnerId,
                    LearnerFirstName = d.Learner!.FirstName,
                    LearnerLastName = d.Learner.LastName,
                    LearnerIdNumber = d.Learner.IdNumber,
                    DocumentType = d.DocumentType,
                    FileName = d.FileName,
                    FileSize = d.FileSize,
                    MimeType = d.MimeType,
                    UploadedAt = d.UploadedAt,
                    UploadedByUserName = d.UploadedByUser != null ? (d.UploadedByUser.FirstName + " " + d.UploadedByUser.LastName) : null,
                    ApprovalStatus = d.ApprovalStatus,
                    ApprovedAt = d.ApprovedAt,
                    ApprovedByUserName = d.ApprovedByUser != null ? (d.ApprovedByUser.FirstName + " " + d.ApprovedByUser.LastName) : null,
                    DeclineReason = d.DeclineReason
                })
                .FirstOrDefaultAsync();

            if (document == null)
            {
                return NotFound("Document not found");
            }

            return Ok(document);
        }
    }
}