using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class Learner
    {
        [Key]
        public int Id { get; set; }

        public int? CreatedByUserId { get; set; }

        // Personal Information
        [Required]
        [StringLength(10)]
        public string Title { get; set; } = string.Empty; // Mr, Mrs, Miss, Sir, Dr

        [Required]
        [StringLength(100)]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string LastName { get; set; } = string.Empty;

        [Required]
        [StringLength(13)]
        public string IdNumber { get; set; } = string.Empty;

        [StringLength(20)]
        public string? ContactNumber { get; set; }

        [StringLength(100)]
        [EmailAddress]
        public string? Email { get; set; }

        public DateTime? DateOfBirth { get; set; }

        public int? Age { get; set; }

        [StringLength(50)]
        public string? Gender { get; set; } // Male, Female, Other, Prefer not to say

        [StringLength(50)]
        public string? Race { get; set; } // Asian, Black, Colored, White, Other, Prefer not to say

        [StringLength(50)]
        public string? HomeLanguage { get; set; } // English, IsiZulu, Sesotho, IsiXhosa, Tshonga, Afrikaans

        [StringLength(100)]
        public string? Disability { get; set; } // None, Visual Impairment, Hearing Impairment, Physical Disability, Mental Disability, Other

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
        public string? BankName { get; set; } // ABSA, Capitec, FNB, Nedbank, Standard Bank, Other

        [StringLength(50)]
        public string? AccountType { get; set; } // Savings, Cheque, Transmission, Other

        [StringLength(50)]
        public string? AccountNumber { get; set; }

        [StringLength(20)]
        public string? BranchCode { get; set; }

        // Profile Photo
        [StringLength(500)]
        public string? ProfilePhotoPath { get; set; }

        // Learner Portal Credentials (generated on registration)
        [StringLength(100)]
        public string? Username { get; set; }

        [StringLength(255)]
        public string? PasswordHash { get; set; }

        public bool MustChangePassword { get; set; } = true;

        // Password Reset
        [StringLength(255)]
        public string? PasswordResetToken { get; set; }

        public DateTime? PasswordResetTokenExpiry { get; set; }

        // Fingerprint Data (Base64 encoded templates)
        public string? LeftThumbTemplate { get; set; } // Futronic ANSI template
        public string? RightThumbTemplate { get; set; } // Futronic ANSI template
        public string? LeftThumbTemplateZk { get; set; } // ZKTECO template
        public string? RightThumbTemplateZk { get; set; } // ZKTECO template

        // Face Recognition
        public string? FaceEmbedding { get; set; } // JSON serialized List<double>

        // Signature
        [StringLength(500)]
        public string? SignaturePath { get; set; }

        // Timestamps
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        // Navigation Properties
        [ForeignKey("CreatedByUserId")]
        public virtual User? CreatedByUser { get; set; }

        public virtual ICollection<ClassEnrollment> ClassEnrollments { get; set; } = new List<ClassEnrollment>();
        public virtual ICollection<LearnerDocument> LearnerDocuments { get; set; } = new List<LearnerDocument>();
    }
}
