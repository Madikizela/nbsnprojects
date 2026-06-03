using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    [Table("AssessmentStrategyPlans")]
    public class AssessmentStrategyPlan
    {
        [Key]
        [Column("Id")]
        public int Id { get; set; }

        [Required]
        [Column("ProjectQualificationUnitStandardId")]
        public int ProjectQualificationUnitStandardId { get; set; }

        [Column("AssessmentDate")]
        public DateTime? AssessmentDate { get; set; }

        [Column("QuestionnaireTime")]
        public string? QuestionnaireTime { get; set; }

        [Column("QuestionnairePeople")]
        public string? QuestionnairePeople { get; set; }

        [Column("QuestionnaireLocation")]
        public string? QuestionnaireLocation { get; set; }

        [Column("QuestionnaireEquipment")]
        public string? QuestionnaireEquipment { get; set; }

        [Column("PracticalTime")]
        public string? PracticalTime { get; set; }

        [Column("PracticalPeople")]
        public string? PracticalPeople { get; set; }

        [Column("PracticalLocation")]
        public string? PracticalLocation { get; set; }

        [Column("PracticalEquipment")]
        public string? PracticalEquipment { get; set; }

        [Column("AssessorName")]
        public string? AssessorName { get; set; }

        [Column("AssessorNumber")]
        public string? AssessorNumber { get; set; }

        [Column("AssessorSignature")]
        public string? AssessorSignature { get; set; }

        [Column("AssessorInitials")]
        public string? AssessorInitials { get; set; }

        [Column("ModeratorName")]
        public string? ModeratorName { get; set; }

        [Column("ModeratorNumber")]
        public string? ModeratorNumber { get; set; }

        [Column("ModeratorSignature")]
        public string? ModeratorSignature { get; set; }

        [Column("ModeratorInitials")]
        public string? ModeratorInitials { get; set; }

        // Candidate Preparation Fields
        [Column("PrepDate")]
        public DateTime? PrepDate { get; set; }

        [Column("PrepTime")]
        public string? PrepTime { get; set; }

        [Column("PrepVenue")]
        public string? PrepVenue { get; set; }

        [Column("PrepComments")]
        public string? PrepComments { get; set; }

        [Column("PrepItemsJson")]
        public string? PrepItemsJson { get; set; } // Store the checklist items as JSON

        [Column("CreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("UpdatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property
        [ForeignKey("ProjectQualificationUnitStandardId")]
        public virtual ProjectQualificationUnitStandard? ProjectQualificationUnitStandard { get; set; }
    }
}
