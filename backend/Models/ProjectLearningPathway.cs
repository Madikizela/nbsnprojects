using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class ProjectLearningPathway
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public int ProjectId { get; set; }
        
        [Required]
        public int PathwayId { get; set; }
        
        // Navigation properties
        [ForeignKey("ProjectId")]
        public virtual Project? Project { get; set; }
        
        [ForeignKey("PathwayId")]
        public virtual LearningPathway? LearningPathway { get; set; }
        
        public virtual ICollection<ProjectQualification> ProjectQualifications { get; set; } = new List<ProjectQualification>();
    }
}