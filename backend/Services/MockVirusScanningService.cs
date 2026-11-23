using backend.Services.Interfaces;

namespace backend.Services
{
    /// <summary>
    /// Mock implementation of virus scanning service for development and testing
    /// In production, this should be replaced with a real antivirus integration
    /// </summary>
    public class MockVirusScanningService : IVirusScanningService
    {
        private readonly ILogger<MockVirusScanningService> _logger;
        private readonly Random _random = new();

        // Simulated malicious file patterns for testing
        private readonly string[] _maliciousPatterns = {
            "EICAR-STANDARD-ANTIVIRUS-TEST-FILE",
            "X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR",
            "malware.exe",
            "virus.bat",
            "trojan.scr"
        };

        public MockVirusScanningService(ILogger<MockVirusScanningService> logger)
        {
            _logger = logger;
        }

        public async Task<VirusScanResult> ScanFileAsync(string filePath)
        {
            var startTime = DateTime.UtcNow;
            
            try
            {
                _logger.LogInformation("Starting mock virus scan for file: {FilePath}", filePath);

                if (filePath == null || filePath.Contains(".."))
                {
                    throw new ArgumentException("Invalid file path");
                }

                // Simulate scanning delay
                await Task.Delay(_random.Next(100, 500));

                if (!File.Exists(filePath))
                {
                    return new VirusScanResult
                    {
                        IsClean = false,
                        ScanCompleted = false,
                        ErrorMessage = "File not found",
                        ScanDuration = DateTime.UtcNow - startTime,
                        ScanTimestamp = DateTime.UtcNow,
                        ScannerVersion = "MockScanner v1.0"
                    };
                }

                var fileName = Path.GetFileName(filePath);
                var fileContent = await File.ReadAllBytesAsync(filePath);
                
                return await ScanContentAsync(fileContent, fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during mock virus scan for file: {FilePath}", filePath);
                
                return new VirusScanResult
                {
                    IsClean = false,
                    ScanCompleted = false,
                    ErrorMessage = $"Scan error: {ex.Message}",
                    ScanDuration = DateTime.UtcNow - startTime,
                    ScanTimestamp = DateTime.UtcNow,
                    ScannerVersion = "MockScanner v1.0"
                };
            }
        }

        public async Task<VirusScanResult> ScanContentAsync(byte[] fileContent, string fileName)
        {
            var startTime = DateTime.UtcNow;
            
            try
            {
                _logger.LogInformation("Starting mock virus scan for content: {FileName} ({Size} bytes)", 
                    fileName, fileContent.Length);

                // Simulate scanning delay based on file size
                var scanDelay = Math.Min(fileContent.Length / 1000, 2000); // Max 2 seconds
                await Task.Delay(scanDelay);

                var contentString = System.Text.Encoding.UTF8.GetString(fileContent);
                var isInfected = false;
                string? threatName = null;

                // Check for simulated malicious patterns
                foreach (var pattern in _maliciousPatterns)
                {
                    if (fileName.ToLower().Contains(pattern.ToLower()) || 
                        contentString.Contains(pattern))
                    {
                        isInfected = true;
                        threatName = $"Mock.Threat.{pattern.Replace(".", "_")}";
                        break;
                    }
                }

                // Simulate occasional false positives (1% chance)
                if (!isInfected && _random.Next(1, 101) == 1)
                {
                    isInfected = true;
                    threatName = "Mock.Threat.Suspicious_Pattern";
                }

                var result = new VirusScanResult
                {
                    IsClean = !isInfected,
                    ScanCompleted = true,
                    ThreatName = threatName,
                    ScanDuration = DateTime.UtcNow - startTime,
                    ScanTimestamp = DateTime.UtcNow,
                    ScannerVersion = "MockScanner v1.0",
                    AdditionalInfo = new Dictionary<string, object>
                    {
                        { "FileSize", fileContent.Length },
                        { "FileName", fileName },
                        { "ScanEngine", "Mock" },
                        { "PatternsChecked", _maliciousPatterns.Length }
                    }
                };

                if (isInfected)
                {
                    _logger.LogWarning("Mock virus scan detected threat: {ThreatName} in file: {FileName}", 
                        threatName, fileName);
                }
                else
                {
                    _logger.LogInformation("Mock virus scan completed - file clean: {FileName}", fileName);
                }

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during mock virus scan for content: {FileName}", fileName);
                
                return new VirusScanResult
                {
                    IsClean = false,
                    ScanCompleted = false,
                    ErrorMessage = $"Scan error: {ex.Message}",
                    ScanDuration = DateTime.UtcNow - startTime,
                    ScanTimestamp = DateTime.UtcNow,
                    ScannerVersion = "MockScanner v1.0"
                };
            }
        }

        public async Task<bool> IsServiceAvailableAsync()
        {
            // Simulate service check delay
            await Task.Delay(50);
            
            // Mock service is always available
            _logger.LogInformation("Mock virus scanning service is available");
            return true;
        }

        public async Task<VirusDefinitionInfo> GetVirusDefinitionInfoAsync()
        {
            // Simulate service check delay
            await Task.Delay(100);
            
            var info = new VirusDefinitionInfo
            {
                Version = "MockDefs-2024.01.01",
                LastUpdated = DateTime.UtcNow.AddDays(-_random.Next(0, 7)), // Random within last week
                DefinitionCount = 1000000 + _random.Next(0, 100000), // Simulate growing definition count
                Source = "Mock Virus Definition Provider"
            };

            _logger.LogInformation("Mock virus definitions: Version {Version}, Last Updated: {LastUpdated}", 
                info.Version, info.LastUpdated);
            
            return info;
        }

        public async Task<bool> UpdateVirusDefinitionsAsync()
        {
            _logger.LogInformation("Starting mock virus definition update");
            
            // Simulate update process
            await Task.Delay(_random.Next(1000, 3000));
            
            // Simulate 95% success rate
            var success = _random.Next(1, 101) <= 95;
            
            if (success)
            {
                _logger.LogInformation("Mock virus definition update completed successfully");
            }
            else
            {
                _logger.LogWarning("Mock virus definition update failed");
            }
            
            return success;
        }
    }

    /// <summary>
    /// Configuration options for virus scanning service
    /// </summary>
    public class VirusScanningOptions
    {
        public bool EnableScanning { get; set; } = true;
        public bool QuarantineInfectedFiles { get; set; } = true;
        public int ScanTimeoutSeconds { get; set; } = 30;
        public string QuarantineDirectory { get; set; } = "quarantine";
        public bool AutoUpdateDefinitions { get; set; } = true;
        public int MaxFileSizeForScanMB { get; set; } = 100;
        public string[] ExcludedExtensions { get; set; } = Array.Empty<string>();
        public bool LogScanResults { get; set; } = true;
    }
}