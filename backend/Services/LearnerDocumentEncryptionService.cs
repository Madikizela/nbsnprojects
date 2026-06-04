using System.Security.Cryptography;
using backend.Services.Interfaces;

namespace backend.Services
{
    public class LearnerDocumentEncryptionService : ILearnerDocumentEncryptionService
    {
        private readonly IConfiguration _configuration;
        private readonly string _uploadDirectory;
        private readonly byte[] _encryptionKey;

        public LearnerDocumentEncryptionService(IConfiguration configuration)
        {
            _configuration = configuration;
            
            // Get upload directory from configuration or use default
            _uploadDirectory = _configuration["FileStorage:LearnerDocumentsPath"] 
                ?? Path.Combine(Directory.GetCurrentDirectory(), "uploads", "learner_documents");
            
            // Ensure directory exists
            if (!Directory.Exists(_uploadDirectory))
            {
                Directory.CreateDirectory(_uploadDirectory);
            }

            // Get encryption key from configuration (should be stored securely, e.g., Azure Key Vault)
            var keyString = _configuration["Encryption:LearnerDocumentKey"] 
                ?? "YourSecure256BitEncryptionKeyHere!!"; // 32 characters for AES-256
            
            _encryptionKey = System.Text.Encoding.UTF8.GetBytes(keyString.PadRight(32).Substring(0, 32));
        }

        public async Task<(string encryptedPath, string iv, string hash)> EncryptAndSaveFileAsync(byte[] fileContent, string fileName)
        {
            // Generate unique file name only — never store full absolute path in DB
            var uniqueFileName = $"{Guid.NewGuid()}_{Path.GetFileName(fileName)}";
            var fullPath = Path.Combine(_uploadDirectory, uniqueFileName);

            // Calculate SHA256 hash of original file
            string fileHash;
            using (var sha256 = SHA256.Create())
            {
                var hashBytes = sha256.ComputeHash(fileContent);
                fileHash = Convert.ToBase64String(hashBytes);
            }

            // Encrypt file using AES-256
            using (var aes = Aes.Create())
            {
                aes.Key = _encryptionKey;
                aes.GenerateIV();
                var iv = Convert.ToBase64String(aes.IV);

                using (var encryptor = aes.CreateEncryptor())
                using (var fileStream = new FileStream(fullPath, FileMode.Create, FileAccess.Write))
                using (var cryptoStream = new CryptoStream(fileStream, encryptor, CryptoStreamMode.Write))
                {
                    await cryptoStream.WriteAsync(fileContent, 0, fileContent.Length);
                    await cryptoStream.FlushFinalBlockAsync();
                }

                // Return only the filename — full path is resolved at runtime from _uploadDirectory
                return (uniqueFileName, iv, fileHash);
            }
        }

        public async Task<byte[]> DecryptFileAsync(string encryptedPath, string iv)
        {
            // Resolve full path — encryptedPath may be just a filename (new style) or full path (legacy)
            var fullPath = Path.IsPathRooted(encryptedPath)
                ? encryptedPath
                : Path.Combine(_uploadDirectory, encryptedPath);

            if (!File.Exists(fullPath))
            {
                throw new FileNotFoundException("Encrypted file not found", fullPath);
            }

            var ivBytes = Convert.FromBase64String(iv);

            using (var aes = Aes.Create())
            {
                aes.Key = _encryptionKey;
                aes.IV = ivBytes;

                using (var decryptor = aes.CreateDecryptor())
                using (var fileStream = new FileStream(fullPath, FileMode.Open, FileAccess.Read))
                using (var cryptoStream = new CryptoStream(fileStream, decryptor, CryptoStreamMode.Read))
                using (var memoryStream = new MemoryStream())
                {
                    await cryptoStream.CopyToAsync(memoryStream);
                    return memoryStream.ToArray();
                }
            }
        }

        public bool VerifyFileIntegrity(byte[] fileContent, string expectedHash)
        {
            using (var sha256 = SHA256.Create())
            {
                var hashBytes = sha256.ComputeHash(fileContent);
                var actualHash = Convert.ToBase64String(hashBytes);
                return actualHash == expectedHash;
            }
        }

        public async Task DeleteEncryptedFileAsync(string encryptedPath)
        {
            var fullPath = Path.IsPathRooted(encryptedPath)
                ? encryptedPath
                : Path.Combine(_uploadDirectory, encryptedPath);
            if (File.Exists(fullPath))
            {
                await Task.Run(() => File.Delete(fullPath));
            }
        }
    }
}
