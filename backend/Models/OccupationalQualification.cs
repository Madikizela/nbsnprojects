using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    [Table("occupational_qualifications")]
    public class OccupationalQualification
    {
        [Key]
        [Column("qualification_id")]
        public int QualificationId { get; set; }
        
        [Required]
        [StringLength(255)]
        [Column("name")]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        [StringLength(255)]
        [Column("level")]
        public string Level { get; set; } = string.Empty;
        
        [Column("credits")]
        public int Credits { get; set; }
        
        [Required]
        [StringLength(255)]
        [Column("qualification_type")]
        public string QualificationType { get; set; } = string.Empty;
        
        [StringLength(255)]
        [Column("description")]
        public string? Description { get; set; }
        
        [Required]
        [StringLength(255)]
        [Column("quality_partner")]
        public string QualityPartner { get; set; } = string.Empty;
        
        [Required]
        [StringLength(255)]
        [Column("trade")]
        public string Trade { get; set; } = string.Empty;
        
        [StringLength(3)]
        [Column("has_cat")]
        public string HasCat { get; set; } = "NO";
        
        // Navigation properties
        public virtual ICollection<OccupationalUnitStandard> UnitStandards { get; set; } = new List<OccupationalUnitStandard>();
        public virtual ICollection<ProjectQualification> ProjectQualifications { get; set; } = new List<ProjectQualification>();
    }
}