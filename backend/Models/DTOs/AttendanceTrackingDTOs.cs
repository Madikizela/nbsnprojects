using System.ComponentModel.DataAnnotations;

namespace backend.Models.DTOs
{
    public class AttendanceTrackingProjectDto
    {
        public int ProjectId { get; set; }
        public string ProjectName { get; set; } = string.Empty;
        public int TotalLearners { get; set; }
        public int PresentToday { get; set; }
        public int AbsentToday { get; set; }
        public double AttendanceRate { get; set; }
        public int TotalClasses { get; set; }
    }

    public class AttendanceTrackingStatsDto
    {
        public DateTime Date { get; set; }
        public int ProjectId { get; set; }
        public string ProjectName { get; set; } = string.Empty;
        public int TotalLearners { get; set; }
        public int PresentLearners { get; set; }
        public int AbsentLearners { get; set; }
        public int LateArrivals { get; set; }
        public int EarlyDepartures { get; set; }
        public double AttendanceRate { get; set; }
        public double AverageContactHours { get; set; }
        public string AverageContactTime { get; set; } = string.Empty;
        public List<ClassAttendanceDto> ClassBreakdown { get; set; } = new List<ClassAttendanceDto>();
    }

    public class ClassAttendanceDto
    {
        public int ClassId { get; set; }
        public string ClassName { get; set; } = string.Empty;
        public string SiteName { get; set; } = string.Empty;
        public int TotalLearners { get; set; }
        public int PresentLearners { get; set; }
        public int AbsentLearners { get; set; }
        public double AttendanceRate { get; set; }
        public List<LearnerAttendanceDto> Learners { get; set; } = new List<LearnerAttendanceDto>();
    }

    public class LearnerAttendanceDto
    {
        public int LearnerId { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string IdNumber { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty; // Present, Absent, Late, Excused
        public DateTime? ClockInTime { get; set; }
        public DateTime? ClockOutTime { get; set; }
        public string? ContactTime { get; set; }
        public double? ContactHours { get; set; }
        public bool ClockInVerified { get; set; }
        public bool ClockOutVerified { get; set; }
        public string? Notes { get; set; }
    }

    public class AttendanceFilterDto
    {
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string Period { get; set; } = "today"; // today, week, month, custom
        public int? ClassId { get; set; }
        public string? Status { get; set; } // Present, Absent, Late, Excused
    }

    public class AttendanceReportDto
    {
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string Period { get; set; } = string.Empty;
        public int ProjectId { get; set; }
        public string ProjectName { get; set; } = string.Empty;
        public AttendanceSummaryDto Summary { get; set; } = new AttendanceSummaryDto();
        public List<DailyAttendanceDto> DailyBreakdown { get; set; } = new List<DailyAttendanceDto>();
        public List<LearnerAttendanceSummaryDto> LearnerSummaries { get; set; } = new List<LearnerAttendanceSummaryDto>();
    }

    public class AttendanceSummaryDto
    {
        public int TotalDays { get; set; }
        public int TotalLearners { get; set; }
        public int TotalPossibleAttendances { get; set; }
        public int TotalActualAttendances { get; set; }
        public double OverallAttendanceRate { get; set; }
        public double AverageContactHours { get; set; }
        public int TotalLateArrivals { get; set; }
        public int TotalEarlyDepartures { get; set; }
    }

    public class DailyAttendanceDto
    {
        public DateTime Date { get; set; }
        public int TotalLearners { get; set; }
        public int PresentLearners { get; set; }
        public int AbsentLearners { get; set; }
        public double AttendanceRate { get; set; }
        public double AverageContactHours { get; set; }
    }

    public class LearnerAttendanceSummaryDto
    {
        public int LearnerId { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string IdNumber { get; set; } = string.Empty;
        public int TotalDays { get; set; }
        public int PresentDays { get; set; }
        public int AbsentDays { get; set; }
        public int LateDays { get; set; }
        public double AttendanceRate { get; set; }
        public double AverageContactHours { get; set; }
        public double TotalContactHours { get; set; }
    }

    public class LearnerWeeklyAttendanceDto
    {
        public int LearnerId { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string IdNumber { get; set; } = string.Empty;
        public DateTime WeekStartDate { get; set; }
        public DateTime WeekEndDate { get; set; }
        public int PresentDays { get; set; }
        public int AbsentDays { get; set; }
        public double AttendanceRate { get; set; }
        public double TotalContactHours { get; set; }
        public List<DailyLearnerAttendanceDto> DailyAttendances { get; set; } = new List<DailyLearnerAttendanceDto>();
    }

    public class DailyLearnerAttendanceDto
    {
        public DateTime Date { get; set; }
        public string DayOfWeek { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty; // Present, Absent, Late, Excused
        public DateTime? ClockInTime { get; set; }
        public DateTime? ClockOutTime { get; set; }
        public string? ContactTime { get; set; }
        public double? ContactHours { get; set; }
        public bool ClockInVerified { get; set; }
        public bool ClockOutVerified { get; set; }
        public string? Notes { get; set; }
    }

    // ─── Calendar View DTOs ──────────────────────────────────────────────────
    public class LearnerAttendanceCalendarDto
    {
        public int LearnerId { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string IdNumber { get; set; } = string.Empty;
        public string? Gender { get; set; }
        public string? Telephone { get; set; }
        public string? Address { get; set; }
        public string? ProfilePhotoPath { get; set; }
        public string? SignaturePath { get; set; }
        
        // Project Details
        public string? ProjectName { get; set; }
        public string? Pathway { get; set; }
        public string? Province { get; set; }
        public string? SiteName { get; set; }
        
        // Class Details
        public string? ClassName { get; set; }
        public string? TeacherName { get; set; }
        public string? TeacherEmail { get; set; }
        public string? TeacherSignaturePath { get; set; }
        public string? TeacherProfileImagePath { get; set; }
        public string? QualificationLevel { get; set; }
        public List<string> UnitStandards { get; set; } = new List<string>();
        
        // Calendar Data
        public int Year { get; set; }
        public int Month { get; set; }
        public string MonthName { get; set; } = string.Empty;
        public List<CalendarDayDto> CalendarDays { get; set; } = new List<CalendarDayDto>();
        
        // Statistics
        public int PresentDays { get; set; }
        public int AbsentDays { get; set; }
        public int LateDays { get; set; }
        public double TotalContactHours { get; set; }
        public double AttendanceRate { get; set; }
        
        // Additional Stats
        public int ExpectedAttendance { get; set; }
        public int ActualAttendance { get; set; }
        public int DaysAbsent { get; set; }
        public int InvalidAttendance { get; set; }
        public int Holidays { get; set; }
        public int ApprovedSickDays { get; set; }
        public int PendingSickDays { get; set; }
    }

    public class CalendarDayDto
    {
        public DateTime Date { get; set; }
        public int Day { get; set; }
        public string DayOfWeek { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty; // Present, Absent, Late, Excused, No Record
        public DateTime? ClockInTime { get; set; }
        public DateTime? ClockOutTime { get; set; }
        public string? SignaturePath { get; set; }
        public double? ContactHours { get; set; }
        public string? Notes { get; set; }
        public bool IsWeekend { get; set; }
    }
}