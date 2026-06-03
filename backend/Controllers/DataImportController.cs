using Microsoft.AspNetCore.Mvc;
using backend.Services.Interfaces;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DataImportController : ControllerBase
    {
        private readonly IDataImportService _dataImportService;

        public DataImportController(IDataImportService dataImportService)
        {
            _dataImportService = dataImportService;
        }

        [HttpPost("import-backup")]
        public async Task<IActionResult> ImportFromBackup([FromBody] ImportBackupRequest request)
        {
            try
            {
                await _dataImportService.ImportFromBackupFileAsync(
                    request.BackupFilePath ?? @"..\db_backups\nbsnproject_postgres.sql",
                    request.RemoteConnectionString
                );
                return Ok(new { message = "Data imported from backup successfully!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Import failed", error = ex.Message, stackTrace = ex.StackTrace });
            }
        }

        [HttpPost("import")]
        [Obsolete("Use import-backup endpoint instead")]
        public async Task<IActionResult> ImportData([FromBody] ImportDataRequest request)
        {
            try
            {
                await _dataImportService.ImportDataFromLocalDatabaseAsync(
                    request.LocalConnectionString,
                    request.RemoteConnectionString
                );
                return Ok(new { message = "Data imported successfully!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Import failed", error = ex.Message, stackTrace = ex.StackTrace });
            }
        }
    }

    public class ImportBackupRequest
    {
        public string BackupFilePath { get; set; } = string.Empty;
        public string RemoteConnectionString { get; set; } = string.Empty;
    }

    public class ImportDataRequest
    {
        public string LocalConnectionString { get; set; } = string.Empty;
        public string RemoteConnectionString { get; set; } = string.Empty;
    }
}
