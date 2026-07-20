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

    // DTO for updating video conference details
    public class UpdateVideoConferenceDto
    {
        [StringLength(1000)]
        public string? VideoConferenceLink { get; set; }
        
        [StringLength(50)]
        public string? VideoConferenceType { get; set; } // Teams, Zoom, Google Meet, Other
        
        public DateTime? VideoConferenceStartTime { get; set; }
        
        [StringLength(500)]
        public string? VideoConferenceDescription { get; set; }
        
        public bool SendAnnouncement { get; set; } = true;
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
        
        // Video Conference fields
        public string? VideoConferenceLink { get; set; }
        public string? VideoConferenceType { get; set; }
        public DateTime? VideoConferenceStartTime { get; set; }
        public string? VideoConferenceDescription { get; set; }
    }
}
