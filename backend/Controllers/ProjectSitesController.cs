using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using backend.Models.DTOs;
using System.Security.Claims;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProjectSitesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ProjectSitesController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/ProjectSites/project/{projectId}
        [HttpGet("project/{projectId}")]
        public async Task<ActionResult<IEnumerable<ProjectSiteResponseDto>>> GetProjectSites(int projectId)
        {
            var sites = await _context.ProjectSites
                .Include(s => s.Project)
                .Include(s => s.CreatedByUser)
                .Where(s => s.ProjectId == projectId)
                .OrderByDescending(s => s.CreatedAt)
                .Select(s => new ProjectSiteResponseDto
                {
                    Id = s.Id,
                    ProjectId = s.ProjectId,
                    ProjectName = s.Project != null ? s.Project.ProjectName : "",
                    SiteName = s.SiteName,
                    SiteCode = s.SiteCode,
                    Category = s.Category,
                    Address = s.Address,
                    Province = s.Province,
                    City = s.City,
                    PostalCode = s.PostalCode,
                    ContactFirstName = s.ContactFirstName,
                    ContactLastName = s.ContactLastName,
                    ContactCellNumber = s.ContactCellNumber,
                    ContactPhone = s.ContactPhone,
                    ContactEmail = s.ContactEmail,
                    Latitude = s.Latitude,
                    Longitude = s.Longitude,
                    Capacity = s.Capacity,
                    TotalClasses = s.SiteClasses.Count,
                    Status = s.Status,
                    Description = s.Description,
                    CreatedAt = s.CreatedAt,
                    UpdatedAt = s.UpdatedAt,
                    CreatedByUserName = s.CreatedByUser != null ? (s.CreatedByUser.FirstName + " " + s.CreatedByUser.LastName) : null
                })
                .ToListAsync();

            return Ok(sites);
        }

        // GET: api/ProjectSites/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<ProjectSiteResponseDto>> GetProjectSite(int id)
        {
            var site = await _context.ProjectSites
                .Include(s => s.Project)
                .Include(s => s.CreatedByUser)
                .Where(s => s.Id == id)
                .Select(s => new ProjectSiteResponseDto
                {
                    Id = s.Id,
                    ProjectId = s.ProjectId,
                    ProjectName = s.Project != null ? s.Project.ProjectName : "",
                    SiteName = s.SiteName,
                    SiteCode = s.SiteCode,
                    Category = s.Category,
                    Address = s.Address,
                    Province = s.Province,
                    City = s.City,
                    PostalCode = s.PostalCode,
                    ContactFirstName = s.ContactFirstName,
                    ContactLastName = s.ContactLastName,
                    ContactCellNumber = s.ContactCellNumber,
                    ContactPhone = s.ContactPhone,
                    ContactEmail = s.ContactEmail,
                    Latitude = s.Latitude,
                    Longitude = s.Longitude,
                    Capacity = s.Capacity,
                    TotalClasses = s.SiteClasses.Count,
                    Status = s.Status,
                    Description = s.Description,
                    CreatedAt = s.CreatedAt,
                    UpdatedAt = s.UpdatedAt,
                    CreatedByUserName = s.CreatedByUser != null ? (s.CreatedByUser.FirstName + " " + s.CreatedByUser.LastName) : null
                })
                .FirstOrDefaultAsync();

            if (site == null)
            {
                return NotFound();
            }

            return Ok(site);
        }

        // POST: api/ProjectSites
        [HttpPost]
        public async Task<ActionResult<ProjectSiteResponseDto>> CreateProjectSite(CreateProjectSiteDto dto)
        {
            // Get user ID from claims
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            int? userId = null;
            if (int.TryParse(userIdClaim, out int parsedUserId))
            {
                userId = parsedUserId;
            }

            var site = new ProjectSite
            {
                ProjectId = dto.ProjectId,
                SiteName = dto.SiteName,
                SiteCode = dto.SiteCode,
                Category = dto.Category,
                Address = dto.Address,
                Province = dto.Province,
                City = dto.City,
                PostalCode = dto.PostalCode,
                ContactFirstName = dto.ContactFirstName,
                ContactLastName = dto.ContactLastName,
                ContactCellNumber = dto.ContactCellNumber,
                ContactPhone = dto.ContactPhone,
                ContactEmail = dto.ContactEmail,
                Latitude = dto.Latitude,
                Longitude = dto.Longitude,
                Capacity = dto.Capacity,
                Status = dto.Status,
                Description = dto.Description,
                CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc),
                UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc),
                CreatedByUserId = userId
            };

            _context.ProjectSites.Add(site);
            await _context.SaveChangesAsync();

            // Reload with navigation properties
            var createdSite = await _context.ProjectSites
                .Include(s => s.Project)
                .Include(s => s.CreatedByUser)
                .Where(s => s.Id == site.Id)
                .Select(s => new ProjectSiteResponseDto
                {
                    Id = s.Id,
                    ProjectId = s.ProjectId,
                    ProjectName = s.Project != null ? s.Project.ProjectName : "",
                    SiteName = s.SiteName,
                    SiteCode = s.SiteCode,
                    Category = s.Category,
                    Address = s.Address,
                    Province = s.Province,
                    City = s.City,
                    PostalCode = s.PostalCode,
                    ContactFirstName = s.ContactFirstName,
                    ContactLastName = s.ContactLastName,
                    ContactCellNumber = s.ContactCellNumber,
                    ContactPhone = s.ContactPhone,
                    ContactEmail = s.ContactEmail,
                    Latitude = s.Latitude,
                    Longitude = s.Longitude,
                    Capacity = s.Capacity,
                    TotalClasses = s.SiteClasses.Count,
                    Status = s.Status,
                    Description = s.Description,
                    CreatedAt = s.CreatedAt,
                    UpdatedAt = s.UpdatedAt,
                    CreatedByUserName = s.CreatedByUser != null ? (s.CreatedByUser.FirstName + " " + s.CreatedByUser.LastName) : null
                })
                .FirstOrDefaultAsync();

            return CreatedAtAction(nameof(GetProjectSite), new { id = site.Id }, createdSite);
        }

        // PUT: api/ProjectSites/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProjectSite(int id, UpdateProjectSiteDto dto)
        {
            var site = await _context.ProjectSites.FindAsync(id);
            if (site == null)
            {
                return NotFound();
            }

            site.SiteName = dto.SiteName;
            site.SiteCode = dto.SiteCode;
            site.Category = dto.Category;
            site.Address = dto.Address;
            site.Province = dto.Province;
            site.City = dto.City;
            site.PostalCode = dto.PostalCode;
            site.ContactFirstName = dto.ContactFirstName;
            site.ContactLastName = dto.ContactLastName;
            site.ContactCellNumber = dto.ContactCellNumber;
            site.ContactPhone = dto.ContactPhone;
            site.ContactEmail = dto.ContactEmail;
            site.Latitude = dto.Latitude;
            site.Longitude = dto.Longitude;
            site.Capacity = dto.Capacity;
            site.Status = dto.Status;
            site.Description = dto.Description;
            site.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);

            await _context.SaveChangesAsync();

            // Return the updated site with navigation properties
            var updatedSite = await _context.ProjectSites
                .Include(s => s.Project)
                .Include(s => s.CreatedByUser)
                .Where(s => s.Id == id)
                .Select(s => new ProjectSiteResponseDto
                {
                    Id = s.Id,
                    ProjectId = s.ProjectId,
                    ProjectName = s.Project != null ? s.Project.ProjectName : "",
                    SiteName = s.SiteName,
                    SiteCode = s.SiteCode,
                    Category = s.Category,
                    Address = s.Address,
                    Province = s.Province,
                    City = s.City,
                    PostalCode = s.PostalCode,
                    ContactFirstName = s.ContactFirstName,
                    ContactLastName = s.ContactLastName,
                    ContactCellNumber = s.ContactCellNumber,
                    ContactPhone = s.ContactPhone,
                    ContactEmail = s.ContactEmail,
                    Latitude = s.Latitude,
                    Longitude = s.Longitude,
                    Capacity = s.Capacity,
                    TotalClasses = s.SiteClasses.Count,
                    Status = s.Status,
                    Description = s.Description,
                    CreatedAt = s.CreatedAt,
                    UpdatedAt = s.UpdatedAt,
                    CreatedByUserName = s.CreatedByUser != null ? (s.CreatedByUser.FirstName + " " + s.CreatedByUser.LastName) : null
                })
                .FirstOrDefaultAsync();

            return Ok(updatedSite);
        }

        // DELETE: api/ProjectSites/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProjectSite(int id)
        {
            var site = await _context.ProjectSites.FindAsync(id);
            if (site == null)
            {
                return NotFound();
            }

            _context.ProjectSites.Remove(site);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
