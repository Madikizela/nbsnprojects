using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class QualificationsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public QualificationsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // Occupational Qualifications
        [HttpGet("occupational")]
        public async Task<ActionResult<IEnumerable<OccupationalQualification>>> GetOccupationalQualifications()
        {
            return await _context.OccupationalQualifications
                .Include(oq => oq.UnitStandards)
                .ToListAsync();
        }

        [HttpGet("occupational/{id}")]
        public async Task<ActionResult<OccupationalQualification>> GetOccupationalQualification(int id)
        {
            var oq = await _context.OccupationalQualifications
                .Include(oq => oq.UnitStandards)
                .FirstOrDefaultAsync(oq => oq.QualificationId == id);

            if (oq == null)
            {
                return NotFound();
            }

            return oq;
        }

        [HttpPost("occupational")]
        public async Task<ActionResult<OccupationalQualification>> PostOccupationalQualification(OccupationalQualification oq)
        {
            _context.OccupationalQualifications.Add(oq);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetOccupationalQualification), new { id = oq.QualificationId }, oq);
        }

        [HttpPut("occupational/{id}")]
        public async Task<IActionResult> PutOccupationalQualification(int id, OccupationalQualification oq)
        {
            if (id != oq.QualificationId)
            {
                return BadRequest();
            }

            _context.Entry(oq).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!OccupationalQualificationExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        [HttpDelete("occupational/{id}")]
        public async Task<IActionResult> DeleteOccupationalQualification(int id)
        {
            var oq = await _context.OccupationalQualifications.FindAsync(id);
            if (oq == null)
            {
                return NotFound();
            }

            _context.OccupationalQualifications.Remove(oq);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool OccupationalQualificationExists(int id)
        {
            return _context.OccupationalQualifications.Any(e => e.QualificationId == id);
        }

        // Occupational Unit Standards
        [HttpGet("occupational/{qualificationId}/unit-standards")]
        public async Task<ActionResult<IEnumerable<OccupationalUnitStandard>>> GetOccupationalUnitStandards(int qualificationId)
        {
            return await _context.OccupationalUnitStandards
                .Where(ous => ous.QualificationId == qualificationId)
                .ToListAsync();
        }

        [HttpPost("occupational/{qualificationId}/unit-standards")]
        public async Task<ActionResult<OccupationalUnitStandard>> PostOccupationalUnitStandard(int qualificationId, OccupationalUnitStandard ous)
        {
            ous.QualificationId = qualificationId;
            _context.OccupationalUnitStandards.Add(ous);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetOccupationalUnitStandards), new { qualificationId = ous.QualificationId, id = ous.Id }, ous);
        }

        [HttpPut("occupational/unit-standards/{id}")]
        public async Task<IActionResult> PutOccupationalUnitStandard(int id, OccupationalUnitStandard ous)
        {
            if (id != ous.Id)
            {
                return BadRequest();
            }

            _context.Entry(ous).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!OccupationalUnitStandardExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        [HttpDelete("occupational/unit-standards/{id}")]
        public async Task<IActionResult> DeleteOccupationalUnitStandard(int id)
        {
            var ous = await _context.OccupationalUnitStandards.FindAsync(id);
            if (ous == null)
            {
                return NotFound();
            }

            _context.OccupationalUnitStandards.Remove(ous);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool OccupationalUnitStandardExists(int id)
        {
            return _context.OccupationalUnitStandards.Any(e => e.Id == id);
        }

        // Legacy Qualifications
        [HttpGet("legacy")]
        public async Task<ActionResult<IEnumerable<LegacyQualification>>> GetLegacyQualifications()
        {
            return await _context.LegacyQualifications
                .Include(lq => lq.UnitStandards)
                .ToListAsync();
        }

        [HttpGet("legacy/{id}")]
        public async Task<ActionResult<LegacyQualification>> GetLegacyQualification(int id)
        {
            var lq = await _context.LegacyQualifications
                .Include(lq => lq.UnitStandards)
                .FirstOrDefaultAsync(lq => lq.Id == id);

            if (lq == null)
            {
                return NotFound();
            }

            return lq;
        }

        [HttpPost("legacy")]
        public async Task<ActionResult<LegacyQualification>> PostLegacyQualification(LegacyQualification lq)
        {
            _context.LegacyQualifications.Add(lq);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetLegacyQualification), new { id = lq.Id }, lq);
        }

        [HttpPut("legacy/{id}")]
        public async Task<IActionResult> PutLegacyQualification(int id, LegacyQualification lq)
        {
            if (id != lq.Id)
            {
                return BadRequest();
            }

            _context.Entry(lq).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!LegacyQualificationExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        [HttpDelete("legacy/{id}")]
        public async Task<IActionResult> DeleteLegacyQualification(int id)
        {
            var lq = await _context.LegacyQualifications.FindAsync(id);
            if (lq == null)
            {
                return NotFound();
            }

            _context.LegacyQualifications.Remove(lq);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool LegacyQualificationExists(int id)
        {
            return _context.LegacyQualifications.Any(e => e.Id == id);
        }

        // Legacy Unit Standards
        [HttpGet("legacy/{qualificationId}/unit-standards")]
        public async Task<ActionResult<IEnumerable<LegacyUnitStandard>>> GetLegacyUnitStandards(int qualificationId)
        {
            return await _context.LegacyUnitStandards
                .Where(lus => lus.QualificationId == qualificationId)
                .ToListAsync();
        }

        [HttpPost("legacy/{qualificationId}/unit-standards")]
        public async Task<ActionResult<LegacyUnitStandard>> PostLegacyUnitStandard(int qualificationId, LegacyUnitStandard lus)
        {
            lus.QualificationId = qualificationId;
            _context.LegacyUnitStandards.Add(lus);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetLegacyUnitStandards), new { qualificationId = lus.QualificationId, id = lus.Id }, lus);
        }

        [HttpPut("legacy/unit-standards/{id}")]
        public async Task<IActionResult> PutLegacyUnitStandard(int id, LegacyUnitStandard lus)
        {
            if (id != lus.Id)
            {
                return BadRequest();
            }

            _context.Entry(lus).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!LegacyUnitStandardExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        [HttpDelete("legacy/unit-standards/{id}")]
        public async Task<IActionResult> DeleteLegacyUnitStandard(int id)
        {
            var lus = await _context.LegacyUnitStandards.FindAsync(id);
            if (lus == null)
            {
                return NotFound();
            }

            _context.LegacyUnitStandards.Remove(lus);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool LegacyUnitStandardExists(int id)
        {
            return _context.LegacyUnitStandards.Any(e => e.Id == id);
        }
    }
}
