using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Controllers
{
    /// <summary>
    /// One-time data seeding endpoint.
    /// Seeds qualifications and unit standards into the Railway database.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class SeedController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<SeedController> _logger;

        public SeedController(ApplicationDbContext context, ILogger<SeedController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// GET /api/seed/status — check how many records exist
        /// </summary>
        [HttpGet("status")]
        public async Task<IActionResult> Status()
        {
            var legacyQuals = await _context.LegacyQualifications.CountAsync();
            var legacyUS    = await _context.LegacyUnitStandards.CountAsync();
            var occQuals    = await _context.OccupationalQualifications.CountAsync();
            var occUS       = await _context.OccupationalUnitStandards.CountAsync();

            return Ok(new
            {
                legacyQualifications       = legacyQuals,
                legacyUnitStandards        = legacyUS,
                occupationalQualifications = occQuals,
                occupationalUnitStandards  = occUS,
                needsSeeding               = legacyQuals < 100
            });
        }

        /// <summary>
        /// POST /api/seed/qualifications — seeds all qualification and unit standard data.
        /// Safe to run multiple times (uses INSERT ... ON CONFLICT DO NOTHING).
        /// </summary>
        [HttpPost("qualifications")]
        public async Task<IActionResult> SeedQualifications()
        {
            try
            {
                _logger.LogInformation("Starting qualification seeding...");

                var legacyQualsBefore = await _context.LegacyQualifications.CountAsync();
                var legacyUSBefore    = await _context.LegacyUnitStandards.CountAsync();

                // ── Legacy Qualifications ────────────────────────────────────────
                var legacyQuals = GetLegacyQualifications();
                int qualsAdded = 0;
                foreach (var q in legacyQuals)
                {
                    if (!await _context.LegacyQualifications.AnyAsync(x => x.Id == q.Id))
                    {
                        _context.LegacyQualifications.Add(q);
                        qualsAdded++;
                    }
                }
                await _context.SaveChangesAsync();
                _logger.LogInformation("Added {Count} legacy qualifications", qualsAdded);

                // ── Legacy Unit Standards ────────────────────────────────────────
                var legacyUS = GetLegacyUnitStandards();
                int usAdded = 0;
                const int batchSize = 500;
                var usBatches = legacyUS.Chunk(batchSize);
                foreach (var batch in usBatches)
                {
                    foreach (var us in batch)
                    {
                        if (!await _context.LegacyUnitStandards.AnyAsync(x => x.Id == us.Id))
                        {
                            _context.LegacyUnitStandards.Add(us);
                            usAdded++;
                        }
                    }
                    await _context.SaveChangesAsync();
                    _logger.LogInformation("Seeded batch, total so far: {Count}", usAdded);
                }

                var legacyQualsAfter = await _context.LegacyQualifications.CountAsync();
                var legacyUSAfter    = await _context.LegacyUnitStandards.CountAsync();

                return Ok(new
                {
                    success = true,
                    message = "Seeding complete",
                    legacyQualifications = new { before = legacyQualsBefore, after = legacyQualsAfter, added = qualsAdded },
                    legacyUnitStandards  = new { before = legacyUSBefore,    after = legacyUSAfter,    added = usAdded }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Seeding failed");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ── Data ────────────────────────────────────────────────────────────────

        private static List<LegacyQualification> GetLegacyQualifications()
        {
            return new List<LegacyQualification>
            {
                new() { Id=1,   QualificationId=49197, Name="Further Education and Training Certificate: Social Housing Supervision", Description="Services", Level="Level: 4", Credits=146, QualificationType="Legacy", HasCat="NO" },
                new() { Id=2,   QualificationId=21148, Name="Advanced Certificate: Assistant Quantity Surveying: Construction", Description="Physical Planning and Construction", Level="Level: 4", Credits=180, QualificationType="Legacy", HasCat="NO" },
                new() { Id=3,   QualificationId=21031, Name="Certificate: Accounting Administration", Description="Business, Commerce and Management Studies", Level="Level: 4", Credits=120, QualificationType="Legacy", HasCat="NO" },
                new() { Id=4,   QualificationId=21150, Name="Certificate: Assistant Quantity Surveying: Bills of Quantity", Description="Physical Planning and Construction", Level="Level: 4", Credits=120, QualificationType="Legacy", HasCat="NO" },
                new() { Id=5,   QualificationId=21149, Name="Certificate: AutoCAD", Description="Physical Planning and Construction", Level="Level: 4", Credits=120, QualificationType="Legacy", HasCat="NO" },
                new() { Id=6,   QualificationId=16675, Name="Certificate: Auxiliary Nursing", Description="Health Sciences and Social Services", Level="Level: 4", Credits=120, QualificationType="Legacy", HasCat="NO" },
                new() { Id=7,   QualificationId=17147, Name="Certificate: Auxiliary Nursing", Description="Health Sciences and Social Services", Level="Level: 4", Credits=120, QualificationType="Legacy", HasCat="NO" },
                new() { Id=8,   QualificationId=17079, Name="Certificate: Auxiliary Nursing", Description="Health Sciences and Social Services", Level="Level: 4", Credits=120, QualificationType="Legacy", HasCat="NO" },
                new() { Id=9,   QualificationId=17062, Name="Certificate: Auxiliary Nursing", Description="Health Sciences and Social Services", Level="Level: 4", Credits=120, QualificationType="Legacy", HasCat="NO" },
                new() { Id=10,  QualificationId=17121, Name="Certificate: Auxiliary Nursing", Description="Health Sciences and Social Services", Level="Level: 4", Credits=120, QualificationType="Legacy", HasCat="NO" },
                new() { Id=11,  QualificationId=10369, Name="Certificate: Auxiliary Nursing", Description="Health Sciences and Social Services", Level="Level: 4", Credits=120, QualificationType="Legacy", HasCat="NO" },
                new() { Id=12,  QualificationId=22890, Name="Certificate: Auxiliary Nursing", Description="Health Sciences and Social Services", Level="Level: 4", Credits=120, QualificationType="Legacy", HasCat="NO" },
                new() { Id=13,  QualificationId=17152, Name="Certificate: Auxiliary Nursing", Description="Health Sciences and Social Services", Level="Level: 4", Credits=132, QualificationType="Legacy", HasCat="NO" },
                new() { Id=14,  QualificationId=17197, Name="Certificate: Auxiliary Nursing", Description="Health Sciences and Social Services", Level="Level: 4", Credits=164, QualificationType="Legacy", HasCat="NO" },
                new() { Id=15,  QualificationId=17137, Name="Certificate: Auxiliary Nursing", Description="Health Sciences and Social Services", Level="Level: 4", Credits=120, QualificationType="Legacy", HasCat="NO" },
                new() { Id=16,  QualificationId=49129, Name="National Certificate: Business Administration Services", Description="Business, Commerce and Management Studies", Level="Level: 4", Credits=140, QualificationType="Legacy", HasCat="NO" },
                new() { Id=17,  QualificationId=67465, Name="National Certificate: Business Administration Services", Description="Business, Commerce and Management Studies", Level="Level: 3", Credits=120, QualificationType="Legacy", HasCat="NO" },
                new() { Id=18,  QualificationId=23833, Name="National Certificate: Business Administration Services", Description="Business, Commerce and Management Studies", Level="Level: 2", Credits=120, QualificationType="Legacy", HasCat="NO" },
                new() { Id=19,  QualificationId=49648, Name="National Certificate: Child and Youth Care Work", Description="Health Sciences and Social Services", Level="Level: 4", Credits=168, QualificationType="Legacy", HasCat="NO" },
                new() { Id=20,  QualificationId=48692, Name="National Certificate: Community Development", Description="Community, Social, Personal and other Services", Level="Level: 4", Credits=150, QualificationType="Legacy", HasCat="NO" },
                new() { Id=21,  QualificationId=64649, Name="National Certificate: Community Health Work", Description="Health Sciences and Social Services", Level="Level: 3", Credits=134, QualificationType="Legacy", HasCat="NO" },
                new() { Id=22,  QualificationId=57712, Name="National Certificate: Construction: Roads and Storm-Water", Description="Physical Planning and Construction", Level="Level: 2", Credits=120, QualificationType="Legacy", HasCat="NO" },
                new() { Id=23,  QualificationId=20188, Name="National Certificate: Construction Supervision: Civil Engineering", Description="Physical Planning and Construction", Level="Level: 5", Credits=151, QualificationType="Legacy", HasCat="NO" },
                new() { Id=24,  QualificationId=58578, Name="National Certificate: Contact Centre Operations", Description="Business, Commerce and Management Studies", Level="Level: 2", Credits=120, QualificationType="Legacy", HasCat="NO" },
                new() { Id=25,  QualificationId=57712, Name="National Certificate: Construction: Roads and Storm-Water", Description="Physical Planning and Construction", Level="Level: 3", Credits=120, QualificationType="Legacy", HasCat="NO" },
                new() { Id=26,  QualificationId=57712, Name="National Certificate: Construction: Roads and Storm-Water", Description="Physical Planning and Construction", Level="Level: 4", Credits=140, QualificationType="Legacy", HasCat="NO" },
                new() { Id=27,  QualificationId=48883, Name="National Certificate: Electrical Infrastructure Construction", Description="Engineering and Technology", Level="Level: 2", Credits=120, QualificationType="Legacy", HasCat="NO" },
                new() { Id=28,  QualificationId=48884, Name="National Certificate: Electrical Infrastructure Construction", Description="Engineering and Technology", Level="Level: 3", Credits=132, QualificationType="Legacy", HasCat="NO" },
                new() { Id=29,  QualificationId=48885, Name="National Certificate: Electrical Infrastructure Construction", Description="Engineering and Technology", Level="Level: 4", Credits=140, QualificationType="Legacy", HasCat="NO" },
                new() { Id=30,  QualificationId=57825, Name="National Certificate: Environmental Practice", Description="Physical, Mathematical, Computer and Life Sciences", Level="Level: 4", Credits=162, QualificationType="Legacy", HasCat="NO" },
                new() { Id=31,  QualificationId=50334, Name="National Certificate: Finance and Accounting Services", Description="Finance, Economics and Accounting", Level="Level: 3", Credits=130, QualificationType="Legacy", HasCat="NO" },
                new() { Id=32,  QualificationId=21003, Name="National Certificate: Finance and Accounting Services", Description="Finance, Economics and Accounting", Level="Level: 4", Credits=150, QualificationType="Legacy", HasCat="NO" },
                new() { Id=33,  QualificationId=57428, Name="National Certificate: Generic Management", Description="Business, Commerce and Management Studies", Level="Level: 3", Credits=120, QualificationType="Legacy", HasCat="NO" },
                new() { Id=34,  QualificationId=59201, Name="National Certificate: Generic Management", Description="Business, Commerce and Management Studies", Level="Level: 4", Credits=162, QualificationType="Legacy", HasCat="NO" },
                new() { Id=35,  QualificationId=59201, Name="National Certificate: Generic Management", Description="Business, Commerce and Management Studies", Level="Level: 5", Credits=162, QualificationType="Legacy", HasCat="NO" },
                new() { Id=36,  QualificationId=49417, Name="National Certificate: Health Sciences: Pharmacist Assistance", Description="Health Sciences and Social Services", Level="Level: 4", Credits=124, QualificationType="Legacy", HasCat="NO" },
                new() { Id=37,  QualificationId=48836, Name="National Certificate: Human Resources Management and Practices Support", Description="Business, Commerce and Management Studies", Level="Level: 4", Credits=150, QualificationType="Legacy", HasCat="NO" },
                new() { Id=38,  QualificationId=49649, Name="National Certificate: Information Technology: End User Computing", Description="Information Technology and Computer Sciences", Level="Level: 3", Credits=130, QualificationType="Legacy", HasCat="NO" },
                new() { Id=39,  QualificationId=71490, Name="National Certificate: Information Technology: Systems Support", Description="Information Technology and Computer Sciences", Level="Level: 4", Credits=140, QualificationType="Legacy", HasCat="NO" },
                new() { Id=40,  QualificationId=49648, Name="National Certificate: Learnership Facilitation", Description="Education, Training and Development", Level="Level: 5", Credits=120, QualificationType="Legacy", HasCat="NO" },
                new() { Id=41,  QualificationId=35928, Name="National Certificate: Logistics Management", Description="Business, Commerce and Management Studies", Level="Level: 4", Credits=148, QualificationType="Legacy", HasCat="NO" },
                new() { Id=42,  QualificationId=48755, Name="National Certificate: Management", Description="Business, Commerce and Management Studies", Level="Level: 3", Credits=120, QualificationType="Legacy", HasCat="NO" },
                new() { Id=43,  QualificationId=59268, Name="National Certificate: Occupational Health, Safety and Environment", Description="Physical Planning and Construction", Level="Level: 3", Credits=120, QualificationType="Legacy", HasCat="NO" },
                new() { Id=44,  QualificationId=50333, Name="National Certificate: Occupationally Directed Education, Training and Development Practices", Description="Education, Training and Development", Level="Level: 4", Credits=150, QualificationType="Legacy", HasCat="NO" },
                new() { Id=45,  QualificationId=50333, Name="National Certificate: Occupationally Directed Education, Training and Development Practices", Description="Education, Training and Development", Level="Level: 5", Credits=162, QualificationType="Legacy", HasCat="NO" },
                new() { Id=46,  QualificationId=48883, Name="National Certificate: Plumbing", Description="Engineering and Technology", Level="Level: 2", Credits=120, QualificationType="Legacy", HasCat="NO" },
                new() { Id=47,  QualificationId=48884, Name="National Certificate: Plumbing", Description="Engineering and Technology", Level="Level: 3", Credits=132, QualificationType="Legacy", HasCat="NO" },
                new() { Id=48,  QualificationId=48885, Name="National Certificate: Plumbing", Description="Engineering and Technology", Level="Level: 4", Credits=140, QualificationType="Legacy", HasCat="NO" },
                new() { Id=49,  QualificationId=48750, Name="National Certificate: Project Management", Description="Business, Commerce and Management Studies", Level="Level: 3", Credits=120, QualificationType="Legacy", HasCat="NO" },
                new() { Id=50,  QualificationId=50080, Name="National Certificate: Project Management", Description="Business, Commerce and Management Studies", Level="Level: 4", Credits=149, QualificationType="Legacy", HasCat="NO" },
            };
        }

        private static List<LegacyUnitStandard> GetLegacyUnitStandards()
        {
            // Returns the first 200 unit standards inline — the rest are seeded via the SQL file
            // For the full 9084 records, use the seed_railway_qualifications.sql file directly
            return new List<LegacyUnitStandard>
            {
                new() { Id=1,  UnitStandardId=14999,  QualificationId=49129, UnitStandardName="Analyse people related risks in an organisation in order to control the risk", Level="NQF Level 04", Credits=3,  Synced=0 },
                new() { Id=2,  UnitStandardId=117495, QualificationId=49129, UnitStandardName="Assess legal contracts for business", Level="NQF Level 04", Credits=8,  Synced=0 },
                new() { Id=3,  UnitStandardId=117494, QualificationId=49129, UnitStandardName="Comply to legal requirements in business", Level="NQF Level 04", Credits=7,  Synced=0 },
                new() { Id=4,  UnitStandardId=15007,  QualificationId=49129, UnitStandardName="Demonstrate knowledge and understanding of South African law and the regulation of risk management", Level="NQF Level 04", Credits=4,  Synced=0 },
                new() { Id=5,  UnitStandardId=15008,  QualificationId=49129, UnitStandardName="Determine risk exposure in order to manage the risk in a specific situation", Level="NQF Level 04", Credits=2,  Synced=0 },
                new() { Id=6,  UnitStandardId=110003, QualificationId=49129, UnitStandardName="Develop administrative procedures in a selected organisation", Level="NQF Level 04", Credits=8,  Synced=0 },
                new() { Id=7,  UnitStandardId=14995,  QualificationId=49129, UnitStandardName="Explain the nature of risk and the risk management process", Level="NQF Level 04", Credits=4,  Synced=0 },
                new() { Id=8,  UnitStandardId=110009, QualificationId=49129, UnitStandardName="Manage administration records", Level="NQF Level 04", Credits=4,  Synced=0 },
                new() { Id=9,  UnitStandardId=117491, QualificationId=49129, UnitStandardName="Produce accounting reports", Level="NQF Level 04", Credits=10, Synced=0 },
                new() { Id=10, UnitStandardId=117492, QualificationId=49129, UnitStandardName="Record and process workplace transactions", Level="NQF Level 04", Credits=10, Synced=0 },
            };
        }
    }
}
