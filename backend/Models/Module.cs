using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class Module
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        [StringLength(100)]
        public string Title { get; set; } = default!;
        
        [StringLength(500)]
        public string Description { get; set; } = default!;
        
        public int Order { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? UpdatedAt { get; set; }
        
        // Foreign key
        public int CourseId { get; set; }
        
        // Navigation property
        [ForeignKey("CourseId")]
        public Course Course { get; set; } = default!;
        
        // Navigation properties
        public ICollection<Lesson> Lessons { get; set; } = new List<Lesson>();
    }
}