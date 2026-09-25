using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace backend.Models
{
    [Table("occupational_unit_standards")]
    public class OccupationalUnitStandard
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("id")]
        public int Id { get; set; }
        
        // qualification_id is INTEGER in the live database
        [Column("qualification_id")]
        public int? QualificationId { get; set; }
        
        [StringLength(100)]
        [Column("module_code")]
        public string? ModuleCode { get; set; }
        
        [StringLength(255)]
        [Column("unit_standard_name")]
        public string? UnitStandardName { get; set; }
        
        // Must be one of: "Knowledge Modules", "Practical Skill Modules", "Work Experience Modules"
        [StringLength(50)]
        [Column("module_type")]
        public string? ModuleType { get; set; }
        
        [StringLength(255)]
        [Column("level")]
        public string? Level { get; set; }
        
        [Column("credits")]
        public int? Credits { get; set; }
    }
}