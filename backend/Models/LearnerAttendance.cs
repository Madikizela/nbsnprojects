using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class LearnerAttendance
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int LearnerId { get; set; }

        [Required]
        public int ClassId { get; set; }

        [Required]
        public DateTime AttendanceDate { get; set; } = DateTime.Today;

        public DateTime? ClockInTime { get; set; }
        public DateTime? ClockOutTime { get; set; }

        [StringLength(50)]
        public string? ClockInMethod { get; set; } // 'Fingerprint', 'Manual', 'QRCode'

        [StringLength(50)]
        public string? ClockOutMethod { get; set; }

        public bool ClockInVerified { get; set; } = false;
        public bool ClockOutVerified { get; set; } = false;

        public int? ClockInTeacherId { get; set; }
        public int? ClockOutTeacherId { get; set; }

        public decimal? ClockInLatitude { get; set; }
        public decimal? ClockInLongitude { get; set; }
        public decimal? ClockOutLatitude { get; set; }
        public decimal? ClockOutLongitude { get; set; }

        [StringLength(50)]
        public string Status { get; set; } = "Present"; // 'Present', 'Absent', 'Late', 'Excused'

        public string? Notes { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("LearnerId")]
        public virtual Learner? Learner { get; set; }

        [ForeignKey("ClassId")]
        public virtual SiteClass? SiteClass { get; set; }

        [ForeignKey("ClockInTeacherId")]
        public virtual User? ClockInTeacher { get; set; }

        [ForeignKey("ClockOutTeacherId")]
        public virtual User? ClockOutTeacher { get; set; }
    }
}
