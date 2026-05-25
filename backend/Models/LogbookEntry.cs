using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    [Table("LogbookEntries")]
    public class LogbookEntry
    {
        [Key]
        [Column("Id")]
        public int Id { get; set; }

        [Required]
        [Column("ProjectQualificationUnitStandardId")]
        public int ProjectQualificationUnitStandardId { get; set; }

        [Column("EntryDate")]
        public DateTime? EntryDate { get; set; }

        [Required]
        [Column("StartDate")]
        public DateTime StartDate { get; set; }

        [Required]
        [Column("EndDate")]
        public DateTime EndDate { get; set; }

        [Required]
        [Column("ActivityDescription")]
        public string ActivityDescription { get; set; } = string.Empty;

        [Column("HoursSpent")]
        public decimal? HoursSpent { get; set; }

        [StringLength(255)]
        [Column("SupervisorName")]
        public string? SupervisorName { get; set; }

        [StringLength(255)]
        [Column("SupervisorSignature")]
        public string? SupervisorSignature { get; set; }

        [Column("Approved")]
        public bool Approved { get; set; } = false;

        [Column("ApprovedDate")]
        public DateTime? ApprovedDate { get; set; }

        [Column("EvidenceUrl")]
        public string? EvidenceUrl { get; set; }

        [Column("Comments")]
        public string? Comments { get; set; }

        [Column("CreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("UpdatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property
        [ForeignKey("ProjectQualificationUnitStandardId")]
        public virtual ProjectQualificationUnitStandard? ProjectQualificationUnitStandard { get; set; }
    }
}
