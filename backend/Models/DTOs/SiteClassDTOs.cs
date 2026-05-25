using System.ComponentModel.DataAnnotations;

namespace backend.Models.DTOs
{
    public class CreateSiteClassDto
    {
        [Required]
        public int ProjectSiteId { get; set; }
        
        [Required]
        [StringLength(255)]
        [RegularExpression(@"^[a-zA-Z\s]+$", ErrorMessage = "Only letters and spaces are allowed")]
        public string ClassName { get; set; } = string.Empty;
        
        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "Only positive numbers are allowed")]
        public int MaxLearners { get; set; }
    }

    public class UpdateSiteClassDto
    {
        [Required]
        [StringLength(255)]
        [RegularExpression(@"^[a-zA-Z\s]+$", ErrorMessage = "Only letters and spaces are allowed")]
        public string ClassName { get; set; } = string.Empty;
        
        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "Only positive numbers are allowed")]
        public int MaxLearners { get; set; }
        
        [StringLength(50)]
        public string Status { get; set; } = "Active";
    }

    public class SiteClassResponseDto
    {
        public int Id { get; set; }
        public int ProjectSiteId { get; set; }
        public string SiteName { get; set; } = string.Empty;
        public string ClassName { get; set; } = string.Empty;
        public int MaxLearners { get; set; }
        public int CurrentLearners { get; set; }
        public string Status { get; set; } = "Active";
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public string? CreatedByUserName { get; set; }
    }
}
