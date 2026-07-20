using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using backend.Services.Interfaces;
using System.Security.Claims;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LearningMaterialsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<LearningMaterialsController> _logger;
        private readonly ILearnerDocumentEncryptionService _encryptionService;

        private static readonly string[] AllowedMimeTypes = new[]
        {
            "application/pdf",
            "video/mp4", "video/webm", "video/ogg",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "image/jpeg", "image/png", "image/gif", "image/webp"
        };

        private const long MaxFileSize = 100 * 1024 * 1024; // 100 MB

        public LearningMaterialsController(
            ApplicationDbContext context,
            ILogger<LearningMaterialsController> logger,
            ILearnerDocumentEncryptionService encryptionService)
        {
            _context = context;
            _logger = logger;
            _encryptionService = encryptionService;
        }

        // ─── GET materials by QUALIFICATION (new primary endpoint) ──────────
        [HttpGet("qualification/{projectQualificationId}")]
        public async Task<ActionResult<IEnumerable<LearningMaterialResponseDto>>> GetMaterialsByQualification(int projectQualificationId)
        {
            try
            {
                var materials = await _context.LearningMaterials
                    .Include(m => m.UploadedByUser)
                    .Where(m => m.ProjectQualificationId == projectQualificationId && m.IsActive)
                    .OrderBy(m => m.DisplayOrder)
                    .ThenBy(m => m.CreatedAt)
                    .Select(m => new LearningMaterialResponseDto
                    {
                        Id = m.Id,
                        Title = m.Title,
                        Description = m.Description,
                        MaterialType = m.MaterialType,
                        FileName = m.FileName,
                        FileSize = m.FileSize,
                        MimeType = m.MimeType,
                        ExternalUrl = m.ExternalUrl,
                        DisplayOrder = m.DisplayOrder,
                        CreatedAt = m.CreatedAt,
                        UploadedByUserName = m.UploadedByUser != null
                            ? $"{m.UploadedByUser.FirstName} {m.UploadedByUser.LastName}"
                            : "Unknown"
                    })
                    .ToListAsync();

                return Ok(materials);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching materials for qualification {Id}", projectQualificationId);
                return StatusCode(500, new { message = "Error fetching learning materials" });
            }
        }

        // ─── GET materials by unit standard (legacy / kept for mobile) ───────
        [HttpGet("unit-standard/{unitStandardId}")]
        public async Task<ActionResult<IEnumerable<LearningMaterialResponseDto>>> GetMaterialsByUnitStandard(int unitStandardId)
        {
            try
            {
                var materials = await _context.LearningMaterials
                    .Include(m => m.UploadedByUser)
                    .Where(m => m.ProjectQualificationUnitStandardId == unitStandardId && m.IsActive)
                    .OrderBy(m => m.DisplayOrder)
                    .ThenBy(m => m.CreatedAt)
                    .Select(m => new LearningMaterialResponseDto
                    {
                        Id = m.Id,
                        Title = m.Title,
                        Description = m.Description,
                        MaterialType = m.MaterialType,
                        FileName = m.FileName,
                        FileSize = m.FileSize,
                        MimeType = m.MimeType,
                        ExternalUrl = m.ExternalUrl,
                        DisplayOrder = m.DisplayOrder,
                        CreatedAt = m.CreatedAt,
                        UploadedByUserName = m.UploadedByUser != null
                            ? $"{m.UploadedByUser.FirstName} {m.UploadedByUser.LastName}"
                            : "Unknown"
                    })
                    .ToListAsync();

                return Ok(materials);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching materials for unit standard {Id}", unitStandardId);
                return StatusCode(500, new { message = "Error fetching learning materials" });
            }
        }

        // ─── GET materials for a learner (all qualification-level for their project) ──
        [HttpGet("learner/{learnerId}/materials")]
        public async Task<ActionResult<IEnumerable<LearnerLearningMaterialDto>>> GetLearnerMaterials(int learnerId)
        {
            try
            {
                var learner = await _context.Learners
                    .Include(l => l.ClassEnrollments)
                        .ThenInclude(e => e.SiteClass)
                            .ThenInclude(c => c!.ProjectSite)
                    .FirstOrDefaultAsync(l => l.Id == learnerId);

                if (learner == null)
                    return NotFound(new { message = "Learner not found" });

                var activeEnrollment = learner.ClassEnrollments?.FirstOrDefault(e => e.Status == "Active");
                if (activeEnrollment?.SiteClass?.ProjectSite == null)
                    return Ok(new List<LearnerLearningMaterialDto>());

                var projectId = activeEnrollment.SiteClass.ProjectSite.ProjectId;

                // Qualification-level materials for this project
                var qualMaterials = await (
                    from lm in _context.LearningMaterials
                    join pq in _context.ProjectQualifications on lm.ProjectQualificationId equals pq.Id
                    join plp in _context.ProjectLearningPathways on pq.ProjectLearningPathwayId equals plp.Id
                    where plp.ProjectId == projectId && lm.IsActive
                    orderby lm.DisplayOrder, lm.CreatedAt
                    select new LearnerLearningMaterialDto
                    {
                        Id = lm.Id,
                        Title = lm.Title,
                        Description = lm.Description,
                        MaterialType = lm.MaterialType,
                        FileName = lm.FileName,
                        FileSize = lm.FileSize,
                        MimeType = lm.MimeType,
                        ExternalUrl = lm.ExternalUrl,
                        UnitStandardName = null,
                        QualificationName = pq.OccupationalQualificationId != null
                            ? _context.OccupationalQualifications
                                .Where(q => q.QualificationId == pq.OccupationalQualificationId)
                                .Select(q => q.Name).FirstOrDefault()
                            : _context.LegacyQualifications
                                .Where(q => q.Id == pq.LegacyQualificationId)
                                .Select(q => q.Name).FirstOrDefault()
                    }
                ).ToListAsync();

                // Unit-standard-level materials for this project (legacy)
                var usMaterials = await (
                    from lm in _context.LearningMaterials
                    join pqus in _context.ProjectQualificationUnitStandards on lm.ProjectQualificationUnitStandardId equals pqus.Id
                    join pq in _context.ProjectQualifications on pqus.ProjectQualificationId equals pq.Id
                    join plp in _context.ProjectLearningPathways on pq.ProjectLearningPathwayId equals plp.Id
                    where plp.ProjectId == projectId && lm.IsActive
                    orderby lm.DisplayOrder, lm.CreatedAt
                    select new LearnerLearningMaterialDto
                    {
                        Id = lm.Id,
                        Title = lm.Title,
                        Description = lm.Description,
                        MaterialType = lm.MaterialType,
                        FileName = lm.FileName,
                        FileSize = lm.FileSize,
                        MimeType = lm.MimeType,
                        ExternalUrl = lm.ExternalUrl,
                        UnitStandardName = pqus.UnitStandardType == "Occupational"
                            ? _context.OccupationalUnitStandards
                                .Where(u => u.Id == pqus.UnitStandardId)
                                .Select(u => u.UnitStandardName).FirstOrDefault()
                            : _context.LegacyUnitStandards
                                .Where(u => u.Id == pqus.UnitStandardId)
                                .Select(u => u.UnitStandardName).FirstOrDefault(),
                        QualificationName = pq.OccupationalQualificationId != null
                            ? _context.OccupationalQualifications
                                .Where(q => q.QualificationId == pq.OccupationalQualificationId)
                                .Select(q => q.Name).FirstOrDefault()
                            : _context.LegacyQualifications
                                .Where(q => q.Id == pq.LegacyQualificationId)
                                .Select(q => q.Name).FirstOrDefault()
                    }
                ).ToListAsync();

                return Ok(qualMaterials.Concat(usMaterials).ToList());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching materials for learner {Id}", learnerId);
                return StatusCode(500, new { message = "Error fetching learning materials" });
            }
        }

        // ─── POST upload material for a QUALIFICATION ────────────────────────
        [HttpPost("upload")]
        public async Task<ActionResult<LearningMaterialResponseDto>> UploadMaterial([FromForm] UploadLearningMaterialDto dto)
        {
            try
            {
                // Must supply either qualificationId or unitStandardId
                if (!dto.ProjectQualificationId.HasValue && !dto.UnitStandardId.HasValue)
                    return BadRequest(new { message = "Either ProjectQualificationId or UnitStandardId is required" });

                // Validate qualification exists if supplied
                if (dto.ProjectQualificationId.HasValue)
                {
                    var qual = await _context.ProjectQualifications.FindAsync(dto.ProjectQualificationId.Value);
                    if (qual == null)
                        return NotFound(new { message = "Qualification not found" });
                }

                // Validate unit standard if supplied
                if (dto.UnitStandardId.HasValue)
                {
                    var us = await _context.ProjectQualificationUnitStandards.FindAsync(dto.UnitStandardId.Value);
                    if (us == null)
                        return NotFound(new { message = "Unit standard not found" });
                }

                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                int? userId = null;
                if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out int pid))
                    userId = pid;

                var material = new LearningMaterial
                {
                    ProjectQualificationId = dto.ProjectQualificationId,
                    ProjectQualificationUnitStandardId = dto.UnitStandardId,
                    Title = dto.Title,
                    Description = dto.Description,
                    MaterialType = dto.MaterialType,
                    DisplayOrder = dto.DisplayOrder ?? 0,
                    UploadedByUserId = userId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                if (dto.File != null)
                {
                    if (dto.File.Length > MaxFileSize)
                        return BadRequest(new { message = $"File exceeds {MaxFileSize / 1024 / 1024} MB limit" });

                    var mime = dto.File.ContentType.ToLower();
                    if (!AllowedMimeTypes.Contains(mime))
                        return BadRequest(new { message = "File type not allowed" });

                    byte[] fileContent;
                    using (var ms = new MemoryStream())
                    {
                        await dto.File.CopyToAsync(ms);
                        fileContent = ms.ToArray();
                    }

                    var (encryptedPath, iv, hash) = await _encryptionService.EncryptAndSaveFileAsync(
                        fileContent, dto.File.FileName);

                    material.FileName = dto.File.FileName;
                    material.EncryptedFilePath = encryptedPath;
                    material.FileSize = dto.File.Length;
                    material.MimeType = mime;
                    material.EncryptionIV = iv;
                    material.FileHash = hash;
                }
                else if (!string.IsNullOrEmpty(dto.ExternalUrl))
                {
                    material.ExternalUrl = dto.ExternalUrl;
                }
                else
                {
                    return BadRequest(new { message = "A file or external URL is required" });
                }

                _context.LearningMaterials.Add(material);
                await _context.SaveChangesAsync();

                // Load uploader name
                string uploaderName = "Unknown";
                if (userId.HasValue)
                {
                    var uploader = await _context.Users.FindAsync(userId.Value);
                    if (uploader != null) uploaderName = $"{uploader.FirstName} {uploader.LastName}";
                }

                return Ok(new LearningMaterialResponseDto
                {
                    Id = material.Id,
                    Title = material.Title,
                    Description = material.Description,
                    MaterialType = material.MaterialType,
                    FileName = material.FileName,
                    FileSize = material.FileSize,
                    MimeType = material.MimeType,
                    ExternalUrl = material.ExternalUrl,
                    DisplayOrder = material.DisplayOrder,
                    CreatedAt = material.CreatedAt,
                    UploadedByUserName = uploaderName
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading learning material");
                return StatusCode(500, new { message = $"Error uploading: {ex.Message}" });
            }
        }

        // ─── GET download ────────────────────────────────────────────────────
        [HttpGet("{id}/download")]
        public async Task<IActionResult> DownloadMaterial(int id)
        {
            try
            {
                var material = await _context.LearningMaterials.FindAsync(id);
                if (material == null || !material.IsActive)
                    return NotFound(new { message = "Material not found" });

                if (string.IsNullOrEmpty(material.EncryptedFilePath))
                    return BadRequest(new { message = "No downloadable file for this material" });

                var decrypted = await _encryptionService.DecryptFileAsync(
                    material.EncryptedFilePath, material.EncryptionIV ?? string.Empty);

                return File(decrypted, material.MimeType ?? "application/octet-stream", material.FileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error downloading material {Id}", id);
                return StatusCode(500, new { message = "Error downloading material" });
            }
        }

        // ─── DELETE ──────────────────────────────────────────────────────────
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMaterial(int id)
        {
            try
            {
                var material = await _context.LearningMaterials.FindAsync(id);
                if (material == null)
                    return NotFound(new { message = "Material not found" });

                material.IsActive = false;
                material.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting material {Id}", id);
                return StatusCode(500, new { message = "Error deleting material" });
            }
        }

        // ─── PUT update ──────────────────────────────────────────────────────
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateMaterial(int id, [FromBody] UpdateLearningMaterialDto dto)
        {
            try
            {
                var material = await _context.LearningMaterials.FindAsync(id);
                if (material == null)
                    return NotFound(new { message = "Material not found" });

                material.Title = dto.Title ?? material.Title;
                material.Description = dto.Description ?? material.Description;
                material.DisplayOrder = dto.DisplayOrder ?? material.DisplayOrder;
                material.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating material {Id}", id);
                return StatusCode(500, new { message = "Error updating material" });
            }
        }
    }

    // ─── DTOs ────────────────────────────────────────────────────────────────
    public class UploadLearningMaterialDto
    {
        public int? ProjectQualificationId { get; set; }   // qualification-level (primary)
        public int? UnitStandardId { get; set; }           // unit-standard-level (legacy)
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string MaterialType { get; set; } = string.Empty;
        public IFormFile? File { get; set; }
        public string? ExternalUrl { get; set; }
        public int? DisplayOrder { get; set; }
    }

    public class UpdateLearningMaterialDto
    {
        public string? Title { get; set; }
        public string? Description { get; set; }
        public int? DisplayOrder { get; set; }
    }

    public class LearningMaterialResponseDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string MaterialType { get; set; } = string.Empty;
        public string? FileName { get; set; }
        public long? FileSize { get; set; }
        public string? MimeType { get; set; }
        public string? ExternalUrl { get; set; }
        public int DisplayOrder { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? UploadedByUserName { get; set; }
    }

    public class LearnerLearningMaterialDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string MaterialType { get; set; } = string.Empty;
        public string? FileName { get; set; }
        public long? FileSize { get; set; }
        public string? MimeType { get; set; }
        public string? ExternalUrl { get; set; }
        public string? UnitStandardName { get; set; }
        public string? QualificationName { get; set; }
    }
}
