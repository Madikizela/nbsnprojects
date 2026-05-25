using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class AttendanceLog
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int AttendanceId { get; set; }

        [Required]
        [StringLength(50)]
        public string Action { get; set; } = string.Empty; // 'ClockIn', 'ClockOut', 'Modified', 'Deleted'

        [Required]
        public DateTime ActionTime { get; set; } = DateTime.UtcNow;

        [Required]
        public int ActionBy { get; set; }

        public bool? FingerprintMatched { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal? MatchScore { get; set; }

        public string? DeviceInfo { get; set; }
        public string? Notes { get; set; }

        // Navigation properties
        [ForeignKey("AttendanceId")]
        public virtual LearnerAttendance? Attendance { get; set; }

        [ForeignKey("ActionBy")]
        public virtual User? User { get; set; }
    }
}
