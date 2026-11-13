using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BudgetController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<BudgetController> _logger;

        public BudgetController(ApplicationDbContext context, ILogger<BudgetController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/Budget/project/{projectId}
        // Returns all phases and their line items for a project.
        [HttpGet("project/{projectId}")]
        public async Task<IActionResult> GetProjectBudget(int projectId)
        {
            try
            {
                var phases = await _context.ProjectBudgetPhases
                    .Include(p => p.LineItems)
                    .Where(p => p.ProjectId == projectId)
                    .OrderBy(p => p.PhaseOrder)
                    .Select(p => new
                    {
                        p.Id,
                        p.ProjectId,
                        p.Name,
                        p.Description,
                        p.AllocatedBudget,
                        p.SpentBudget,
                        p.StartDate,
                        p.EndDate,
                        p.PhaseOrder,
                        p.CreatedAt,
                        LineItems = p.LineItems.OrderBy(li => li.CreatedAt).Select(li => new
                        {
                            li.Id,
                            li.PhaseId,
                            li.Category,
                            li.Description,
                            li.AllocatedAmount,
                            li.SpentAmount,
                            li.IsPerLearner,
                            li.CostPerLearner,
                            li.LearnersCount,
                            li.IsEditable
                        }).ToList()
                    })
                    .ToListAsync();

                // Get project total budget
                var project = await _context.Projects
                    .Where(p => p.Id == projectId)
                    .Select(p => new { p.Id, p.ProjectName, p.BudgetAmount })
                    .FirstOrDefaultAsync();

                return Ok(new
                {
                    projectId,
                    projectName      = project?.ProjectName ?? "",
                    totalBudget      = project?.BudgetAmount ?? 0,
                    totalAllocated   = phases.Sum(ph => ph.LineItems.Sum(li => li.AllocatedAmount)),
                    totalSpent       = phases.Sum(ph => ph.SpentBudget),
                    numberOfPhases   = phases.Count,
                    phases
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching budget for project {ProjectId}", projectId);
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // POST: api/Budget/project/{projectId}/phases
        // Saves (upserts) all phases and line items for a project.
        // Replaces all existing phases for the project — full overwrite.
        [HttpPost("project/{projectId}/phases")]
        public async Task<IActionResult> SaveBudget(int projectId, [FromBody] SaveBudgetRequest request)
        {
            try
            {
                // Delete existing phases (cascades to line items via EF)
                var existing = await _context.ProjectBudgetPhases
                    .Include(p => p.LineItems)
                    .Where(p => p.ProjectId == projectId)
                    .ToListAsync();

                _context.ProjectBudgetPhases.RemoveRange(existing);
                await _context.SaveChangesAsync();

                // Insert new phases and line items
                int order = 1;
                foreach (var phaseDto in request.Phases)
                {
                    var phase = new ProjectBudgetPhase
                    {
                        ProjectId       = projectId,
                        Name            = phaseDto.Name,
                        Description     = phaseDto.Description,
                        AllocatedBudget = phaseDto.AllocatedBudget,
                        SpentBudget     = phaseDto.SpentBudget,
                        StartDate       = phaseDto.StartDate,
                        EndDate         = phaseDto.EndDate,
                        PhaseOrder      = order++,
                        CreatedAt       = DateTime.UtcNow,
                        UpdatedAt       = DateTime.UtcNow
                    };

                    foreach (var liDto in phaseDto.LineItems)
                    {
                        phase.LineItems.Add(new ProjectBudgetLineItem
                        {
                            Category        = liDto.Category,
                            Description     = liDto.Description,
                            AllocatedAmount = liDto.AllocatedAmount,
                            SpentAmount     = liDto.SpentAmount,
                            IsPerLearner    = liDto.IsPerLearner,
                            CostPerLearner  = liDto.CostPerLearner,
                            LearnersCount   = liDto.LearnersCount,
                            IsEditable      = liDto.IsEditable,
                            CreatedAt       = DateTime.UtcNow,
                            UpdatedAt       = DateTime.UtcNow
                        });
                    }

                    _context.ProjectBudgetPhases.Add(phase);
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation("Budget saved for project {ProjectId}: {PhaseCount} phases", projectId, request.Phases.Count);
                return Ok(new { message = "Budget saved successfully.", phases = request.Phases.Count });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving budget for project {ProjectId}", projectId);
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // PUT: api/Budget/line-items/{id}/spent
        // Updates the spent amount on a single line item (e.g. from expenditure tracking).
        [HttpPut("line-items/{id}/spent")]
        public async Task<IActionResult> UpdateSpent(int id, [FromBody] UpdateSpentRequest request)
        {
            var item = await _context.ProjectBudgetLineItems.FindAsync(id);
            if (item == null) return NotFound(new { message = "Line item not found" });

            item.SpentAmount = request.SpentAmount;
            item.UpdatedAt   = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Spent amount updated", remaining = item.AllocatedAmount - item.SpentAmount });
        }

        // DELETE: api/Budget/project/{projectId}/phases
        // Clears all budget data for a project (reconfigure from scratch).
        [HttpDelete("project/{projectId}/phases")]
        public async Task<IActionResult> ClearBudget(int projectId)
        {
            var phases = await _context.ProjectBudgetPhases
                .Include(p => p.LineItems)
                .Where(p => p.ProjectId == projectId)
                .ToListAsync();

            _context.ProjectBudgetPhases.RemoveRange(phases);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Budget cleared." });
        }
    }

    // ── Request DTOs ──────────────────────────────────────────────────────────

    public class SaveBudgetRequest
    {
        public List<BudgetPhaseDto> Phases { get; set; } = new();
    }

    public class BudgetPhaseDto
    {
        public string Name            { get; set; } = string.Empty;
        public string? Description    { get; set; }
        public decimal AllocatedBudget { get; set; }
        public decimal SpentBudget    { get; set; }
        public string? StartDate      { get; set; }
        public string? EndDate        { get; set; }
        public List<BudgetLineItemDto> LineItems { get; set; } = new();
    }

    public class BudgetLineItemDto
    {
        public string Category        { get; set; } = string.Empty;
        public string Description     { get; set; } = string.Empty;
        public decimal AllocatedAmount { get; set; }
        public decimal SpentAmount    { get; set; }
        public bool IsPerLearner      { get; set; }
        public decimal? CostPerLearner { get; set; }
        public int? LearnersCount     { get; set; }
        public bool IsEditable        { get; set; } = true;
    }

    public class UpdateSpentRequest
    {
        public decimal SpentAmount { get; set; }
    }
}
