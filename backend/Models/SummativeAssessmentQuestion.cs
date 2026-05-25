using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    [Table("SummativeAssessmentQuestions")]
    public class SummativeAssessmentQuestion
    {
        [Key]
        [Column("Id")]
        public int Id { get; set; }
        
        [Required]
        [Column("SummativeAssessmentId")]
        public int SummativeAssessmentId { get; set; }
        
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
        [ForeignKey("SummativeAssessmentId")]
        public SummativeAssessment? SummativeAssessment { get; set; }
    }
}
