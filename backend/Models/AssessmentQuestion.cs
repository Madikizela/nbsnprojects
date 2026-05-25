using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    [Table("AssessmentQuestions")]
    public class AssessmentQuestion
    {
        [Key]
        [Column("Id")]
        public int Id { get; set; }
        
        [Column("UnitStandardAssessmentId")]
        public int? UnitStandardAssessmentId { get; set; }
        
        [Column("FormativeAssessmentId")]
        public int? FormativeAssessmentId { get; set; }
        
        [Required]
        [Column("QuestionNumber")]
        public int QuestionNumber { get; set; }
        
        [Required]
        [Column("QuestionText")]
        public string QuestionText { get; set; } = string.Empty;
        
        [Column("AllocatedMarks", TypeName = "decimal(5,2)")]
        public decimal? AllocatedMarks { get; set; }
        
        [Column("OrderIndex")]
        public int? OrderIndex { get; set; }
        
        [Column("CreatedAt")]
        public DateTime CreatedAt { get; set; }
        
        [Column("UpdatedAt")]
        public DateTime UpdatedAt { get; set; }
        
        // Navigation properties
        [ForeignKey("UnitStandardAssessmentId")]
        public UnitStandardAssessment? UnitStandardAssessment { get; set; }
    }
}
