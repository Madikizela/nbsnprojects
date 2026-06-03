using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using Npgsql;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class QAOverviewController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public QAOverviewController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("metrics")]
        public async Task<ActionResult<QAOverviewMetrics>> GetQAMetrics()
        {
            try
            {
                // Use raw SQL queries to get counts from all tables
                var connectionString = _context.Database.GetConnectionString();
                
                using var connection = new NpgsqlConnection(connectionString);
                await connection.OpenAsync();

                // Get total qualifications in system
                var legacyQualificationsCmd = new NpgsqlCommand("SELECT COUNT(*) FROM legacy_qualifications", connection);
                var legacyQualifications = Convert.ToInt32(await legacyQualificationsCmd.ExecuteScalarAsync());

                var occupationalQualificationsCmd = new NpgsqlCommand("SELECT COUNT(*) FROM occupational_qualifications", connection);
                var occupationalQualifications = Convert.ToInt32(await occupationalQualificationsCmd.ExecuteScalarAsync());
                
                var totalQualifications = legacyQualifications + occupationalQualifications;

                // Get total unit standards in system
                var legacyUnitStandardsCmd = new NpgsqlCommand("SELECT COUNT(*) FROM legacy_unit_standards", connection);
                var legacyUnitStandards = Convert.ToInt32(await legacyUnitStandardsCmd.ExecuteScalarAsync());

                var occupationalUnitStandardsCmd = new NpgsqlCommand("SELECT COUNT(*) FROM occupational_unit_standards", connection);
                var occupationalUnitStandards = Convert.ToInt32(await occupationalUnitStandardsCmd.ExecuteScalarAsync());
                
                var totalUnitStandards = legacyUnitStandards + occupationalUnitStandards;

                // Get assessment questions
                var formativeQuestionsCmd = new NpgsqlCommand("SELECT COUNT(*) FROM `FormativeAssessmentQuestions`", connection);
                var formativeQuestions = Convert.ToInt32(await formativeQuestionsCmd.ExecuteScalarAsync());

                var summativeQuestionsCmd = new NpgsqlCommand("SELECT COUNT(*) FROM `SummativeAssessmentQuestions`", connection);
                var summativeQuestions = Convert.ToInt32(await summativeQuestionsCmd.ExecuteScalarAsync());
                
                var totalQuestions = formativeQuestions + summativeQuestions;

                // Get assessments
                var formativeAssessmentsCmd = new NpgsqlCommand("SELECT COUNT(*) FROM `FormativeAssessments`", connection);
                var formativeAssessments = Convert.ToInt32(await formativeAssessmentsCmd.ExecuteScalarAsync());

                var summativeAssessmentsCmd = new NpgsqlCommand("SELECT COUNT(*) FROM `SummativeAssessments`", connection);
                var summativeAssessments = Convert.ToInt32(await summativeAssessmentsCmd.ExecuteScalarAsync());
                
                var totalAssessments = formativeAssessments + summativeAssessments;

                // Get active projects with qualifications
                var activeProjectsCmd = new NpgsqlCommand(@"
                    SELECT COUNT(DISTINCT p.Id) 
                    FROM Projects p
                    INNER JOIN ProjectLearningPathways plp ON p.Id = plp.ProjectId
                    INNER JOIN ProjectQualifications pq ON plp.Id = pq.ProjectLearningPathwayId
                ", connection);
                var activeProjectsWithQualifications = Convert.ToInt32(await activeProjectsCmd.ExecuteScalarAsync());

                // Get project qualifications and unit standards
                var projectQualificationsCmd = new NpgsqlCommand("SELECT COUNT(*) FROM ProjectQualifications", connection);
                var projectQualifications = Convert.ToInt32(await projectQualificationsCmd.ExecuteScalarAsync());

                var projectUnitStandardsCmd = new NpgsqlCommand("SELECT COUNT(*) FROM ProjectQualificationUnitStandards", connection);
                var projectUnitStandards = Convert.ToInt32(await projectUnitStandardsCmd.ExecuteScalarAsync());

                var metrics = new QAOverviewMetrics
                {
                    TotalQualifications = totalQualifications,
                    LegacyQualifications = legacyQualifications,
                    OccupationalQualifications = occupationalQualifications,
                    TotalUnitStandards = totalUnitStandards,
                    LegacyUnitStandards = legacyUnitStandards,
                    OccupationalUnitStandards = occupationalUnitStandards,
                    FormativeQuestions = formativeQuestions,
                    SummativeQuestions = summativeQuestions,
                    TotalQuestions = totalQuestions,
                    FormativeAssessments = formativeAssessments,
                    SummativeAssessments = summativeAssessments,
                    TotalAssessments = totalAssessments,
                    ActiveProjectsWithQualifications = activeProjectsWithQualifications,
                    ProjectQualifications = projectQualifications,
                    ProjectUnitStandards = projectUnitStandards
                };

                return Ok(metrics);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching QA metrics", error = ex.Message, stackTrace = ex.StackTrace });
            }
        }

        [HttpGet("unit-standard-breakdown")]
        public async Task<ActionResult<List<UnitStandardAssessmentBreakdown>>> GetUnitStandardBreakdown()
        {
            try
            {
                var connectionString = _context.Database.GetConnectionString();
                
                using var connection = new NpgsqlConnection(connectionString);
                await connection.OpenAsync();

                // Get unit standard assessment breakdown for project unit standards
                var query = @"
                    SELECT 
                        lus.unit_standard_name as UnitStandardName,
                        lus.level as Level,
                        lus.credits as Credits,
                        COUNT(DISTINCT fa.Id) as FormativeAssessments,
                        COUNT(DISTINCT sa.Id) as SummativeAssessments,
                        COUNT(DISTINCT faq.Id) as FormativeQuestions,
                        COUNT(DISTINCT saq.Id) as SummativeQuestions
                    FROM ProjectQualificationUnitStandards pqus
                    INNER JOIN legacy_unit_standards lus ON pqus.UnitStandardId = lus.id
                    LEFT JOIN FormativeAssessments fa ON pqus.Id = fa.ProjectQualificationUnitStandardId
                    LEFT JOIN SummativeAssessments sa ON pqus.Id = sa.ProjectQualificationUnitStandardId
                    LEFT JOIN FormativeAssessmentQuestions faq ON fa.Id = faq.FormativeAssessmentId
                    LEFT JOIN SummativeAssessmentQuestions saq ON sa.Id = saq.SummativeAssessmentId
                    WHERE pqus.UnitStandardType = 'Legacy'
                    GROUP BY lus.id, lus.unit_standard_name, lus.level, lus.credits
                    ORDER BY lus.unit_standard_name
                ";

                var cmd = new NpgsqlCommand(query, connection);
                var reader = await cmd.ExecuteReaderAsync();

                var breakdown = new List<UnitStandardAssessmentBreakdown>();
                while (await reader.ReadAsync())
                {
                    breakdown.Add(new UnitStandardAssessmentBreakdown
                    {
                        UnitStandardName = reader.GetString(reader.GetOrdinal("UnitStandardName")),
                        Level = reader.IsDBNull(reader.GetOrdinal("Level")) ? "" : reader.GetString(reader.GetOrdinal("Level")),
                        Credits = reader.IsDBNull(reader.GetOrdinal("Credits")) ? 0 : reader.GetInt32(reader.GetOrdinal("Credits")),
                        FormativeAssessments = reader.GetInt32(reader.GetOrdinal("FormativeAssessments")),
                        SummativeAssessments = reader.GetInt32(reader.GetOrdinal("SummativeAssessments")),
                        FormativeQuestions = reader.GetInt32(reader.GetOrdinal("FormativeQuestions")),
                        SummativeQuestions = reader.GetInt32(reader.GetOrdinal("SummativeQuestions"))
                    });
                }

                return Ok(breakdown);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching unit standard breakdown", error = ex.Message, stackTrace = ex.StackTrace });
            }
        }
    }

    public class QAOverviewMetrics
    {
        public int TotalQualifications { get; set; }
        public int LegacyQualifications { get; set; }
        public int OccupationalQualifications { get; set; }
        public int TotalUnitStandards { get; set; }
        public int LegacyUnitStandards { get; set; }
        public int OccupationalUnitStandards { get; set; }
        public int FormativeQuestions { get; set; }
        public int SummativeQuestions { get; set; }
        public int TotalQuestions { get; set; }
        public int FormativeAssessments { get; set; }
        public int SummativeAssessments { get; set; }
        public int TotalAssessments { get; set; }
        public int ActiveProjectsWithQualifications { get; set; }
        public int ProjectQualifications { get; set; }
        public int ProjectUnitStandards { get; set; }
    }

    public class UnitStandardAssessmentBreakdown
    {
        public string UnitStandardName { get; set; } = "";
        public string Level { get; set; } = "";
        public int Credits { get; set; }
        public int FormativeAssessments { get; set; }
        public int SummativeAssessments { get; set; }
        public int FormativeQuestions { get; set; }
        public int SummativeQuestions { get; set; }
    }
}