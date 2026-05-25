using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    [Table("AssessmentTypes")]
    public class AssessmentType
    {
        [Key]
        [Column("Id")]
        public int Id { get; set; }

        [Required]
        [StringLength(50)]
        [Column("Name")]
        public string Name { get; set; } = string.Empty;

        [Column("Description")]
        public string? Description { get; set; }

        [Column("CreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("UpdatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property
        public virtual ICollection<UnitStandardAssessment> UnitStandardAssessments { get; set; } = new List<UnitStandardAssessment>();
    }
}
