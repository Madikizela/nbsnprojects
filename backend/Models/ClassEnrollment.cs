using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class ClassEnrollment
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int LearnerId { get; set; }

        [Required]
        public int SiteClassId { get; set; }

        public DateTime EnrollmentDate { get; set; }

        [StringLength(50)]
        public string Status { get; set; } = "Active"; // Active, Completed, Withdrawn, Suspended

        public DateTime? CompletionDate { get; set; }

        public DateTime? WithdrawalDate { get; set; }

        public string? WithdrawalReason { get; set; }

        public int? CreatedByUserId { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        // Navigation Properties
        [ForeignKey("LearnerId")]
        public virtual Learner? Learner { get; set; }

        [ForeignKey("SiteClassId")]
        public virtual SiteClass? SiteClass { get; set; }

        [ForeignKey("CreatedByUserId")]
        public virtual User? CreatedByUser { get; set; }
    }
}
