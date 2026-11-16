using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class Lesson : ISoftDeletable
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        [StringLength(100)]
        public string Title { get; set; } = default!;
        
        [StringLength(500)]
        public string Description { get; set; } = default!;
        
        public string Content { get; set; } = default!;
        
        public int Order { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? UpdatedAt { get; set; }
        
        // Foreign key
        public int ModuleId { get; set; }
        
        // Navigation property
        [ForeignKey("ModuleId")]
        public Module Module { get; set; } = default!;

        // ---- Soft Delete ------------------------------------------------
        public bool      IsDeleted       { get; set; } = false;
        public DateTime? DeletedAt       { get; set; }
        public int?      DeletedByUserId { get; set; }
    }
}
