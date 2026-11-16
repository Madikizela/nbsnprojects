using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class LearningPathway : ISoftDeletable
    {
        [Key]
        public int PathwayId { get; set; }
        
        [Required]
        [StringLength(255)]
        public string Name { get; set; } = string.Empty;
        
        public int Synced { get; set; } = 0;
        
        // Navigation properties
        public virtual ICollection<ProjectLearningPathway> ProjectLearningPathways { get; set; } = new List<ProjectLearningPathway>();

        // ---- Soft Delete ------------------------------------------------
        public bool      IsDeleted       { get; set; } = false;
        public DateTime? DeletedAt       { get; set; }
        public int?      DeletedByUserId { get; set; }
    }
}
