using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class ProjectQualification
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public int ProjectLearningPathwayId { get; set; }
        
        [Required]
        public int QualificationTypeId { get; set; }
        
        // Either OccupationalQualificationId or LegacyQualificationId will be set, not both
        public int? OccupationalQualificationId { get; set; }
        public int? LegacyQualificationId { get; set; }
        
        [StringLength(50)]
        public string? EmploymentType { get; set; }
        
        public int NumberOfBeneficiaries { get; set; } = 0;
        
        // Navigation properties
        [ForeignKey("ProjectLearningPathwayId")]
        public virtual ProjectLearningPathway? ProjectLearningPathway { get; set; }
        
        [ForeignKey("QualificationTypeId")]
        public virtual QualificationType? QualificationType { get; set; }
        
        [ForeignKey("OccupationalQualificationId")]
        public virtual OccupationalQualification? OccupationalQualification { get; set; }
        
        [ForeignKey("LegacyQualificationId")]
        public virtual LegacyQualification? LegacyQualification { get; set; }
    }
}