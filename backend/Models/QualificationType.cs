using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class QualificationType
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        [StringLength(50)]
        public string Name { get; set; } = string.Empty; // "Legacy" or "Occupational"
        
        public string? Description { get; set; }
        
        // Navigation properties
        public virtual ICollection<ProjectQualification> ProjectQualifications { get; set; } = new List<ProjectQualification>();
    }
}