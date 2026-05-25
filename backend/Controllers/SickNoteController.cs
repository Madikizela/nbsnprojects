using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using backend.Models.DTOs;
using backend.Services.Interfaces;
using System.Security.Claims;

namespace backend.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class SickNoteController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IFileEncryptionService _fileEncryptionService;
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<SickNoteController> _logger;

        public SickNoteController(
            ApplicationDbContext context,
            IFileEncryptionService fileEncryptionService,
            IWebHostEnvironment environment,
            ILogger<SickNoteController> logger)
        {
            _context = context;
            _fileEncryptionService = fileEncryptionService;
            _environment = environment;
            _logger = logger;
        }

        [HttpPost("upload")]
        [DisableRequestSizeLimit]
        public async Task<IActionResult> UploadSickNote([FromForm] CreateSickNoteDTO dto)
        {
            try
            {
                _logger.LogInformation("Sick note upload started for learner {LearnerId}", dto.LearnerId);

                var file = dto.File;
                if (file == null || file.Length == 0)
                {
                    _logger.LogWarning("Upload attempt with no file for learner {LearnerId}", dto.LearnerId);
                    return BadRequest(new { message = "No file uploaded. Please ensure the file is attached to the 'File' field." });
                }

                var learner = await _context.Learners.FindAsync(dto.LearnerId);
                if (learner == null)
                {
                    _logger.LogWarning("Learner {LearnerId} not found for sick note upload", dto.LearnerId);
                    return NotFound(new { message = "Learner not found" });
                }

                // Check for overlapping sick notes
                var startDate = dto.StartDate.Kind == DateTimeKind.Unspecified ? DateTime.SpecifyKind(dto.StartDate, DateTimeKind.Utc) : dto.StartDate.ToUniversalTime();
                var endDate = dto.EndDate.Kind == DateTimeKind.Unspecified ? DateTime.SpecifyKind(dto.EndDate, DateTimeKind.Utc) : dto.EndDate.ToUniversalTime();

                var overlappingSickNote = await _context.SickNotes
                    .Where(s => s.LearnerId == dto.LearnerId && 
                               (s.Status == "Pending" || s.Status == "Approved") &&
                               ((startDate >= s.StartDate && startDate <= s.EndDate) || 
                                (endDate >= s.StartDate && endDate <= s.EndDate) ||
                                (startDate <= s.StartDate && endDate >= s.EndDate)))
                    .FirstOrDefaultAsync();

                if (overlappingSickNote != null)
                {
                    var status = overlappingSickNote.Status.ToLower();
                    return BadRequest(new { 
                        message = $"An {status} sick note already exists for this learner covering some or all of these dates ({overlappingSickNote.StartDate:yyyy-MM-dd} to {overlappingSickNote.EndDate:yyyy-MM-dd})." 
                    });
                }

                // Create storage directory
                var uploadsDir = Path.Combine(_environment.ContentRootPath, "uploads", "sick-notes");
                if (!Directory.Exists(uploadsDir))
                {
                    Directory.CreateDirectory(uploadsDir);
                }

                // Generate unique filename
                var extension = Path.GetExtension(file.FileName) ?? ".jpg";
                var fileName = $"sicknote_{dto.LearnerId}_{DateTime.UtcNow.Ticks}{extension}";
                var finalPath = Path.Combine(uploadsDir, fileName);

                _logger.LogInformation("Saving sick note to {Path}", finalPath);

                // Save file directly
                using (var stream = new FileStream(finalPath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                var iv = Guid.NewGuid().ToString().Replace("-", "").Substring(0, 16);
                
                var sickNote = new SickNote
                {
                    LearnerId = dto.LearnerId,
                    MedicalFacility = dto.MedicalFacility,
                    PractitionerName = dto.PractitionerName,
                    StartDate = dto.StartDate.Kind == DateTimeKind.Unspecified ? DateTime.SpecifyKind(dto.StartDate, DateTimeKind.Utc) : dto.StartDate.ToUniversalTime(),
                    EndDate = dto.EndDate.Kind == DateTimeKind.Unspecified ? DateTime.SpecifyKind(dto.EndDate, DateTimeKind.Utc) : dto.EndDate.ToUniversalTime(),
                    IssuedDate = dto.IssuedDate.Kind == DateTimeKind.Unspecified ? DateTime.SpecifyKind(dto.IssuedDate, DateTimeKind.Utc) : dto.IssuedDate.ToUniversalTime(),
                    EncryptedFilePath = Path.Combine("uploads", "sick-notes", fileName),
                    EncryptionIV = iv,
                    Status = "Pending",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.SickNotes.Add(sickNote);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Sick note {Id} uploaded successfully for learner {LearnerId}", sickNote.Id, dto.LearnerId);
                return Ok(new { message = "Sick note uploaded successfully", sickNoteId = sickNote.Id });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading sick note for learner {LearnerId}", dto.LearnerId);
                return StatusCode(500, new { message = "An error occurred while uploading sick note: " + ex.Message });
            }
        }

        [HttpGet("list")]
        public async Task<IActionResult> GetAllSickNotes()
        {
            try
            {
                _logger.LogInformation("Fetching all sick notes from database");
                
                // Get all sick notes
                var sickNotes = await _context.SickNotes
                    .OrderByDescending(s => s.CreatedAt)
                    .ToListAsync();

                _logger.LogInformation("Retrieved {Count} raw sick note records", sickNotes.Count);

                var response = new List<SickNoteResponseDTO>();
                
                foreach (var s in sickNotes)
                {
                    try 
                    {
                        var learner = await _context.Learners.FindAsync(s.LearnerId);
                        
                        // Ensure dates are UTC for JSON serialization
                        var startDate = s.StartDate.Kind == DateTimeKind.Unspecified 
                            ? DateTime.SpecifyKind(s.StartDate, DateTimeKind.Utc) 
                            : s.StartDate.ToUniversalTime();
                            
                        var endDate = s.EndDate.Kind == DateTimeKind.Unspecified 
                            ? DateTime.SpecifyKind(s.EndDate, DateTimeKind.Utc) 
                            : s.EndDate.ToUniversalTime();
                            
                        var issuedDate = s.IssuedDate.Kind == DateTimeKind.Unspecified 
                            ? DateTime.SpecifyKind(s.IssuedDate, DateTimeKind.Utc) 
                            : s.IssuedDate.ToUniversalTime();
                            
                        var createdAt = s.CreatedAt.Kind == DateTimeKind.Unspecified 
                            ? DateTime.SpecifyKind(s.CreatedAt, DateTimeKind.Utc) 
                            : s.CreatedAt.ToUniversalTime();

                        response.Add(new SickNoteResponseDTO
                        {
                            Id = s.Id,
                            LearnerId = s.LearnerId,
                            LearnerName = learner != null ? $"{learner.FirstName} {learner.LastName}" : $"Learner #{s.LearnerId}",
                            MedicalFacility = s.MedicalFacility,
                            PractitionerName = s.PractitionerName,
                            StartDate = startDate,
                            EndDate = endDate,
                            IssuedDate = issuedDate,
                            Status = s.Status,
                            RejectionReason = s.RejectionReason,
                            CreatedAt = createdAt
                        });
                    }
                    catch (Exception itemEx)
                    {
                        _logger.LogError(itemEx, "Error processing sick note item {Id}", s.Id);
                        // Continue to next item instead of failing whole request
                    }
                }

                _logger.LogInformation("Returning {Count} sick notes in response", response.Count);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Critical error in GetAllSickNotes");
                return StatusCode(500, new { message = "An error occurred while fetching sick notes", details = ex.Message });
            }
        }

        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingSickNotes()
        {
            var pending = await _context.SickNotes
                .Include(s => s.Learner)
                .Where(s => s.Status == "Pending")
                .Select(s => new SickNoteResponseDTO
                {
                    Id = s.Id,
                    LearnerId = s.LearnerId,
                    LearnerName = $"{s.Learner!.FirstName} {s.Learner.LastName}",
                    MedicalFacility = s.MedicalFacility,
                    PractitionerName = s.PractitionerName,
                    StartDate = s.StartDate,
                    EndDate = s.EndDate,
                    IssuedDate = s.IssuedDate,
                    Status = s.Status,
                    CreatedAt = s.CreatedAt
                })
                .ToListAsync();

            return Ok(pending);
        }

        [HttpGet("{id}/file")]
        public async Task<IActionResult> GetSickNoteFile(int id)
        {
            try
            {
                var sickNote = await _context.SickNotes.FindAsync(id);
                if (sickNote == null)
                    return NotFound(new { message = "Sick note not found" });

                var filePath = Path.Combine(_environment.ContentRootPath, sickNote.EncryptedFilePath);
                if (!System.IO.File.Exists(filePath))
                    return NotFound(new { message = "File not found on disk" });

                // Since the upload logic in SickNoteController was simplified and just moved the file
                // without actual encryption (based on the comment in UploadSickNote),
                // we'll just return the file for now.
                
                var contentType = "application/pdf"; // Default to PDF
                if (filePath.EndsWith(".jpg", StringComparison.OrdinalIgnoreCase) || 
                    filePath.EndsWith(".jpeg", StringComparison.OrdinalIgnoreCase)) contentType = "image/jpeg";
                else if (filePath.EndsWith(".png", StringComparison.OrdinalIgnoreCase)) contentType = "image/png";

                var bytes = await System.IO.File.ReadAllBytesAsync(filePath);
                return File(bytes, contentType, Path.GetFileName(filePath));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving sick note file");
                return StatusCode(500, new { message = "An error occurred while retrieving sick note file" });
            }
        }

        [HttpPost("{id}/approve")]
        public async Task<IActionResult> ApproveSickNote(int id, [FromBody] ApproveSickNoteDTO dto)
        {
            var sickNote = await _context.SickNotes.FindAsync(id);
            if (sickNote == null)
                return NotFound(new { message = "Sick note not found" });

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            int? userId = int.TryParse(userIdClaim, out int idVal) ? idVal : null;

            sickNote.Status = dto.IsApproved ? "Approved" : "Rejected";
            sickNote.ApprovedByUserId = userId;
            sickNote.ApprovedAt = DateTime.UtcNow;
            sickNote.RejectionReason = dto.RejectionReason;
            sickNote.UpdatedAt = DateTime.UtcNow;

            if (dto.IsApproved)
            {
                // Logic to update attendance: Mark all days in range as "Excused"
                var startDate = sickNote.StartDate.Date;
                var endDate = sickNote.EndDate.Date;

                // Get the class the learner is currently in
                var enrollment = await _context.ClassEnrollments
                    .FirstOrDefaultAsync(ce => ce.LearnerId == sickNote.LearnerId && ce.Status == "Active");

                if (enrollment != null)
                {
                    for (var date = startDate; date <= endDate; date = date.AddDays(1))
                    {
                        var attendance = await _context.LearnerAttendances
                            .FirstOrDefaultAsync(la => la.LearnerId == sickNote.LearnerId && 
                                                    la.ClassId == enrollment.SiteClassId && 
                                                    la.AttendanceDate.Date == date.Date);

                        if (attendance == null)
                        {
                            attendance = new LearnerAttendance
                            {
                                LearnerId = sickNote.LearnerId,
                                ClassId = enrollment.SiteClassId,
                                AttendanceDate = date.Date,
                                Status = "Excused",
                                Notes = "Sick note approved",
                                CreatedAt = DateTime.UtcNow,
                                UpdatedAt = DateTime.UtcNow
                            };
                            _context.LearnerAttendances.Add(attendance);
                        }
                        else
                        {
                            attendance.Status = "Excused";
                            attendance.Notes = "Sick note approved (updated from " + attendance.Status + ")";
                            attendance.UpdatedAt = DateTime.UtcNow;
                        }
                    }
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = $"Sick note {sickNote.Status.ToLower()} successfully" });
        }
    }
}
