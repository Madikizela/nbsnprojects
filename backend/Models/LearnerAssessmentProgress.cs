using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    [Table("LearnerAssessmentProgress")]
    public class LearnerAssessmentProgress
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int LearnerId { get; set; }

        [Required]
        public int ProjectQualificationUnitStandardId { get; set; }

        public int? FormativeAssessmentId { get; set; }

        public int? SummativeAssessmentId { get; set; }

        [Required]
        public bool FormativeCompleted { get; set; } = false;

        public DateTime? FormativeCompletedAt { get; set; }

        [Required]
        public bool FormativeModerated { get; set; } = false;

        public DateTime? FormativeModeratedAt { get; set; }

        [Required]
        public bool SummativeCompleted { get; set; } = false;

        public DateTime? SummativeCompletedAt { get; set; }

        [Required]
        public bool SummativeModerated { get; set; } = false;

        public DateTime? SummativeModeratedAt { get; set; }

        public bool RemedialRequired { get; set; } = false;

        public bool RemedialCompleted { get; set; } = false;

        public DateTime? RemedialCompletedAt { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; }

        [Required]
        public DateTime UpdatedAt { get; set; }

        // Navigation properties
        public virtual Learner? Learner { get; set; }
        public virtual ProjectQualificationUnitStandard? ProjectQualificationUnitStandard { get; set; }
    }
}