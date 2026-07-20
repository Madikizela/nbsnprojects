using System;
using System.ComponentModel.DataAnnotations;

namespace backend.Models.DTOs
{
    // DTO for assigning teacher to class
    public class AssignTeacherDTO
    {
        [Required]
        public int ClassId { get; set; }

        [Required]
        public int TeacherId { get; set; }
    }

    // DTO for creating and assigning a new teacher
    public class CreateTeacherDTO
    {
        [Required]
        public int ClassId { get; set; }

        [Required]
        [StringLength(100)]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string LastName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [StringLength(200)]
        public string Email { get; set; } = string.Empty;
    }

    // DTO for fingerprint clock in/out
    public class FingerprintClockDTO
    {
        [Required]
        public int ClassId { get; set; }

        [Required]
        public int TeacherId { get; set; }

        [Required]
        public string FingerprintTemplate { get; set; } = string.Empty; // Base64 template

        [Required]
        public string ScannerType { get; set; } = "Futronic"; // "Futronic" or "ZKTECO"

        public double? Latitude { get; set; }
        public double? Longitude { get; set; }

        public string? DeviceInfo { get; set; }
    }

    // DTO for face recognition clock in/out
    public class FaceClockDTO
    {
        [Required]
        public int ClassId { get; set; }

        [Required]
        public int TeacherId { get; set; }

        [Required]
        public List<double> Embedding { get; set; } = new List<double>();

        public double? Latitude { get; set; }
        public double? Longitude { get; set; }

        public string? DeviceInfo { get; set; }
    }

    // DTO for manual clock in/out
    public class ManualClockDTO
    {
        [Required]
        public int LearnerId { get; set; }

        [Required]
        public int ClassId { get; set; }

        [Required]
        public string Action { get; set; } = string.Empty; // 'ClockIn' or 'ClockOut'

        public string? Notes { get; set; }
    }

    // DTO for attendance response
    public class AttendanceResponseDTO
    {
        public int Id { get; set; }
        public int LearnerId { get; set; }
        public string LearnerName { get; set; } = string.Empty;
        public string LearnerSurname { get; set; } = string.Empty;
        public int ClassId { get; set; }
        public string ClassName { get; set; } = string.Empty;
        public DateTime AttendanceDate { get; set; }
        public DateTime? ClockInTime { get; set; }
        public DateTime? ClockOutTime { get; set; }
        public string? ClockInMethod { get; set; }
        public string? ClockOutMethod { get; set; }
        public bool ClockInVerified { get; set; }
        public bool ClockOutVerified { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? Notes { get; set; }
    }

    // DTO for teacher's class list
    public class TeacherClassDTO
    {
        public int ClassId { get; set; }
        public string ClassName { get; set; } = string.Empty;
        public int ProjectSiteId { get; set; }
        public string SiteName { get; set; } = string.Empty;
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public int TotalLearners { get; set; }
        public int PresentToday { get; set; }
        public int AbsentToday { get; set; }
        public DateTime AssignedDate { get; set; }
    }

    // DTO for learner in class with attendance status
    public class ClassLearnerDTO
    {
        public int LearnerId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Surname { get; set; } = string.Empty;
        public string IDNumber { get; set; } = string.Empty;
        public bool HasLeftFingerprint { get; set; }
        public bool HasRightFingerprint { get; set; }
        public string? ProfileImage { get; set; }
        
        // Today's attendance
        public int? AttendanceId { get; set; }
        public DateTime? ClockInTime { get; set; }
        public DateTime? ClockOutTime { get; set; }
        public string? Status { get; set; }
        public bool? ClockInVerified { get; set; }
        public bool? ClockOutVerified { get; set; }
    }

    // DTO for attendance statistics
    public class AttendanceStatsDTO
    {
        public int ClassId { get; set; }
        public DateTime Date { get; set; }
        public int TotalLearners { get; set; }
        public int Present { get; set; }
        public int Absent { get; set; }
        public int Late { get; set; }
        public int Excused { get; set; }
        public decimal AttendanceRate { get; set; }
    }

    // DTO for fingerprint match result
    public class FingerprintMatchResultDTO
    {
        public bool Matched { get; set; }
        public int? LearnerId { get; set; }
        public string? LearnerName { get; set; }
        public string? LearnerSurname { get; set; }
        public decimal? MatchScore { get; set; }
        public string? FingerType { get; set; } // 'Left' or 'Right'
        public string? Message { get; set; }
    }
}
