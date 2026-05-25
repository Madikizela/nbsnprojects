using System.ComponentModel.DataAnnotations;

namespace backend.Models.DTOs
{
    public class CreateProjectSiteDto
    {
        [Required]
        public int ProjectId { get; set; }
        
        [Required]
        [StringLength(255)]
        public string SiteName { get; set; } = string.Empty;
        
        [StringLength(50)]
        public string? SiteCode { get; set; }
        
        [StringLength(50)]
        public string? Category { get; set; }
        
        public string? Address { get; set; }
        
        [StringLength(100)]
        public string? Province { get; set; }
        
        [StringLength(100)]
        public string? City { get; set; }
        
        [StringLength(20)]
        public string? PostalCode { get; set; }
        
        [StringLength(100)]
        public string? ContactFirstName { get; set; }
        
        [StringLength(100)]
        public string? ContactLastName { get; set; }
        
        [StringLength(50)]
        public string? ContactCellNumber { get; set; }
        
        [StringLength(50)]
        public string? ContactPhone { get; set; }
        
        [StringLength(255)]
        [EmailAddress]
        public string? ContactEmail { get; set; }
        
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public int? Capacity { get; set; }
        
        [StringLength(50)]
        public string Status { get; set; } = "Active";
        
        public string? Description { get; set; }
    }

    public class UpdateProjectSiteDto
    {
        [Required]
        [StringLength(255)]
        public string SiteName { get; set; } = string.Empty;
        
        [StringLength(50)]
        public string? SiteCode { get; set; }
        
        [StringLength(50)]
        public string? Category { get; set; }
        
        public string? Address { get; set; }
        
        [StringLength(100)]
        public string? Province { get; set; }
        
        [StringLength(100)]
        public string? City { get; set; }
        
        [StringLength(20)]
        public string? PostalCode { get; set; }
        
        [StringLength(100)]
        public string? ContactFirstName { get; set; }
        
        [StringLength(100)]
        public string? ContactLastName { get; set; }
        
        [StringLength(50)]
        public string? ContactCellNumber { get; set; }
        
        [StringLength(50)]
        public string? ContactPhone { get; set; }
        
        [StringLength(255)]
        [EmailAddress]
        public string? ContactEmail { get; set; }
        
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public int? Capacity { get; set; }
        
        [StringLength(50)]
        public string Status { get; set; } = "Active";
        
        public string? Description { get; set; }
    }

    public class ProjectSiteResponseDto
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public string ProjectName { get; set; } = string.Empty;
        public string SiteName { get; set; } = string.Empty;
        public string? SiteCode { get; set; }
        public string? Category { get; set; }
        public string? Address { get; set; }
        public string? Province { get; set; }
        public string? City { get; set; }
        public string? PostalCode { get; set; }
        public string? ContactFirstName { get; set; }
        public string? ContactLastName { get; set; }
        public string? ContactCellNumber { get; set; }
        public string? ContactPhone { get; set; }
        public string? ContactEmail { get; set; }
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public int? Capacity { get; set; }
        public int TotalClasses { get; set; }
        public string Status { get; set; } = "Active";
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public string? CreatedByUserName { get; set; }
    }
}
