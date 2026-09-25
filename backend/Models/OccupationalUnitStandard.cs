using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    [Table("occupational_unit_standards")]
    public class OccupationalUnitStandard
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }
        
        // qualification_id is VARCHAR(50) in the database — stored as string
        [StringLength(50)]
        [Column("qualification_id")]
        public string? QualificationId { get; set; }
        
        [StringLength(100)]
        [Column("module_code")]
        public string? ModuleCode { get; set; }
        
        [StringLength(255)]
        [Column("unit_standard_name")]
        public string? UnitStandardName { get; set; }
        
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