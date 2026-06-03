using Microsoft.EntityFrameworkCore;
using backend.Models;
using System.Security.Cryptography;
using System.Text;
using backend.Services.Interfaces;

namespace backend.Services
{
    public class DataSeedingService : IDataSeedingService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<DataSeedingService> _logger;
        private readonly IPasswordHashingService _passwordHasher;
        private readonly string DEFAULT_ADMIN_EMAIL;
        private readonly string DEFAULT_ADMIN_PASSWORD;

        public DataSeedingService(
            ApplicationDbContext context, 
            ILogger<DataSeedingService> _logger,
            IPasswordHashingService passwordHasher)
        {
            _context = context;
            this._logger = _logger;
            _passwordHasher = passwordHasher;
            
            // Load admin credentials from environment variables or use defaults
            DEFAULT_ADMIN_EMAIL = Environment.GetEnvironmentVariable("DEFAULT_ADMIN_EMAIL") ?? "admin@system.local";
            DEFAULT_ADMIN_PASSWORD = Environment.GetEnvironmentVariable("DEFAULT_ADMIN_PASSWORD") ?? "Admin@123";
        }

        public async Task<bool> DefaultSystemAdminExistsAsync()
        {
            return await _context.SystemAdmins.AnyAsync(a => a.Email == DEFAULT_ADMIN_EMAIL);
        }

        public async Task CreateDefaultSystemAdminAsync()
        {
            var admin = new SystemAdmin
            {
                Email = DEFAULT_ADMIN_EMAIL,
                Username = "admin",
                FirstName = "System",
                LastName = "Administrator",
                PasswordHash = _passwordHasher.HashPassword(DEFAULT_ADMIN_PASSWORD),
                Status = SystemAdminStatus.Active,
                AccessLevel = SystemAdminLevel.SuperAdmin,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.SystemAdmins.Add(admin);
            await _context.SaveChangesAsync();
        }

        public async Task SeedInitialDataAsync()
        {
            try
            {
                _logger.LogInformation("Starting database seeding process...");

                // Ensure database is created
                await _context.Database.EnsureCreatedAsync();

                // Fix missing columns in AssessmentStrategyPlans
                await FixAssessmentStrategyPlansSchemaAsync();

                // Fix missing columns in LearnerAssessmentProgress
                await FixLearnerAssessmentProgressSchemaAsync();

                // Create default system admin if it doesn't exist
                if (!await DefaultSystemAdminExistsAsync())
                {
                    await CreateDefaultSystemAdminAsync();
                    _logger.LogInformation("Default system admin user created successfully.");
                }
                else
                {
                    _logger.LogInformation("Default system admin user already exists. Skipping creation.");
                }

                // Seed other data
                await SeedLearningPathwaysAsync();
                await SeedQualificationTypesAsync();
                await SeedLegacyDataAsync();
                await SeedClientsAsync();
                await SeedOccupationalDataAsync();
                await SeedSkillsDevelopmentProvidersAsync();
                await SeedSampleProjectsAsync();
                await SeedSampleUsersAsync();
                await SeedSampleAssignmentsAsync();

                _logger.LogInformation("Database seeding process completed successfully.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred during database seeding.");
                throw;
            }
        }

        private async Task SeedSampleAssignmentsAsync()
        {
            _logger.LogInformation("Checking sample assignments...");
            var project = await _context.Projects.FirstOrDefaultAsync();
            var assessor = await _context.Users.FirstOrDefaultAsync(u => u.Email == "maphangolwemihla5@gmail.com");

            if (project != null && assessor != null)
            {
                var existingAssignment = await _context.ProjectAssignments
                    .FirstOrDefaultAsync(a => a.ProjectId == project.Id && a.UserId == assessor.Id);

                if (existingAssignment == null)
                {
                    var assignment = new ProjectAssignment
                    {
                        ProjectId = project.Id,
                        UserId = assessor.Id,
                        Role = ProjectAssignmentRole.Assessor,
                        AssignedAt = DateTime.UtcNow
                    };
                    _context.ProjectAssignments.Add(assignment);
                    await _context.SaveChangesAsync();
                    _logger.LogInformation($"Assigned user {assessor.Email} to project {project.ProjectName} as Assessor.");
                }
                else
                {
                    _logger.LogInformation("Sample assignment already exists.");
                }
            }
        }

        private async Task FixAssessmentStrategyPlansSchemaAsync()
        {
            _logger.LogInformation("Checking and fixing database schema...");
            try
            {
                // Fix AssessmentStrategyPlans
                await _context.Database.ExecuteSqlRawAsync(@"
                    IF NOT EXISTS (SELECT * FROM information_schema.columns 
                                   WHERE table_name = 'AssessmentStrategyPlans' AND column_name = 'ModeratorName')
                    THEN
                        ALTER TABLE AssessmentStrategyPlans ADD COLUMN ModeratorName VARCHAR(255);
                    END IF;");

                await _context.Database.ExecuteSqlRawAsync(@"
                    IF NOT EXISTS (SELECT * FROM information_schema.columns 
                                   WHERE table_name = 'AssessmentStrategyPlans' AND column_name = 'ModeratorNumber')
                    THEN
                        ALTER TABLE AssessmentStrategyPlans ADD COLUMN ModeratorNumber VARCHAR(255);
                    END IF;");

                await _context.Database.ExecuteSqlRawAsync(@"
                    IF NOT EXISTS (SELECT * FROM information_schema.columns 
                                   WHERE table_name = 'AssessmentStrategyPlans' AND column_name = 'ModeratorSignature')
                    THEN
                        ALTER TABLE AssessmentStrategyPlans ADD COLUMN ModeratorSignature LONGTEXT;
                    END IF;");

                await _context.Database.ExecuteSqlRawAsync(@"
                    IF NOT EXISTS (SELECT * FROM information_schema.columns 
                                   WHERE table_name = 'AssessmentStrategyPlans' AND column_name = 'ModeratorInitials')
                    THEN
                        ALTER TABLE AssessmentStrategyPlans ADD COLUMN ModeratorInitials VARCHAR(50);
                    END IF;");

                // Fix SkillsDevelopmentProviders
                await _context.Database.ExecuteSqlRawAsync(@"
                    IF NOT EXISTS (SELECT * FROM information_schema.columns 
                                   WHERE table_name = 'SkillsDevelopmentProviders' AND column_name = 'AccreditationNumber')
                    THEN
                        ALTER TABLE SkillsDevelopmentProviders ADD COLUMN AccreditationNumber VARCHAR(255);
                    END IF;");

                await _context.Database.ExecuteSqlRawAsync(@"
                    IF NOT EXISTS (SELECT * FROM information_schema.columns     
                                   WHERE table_name = 'SkillsDevelopmentProviders' AND column_name = 'AccreditationExpiryDate')
                    THEN
                        ALTER TABLE SkillsDevelopmentProviders ADD COLUMN AccreditationExpiryDate DATETIME;
                    END IF;");

                await _context.Database.ExecuteSqlRawAsync(@"
                    IF NOT EXISTS (SELECT * FROM information_schema.columns 
                                   WHERE table_name = 'Users' AND column_name = 'Initials')
                    THEN
                        ALTER TABLE Users ADD COLUMN Initials VARCHAR(50);
                    END IF;");

                _logger.LogInformation("Database schema check/fix completed.");
            }
            catch (Exception ex)
            {
                _logger.LogWarning($"Advanced schema fix failed: {ex.Message}. Trying simple ALTER TABLE...");
                try { await _context.Database.ExecuteSqlRawAsync("ALTER TABLE AssessmentStrategyPlans ADD COLUMN IF NOT EXISTS ModeratorName VARCHAR(255);"); } catch { }
                try { await _context.Database.ExecuteSqlRawAsync("ALTER TABLE AssessmentStrategyPlans ADD COLUMN IF NOT EXISTS ModeratorNumber VARCHAR(255);"); } catch { }
                try { await _context.Database.ExecuteSqlRawAsync("ALTER TABLE AssessmentStrategyPlans ADD COLUMN IF NOT EXISTS ModeratorSignature LONGTEXT;"); } catch { }
                try { await _context.Database.ExecuteSqlRawAsync("ALTER TABLE AssessmentStrategyPlans ADD COLUMN IF NOT EXISTS ModeratorInitials VARCHAR(50);"); } catch { }
                try { await _context.Database.ExecuteSqlRawAsync("ALTER TABLE SkillsDevelopmentProviders ADD COLUMN IF NOT EXISTS AccreditationNumber VARCHAR(255);"); } catch { }
                try { await _context.Database.ExecuteSqlRawAsync("ALTER TABLE SkillsDevelopmentProviders ADD COLUMN IF NOT EXISTS AccreditationExpiryDate DATETIME;"); } catch { }
            }
        }

        private async Task FixLearnerAssessmentProgressSchemaAsync()
        {
            _logger.LogInformation("Checking and fixing LearnerAssessmentProgress schema...");
            try
            {
                var columns = new[] 
                { 
                    ("FormativeModerated", "TINYINT(1) DEFAULT 0"),
                    ("FormativeModeratedAt", "DATETIME NULL"),
                    ("SummativeModerated", "TINYINT(1) DEFAULT 0"),
                    ("SummativeModeratedAt", "DATETIME NULL"),
                    ("RemedialRequired", "TINYINT(1) DEFAULT 0"),
                    ("RemedialCompleted", "TINYINT(1) DEFAULT 0"),
                    ("RemedialCompletedAt", "DATETIME NULL")
                };

                foreach (var (col, type) in columns)
                {
                    try
                    {
                        await _context.Database.ExecuteSqlRawAsync($@"
                            IF NOT EXISTS (SELECT * FROM information_schema.columns 
                                           WHERE table_name = 'LearnerAssessmentProgress' AND column_name = '{col}')
                            THEN
                                ALTER TABLE LearnerAssessmentProgress ADD COLUMN {col} {type};
                            END IF;");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning($"Simple fix for {col} failed, trying ALTER TABLE ADD IF NOT EXISTS: {ex.Message}");
                        try { await _context.Database.ExecuteSqlRawAsync($"ALTER TABLE LearnerAssessmentProgress ADD COLUMN IF NOT EXISTS {col} {type};"); } catch { }
                    }
                }
                
                _logger.LogInformation("LearnerAssessmentProgress schema check/fix completed.");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Fatal error fixing LearnerAssessmentProgress schema: {ex.Message}");
            }
        }

        private async Task SeedSkillsDevelopmentProvidersAsync()
        {
            if (!await _context.SkillsDevelopmentProviders.AnyAsync())
            {
                var client = await _context.Clients.FirstOrDefaultAsync();
                if (client != null)
                {
                    var sdp = new SkillsDevelopmentProvider
                    {
                        Name = "NBSN Training Center",
                        Description = "Main training center for NBSN projects",
                        Status = SDPStatus.Active,
                        ClientId = client.Id,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    _context.SkillsDevelopmentProviders.Add(sdp);
                    await _context.SaveChangesAsync();
                    _logger.LogInformation("Skills Development Provider seeded successfully.");
                }
            }
        }

        private async Task SeedLearningPathwaysAsync()
        {
            if (!await _context.LearningPathways.AnyAsync())
            {
                var pathways = new[]
                {
                    new LearningPathway { PathwayId = 1, Name = "Internship", Synced = 0 },
                    new LearningPathway { PathwayId = 2, Name = "Apprenticeship (Artisans)", Synced = 0 },
                    new LearningPathway { PathwayId = 3, Name = "Learnership", Synced = 0 },
                    new LearningPathway { PathwayId = 4, Name = "Short Skills Programme", Synced = 0 },
                    new LearningPathway { PathwayId = 5, Name = "ARPL", Synced = 0 },
                    new LearningPathway { PathwayId = 6, Name = "RPL", Synced = 0 },
                    new LearningPathway { PathwayId = 7, Name = "Bursary", Synced = 0 },
                    new LearningPathway { PathwayId = 8, Name = "University Student Placement", Synced = 0 },
                    new LearningPathway { PathwayId = 9, Name = "Work Integrated Learning", Synced = 0 }
                };

                _context.LearningPathways.AddRange(pathways);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Learning pathways seeded successfully.");
            }
        }

        private async Task SeedQualificationTypesAsync()
        {
            if (!await _context.QualificationTypes.AnyAsync())
            {
                var qualificationTypes = new[]
                {
                    new QualificationType { Id = 1, Name = "Legacy", Description = "Legacy qualifications from previous system" },
                    new QualificationType { Id = 2, Name = "Occupational", Description = "Occupational qualifications from QCTO" }
                };

                _context.QualificationTypes.AddRange(qualificationTypes);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Qualification types seeded successfully.");
            }
        }

        private async Task SeedLegacyDataAsync()
        {
            if (!await _context.LegacyQualifications.AnyAsync())
            {
                var qualifications = new[]
                {
                    new LegacyQualification { Name = "National Certificate: IT", Level = "5", Credits = 120, QualificationType = "Full Qualification", QualificationId = 12345 },
                    new LegacyQualification { Name = "Further Education and Training: Business", Level = "4", Credits = 140, QualificationType = "Full Qualification", QualificationId = 67890 }
                };
                _context.LegacyQualifications.AddRange(qualifications);
                await _context.SaveChangesAsync();
            }
        }

        private async Task SeedClientsAsync()
        {
            if (!await _context.Clients.AnyAsync())
            {
                var clients = new[]
                {
                    new Client { Name = "Global Tech Solutions", Email = "contact@globaltech.com", Status = ClientStatus.Active },
                    new Client { Name = "Industrial Manufacturing Co", Email = "info@industrial.com", Status = ClientStatus.Active }
                };
                _context.Clients.AddRange(clients);
                await _context.SaveChangesAsync();
            }
        }

        private async Task SeedOccupationalDataAsync()
        {
            if (!await _context.OccupationalQualifications.AnyAsync())
            {
                var qualifications = new[]
                {
                    new OccupationalQualification { QualificationId = 1001, Name = "Occupational Certificate: Software Developer", Level = "6", Credits = 360, QualificationType = "Occupational", QualityPartner = "QCTO", Trade = "IT" },
                    new OccupationalQualification { QualificationId = 1002, Name = "Occupational Certificate: Electrician", Level = "4", Credits = 240, QualificationType = "Occupational", QualityPartner = "QCTO", Trade = "Engineering" }
                };
                _context.OccupationalQualifications.AddRange(qualifications);
                await _context.SaveChangesAsync();
            }
        }

        private async Task SeedSampleProjectsAsync()
        {
            var sdp = await _context.SkillsDevelopmentProviders.FirstOrDefaultAsync();
            var client = await _context.Clients.FirstOrDefaultAsync();
            
            if (sdp != null)
            {
                _logger.LogInformation($"DEBUG: Using SDP ID {sdp.Id} for project linking");
            }

            if (!await _context.Projects.AnyAsync())
            {
                if (client != null && sdp != null)
                {
                    var projects = new[]
                    {
                        new Project 
                        { 
                            ProjectName = "Junior Developer Program 2024", 
                            StartDate = DateTime.UtcNow, 
                            EndDate = DateTime.UtcNow.AddYears(1), 
                            ClientId = client.Id,
                            SkillsDevelopmentProviderId = sdp.Id,
                            ContractNumber = "CONT-2024-001",
                            FinancialYear = "2024/2025",
                            NumberOfBeneficiaries = 20,
                            Province = "Gauteng",
                            ProjectFunder = "Funder A",
                            LeadEmployerPartner = "Partner X",
                            BudgetAmount = 1000000m,
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow
                        }
                    };
                    _context.Projects.AddRange(projects);
                    await _context.SaveChangesAsync();
                    _logger.LogInformation("Sample project seeded successfully.");
                }
            }
            else
            {
                // Force link all projects to the first SDP
                var projects = await _context.Projects.ToListAsync();
                bool updated = false;
                foreach (var p in projects)
                {
                    if (sdp != null && p.SkillsDevelopmentProviderId != sdp.Id)
                    {
                        _logger.LogInformation($"DEBUG: Linking project {p.ProjectName} (ID: {p.Id}) to SDP ID {sdp.Id}");
                        p.SkillsDevelopmentProviderId = sdp.Id;
                        updated = true;
                    }
                }

                if (updated)
                {
                    await _context.SaveChangesAsync();
                    _logger.LogInformation("Existing projects linked to the main SDP.");
                }
            }
        }

        private async Task SeedSampleUsersAsync()
        {
            var sdp = await _context.SkillsDevelopmentProviders.FirstOrDefaultAsync();
            if (sdp != null)
            {
                _logger.LogInformation($"DEBUG: Using SDP ID {sdp.Id} for user linking");
            }

            if (!await _context.Users.AnyAsync())
            {
                var testUsers = new[]
                {
                    new User
                    {
                        Email = "manager@nbsn.local",
                        Username = "nbsn_manager",
                        FirstName = "NBSN",
                        LastName = "Manager",
                        PasswordHash = _passwordHasher.HashPassword("Admin@123"),
                        Role = UserRole.SDPAdministrator,
                        Status = UserStatus.Active,
                        SkillsDevelopmentProviderId = sdp?.Id,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    }
                };
                _context.Users.AddRange(testUsers);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Sample users seeded successfully.");
            }
            else
            {
                // Force link all users to the first SDP
                var users = await _context.Users.ToListAsync();
                bool updated = false;
                foreach (var u in users)
                {
                    if (sdp != null && u.SkillsDevelopmentProviderId != sdp.Id)
                    {
                        _logger.LogInformation($"DEBUG: Linking user {u.Email} (ID: {u.Id}) to SDP ID {sdp.Id}");
                        u.SkillsDevelopmentProviderId = sdp.Id;
                        updated = true;
                    }
                }
                
                if (updated)
                {
                    await _context.SaveChangesAsync();
                    _logger.LogInformation("Existing users linked to SDP.");
                }
            }
        }
    }
}
