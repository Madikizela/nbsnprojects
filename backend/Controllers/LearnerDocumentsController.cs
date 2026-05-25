using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using backend.Models.DTOs;
using backend.Services.Interfaces;
using System.Security.Claims;
using System.IO.Compression;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class LearnerDocumentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILearnerDocumentEncryptionService _encryptionService;
        private readonly ILogger<LearnerDocumentsController> _logger;
        private const long MaxFileSize = 10 * 1024 * 1024; // 10 MB

        private static readonly string[] AllowedDocumentTypes = new[]
        {
            "Bank Confirmation Letter",
            "CV",
            "ID Document",
            "Proof of Residence",
            "Qualifications"
        };

        private static readonly string[] AllowedMimeTypes = new[]
        {
            "application/pdf",
            "image/jpeg",
            "image/jpg",
            "image/png"
        };

        public LearnerDocumentsController(
            ApplicationDbContext context,
            ILearnerDocumentEncryptionService encryptionService,
            ILogger<LearnerDocumentsController> logger)
        {
            _context = context;
            _encryptionService = encryptionService;
            _logger = logger;
        }

        // GET: api/LearnerDocuments/bulk-download
        [HttpGet("bulk-download")]
        public async Task<IActionResult> BulkDownload(
            [FromQuery] int? projectId = null, 
            [FromQuery] int? learnerId = null, 
            [FromQuery] string? status = null)
        {
            try
            {
                var query = _context.LearnerDocuments.AsQueryable();

                if (projectId.HasValue)
                {
                    query = from ld in query
                            join l in _context.Learners on ld.LearnerId equals l.Id
                            join ce in _context.ClassEnrollments on l.Id equals ce.LearnerId
                            join sc in _context.SiteClasses on ce.SiteClassId equals sc.Id
                            join ps in _context.ProjectSites on sc.ProjectSiteId equals ps.Id
                            where ps.ProjectId == projectId.Value
                            select ld;
                }

                if (learnerId.HasValue)
                {
                    query = query.Where(d => d.LearnerId == learnerId.Value);
                }

                if (!string.IsNullOrEmpty(status) && status != "All")
                {
                    query = query.Where(d => d.ApprovalStatus == status);
                }

                var documents = await query.Include(d => d.Learner).ToListAsync();

                if (!documents.Any())
                {
                    return NotFound(new { message = "No documents found matching the criteria" });
                }

                using (var memoryStream = new MemoryStream())
                {
                    using (var archive = new ZipArchive(memoryStream, ZipArchiveMode.Create, true))
                    {
                        foreach (var doc in documents)
                        {
                            try
                            {
                                var decryptedContent = await _encryptionService.DecryptFileAsync(
                                    doc.EncryptedFilePath,
                                    doc.EncryptionIV
                                );

                                // Create a folder structure in the zip: LearnerName_ID/DocType_FileName
                                var learnerFolder = $"{doc.Learner?.FirstName}_{doc.Learner?.LastName}_{doc.Learner?.IdNumber}".Replace(" ", "_");
                                var entryName = $"{learnerFolder}/{doc.DocumentType}_{doc.FileName}".Replace(" ", "_");
                                
                                var entry = archive.CreateEntry(entryName);
                                using (var entryStream = entry.Open())
                                {
                                    await entryStream.WriteAsync(decryptedContent, 0, decryptedContent.Length);
                                }
                            }
                            catch (Exception ex)
                            {
                                _logger.LogError(ex, $"Error adding document {doc.Id} to bulk download");
                                // Continue with other documents
                            }
                        }
                    }

                    memoryStream.Position = 0;
                    var zipFileName = $"Documents_{DateTime.Now:yyyyMMddHHmmss}.zip";
                    return File(memoryStream.ToArray(), "application/zip", zipFileName);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in bulk download");
                return StatusCode(500, new { message = "An error occurred while preparing bulk download" });
            }
        }

        // GET: api/LearnerDocuments/learner/{learnerId}
        [HttpGet("learner/{learnerId}")]
        public async Task<ActionResult<IEnumerable<LearnerDocumentResponseDto>>> GetLearnerDocuments(int learnerId)
        {
            var documents = await _context.LearnerDocuments
                .Include(d => d.UploadedByUser)
                .Where(d => d.LearnerId == learnerId)
                .OrderByDescending(d => d.UploadedAt)
                .Select(d => new LearnerDocumentResponseDto
                {
                    Id = d.Id,
                    LearnerId = d.LearnerId,
                    DocumentType = d.DocumentType,
                    FileName = d.FileName,
                    FileSize = d.FileSize,
                    MimeType = d.MimeType,
                    UploadedAt = d.UploadedAt,
                    UploadedByUserName = d.UploadedByUser != null 
                        ? $"{d.UploadedByUser.FirstName} {d.UploadedByUser.LastName}" 
                        : null
                })
                .ToListAsync();

            return Ok(documents);
        }

        [HttpPost("upload")]
        public async Task<ActionResult<object>> UploadDocument([FromForm] UploadDocumentDto dto)
        {
            try
            {
                // Validate learner exists
                var learner = await _context.Learners.FindAsync(dto.LearnerId);
                if (learner == null)
                {
                    return NotFound(new { message = "Learner not found" });
                }

                // Validate document type
                if (!AllowedDocumentTypes.Contains(dto.DocumentType))
                {
                    return BadRequest(new { message = $"Invalid document type. Allowed types: {string.Join(", ", AllowedDocumentTypes)}" });
                }

                // Collect all files to upload
                var filesToUpload = new List<IFormFile>();
                if (dto.File != null) filesToUpload.Add(dto.File);
                if (dto.Files != null) filesToUpload.AddRange(dto.Files);

                if (!filesToUpload.Any())
                {
                    return BadRequest(new { message = "No files uploaded" });
                }

                // Get user ID from claims
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                int? userId = null;
                if (int.TryParse(userIdClaim, out int parsedUserId))
                {
                    userId = parsedUserId;
                }

                var uploadedDocuments = new List<LearnerDocumentResponseDto>();

                foreach (var file in filesToUpload)
                {
                    if (file.Length == 0) continue;

                    if (file.Length > MaxFileSize)
                    {
                        return BadRequest(new { message = $"File {file.FileName} size exceeds maximum allowed size of {MaxFileSize / 1024 / 1024} MB" });
                    }

                    if (!AllowedMimeTypes.Contains(file.ContentType.ToLower()))
                    {
                        return BadRequest(new { message = $"File {file.FileName} has invalid type. Allowed types: PDF, JPEG, JPG, PNG" });
                    }

                    // Read file content
                    byte[] fileContent;
                    using (var memoryStream = new MemoryStream())
                    {
                        await file.CopyToAsync(memoryStream);
                        fileContent = memoryStream.ToArray();
                    }

                    // Encrypt and save file
                    var (encryptedPath, iv, hash) = await _encryptionService.EncryptAndSaveFileAsync(
                        fileContent,
                        file.FileName
                    );

                    // Create document record
                    var document = new LearnerDocument
                    {
                        LearnerId = dto.LearnerId,
                        DocumentType = dto.DocumentType,
                        FileName = file.FileName,
                        EncryptedFilePath = encryptedPath,
                        FileSize = file.Length,
                        MimeType = file.ContentType,
                        EncryptionIV = iv,
                        FileHash = hash,
                        UploadedAt = DateTime.UtcNow,
                        UploadedByUserId = userId,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    _context.LearnerDocuments.Add(document);
                    await _context.SaveChangesAsync();

                    _logger.LogInformation($"Document uploaded successfully: LearnerId={dto.LearnerId}, Type={dto.DocumentType}, Size={file.Length}");

                    var uploadedByUser = userId.HasValue ? await _context.Users.FindAsync(userId.Value) : null;
                    uploadedDocuments.Add(new LearnerDocumentResponseDto
                    {
                        Id = document.Id,
                        LearnerId = document.LearnerId,
                        DocumentType = document.DocumentType,
                        FileName = document.FileName,
                        FileSize = document.FileSize,
                        MimeType = document.MimeType,
                        UploadedAt = document.UploadedAt,
                        UploadedByUserName = uploadedByUser != null
                            ? $"{uploadedByUser.FirstName} {uploadedByUser.LastName}"
                            : null
                    });
                }

                return Ok(uploadedDocuments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading documents");
                return StatusCode(500, new { message = "An error occurred while uploading the documents" });
            }
        }

        // GET: api/LearnerDocuments/{id}/download
        [HttpGet("{id}/download")]
        public async Task<IActionResult> DownloadDocument(int id)
        {
            try
            {
                var document = await _context.LearnerDocuments.FindAsync(id);
                if (document == null)
                {
                    return NotFound(new { message = "Document not found" });
                }

                // Decrypt file
                var decryptedContent = await _encryptionService.DecryptFileAsync(
                    document.EncryptedFilePath,
                    document.EncryptionIV
                );

                // Verify file integrity
                if (!_encryptionService.VerifyFileIntegrity(decryptedContent, document.FileHash))
                {
                    _logger.LogWarning($"File integrity check failed for document ID {id}");
                    return StatusCode(500, new { message = "File integrity verification failed" });
                }

                _logger.LogInformation($"Document downloaded: ID={id}, LearnerId={document.LearnerId}, Type={document.DocumentType}");

                // Return file with proper content type
                return File(decryptedContent, document.MimeType, document.FileName);
            }
            catch (FileNotFoundException)
            {
                _logger.LogError($"Encrypted file not found for document ID {id}");
                return NotFound(new { message = "Document file not found on server" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error downloading document ID {id}");
                return StatusCode(500, new { message = "An error occurred while downloading the document" });
            }
        }

        // DELETE: api/LearnerDocuments/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDocument(int id)
        {
            try
            {
                var document = await _context.LearnerDocuments.FindAsync(id);
                if (document == null)
                {
                    return NotFound(new { message = "Document not found" });
                }

                // Delete encrypted file from disk
                await _encryptionService.DeleteEncryptedFileAsync(document.EncryptedFilePath);

                // Delete database record
                _context.LearnerDocuments.Remove(document);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Document deleted: ID={id}, LearnerId={document.LearnerId}, Type={document.DocumentType}");

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting document ID {id}");
                return StatusCode(500, new { message = "An error occurred while deleting the document" });
            }
        }

        // GET: api/LearnerDocuments/types
        [HttpGet("types")]
        public ActionResult<IEnumerable<string>> GetDocumentTypes()
        {
            return Ok(AllowedDocumentTypes);
        }
    }
}
