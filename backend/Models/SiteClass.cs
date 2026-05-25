using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    [Table("SiteClasses")]
    public class SiteClass
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public int ProjectSiteId { get; set; }
        
        [Required]
        [StringLength(255)]
        public string ClassName { get; set; } = string.Empty;
        
        [Required]
        public int MaxLearners { get; set; }
        
        [StringLength(50)]
        public string Status { get; set; } = "Active";
        
        [Required]
        public DateTime CreatedAt { get; set; }
        
        [Required]
        public DateTime UpdatedAt { get; set; }
        
        public int? CreatedByUserId { get; set; }
        
        // Navigation properties
        [ForeignKey("ProjectSiteId")]
        public virtual ProjectSite? ProjectSite { get; set; }
        
        [ForeignKey("CreatedByUserId")]
        public virtual User? CreatedByUser { get; set; }
        
        public virtual ICollection<ClassEnrollment> ClassEnrollments { get; set; } = new List<ClassEnrollment>();
    }
}
