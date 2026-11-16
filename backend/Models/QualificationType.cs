using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class QualificationType : ISoftDeletable
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        [StringLength(50)]
        public string Name { get; set; } = string.Empty; // "Legacy" or "Occupational"
        
        public string? Description { get; set; }
        
        // Navigation properties
        public virtual ICollection<ProjectQualification> ProjectQualifications { get; set; } = new List<ProjectQualification>();

        // ---- Soft Delete ------------------------------------------------
        public bool      IsDeleted       { get; set; } = false;
        public DateTime? DeletedAt       { get; set; }
        public int?      DeletedByUserId { get; set; }
    }
}
