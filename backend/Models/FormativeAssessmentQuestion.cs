using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    [Table("FormativeAssessmentQuestions")]
    public class FormativeAssessmentQuestion : ISoftDeletable
    {
        [Key]
        [Column("Id")]
        public int Id { get; set; }
        
        [Required]
        [Column("FormativeAssessmentId")]
        public int FormativeAssessmentId { get; set; }
        
        [Required]
        [Column("QuestionNumber")]
        public int QuestionNumber { get; set; }
        
        [Required]
        [Column("QuestionText")]
        public string QuestionText { get; set; } = string.Empty;
        
        [Required]
        [Column("AllocatedMarks", TypeName = "decimal(5,2)")]
        public decimal AllocatedMarks { get; set; }
        
        [Column("CreatedAt")]
        public DateTime CreatedAt { get; set; }
        
        [Column("UpdatedAt")]
        public DateTime UpdatedAt { get; set; }
        
        // Navigation property
        [ForeignKey("FormativeAssessmentId")]
        public FormativeAssessment? FormativeAssessment { get; set; }

        // ---- Soft Delete ------------------------------------------------
        public bool      IsDeleted       { get; set; } = false;
        public DateTime? DeletedAt       { get; set; }
        public int?      DeletedByUserId { get; set; }
    }
}
