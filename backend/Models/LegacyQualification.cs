using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    [Table("legacy_qualifications")]
    public class LegacyQualification
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }
        
        [Column("qualification_id")]
        public int? QualificationId { get; set; }
        
        [StringLength(255)]
        [Column("name")]
        public string? Name { get; set; }
        
        [Column("description")]
        public string? Description { get; set; }
        
        [StringLength(255)]
        [Column("level")]
        public string? Level { get; set; }
        
        [Column("credits")]
        public int? Credits { get; set; }
        
        [Required]
        [StringLength(255)]
        [Column("qualification_type")]
        public string QualificationType { get; set; } = string.Empty;
        
        [StringLength(3)]
        [Column("has_cat")]
        public string HasCat { get; set; } = "NO";
        
        // Navigation properties
        public virtual ICollection<LegacyUnitStandard> UnitStandards { get; set; } = new List<LegacyUnitStandard>();
        public virtual ICollection<ProjectQualification> ProjectQualifications { get; set; } = new List<ProjectQualification>();
    }
}