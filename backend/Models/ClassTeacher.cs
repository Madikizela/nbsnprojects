using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class ClassTeacher : ISoftDeletable
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ClassId { get; set; }

        [Required]
        public int TeacherId { get; set; }

        [Required]
        public DateTime AssignedDate { get; set; } = DateTime.UtcNow;

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("ClassId")]
        public virtual SiteClass? SiteClass { get; set; }

        [ForeignKey("TeacherId")]
        public virtual User? Teacher { get; set; }

        // ---- Soft Delete ------------------------------------------------
        public bool      IsDeleted       { get; set; } = false;
        public DateTime? DeletedAt       { get; set; }
        public int?      DeletedByUserId { get; set; }
    }
}
