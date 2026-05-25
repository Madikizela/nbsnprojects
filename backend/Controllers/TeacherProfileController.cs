using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using backend.Models.DTOs;

namespace backend.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class TeacherProfileController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<TeacherProfileController> _logger;

        public TeacherProfileController(
            ApplicationDbContext context,
            ILogger<TeacherProfileController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/TeacherProfile/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetTeacherProfile(int id)
        {
            try
            {
                var teacher = await _context.Users
                    .Where(u => u.Id == id && u.Role == UserRole.Teacher)
                    .Select(u => new TeacherProfileResponseDTO
                    {
                        Id = u.Id,
                        FirstName = u.FirstName,
                        LastName = u.LastName,
                        Email = u.Email,
                        PhoneNumber = u.PhoneNumber,
                        AddressLine1 = u.AddressLine1,
                        AddressLine2 = u.AddressLine2,
                        City = u.City,
                        Province = u.Province,
                        PostalCode = u.PostalCode,
                        ProfileImage = u.ProfileImage,
                        Signature = u.Signature,
                        PracticeNumber = u.PracticeNumber,
                        UpdatedAt = u.UpdatedAt
                    })
                    .FirstOrDefaultAsync();

                if (teacher == null)
                {
                    return NotFound(new { message = "Teacher not found" });
                }

                return Ok(teacher);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching teacher profile");
                return StatusCode(500, new { message = "An error occurred while fetching profile" });
            }
        }

        // PUT: api/TeacherProfile/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTeacherProfile(int id, [FromBody] UpdateTeacherProfileDTO dto)
        {
            try
            {
                var teacher = await _context.Users.FindAsync(id);
                
                if (teacher == null)
                {
                    return NotFound(new { message = "Teacher not found" });
                }

                if (teacher.Role != UserRole.Teacher)
                {
                    return BadRequest(new { message = "User is not a teacher" });
                }

                // Check if email is being changed and if it's already in use
                if (teacher.Email.ToLower() != dto.Email.ToLower())
                {
                    var emailExists = await _context.Users
                        .AnyAsync(u => u.Email.ToLower() == dto.Email.ToLower() && u.Id != id);
                    
                    if (emailExists)
                    {
                        return BadRequest(new { message = "Email is already in use by another user" });
                    }
                }

                // Update teacher information
                teacher.FirstName = dto.FirstName.Trim();
                teacher.LastName = dto.LastName.Trim();
                teacher.Email = dto.Email.Trim().ToLower();
                teacher.PhoneNumber = dto.PhoneNumber?.Trim();
                teacher.AddressLine1 = dto.AddressLine1?.Trim();
                teacher.AddressLine2 = dto.AddressLine2?.Trim();
                teacher.City = dto.City?.Trim();
                teacher.Province = dto.Province?.Trim();
                teacher.PostalCode = dto.PostalCode?.Trim();
                
                // Update profile image if provided
                if (!string.IsNullOrWhiteSpace(dto.ProfileImage))
                {
                    teacher.ProfileImage = dto.ProfileImage;
                }

                // Update signature if provided
                if (!string.IsNullOrWhiteSpace(dto.Signature))
                {
                    teacher.Signature = dto.Signature;
                }
                
                // Update practice number
                teacher.PracticeNumber = dto.PracticeNumber?.Trim();

                teacher.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Teacher profile updated: {TeacherId}", id);

                var response = new TeacherProfileResponseDTO
                {
                    Id = teacher.Id,
                    FirstName = teacher.FirstName,
                    LastName = teacher.LastName,
                    Email = teacher.Email,
                    PhoneNumber = teacher.PhoneNumber,
                    AddressLine1 = teacher.AddressLine1,
                    AddressLine2 = teacher.AddressLine2,
                    City = teacher.City,
                    Province = teacher.Province,
                    PostalCode = teacher.PostalCode,
                    ProfileImage = teacher.ProfileImage,
                    Signature = teacher.Signature,
                    PracticeNumber = teacher.PracticeNumber,
                    UpdatedAt = teacher.UpdatedAt
                };

                return Ok(new
                {
                    message = "Profile updated successfully",
                    profile = response
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating teacher profile");
                return StatusCode(500, new { message = "An error occurred while updating profile" });
            }
        }
    }
}
