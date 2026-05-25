using System.ComponentModel.DataAnnotations;

namespace backend.Models.DTOs
{
    public class CreateSickNoteDTO
    {
        [Required]
        public int LearnerId { get; set; }

        [Required]
        public string MedicalFacility { get; set; } = string.Empty;

        [Required]
        public string PractitionerName { get; set; } = string.Empty;

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        [Required]
        public DateTime IssuedDate { get; set; }

        public IFormFile? File { get; set; }
    }

    public class ApproveSickNoteDTO
    {
        [Required]
        public bool IsApproved { get; set; }
        public string? RejectionReason { get; set; }
    }

    public class SickNoteResponseDTO
    {
        public int Id { get; set; }
        public int LearnerId { get; set; }
        public string LearnerName { get; set; } = string.Empty;
        public string MedicalFacility { get; set; } = string.Empty;
        public string PractitionerName { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public DateTime IssuedDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? RejectionReason { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
