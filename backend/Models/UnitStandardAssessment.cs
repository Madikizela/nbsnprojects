using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    [Table("UnitStandardAssessments")]
    public class UnitStandardAssessment
    {
        [Key]
        [Column("Id")]
        public int Id { get; set; }

        [Required]
        [Column("ProjectQualificationUnitStandardId")]
        public int ProjectQualificationUnitStandardId { get; set; }

        [Required]
        [Column("AssessmentTypeId")]
        public int AssessmentTypeId { get; set; }

        [StringLength(255)]
        [Column("Title")]
        public string? Title { get; set; }

        [Column("Description")]
        public string? Description { get; set; }

        [Column("TotalMarks")]
        public int TotalMarks { get; set; } = 0;

        [Column("PassingMarks")]
        public int PassingMarks { get; set; } = 0;

        [Column("CreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("UpdatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [Column("CreatedByUserId")]
        public int? CreatedByUserId { get; set; }

        // Navigation properties
        [ForeignKey("ProjectQualificationUnitStandardId")]
        public virtual ProjectQualificationUnitStandard? ProjectQualificationUnitStandard { get; set; }

        [ForeignKey("AssessmentTypeId")]
        public virtual AssessmentType? AssessmentType { get; set; }

        [ForeignKey("CreatedByUserId")]
        public virtual User? CreatedByUser { get; set; }

        public virtual ICollection<AssessmentQuestion> Questions { get; set; } = new List<AssessmentQuestion>();
    }
}
