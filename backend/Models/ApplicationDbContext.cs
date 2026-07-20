using Microsoft.EntityFrameworkCore;
using backend.Services.Interfaces;

namespace backend.Models
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        // Learning Management System Entities
        public DbSet<Course> Courses { get; set; }
        public DbSet<Module> Modules { get; set; }
        public DbSet<Lesson> Lessons { get; set; }
        
        // User Management System Entities
        public DbSet<User> Users { get; set; }
        public DbSet<SystemAdmin> SystemAdmins { get; set; }
        public DbSet<Client> Clients { get; set; }
        public DbSet<SkillsDevelopmentProvider> SkillsDevelopmentProviders { get; set; }
        public DbSet<Department> Departments { get; set; }
        
        // Document Management System Entities
        public DbSet<Document> Documents { get; set; }
        public DbSet<DocumentAuditLog> DocumentAuditLogs { get; set; }
        public DbSet<DocumentPermission> DocumentPermissions { get; set; }
        public DbSet<DocumentAccessLog> DocumentAccessLogs { get; set; }
        
        // Project Management System Entities
        public DbSet<Project> Projects { get; set; }
        public DbSet<ProjectAssignment> ProjectAssignments { get; set; }
        public DbSet<LearningPathway> LearningPathways { get; set; }
        public DbSet<ProjectLearningPathway> ProjectLearningPathways { get; set; }
        public DbSet<QualificationType> QualificationTypes { get; set; }
        public DbSet<ProjectQualification> ProjectQualifications { get; set; }
        
        // Task Management System Entities
        public DbSet<ProjectTask> Tasks { get; set; }
        public DbSet<TaskReminder> TaskReminders { get; set; }
        
        // Phase Management System Entities
        public DbSet<ProjectPhase> ProjectPhases { get; set; }
        public DbSet<ProjectPhaseQualification> ProjectPhaseQualifications { get; set; }
        public DbSet<ProjectPhaseLearningPathway> ProjectPhaseLearningPathways { get; set; }
        public DbSet<PhaseActivity> PhaseActivities { get; set; }
        public DbSet<PhaseSubActivity> PhaseSubActivities { get; set; }
        
        // Qualification System Entities
        public DbSet<OccupationalQualification> OccupationalQualifications { get; set; }
        public DbSet<LegacyQualification> LegacyQualifications { get; set; }
        public DbSet<OccupationalUnitStandard> OccupationalUnitStandards { get; set; }
        public DbSet<LegacyUnitStandard> LegacyUnitStandards { get; set; }
        public DbSet<ProjectQualificationUnitStandard> ProjectQualificationUnitStandards { get; set; }
        
        // Assessment System Entities
        public DbSet<FormativeAssessment> FormativeAssessments { get; set; }
        public DbSet<SummativeAssessment> SummativeAssessments { get; set; }
        public DbSet<LogbookEntry> LogbookEntries { get; set; }
        public DbSet<FormativeAssessmentQuestion> FormativeAssessmentQuestions { get; set; }
        public DbSet<SummativeAssessmentQuestion> SummativeAssessmentQuestions { get; set; }
        public DbSet<AssessmentStrategyPlan> AssessmentStrategyPlans { get; set; }
        
        // Learner Assessment Answer System Entities
        public DbSet<LearnerAssessmentAnswer> LearnerAssessmentAnswers { get; set; }
        public DbSet<LearnerAssessmentProgress> LearnerAssessmentProgress { get; set; }
        
        // Learning Content System Entities
        public DbSet<LearningMaterial> LearningMaterials { get; set; }
        
        // Site Management System Entities
        public DbSet<ProjectSite> ProjectSites { get; set; }
        public DbSet<SiteClass> SiteClasses { get; set; }
        public DbSet<Learner> Learners { get; set; }
        public DbSet<ClassEnrollment> ClassEnrollments { get; set; }
        public DbSet<LearnerDocument> LearnerDocuments { get; set; }
        
        // Attendance System Entities
        public DbSet<ClassTeacher> ClassTeachers { get; set; }
        public DbSet<LearnerAttendance> LearnerAttendances { get; set; }
        public DbSet<AttendanceLog> AttendanceLogs { get; set; }
        public DbSet<SickNote> SickNotes { get; set; }

        // Notice Board
        public DbSet<Announcement> Announcements { get; set; }
        
        // External User Access
        public DbSet<ExternalUserAccess> ExternalUserAccess { get; set; }
        
        // Legacy Assessment System Entities
        public DbSet<AssessmentType> AssessmentTypes { get; set; }
        public DbSet<UnitStandardAssessment> UnitStandardAssessments { get; set; }
        public DbSet<AssessmentQuestion> AssessmentQuestions { get; set; }
        
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            
            // Configure PostgreSQL naming conventions
            foreach (var entity in modelBuilder.Model.GetEntityTypes())
            {
                // Configure table names to match PostgreSQL case sensitivity
                entity.SetTableName(entity.GetTableName());
                
                foreach (var property in entity.GetProperties())
                {
                    // Ensure column names match the exact case used in PostgreSQL
                    property.SetColumnName(property.GetColumnName());
                }
            }
            
            // Configure LMS relationships
            modelBuilder.Entity<Course>()
                .HasMany(c => c.Modules)
                .WithOne(m => m.Course)
                .HasForeignKey(m => m.CourseId)
                .OnDelete(DeleteBehavior.Cascade);
                
            modelBuilder.Entity<Module>()
                .HasMany(m => m.Lessons)
                .WithOne(l => l.Module)
                .HasForeignKey(l => l.ModuleId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure User Management relationships
            modelBuilder.Entity<Client>()
                .HasMany(c => c.Users)
                .WithOne(u => u.Client)
                .HasForeignKey(u => u.ClientId)
                .OnDelete(DeleteBehavior.SetNull);

            // SkillsDevelopmentProviders relationship temporarily removed due to database schema mismatch
            // modelBuilder.Entity<Client>()
            //     .HasMany(c => c.SkillsDevelopmentProviders)
            //     .WithOne(s => s.Client)
            //     .HasForeignKey(s => s.ClientId)
            //     .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<SkillsDevelopmentProvider>()
                .HasMany(s => s.Users)
                .WithOne(u => u.SkillsDevelopmentProvider)
                .HasForeignKey(u => u.SkillsDevelopmentProviderId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<SkillsDevelopmentProvider>()
                .HasMany(s => s.Departments)
                .WithOne(d => d.SkillsDevelopmentProvider)
                .HasForeignKey(d => d.SkillsDevelopmentProviderId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Department>()
                .HasMany(d => d.Users)
                .WithOne(u => u.Department)
                .HasForeignKey(u => u.DepartmentId)
                .OnDelete(DeleteBehavior.SetNull);

            // Configure Document Management relationships
            modelBuilder.Entity<Document>()
                .HasOne(d => d.UploadedBy)
                .WithMany()
                .HasForeignKey(d => d.UploadedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Document>()
                .HasOne(d => d.Client)
                .WithMany()
                .HasForeignKey(d => d.ClientId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Document>()
                .HasOne(d => d.SkillsDevelopmentProvider)
                .WithMany()
                .HasForeignKey(d => d.SkillsDevelopmentProviderId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Document>()
                .HasOne(d => d.Department)
                .WithMany()
                .HasForeignKey(d => d.DepartmentId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<DocumentAuditLog>()
                .HasOne(dal => dal.Document)
                .WithMany()
                .HasForeignKey(dal => dal.DocumentId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<DocumentAuditLog>()
                .HasOne(dal => dal.User)
                .WithMany()
                .HasForeignKey(dal => dal.UserId)
                .OnDelete(DeleteBehavior.SetNull);

            // Configure Document Permission relationships
            modelBuilder.Entity<DocumentPermission>()
                .HasOne(dp => dp.Document)
                .WithMany()
                .HasForeignKey(dp => dp.DocumentId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<DocumentPermission>()
                .HasOne(dp => dp.User)
                .WithMany()
                .HasForeignKey(dp => dp.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<DocumentPermission>()
                .HasOne(dp => dp.GrantedBy)
                .WithMany()
                .HasForeignKey(dp => dp.GrantedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<DocumentPermission>()
                .HasOne(dp => dp.RevokedBy)
                .WithMany()
                .HasForeignKey(dp => dp.RevokedByUserId)
                .OnDelete(DeleteBehavior.SetNull);

            // Configure Document Access Log relationships
            modelBuilder.Entity<DocumentAccessLog>(entity =>
            {
                entity.HasOne(dal => dal.Document)
                    .WithMany(d => d.AccessLogs)
                    .HasForeignKey(dal => dal.DocumentId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(dal => dal.User)
                    .WithMany()
                    .HasForeignKey(dal => dal.UserId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // Configure indexes for better performance
            
            // User indexes
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();
                
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Role);
                
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Status);
                
            modelBuilder.Entity<User>()
                .HasIndex(u => u.ClientId);
                
            modelBuilder.Entity<User>()
                .HasIndex(u => u.SkillsDevelopmentProviderId);
                
            modelBuilder.Entity<User>()
                .HasIndex(u => u.DepartmentId);
                
            modelBuilder.Entity<User>()
                .HasIndex(u => u.CreatedAt);

            // Client indexes
            modelBuilder.Entity<Client>()
                .HasIndex(c => c.Name);
                
            modelBuilder.Entity<Client>()
                .HasIndex(c => c.Email);
                
            modelBuilder.Entity<Client>()
                .HasIndex(c => c.Status);
                
            modelBuilder.Entity<Client>()
                .HasIndex(c => c.CreatedAt);

            // SkillsDevelopmentProvider indexes
            modelBuilder.Entity<SkillsDevelopmentProvider>()
                .HasIndex(s => s.Name);

            // Temporarily disabled due to database schema mismatch
            // modelBuilder.Entity<SkillsDevelopmentProvider>()
            //     .HasIndex(s => s.AccreditationNumber)
            //     .IsUnique();
                
            modelBuilder.Entity<SkillsDevelopmentProvider>();
                // ContactEmail index temporarily removed due to missing column in database
                // .HasIndex(s => s.ContactEmail)
                // .IsUnique();
                
            modelBuilder.Entity<SkillsDevelopmentProvider>()
                .HasIndex(s => s.Status);
                
            modelBuilder.Entity<SkillsDevelopmentProvider>()
                .HasIndex(s => s.ClientId);
                
            modelBuilder.Entity<SkillsDevelopmentProvider>()
                .HasIndex(s => s.CreatedAt);
                
            // Department indexes
            modelBuilder.Entity<Department>()
                .HasIndex(d => d.Name);
                
            modelBuilder.Entity<Department>()
                .HasIndex(d => d.Type);
                
            modelBuilder.Entity<Department>()
                .HasIndex(d => d.Status);
                
            modelBuilder.Entity<Department>()
                .HasIndex(d => d.SkillsDevelopmentProviderId);
                
            modelBuilder.Entity<Department>()
                .HasIndex(d => d.CreatedAt);
                
            // Course indexes for LMS
            modelBuilder.Entity<Course>()
                .HasIndex(c => c.Title);
                
            modelBuilder.Entity<Course>()
                .HasIndex(c => c.CreatedAt);
                
            // Module indexes for LMS
            modelBuilder.Entity<Module>()
                .HasIndex(m => m.Title);
                
            modelBuilder.Entity<Module>()
                .HasIndex(m => m.CourseId);
                
            modelBuilder.Entity<Module>()
                .HasIndex(m => m.Order);
                
            // Lesson indexes for LMS
            modelBuilder.Entity<Lesson>()
                .HasIndex(l => l.Title);
                
            modelBuilder.Entity<Lesson>()
                .HasIndex(l => l.ModuleId);
                
            modelBuilder.Entity<Lesson>()
                .HasIndex(l => l.Order);
                
            // Document indexes for Document Management
            modelBuilder.Entity<Document>()
                .HasIndex(d => d.Name);
                
            modelBuilder.Entity<Document>()
                .HasIndex(d => d.Type);
                
            modelBuilder.Entity<Document>()
                .HasIndex(d => d.Status);
                
            modelBuilder.Entity<Document>()
                .HasIndex(d => d.AccessLevel);
                
            modelBuilder.Entity<Document>()
                .HasIndex(d => d.UploadedByUserId);
                
            modelBuilder.Entity<Document>()
                .HasIndex(d => d.ClientId);
                
            modelBuilder.Entity<Document>()
                .HasIndex(d => d.SkillsDevelopmentProviderId);
                
            modelBuilder.Entity<Document>()
                .HasIndex(d => d.DepartmentId);
                
            modelBuilder.Entity<Document>()
                .HasIndex(d => d.CreatedAt);
                
            modelBuilder.Entity<Document>()
                .HasIndex(d => d.ExpiresAt);
                
            // Document Audit Log indexes
            modelBuilder.Entity<DocumentAuditLog>()
                .HasIndex(dal => dal.DocumentId);
                
            modelBuilder.Entity<DocumentAuditLog>()
                .HasIndex(dal => dal.UserId);
                
            modelBuilder.Entity<DocumentAuditLog>()
                .HasIndex(dal => dal.Action);
                
            modelBuilder.Entity<DocumentAuditLog>()
                .HasIndex(dal => dal.Timestamp);
                
            modelBuilder.Entity<DocumentAuditLog>()
                .HasIndex(dal => dal.IsSecurityEvent);
                
            modelBuilder.Entity<DocumentAuditLog>()
                .HasIndex(dal => dal.SecurityEventType);
                
            // Document Permission indexes
            modelBuilder.Entity<DocumentPermission>()
                .HasIndex(dp => dp.DocumentId);
                
            modelBuilder.Entity<DocumentPermission>()
                .HasIndex(dp => dp.UserId);
                
            modelBuilder.Entity<DocumentPermission>()
                .HasIndex(dp => dp.IsActive);
                
            modelBuilder.Entity<DocumentPermission>()
                .HasIndex(dp => dp.ExpiresAt);
                
            modelBuilder.Entity<DocumentPermission>()
                .HasIndex(dp => dp.GrantedAt);
                
            // Document Access Log indexes
            modelBuilder.Entity<DocumentAccessLog>()
                .HasIndex(dal => dal.DocumentId);
                
            modelBuilder.Entity<DocumentAccessLog>()
                .HasIndex(dal => dal.UserId);
                
            modelBuilder.Entity<DocumentAccessLog>()
                .HasIndex(dal => dal.Action);
                
            modelBuilder.Entity<DocumentAccessLog>()
                .HasIndex(dal => dal.AccessedAt);
                
            // SystemAdmin table configuration
            modelBuilder.Entity<SystemAdmin>()
                .HasIndex(sa => sa.Email)
                .IsUnique();
                
            // Configure Project Management relationships
            modelBuilder.Entity<Project>()
                .HasOne(p => p.Client)
                .WithMany()
                .HasForeignKey(p => p.ClientId)
                .OnDelete(DeleteBehavior.Cascade);
                
            modelBuilder.Entity<Project>()
                .HasOne(p => p.SkillsDevelopmentProvider)
                .WithMany()
                .HasForeignKey(p => p.SkillsDevelopmentProviderId)
                .OnDelete(DeleteBehavior.Restrict);
                
            modelBuilder.Entity<ProjectLearningPathway>()
                .HasOne(plp => plp.Project)
                .WithMany(p => p.ProjectLearningPathways)
                .HasForeignKey(plp => plp.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);
                
            modelBuilder.Entity<ProjectLearningPathway>()
                .HasOne(plp => plp.LearningPathway)
                .WithMany(lp => lp.ProjectLearningPathways)
                .HasForeignKey(plp => plp.PathwayId)
                .OnDelete(DeleteBehavior.Cascade);
                
            modelBuilder.Entity<ProjectQualification>()
                .HasOne(pq => pq.ProjectLearningPathway)
                .WithMany(plp => plp.ProjectQualifications)
                .HasForeignKey(pq => pq.ProjectLearningPathwayId)
                .OnDelete(DeleteBehavior.Cascade);
                
            modelBuilder.Entity<ProjectQualification>()
                .HasOne(pq => pq.QualificationType)
                .WithMany(qt => qt.ProjectQualifications)
                .HasForeignKey(pq => pq.QualificationTypeId)
                .OnDelete(DeleteBehavior.Restrict);
                
            modelBuilder.Entity<ProjectQualification>()
                .HasOne(pq => pq.OccupationalQualification)
                .WithMany(oq => oq.ProjectQualifications)
                .HasForeignKey(pq => pq.OccupationalQualificationId)
                .OnDelete(DeleteBehavior.SetNull);
                
            modelBuilder.Entity<ProjectQualification>()
                .HasOne(pq => pq.LegacyQualification)
                .WithMany(lq => lq.ProjectQualifications)
                .HasForeignKey(pq => pq.LegacyQualificationId)
                .OnDelete(DeleteBehavior.SetNull);
                
            // Configure Qualification relationships
            modelBuilder.Entity<OccupationalUnitStandard>()
                .HasOne(ous => ous.Qualification)
                .WithMany(oq => oq.UnitStandards)
                .HasForeignKey(ous => ous.QualificationId)
                .HasPrincipalKey(oq => oq.QualificationId)
                .OnDelete(DeleteBehavior.Cascade);
                
            modelBuilder.Entity<LegacyUnitStandard>()
                .HasOne(lus => lus.Qualification)
                .WithMany(lq => lq.UnitStandards)
                .HasForeignKey(lus => lus.QualificationId)
                .HasPrincipalKey(lq => lq.QualificationId)
                .OnDelete(DeleteBehavior.Cascade);
                
            modelBuilder.Entity<SystemAdmin>()
                .HasIndex(sa => sa.Username)
                .IsUnique();
                
            modelBuilder.Entity<SystemAdmin>()
                .HasIndex(sa => sa.Status);
                
            modelBuilder.Entity<SystemAdmin>()
                .HasIndex(sa => sa.AccessLevel);

            // Configure LogbookEntry explicitly to ensure EF Core recognizes the new columns
            modelBuilder.Entity<LogbookEntry>()
                .Property(l => l.StartDate)
                .IsRequired();
                
            modelBuilder.Entity<LogbookEntry>()
                .Property(l => l.EndDate)
                .IsRequired();
                
            modelBuilder.Entity<LogbookEntry>()
                .Property(l => l.EntryDate)
                .IsRequired(false);
        }
    }
}