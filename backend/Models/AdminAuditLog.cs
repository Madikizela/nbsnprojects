using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    [Table("admin_audit_logs")]
    public class AdminAuditLog
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        /// <summary>Who performed the action — system admin email or name.</summary>
        [StringLength(200)]
        public string PerformedBy { get; set; } = "System";

        /// <summary>Action type: SDP_DISABLED, SDP_ENABLED, USER_DISABLED, USER_ENABLED,
        /// CREDENTIALS_RESENT, SDP_REGISTERED, etc.</summary>
        [Required]
        [StringLength(100)]
        public string Action { get; set; } = string.Empty;

        /// <summary>Human-readable description of what happened.</summary>
        [StringLength(1000)]
        public string Description { get; set; } = string.Empty;

        /// <summary>The type of entity affected, e.g. "SDP", "User", "Client".</summary>
        [StringLength(50)]
        public string EntityType { get; set; } = string.Empty;

        /// <summary>The ID of the entity affected.</summary>
        public int? EntityId { get; set; }

        /// <summary>The name/label of the entity (denormalised for easy log display).</summary>
        [StringLength(200)]
        public string EntityName { get; set; } = string.Empty;

        /// <summary>Optional extra JSON data (e.g. before/after status).</summary>
        [StringLength(2000)]
        public string? Metadata { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
