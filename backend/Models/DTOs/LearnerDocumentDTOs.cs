using System.ComponentModel.DataAnnotations;

namespace backend.Models.DTOs
{
    public class LearnerDocumentResponseDto
    {
        public int Id { get; set; }
        public int LearnerId { get; set; }
        public string DocumentType { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public string MimeType { get; set; } = string.Empty;
        public DateTime UploadedAt { get; set; }
        public string? UploadedByUserName { get; set; }
    }

    public class UploadDocumentDto
    {
        [Required]
        public int LearnerId { get; set; }

        [Required]
        [StringLength(100)]
        public string DocumentType { get; set; } = string.Empty;

        public IFormFile? File { get; set; }

        public List<IFormFile>? Files { get; set; }
    }

    public class DocumentDownloadDto
    {
        public byte[] FileContent { get; set; } = Array.Empty<byte>();
        public string FileName { get; set; } = string.Empty;
        public string MimeType { get; set; } = string.Empty;
    }
}
