using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    [Table("FormativeAssessments")]
    public class FormativeAssessment
    {
        [Key]
        [Column("Id")]
        public int Id { get; set; }

        [Required]
        [Column("ProjectQualificationUnitStandardId")]
        public int ProjectQualificationUnitStandardId { get; set; }

        [Required]
        [Column("AssessmentDate")]
        public DateTime AssessmentDate { get; set; }

        [StringLength(100)]
        [Column("AssessmentMethod")]
        public string? AssessmentMethod { get; set; }

        [Column("Score")]
        public decimal? Score { get; set; }

        [Column("MaxScore")]
        public decimal? MaxScore { get; set; }

        [StringLength(255)]
        [Column("AssessorName")]
        public string? AssessorName { get; set; }

        [Column("Comments")]
        public string? Comments { get; set; }

        [StringLength(50)]
        [Column("Status")]
        public string Status { get; set; } = "Pending";

        [Column("CreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("UpdatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property
        [ForeignKey("ProjectQualificationUnitStandardId")]
        public virtual ProjectQualificationUnitStandard? ProjectQualificationUnitStandard { get; set; }
    }
}
