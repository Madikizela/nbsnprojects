using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class DepartmentCreateRequest
    {
        [Required]
        [StringLength(200)]
        public string Name { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Description { get; set; }

        [Required]
        public DepartmentType Type { get; set; }

        [Required]
        [StringLength(100)]
        public string ManagerFirstName { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string ManagerSurname { get; set; } = string.Empty;

        [Required]
        [StringLength(255)]
        [EmailAddress]
        public string ManagerEmail { get; set; } = string.Empty;

        [Required]
        public int SkillsDevelopmentProviderId { get; set; }
    }
}

