using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using backend.Services.Interfaces;

namespace backend.Models
{
    /// <summary>
    /// Document entity for secure file storage with comprehensive security features
    /// </summary>
    public class Document
    {
        [Key]
        public int Id { get; set; }

        [Required(ErrorMessage = "Document name is required")]
        [StringLength(255, MinimumLength = 1, ErrorMessage = "Document name must be between 1 and 255 characters")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "Original filename is required")]
        [StringLength(255, ErrorMessage = "Original filename cannot exceed 255 characters")]
        public string OriginalFileName { get; set; } = string.Empty;

        [Required(ErrorMessage = "File path is required")]
        [StringLength(500, ErrorMessage = "File path cannot exceed 500 characters")]
        public string FilePath { get; set; } = string.Empty;

        [Required(ErrorMessage = "Content type is required")]
        [StringLength(100, ErrorMessage = "Content type cannot exceed 100 characters")]
        public string ContentType { get; set; } = string.Empty;

        [Required]
        [Range(1, long.MaxValue, ErrorMessage = "File size must be greater than 0")]
        public long FileSizeBytes { get; set; }

        [Required(ErrorMessage = "Document type is required")]
        public DocumentType Type { get; set; }

        [Required]
        public DocumentStatus Status { get; set; } = DocumentStatus.Active;

        [StringLength(1000, ErrorMessage = "Description cannot exceed 1000 characters")]
        public string? Description { get; set; }

        // Security and Encryption
        [Required(ErrorMessage = "File hash is required for integrity verification")]
        [StringLength(128, ErrorMessage = "File hash cannot exceed 128 characters")]
        public string FileHash { get; set; } = string.Empty;

        [Required]
        public bool IsEncrypted { get; set; } = true;

        [StringLength(100, ErrorMessage = "Encryption algorithm cannot exceed 100 characters")]
        public string? EncryptionAlgorithm { get; set; }

        [StringLength(500, ErrorMessage = "Encryption key cannot exceed 500 characters")]
        public string? EncryptionKey { get; set; }

        // Access Control
        [Required]
        public DocumentAccessLevel AccessLevel { get; set; } = DocumentAccessLevel.Private;

        [Required]
        public bool RequiresApproval { get; set; } = false;

        // Audit Trail
        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Required]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? LastAccessedAt { get; set; }

        [Required]
        public int UploadedByUserId { get; set; }

        public int? ApprovedByUserId { get; set; }

        public DateTime? ApprovedAt { get; set; }

        // Expiration and Retention
        public DateTime? ExpiresAt { get; set; }

        [Required]
        public bool IsDeleted { get; set; } = false;

        public DateTime? DeletedAt { get; set; }

        public int? DeletedByUserId { get; set; }

        // Version Control
        [Required]
        public int Version { get; set; } = 1;

        public int? ParentDocumentId { get; set; }

        // Foreign Keys for User Association
        public int? ClientId { get; set; }
        public int? SkillsDevelopmentProviderId { get; set; }
        public int? DepartmentId { get; set; }

        // Navigation Properties
        [ForeignKey("UploadedByUserId")]
        public virtual User UploadedBy { get; set; } = null!;

        [ForeignKey("ApprovedByUserId")]
        public virtual User? ApprovedBy { get; set; }

        [ForeignKey("DeletedByUserId")]
        public virtual User? DeletedBy { get; set; }

        [ForeignKey("ClientId")]
        public virtual Client? Client { get; set; }

        [ForeignKey("SkillsDevelopmentProviderId")]
        public virtual SkillsDevelopmentProvider? SkillsDevelopmentProvider { get; set; }

        [ForeignKey("DepartmentId")]
        public virtual Department? Department { get; set; }

        [ForeignKey("ParentDocumentId")]
        public virtual Document? ParentDocument { get; set; }

        public virtual ICollection<Document> ChildDocuments { get; set; } = new List<Document>();

        public virtual ICollection<DocumentAccessLog> AccessLogs { get; set; } = new List<DocumentAccessLog>();
    }

    /// <summary>
    /// Document types for categorization and security policies
    /// </summary>
    public enum DocumentType
    {
        Identity = 1,           // ID documents, passports, etc.
        PortfolioOfEvidence = 2, // Learning evidence, certificates
        Contract = 3,           // Legal contracts and agreements
        Invoice = 4,            // Financial documents
        Certificate = 5,        // Certificates and qualifications
        Assessment = 6,         // Assessment documents
        Report = 7,             // Reports and analytics
        Policy = 8,             // Policy documents
        Other = 99              // Other document types
    }

    /// <summary>
    /// Document status for workflow management
    /// </summary>
    public enum DocumentStatus
    {
        Active = 1,             // Document is active and accessible
        PendingApproval = 2,    // Waiting for approval
        Approved = 3,           // Approved and verified
        Rejected = 4,           // Rejected during approval process
        Archived = 5,           // Archived but accessible
        Expired = 6,            // Document has expired
        Suspended = 7           // Temporarily suspended
    }

    /// <summary>
    /// Access levels for document security
    /// </summary>
    public enum DocumentAccessLevel
    {
        Private = 1,            // Only owner can access
        Department = 2,         // Department members can access
        Organization = 3,       // Organization members can access
        Client = 4,             // Client-wide access
        Public = 5              // Public access (use with caution)
    }

    /// <summary>
    /// Document access logging for audit trail
    /// </summary>
    public class DocumentAccessLog
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int DocumentId { get; set; }

        public int? UserId { get; set; }

        [Required]
        public DocumentAccessAction Action { get; set; }

        [Required]
        public DateTime AccessedAt { get; set; } = DateTime.UtcNow;

        [StringLength(45, ErrorMessage = "IP address cannot exceed 45 characters")]
        public string? IpAddress { get; set; }

        [StringLength(500, ErrorMessage = "User agent cannot exceed 500 characters")]
        public string? UserAgent { get; set; }

        [StringLength(1000, ErrorMessage = "Notes cannot exceed 1000 characters")]
        public string? Notes { get; set; }

        // Navigation Properties
        [ForeignKey("DocumentId")]
        public virtual Document Document { get; set; } = null!;

        [ForeignKey("UserId")]
        public virtual User User { get; set; } = null!;
    }
}