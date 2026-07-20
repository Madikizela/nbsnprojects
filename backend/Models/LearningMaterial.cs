using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    [Table("LearningMaterials")]
    public class LearningMaterial
    {
        [Key]
        [Column("Id")]
        public int Id { get; set; }

        [Column("ProjectQualificationUnitStandardId")]
        public int? ProjectQualificationUnitStandardId { get; set; }

        // Qualification-level material (set when uploaded for whole qualification, not per unit standard)
        [Column("ProjectQualificationId")]
        public int? ProjectQualificationId { get; set; }

        [Required]
        [StringLength(255)]
        [Column("Title")]
        public string Title { get; set; } = string.Empty;

        [Column("Description")]
        public string? Description { get; set; }

        [Required]
        [StringLength(50)]
        [Column("MaterialType")]
        public string MaterialType { get; set; } = string.Empty; // PDF, Video, Document, Link

        [StringLength(255)]
        [Column("FileName")]
        public string? FileName { get; set; }

        [StringLength(500)]
        [Column("EncryptedFilePath")]
        public string? EncryptedFilePath { get; set; }

        [Column("FileSize")]
        public long? FileSize { get; set; }

        [StringLength(100)]
        [Column("MimeType")]
        public string? MimeType { get; set; }

        [StringLength(500)]
        [Column("EncryptionIV")]
        public string? EncryptionIV { get; set; }

        [StringLength(500)]
        [Column("FileHash")]
        public string? FileHash { get; set; }

        [StringLength(1000)]
        [Column("ExternalUrl")]
        public string? ExternalUrl { get; set; }

        [Column("DisplayOrder")]
        public int DisplayOrder { get; set; } = 0;

        [Column("UploadedByUserId")]
        public int? UploadedByUserId { get; set; }

        [Required]
        [Column("IsActive")]
        public bool IsActive { get; set; } = true;

        [Required]
        [Column("CreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Required]
        [Column("UpdatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("ProjectQualificationUnitStandardId")]
        public virtual ProjectQualificationUnitStandard? ProjectQualificationUnitStandard { get; set; }

        [ForeignKey("ProjectQualificationId")]
        public virtual ProjectQualification? ProjectQualification { get; set; }

        [ForeignKey("UploadedByUserId")]
        public virtual User? UploadedByUser { get; set; }
    }
}
