using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class LearningPathway
    {
        [Key]
        public int PathwayId { get; set; }
        
        [Required]
        [StringLength(255)]
        public string Name { get; set; } = string.Empty;
        
        public int Synced { get; set; } = 0;
        
        // Navigation properties
        public virtual ICollection<ProjectLearningPathway> ProjectLearningPathways { get; set; } = new List<ProjectLearningPathway>();
    }
}