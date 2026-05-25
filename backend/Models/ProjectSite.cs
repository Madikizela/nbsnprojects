using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    [Table("ProjectSites")]
    public class ProjectSite
    {
        [Key]
        public int Id { get; set; }
        
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
        public string? ContactEmail { get; set; }
        
        [Column(TypeName = "decimal(10,8)")]
        public decimal? Latitude { get; set; }
        
        [Column(TypeName = "decimal(11,8)")]
        public decimal? Longitude { get; set; }
        
        public int? Capacity { get; set; }
        
        [StringLength(50)]
        public string Status { get; set; } = "Active";
        
        public string? Description { get; set; }
        
        [Required]
        public DateTime CreatedAt { get; set; }
        
        [Required]
        public DateTime UpdatedAt { get; set; }
        
        public int? CreatedByUserId { get; set; }
        
        // Navigation properties
        [ForeignKey("ProjectId")]
        public virtual Project? Project { get; set; }
        
        [ForeignKey("CreatedByUserId")]
        public virtual User? CreatedByUser { get; set; }
        
        public virtual ICollection<SiteClass> SiteClasses { get; set; } = new List<SiteClass>();
    }
}
