using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using backend.Models.DTOs;
using System.Security.Claims;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SiteClassesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SiteClassesController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/SiteClasses/site/{siteId}
        [HttpGet("site/{siteId}")]
        public async Task<ActionResult<IEnumerable<SiteClassResponseDto>>> GetSiteClasses(int siteId)
        {
            var classes = await _context.SiteClasses
                .Include(c => c.ProjectSite)
                .Include(c => c.CreatedByUser)
                .Where(c => c.ProjectSiteId == siteId)
                .OrderBy(c => c.ClassName)
                .Select(c => new SiteClassResponseDto
                {
                    Id = c.Id,
                    ProjectSiteId = c.ProjectSiteId,
                    SiteName = c.ProjectSite != null ? c.ProjectSite.SiteName : "",
                    ClassName = c.ClassName,
                    MaxLearners = c.MaxLearners,
                    CurrentLearners = _context.ClassEnrollments.Count(ce => ce.SiteClassId == c.Id && ce.Status == "Active"),
                    Status = c.Status,
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt,
                    CreatedByUserName = c.CreatedByUser != null ? (c.CreatedByUser.FirstName + " " + c.CreatedByUser.LastName) : null
                })
                .ToListAsync();

            return Ok(classes);
        }

        // GET: api/SiteClasses/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<SiteClassResponseDto>> GetSiteClass(int id)
        {
            var siteClass = await _context.SiteClasses
                .Include(c => c.ProjectSite)
                .Include(c => c.CreatedByUser)
                .Where(c => c.Id == id)
                .Select(c => new SiteClassResponseDto
                {
                    Id = c.Id,
                    ProjectSiteId = c.ProjectSiteId,
                    SiteName = c.ProjectSite != null ? c.ProjectSite.SiteName : "",
                    ClassName = c.ClassName,
                    MaxLearners = c.MaxLearners,
                    CurrentLearners = _context.ClassEnrollments.Count(ce => ce.SiteClassId == c.Id && ce.Status == "Active"),
                    Status = c.Status,
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt,
                    CreatedByUserName = c.CreatedByUser != null ? (c.CreatedByUser.FirstName + " " + c.CreatedByUser.LastName) : null
                })
                .FirstOrDefaultAsync();

            if (siteClass == null)
            {
                return NotFound();
            }

            return Ok(siteClass);
        }

        // POST: api/SiteClasses
        [HttpPost]
        public async Task<ActionResult<SiteClassResponseDto>> CreateSiteClass(CreateSiteClassDto dto)
        {
            // Get user ID from claims
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            int? userId = null;
            if (int.TryParse(userIdClaim, out int parsedUserId))
            {
                userId = parsedUserId;
            }

            var siteClass = new SiteClass
            {
                ProjectSiteId = dto.ProjectSiteId,
                ClassName = dto.ClassName.Trim(),
                MaxLearners = dto.MaxLearners,
                Status = "Active",
                CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc),
                UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc),
                CreatedByUserId = userId
            };

            _context.SiteClasses.Add(siteClass);
            await _context.SaveChangesAsync();

            // Reload with navigation properties
            var createdClass = await _context.SiteClasses
                .Include(c => c.ProjectSite)
                .Include(c => c.CreatedByUser)
                .Where(c => c.Id == siteClass.Id)
                .Select(c => new SiteClassResponseDto
                {
                    Id = c.Id,
                    ProjectSiteId = c.ProjectSiteId,
                    SiteName = c.ProjectSite != null ? c.ProjectSite.SiteName : "",
                    ClassName = c.ClassName,
                    MaxLearners = c.MaxLearners,
                    CurrentLearners = _context.ClassEnrollments.Count(ce => ce.SiteClassId == c.Id && ce.Status == "Active"),
                    Status = c.Status,
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt,
                    CreatedByUserName = c.CreatedByUser != null ? (c.CreatedByUser.FirstName + " " + c.CreatedByUser.LastName) : null
                })
                .FirstOrDefaultAsync();

            return CreatedAtAction(nameof(GetSiteClass), new { id = siteClass.Id }, createdClass);
        }

        // PUT: api/SiteClasses/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateSiteClass(int id, UpdateSiteClassDto dto)
        {
            var siteClass = await _context.SiteClasses.FindAsync(id);
            if (siteClass == null)
            {
                return NotFound();
            }

            siteClass.ClassName = dto.ClassName.Trim();
            siteClass.MaxLearners = dto.MaxLearners;
            siteClass.Status = dto.Status;
            siteClass.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/SiteClasses/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSiteClass(int id)
        {
            var siteClass = await _context.SiteClasses.FindAsync(id);
            if (siteClass == null)
            {
                return NotFound();
            }

            _context.SiteClasses.Remove(siteClass);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
