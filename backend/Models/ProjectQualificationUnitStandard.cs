using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    [Table("ProjectQualificationUnitStandards")]
    public class ProjectQualificationUnitStandard : ISoftDeletable
    {
        [Key]
        [Column("Id")]
        public int Id { get; set; }

        [Required]
        [Column("ProjectQualificationId")]
        public int ProjectQualificationId { get; set; }

        [Required]
        [Column("UnitStandardId")]
        public int UnitStandardId { get; set; }

        [Required]
        [StringLength(50)]
        [Column("UnitStandardType")]
        public string UnitStandardType { get; set; } = string.Empty; // "Occupational" or "Legacy"

        [Column("CreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("UpdatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property
        [ForeignKey("ProjectQualificationId")]
        public virtual ProjectQualification? ProjectQualification { get; set; }

        // ---- Soft Delete ------------------------------------------------
        public bool      IsDeleted       { get; set; } = false;
        public DateTime? DeletedAt       { get; set; }
        public int?      DeletedByUserId { get; set; }
    }
}
