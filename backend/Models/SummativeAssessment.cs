using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    [Table("SummativeAssessments")]
    public class SummativeAssessment
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

        [Column("FinalScore")]
        public decimal? FinalScore { get; set; }

        [Column("MaxScore")]
        public decimal? MaxScore { get; set; }

        [Required]
        [StringLength(50)]
        [Column("Status")]
        public string Status { get; set; } = "Pending";

        [StringLength(255)]
        [Column("AssessorName")]
        public string? AssessorName { get; set; }

        [StringLength(255)]
        [Column("ModeratorName")]
        public string? ModeratorName { get; set; }

        [Column("Comments")]
        public string? Comments { get; set; }

        [Column("ModeratorComments")]
        public string? ModeratorComments { get; set; }

        [Column("CreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("UpdatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property
        [ForeignKey("ProjectQualificationUnitStandardId")]
        public virtual ProjectQualificationUnitStandard? ProjectQualificationUnitStandard { get; set; }
    }
}
