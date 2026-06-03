using System;
using System.Threading.Tasks;

namespace backend.Services.Interfaces
{
    public interface IDataImportService
    {
        Task ImportDataFromLocalDatabaseAsync(string localConnectionString, string remoteConnectionString);
        Task ImportFromBackupFileAsync(string backupFilePath, string remoteConnectionString);
    }
}
