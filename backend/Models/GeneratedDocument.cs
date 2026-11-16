using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    [Table("generated_documents")]
    public class GeneratedDocument : ISoftDeletable
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        /// <summary>QUOTATION or SLA</summary>
        [Required]
        [StringLength(20)]
        public string DocumentType { get; set; } = string.Empty;

        [Required]
        [StringLength(200)]
        public string DocumentTitle { get; set; } = string.Empty;

        /// <summary>e.g. NBSN-Q-2026-001 or SLA/NBSN/CLIENT/2026/001</summary>
        [StringLength(100)]
        public string ReferenceNumber { get; set; } = string.Empty;

        /// <summary>Client / recipient name.</summary>
        [StringLength(200)]
        public string ClientName { get; set; } = string.Empty;

        /// <summary>Full JSON snapshot of the form data used to generate the doc.</summary>
        [Required]
        public string FormDataJson { get; set; } = string.Empty;

        /// <summary>Generated PDF bytes stored as base64 string for simple retrieval.</summary>
        public string? PdfBase64 { get; set; }

        public int? GeneratedByUserId { get; set; }

        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;

        [StringLength(50)]
        public string Status { get; set; } = "Draft"; // Draft, Sent, Accepted, Rejected

        // ---- Soft Delete ------------------------------------------------
        public bool      IsDeleted       { get; set; } = false;
        public DateTime? DeletedAt       { get; set; }
        public int?      DeletedByUserId { get; set; }
    }
}
