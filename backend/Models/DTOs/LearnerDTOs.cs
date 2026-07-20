using System.ComponentModel.DataAnnotations;

namespace backend.Models.DTOs
{
    public class CreateLearnerDto
    {
        [Required]
        public int SiteClassId { get; set; }

        // Personal Information
        [Required]
        [StringLength(10)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string LastName { get; set; } = string.Empty;

        [Required]
        [StringLength(13)]
        [RegularExpression(@"^\d{13}$", ErrorMessage = "ID Number must be exactly 13 digits")]
        public string IdNumber { get; set; } = string.Empty;

        [StringLength(20)]
        public string? ContactNumber { get; set; }

        [StringLength(100)]
        [EmailAddress]
        public string? Email { get; set; }

        public DateTime? DateOfBirth { get; set; }

        public int? Age { get; set; }

        [StringLength(50)]
        public string? Gender { get; set; }

        [StringLength(50)]
        public string? Race { get; set; }

        [StringLength(50)]
        public string? HomeLanguage { get; set; }

        [StringLength(100)]
        public string? Disability { get; set; }

        // Address Information
        [StringLength(255)]
        public string? AddressLine1 { get; set; }

        [StringLength(255)]
        public string? AddressLine2 { get; set; }

        [StringLength(255)]
        public string? AddressLine3 { get; set; }

        [StringLength(10)]
        public string? PostalCode { get; set; }

        // Education Information
        [StringLength(200)]
        public string? HighSchoolName { get; set; }

        public int? YearOfCompletion { get; set; }

        [StringLength(200)]
        public string? SchoolLocation { get; set; }

        [StringLength(50)]
        public string? HighestGradePassed { get; set; }

        // Next of Kin Information
        [StringLength(200)]
        public string? NextOfKinName { get; set; }

        [StringLength(50)]
        public string? NextOfKinRelation { get; set; }

        [StringLength(20)]
        public string? NextOfKinContactNumber { get; set; }

        // Bank Information
        [StringLength(100)]
        public string? BankName { get; set; }

        [StringLength(50)]
        public string? AccountType { get; set; }

        [StringLength(50)]
        public string? AccountNumber { get; set; }

        [StringLength(20)]
        public string? BranchCode { get; set; }
    }

    public class UpdateLearnerDto
    {
        [Required]
        [StringLength(10)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string LastName { get; set; } = string.Empty;

        [Required]
        [StringLength(13)]
        [RegularExpression(@"^\d{13}$", ErrorMessage = "ID Number must be exactly 13 digits")]
        public string IdNumber { get; set; } = string.Empty;

        [StringLength(20)]
        public string? ContactNumber { get; set; }

        [StringLength(100)]
        [EmailAddress]
        public string? Email { get; set; }

        public DateTime? DateOfBirth { get; set; }

        public int? Age { get; set; }

        [StringLength(50)]
        public string? Gender { get; set; }

        [StringLength(50)]
        public string? Race { get; set; }

        [StringLength(50)]
        public string? HomeLanguage { get; set; }

        [StringLength(100)]
        public string? Disability { get; set; }

        // Address Information
        [StringLength(255)]
        public string? AddressLine1 { get; set; }

        [StringLength(255)]
        public string? AddressLine2 { get; set; }

        [StringLength(255)]
        public string? AddressLine3 { get; set; }

        [StringLength(10)]
        public string? PostalCode { get; set; }

        // Education Information
        [StringLength(200)]
        public string? HighSchoolName { get; set; }

        public int? YearOfCompletion { get; set; }

        [StringLength(200)]
        public string? SchoolLocation { get; set; }

        [StringLength(50)]
        public string? HighestGradePassed { get; set; }

        // Next of Kin Information
        [StringLength(200)]
        public string? NextOfKinName { get; set; }

        [StringLength(50)]
        public string? NextOfKinRelation { get; set; }

        [StringLength(20)]
        public string? NextOfKinContactNumber { get; set; }

        // Bank Information
        [StringLength(100)]
        public string? BankName { get; set; }

        [StringLength(50)]
        public string? AccountType { get; set; }

        [StringLength(50)]
        public string? AccountNumber { get; set; }

        [StringLength(20)]
        public string? BranchCode { get; set; }
    }

    public class LearnerResponseDto
    {
        public int Id { get; set; }
        public int EnrollmentId { get; set; }
        public int SiteClassId { get; set; }
        public string ClassName { get; set; } = string.Empty;
        public string SiteName { get; set; } = string.Empty;

        // Personal Information
        public string Title { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string IdNumber { get; set; } = string.Empty;
        public string? ContactNumber { get; set; }
        public string? Email { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public int? Age { get; set; }
        public string? Gender { get; set; }
        public string? Race { get; set; }
        public string? HomeLanguage { get; set; }
        public string? Disability { get; set; }

        // Address Information
        public string? AddressLine1 { get; set; }
        public string? AddressLine2 { get; set; }
        public string? AddressLine3 { get; set; }
        public string? PostalCode { get; set; }

        // Education Information
        public string? HighSchoolName { get; set; }
        public int? YearOfCompletion { get; set; }
        public string? SchoolLocation { get; set; }
        public string? HighestGradePassed { get; set; }

        // Next of Kin Information
        public string? NextOfKinName { get; set; }
        public string? NextOfKinRelation { get; set; }
        public string? NextOfKinContactNumber { get; set; }

        // Bank Information
        public string? BankName { get; set; }
        public string? AccountType { get; set; }
        public string? AccountNumber { get; set; }
        public string? BranchCode { get; set; }

        // Profile Photo
        public string? ProfilePhotoPath { get; set; }

        // Enrollment Status
        public string Status { get; set; } = "Active";
        public DateTime EnrollmentDate { get; set; }
        public DateTime? CompletionDate { get; set; }
        
        // Fingerprint Information
        public string? LeftThumbTemplate { get; set; } // Futronic
        public string? RightThumbTemplate { get; set; } // Futronic
        public string? LeftThumbTemplateZk { get; set; } // ZKTECO
        public string? RightThumbTemplateZk { get; set; } // ZKTECO

        // Signature
        public string? SignaturePath { get; set; }
        
        // Timestamps
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public string? CreatedByUserName { get; set; }
    }

    public class EnrollLearnerDto
    {
        [Required]
        public int LearnerId { get; set; }

        [Required]
        public int SiteClassId { get; set; }
    }

    public class UpdateEnrollmentStatusDto
    {
        [Required]
        [StringLength(50)]
        public string Status { get; set; } = "Active";

        public DateTime? CompletionDate { get; set; }

        public DateTime? WithdrawalDate { get; set; }

        public string? WithdrawalReason { get; set; }
    }
}
