using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using backend.Services.Interfaces;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DocumentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IDocumentUploadService _uploadService;
        private readonly IDocumentAccessControlService _accessControlService;
        private readonly IDocumentAuditService _auditService;
        private readonly IFileEncryptionService _encryptionService;
        private readonly ILogger<DocumentsController> _logger;

        public DocumentsController(
            ApplicationDbContext context,
            IDocumentUploadService uploadService,
            IDocumentAccessControlService accessControlService,
            IDocumentAuditService auditService,
            IFileEncryptionService encryptionService,
            ILogger<DocumentsController> logger)
        {
            _context = context;
            _uploadService = uploadService;
            _accessControlService = accessControlService;
            _auditService = auditService;
            _encryptionService = encryptionService;
            _logger = logger;
        }

        /// <summary>
        /// Get all documents accessible to the current user
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<DocumentDto>>> GetDocuments(
            [FromQuery] DocumentType? documentType = null,
            [FromQuery] DocumentStatus? status = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                    return Unauthorized("User not authenticated");

                var accessibleDocuments = await _accessControlService.GetAccessibleDocumentsAsync(userId.Value, documentType);
                
                var query = accessibleDocuments.AsQueryable();
                
                if (status.HasValue)
                    query = query.Where(d => d.Status == status.Value);

                var totalCount = query.Count();
                var documents = query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(d => new DocumentDto
                    {
                        Id = d.Id,
                        FileName = d.Name,
                        DocumentType = d.Type,
                        Status = d.Status,
                        AccessLevel = d.AccessLevel,
                        FileSize = d.FileSizeBytes,
                        CreatedAt = d.CreatedAt,
                        UpdatedAt = d.UpdatedAt,
                        ExpiryDate = d.ExpiresAt,
                        UploadedByUserId = d.UploadedByUserId,
                        ClientId = d.ClientId,
                        SkillsDevelopmentProviderId = d.SkillsDevelopmentProviderId,
                        DepartmentId = d.DepartmentId
                    })
                    .ToList();

                await _auditService.LogDocumentAccessAsync(0, userId.Value, DocumentAccessAction.View, 
                    GetClientIpAddress(), GetUserAgent(), $"Listed {documents.Count} documents");

                return Ok(new { documents, totalCount, page, pageSize });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving documents for user {UserId}", GetCurrentUserId());
                return StatusCode(500, "An error occurred while retrieving documents");
            }
        }

        /// <summary>
        /// Get a specific document by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<DocumentDto>> GetDocument(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                    return Unauthorized("User not authenticated");

                var document = await _context.Documents
                    .Include(d => d.UploadedBy)
                    .Include(d => d.Client)
                    .Include(d => d.SkillsDevelopmentProvider)
                    .Include(d => d.Department)
                    .FirstOrDefaultAsync(d => d.Id == id);

                if (document == null)
                    return NotFound("Document not found");

                var accessResult = await _accessControlService.CanAccessDocumentAsync(id, userId.Value, DocumentAccessAction.View);
                if (!accessResult.HasAccess)
                {
                    await _auditService.LogDocumentAccessAsync(id, userId.Value, DocumentAccessAction.AccessDenied,
                        GetClientIpAddress(), GetUserAgent(), accessResult.Reason);
                    return Forbid(accessResult.Reason);
                }

                await _auditService.LogDocumentAccessAsync(id, userId.Value, DocumentAccessAction.View,
                    GetClientIpAddress(), GetUserAgent());

                var documentDto = new DocumentDto
                {
                    Id = document.Id,
                    FileName = document.Name,
                    DocumentType = document.Type,
                    Status = document.Status,
                    AccessLevel = document.AccessLevel,
                    FileSize = document.FileSizeBytes,
                    CreatedAt = document.CreatedAt,
                    UpdatedAt = document.UpdatedAt,
                    ExpiryDate = document.ExpiresAt,
                    UploadedByUserId = document.UploadedByUserId,
                    ClientId = document.ClientId,
                    SkillsDevelopmentProviderId = document.SkillsDevelopmentProviderId,
                    DepartmentId = document.DepartmentId
                };

                return Ok(documentDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving document {DocumentId} for user {UserId}", id, GetCurrentUserId());
                return StatusCode(500, "An error occurred while retrieving the document");
            }
        }

        /// <summary>
        /// Upload a new document
        /// </summary>
        [HttpPost("upload")]
        public async Task<ActionResult<DocumentDto>> UploadDocument([FromForm] DocumentUploadRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                    return Unauthorized("User not authenticated");

                if (request.File == null || request.File.Length == 0)
                    return BadRequest("No file provided");

                // Set the uploaded by user ID
                request.UploadedByUserId = userId.Value;

                var uploadResult = await _uploadService.UploadDocumentAsync(request.File, request, userId.Value);
                
                if (!uploadResult.Success)
                {
                    await _auditService.LogSecurityEventAsync(null, userId.Value, SecurityEventType.SuspiciousActivity,
                        $"Failed document upload: {uploadResult.Message}", GetClientIpAddress(), GetUserAgent());
                    return BadRequest(uploadResult.Message);
                }

                await _auditService.LogDocumentUploadAsync(uploadResult.Document!.Id, userId.Value, 
                    request.File.FileName, request.File.Length, GetClientIpAddress(), GetUserAgent());

                var document = await _context.Documents.FindAsync(uploadResult.Document!.Id);
                if (document == null)
                    return StatusCode(500, "Document was uploaded but could not be retrieved");

                var documentDto = new DocumentDto
                {
                    Id = document.Id,
                    FileName = document.Name,
                    DocumentType = document.Type,
                    Status = document.Status,
                    AccessLevel = document.AccessLevel,
                    FileSize = document.FileSizeBytes,
                    CreatedAt = document.CreatedAt,
                    UpdatedAt = document.UpdatedAt,
                    ExpiryDate = document.ExpiresAt,
                    UploadedByUserId = document.UploadedByUserId,
                    ClientId = document.ClientId,
                    SkillsDevelopmentProviderId = document.SkillsDevelopmentProviderId,
                    DepartmentId = document.DepartmentId
                };

                return CreatedAtAction(nameof(GetDocument), new { id = document.Id }, documentDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading document for user {UserId}", GetCurrentUserId());
                return StatusCode(500, "An error occurred while uploading the document");
            }
        }

        /// <summary>
        /// Download a document
        /// </summary>
        [HttpGet("{id}/download")]
        public async Task<IActionResult> DownloadDocument(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                    return Unauthorized("User not authenticated");

                var document = await _context.Documents.FindAsync(id);
                if (document == null)
                    return NotFound("Document not found");

                var accessResult = await _accessControlService.CanAccessDocumentAsync(id, userId.Value, DocumentAccessAction.View);
                if (!accessResult.HasAccess)
                {
                    await _auditService.LogDocumentAccessAsync(id, userId.Value, DocumentAccessAction.AccessDenied,
                        GetClientIpAddress(), GetUserAgent(), accessResult.Reason);
                    return Forbid(accessResult.Reason);
                }

                if (!System.IO.File.Exists(document.FilePath))
                {
                    await _auditService.LogSecurityEventAsync(id, userId.Value, SecurityEventType.IntegrityViolation,
                        "Document file not found on disk", GetClientIpAddress(), GetUserAgent());
                    return NotFound("Document file not found");
                }

                // Decrypt the file for download
                var key = document.EncryptionKey ?? string.Empty;
                var decryptedContent = await _encryptionService.DecryptFileAsync(document.FilePath, key);
                
                await _auditService.LogDocumentAccessAsync(id, userId.Value, DocumentAccessAction.Download,
                    GetClientIpAddress(), GetUserAgent());

                return File(decryptedContent, document.ContentType, document.OriginalFileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error downloading document {DocumentId} for user {UserId}", id, GetCurrentUserId());
                return StatusCode(500, "An error occurred while downloading the document");
            }
        }

        /// <summary>
        /// Update document metadata
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateDocument(int id, [FromBody] DocumentUpdateRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                    return Unauthorized("User not authenticated");

                var document = await _context.Documents.FindAsync(id);
                if (document == null)
                    return NotFound("Document not found");

                var accessResult = await _accessControlService.CanAccessDocumentAsync(id, userId.Value, DocumentAccessAction.Update);
                if (!accessResult.HasAccess || !accessResult.Permissions.CanEdit)
                {
                    await _auditService.LogDocumentAccessAsync(id, userId.Value, DocumentAccessAction.AccessDenied,
                        GetClientIpAddress(), GetUserAgent(), "Insufficient permissions to modify document");
                    return Forbid("Insufficient permissions to modify document");
                }

                var originalStatus = document.Status;
                var originalAccessLevel = document.AccessLevel;

                // Update allowed fields
                if (request.Status.HasValue && request.Status != document.Status)
                {
                    document.Status = request.Status.Value;
                    await _auditService.LogDocumentModificationAsync(id, userId.Value, DocumentModificationType.StatusChange,
                        originalStatus.ToString(), request.Status.ToString(), GetClientIpAddress(), GetUserAgent());
                }

                if (request.AccessLevel.HasValue && request.AccessLevel != document.AccessLevel)
                {
                    document.AccessLevel = request.AccessLevel.Value;
                    await _auditService.LogDocumentModificationAsync(id, userId.Value, DocumentModificationType.AccessLevelChange,
                        originalAccessLevel.ToString(), request.AccessLevel.ToString(), GetClientIpAddress(), GetUserAgent());
                }

                if (!string.IsNullOrEmpty(request.Description))
                {
                    document.Description = request.Description;
                    await _auditService.LogDocumentModificationAsync(id, userId.Value, DocumentModificationType.MetadataUpdate,
                        null, "Description updated", GetClientIpAddress(), GetUserAgent());
                }

                if (request.ExpiryDate.HasValue)
                {
                    document.ExpiresAt = request.ExpiryDate;
                    await _auditService.LogDocumentModificationAsync(id, userId.Value, DocumentModificationType.MetadataUpdate,
                        null, $"Expiry date set to {request.ExpiryDate}", GetClientIpAddress(), GetUserAgent());
                }

                document.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating document {DocumentId} for user {UserId}", id, GetCurrentUserId());
                return StatusCode(500, "An error occurred while updating the document");
            }
        }

        /// <summary>
        /// Delete a document
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDocument(int id, [FromBody] DocumentDeleteRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                    return Unauthorized("User not authenticated");

                var document = await _context.Documents.FindAsync(id);
                if (document == null)
                    return NotFound("Document not found");

                var accessResult = await _accessControlService.CanAccessDocumentAsync(id, userId.Value, DocumentAccessAction.Delete);
                if (!accessResult.HasAccess || !accessResult.Permissions.CanDelete)
                {
                    await _auditService.LogDocumentAccessAsync(id, userId.Value, DocumentAccessAction.AccessDenied,
                        GetClientIpAddress(), GetUserAgent(), "Insufficient permissions to delete document");
                    return Forbid("Insufficient permissions to delete document");
                }

                // Log deletion before removing from database
                await _auditService.LogDocumentDeletionAsync(id, userId.Value, document.Name, 
                    request.Reason ?? "User requested deletion", GetClientIpAddress(), GetUserAgent());

                // Securely delete the physical file
                if (System.IO.File.Exists(document.FilePath))
                {
                    await _encryptionService.SecureDeleteFileAsync(document.FilePath);
                }

                // Remove from database
                _context.Documents.Remove(document);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting document {DocumentId} for user {UserId}", id, GetCurrentUserId());
                return StatusCode(500, "An error occurred while deleting the document");
            }
        }

        /// <summary>
        /// Share a document with another user
        /// </summary>
        [HttpPost("{id}/share")]
        public async Task<IActionResult> ShareDocument(int id, [FromBody] DocumentShareRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                    return Unauthorized("User not authenticated");

                var document = await _context.Documents.FindAsync(id);
                if (document == null)
                    return NotFound("Document not found");

                var accessResult = await _accessControlService.CanAccessDocumentAsync(id, userId.Value, DocumentAccessAction.Share);
                if (!accessResult.HasAccess || !accessResult.Permissions.CanShare)
                {
                    await _auditService.LogDocumentAccessAsync(id, userId.Value, DocumentAccessAction.AccessDenied,
                        GetClientIpAddress(), GetUserAgent(), "Insufficient permissions to share document");
                    return Forbid("Insufficient permissions to share document");
                }

                // Convert access level to permissions
                var permissions = ConvertAccessLevelToPermissions(request.AccessLevel);
                var shareResult = await _accessControlService.GrantAccessAsync(id, request.TargetUserId, userId.Value, permissions);
                if (!shareResult.HasAccess)
                    return BadRequest(shareResult.Reason);

                await _auditService.LogDocumentSharingAsync(id, userId.Value, request.TargetUserId, request.AccessLevel,
                    GetClientIpAddress(), GetUserAgent());

                return Ok(new { message = "Document shared successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sharing document {DocumentId} for user {UserId}", id, GetCurrentUserId());
                return StatusCode(500, "An error occurred while sharing the document");
            }
        }

        /// <summary>
        /// Get audit logs for a document
        /// </summary>
        [HttpGet("{id}/audit-logs")]
        public async Task<ActionResult<IEnumerable<DocumentAuditLog>>> GetDocumentAuditLogs(int id,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                    return Unauthorized("User not authenticated");

                var accessResult = await _accessControlService.CanAccessDocumentAsync(id, userId.Value, DocumentAccessAction.View);
                if (!accessResult.HasAccess)
                    return Forbid("Insufficient permissions to view audit logs");

                var auditLogs = await _auditService.GetDocumentAuditLogsAsync(id, fromDate, toDate);
                return Ok(auditLogs);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving audit logs for document {DocumentId}", id);
                return StatusCode(500, "An error occurred while retrieving audit logs");
            }
        }

        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(userIdClaim, out var userId) ? userId : null;
        }

        private string? GetClientIpAddress()
        {
            return HttpContext.Connection.RemoteIpAddress?.ToString();
        }

        private string? GetUserAgent()
        {
            return HttpContext.Request.Headers["User-Agent"].FirstOrDefault();
        }

        // Helper method to convert DocumentAccessLevel to DocumentPermissions
        private DocumentPermissions ConvertAccessLevelToPermissions(DocumentAccessLevel accessLevel)
        {
            return accessLevel switch
            {
                DocumentAccessLevel.Private => new DocumentPermissions
                {
                    CanView = true,
                    CanDownload = false,
                    CanEdit = false,
                    CanDelete = false,
                    CanShare = false,
                    CanApprove = false,
                    CanManageAccess = false
                },
                DocumentAccessLevel.Department => new DocumentPermissions
                {
                    CanView = true,
                    CanDownload = true,
                    CanEdit = false,
                    CanDelete = false,
                    CanShare = false,
                    CanApprove = false,
                    CanManageAccess = false
                },
                DocumentAccessLevel.Organization => new DocumentPermissions
                {
                    CanView = true,
                    CanDownload = true,
                    CanEdit = true,
                    CanDelete = false,
                    CanShare = true,
                    CanApprove = false,
                    CanManageAccess = false
                },
                DocumentAccessLevel.Client => new DocumentPermissions
                {
                    CanView = true,
                    CanDownload = true,
                    CanEdit = true,
                    CanDelete = false,
                    CanShare = true,
                    CanApprove = true,
                    CanManageAccess = false
                },
                DocumentAccessLevel.Public => new DocumentPermissions
                {
                    CanView = true,
                    CanDownload = true,
                    CanEdit = false,
                    CanDelete = false,
                    CanShare = false,
                    CanApprove = false,
                    CanManageAccess = false
                },
                _ => new DocumentPermissions()
            };
        }
    }

    // DTOs for API responses and requests
    public class DocumentDto
    {
        public int Id { get; set; }
        public string FileName { get; set; } = string.Empty;
        public DocumentType DocumentType { get; set; }
        public DocumentStatus Status { get; set; }
        public DocumentAccessLevel AccessLevel { get; set; }
        public long FileSize { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public DateTime? ExpiryDate { get; set; }
        public int UploadedByUserId { get; set; }
        public int? ClientId { get; set; }
        public int? SkillsDevelopmentProviderId { get; set; }
        public int? DepartmentId { get; set; }
    }

    public class DocumentUpdateRequest
    {
        public DocumentStatus? Status { get; set; }
        public DocumentAccessLevel? AccessLevel { get; set; }
        public string? Description { get; set; }
        public DateTime? ExpiryDate { get; set; }
    }

    public class DocumentDeleteRequest
    {
        public string? Reason { get; set; }
    }

    public class DocumentShareRequest
    {
        public int TargetUserId { get; set; }
        public DocumentAccessLevel AccessLevel { get; set; }
    }
}