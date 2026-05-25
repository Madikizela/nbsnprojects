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
        private const string DEFAULT_ADMIN_EMAIL = "admin@system.local";
        private const string DEFAULT_ADMIN_PASSWORD = "Admin@123";

        public DataSeedingService(
            ApplicationDbContext context, 
            ILogger<DataSeedingService> _logger,
            IPasswordHashingService passwordHasher)
        {
            _context = context;
            this._logger = _logger;
            _passwordHasher = passwordHasher;
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
                // await SeedSampleProjectsAsync(); // Skipped due to foreign key requirements
                await SeedSampleUsersAsync();

                _logger.LogInformation("Database seeding process completed successfully.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred during database seeding.");
                throw;
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
            if (!await _context.Projects.AnyAsync())
            {
                var client = await _context.Clients.FirstOrDefaultAsync();
                if (client != null)
                {
                    var projects = new[]
                    {
                        new Project 
                        { 
                            ProjectName = "Junior Developer Program 2024", 
                            StartDate = DateTime.UtcNow, 
                            EndDate = DateTime.UtcNow.AddYears(1), 
                            ClientId = client.Id,
                            ContractNumber = "CONT-2024-001",
                            FinancialYear = "2024/2025",
                            NumberOfBeneficiaries = 20,
                            Province = "Gauteng",
                            ProjectFunder = "Funder A",
                            LeadEmployerPartner = "Partner X",
                            BudgetAmount = 1000000m
                        }
                    };
                    _context.Projects.AddRange(projects);
                    await _context.SaveChangesAsync();
                }
            }
        }

        private async Task SeedSampleUsersAsync()
        {
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
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    }
                };
                _context.Users.AddRange(testUsers);
                await _context.SaveChangesAsync();
            }
        }
    }
}
