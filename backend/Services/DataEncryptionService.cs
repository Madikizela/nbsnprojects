using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using backend.Services.Interfaces;

namespace backend.Services
{
    /// <summary>
    /// Implementation of AES data encryption service for secure data transmission and storage
    /// </summary>
    public class DataEncryptionService : IDataEncryptionService
    {
        private readonly ILogger<DataEncryptionService> _logger;
        private readonly IConfiguration _configuration;
        private readonly byte[] _encryptionKey;
        private const int IV_SIZE = 16; // AES block size

        public DataEncryptionService(ILogger<DataEncryptionService> logger, IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;
            
            // Get encryption key from environment variables, configuration, or generate one
            var keyString = Environment.GetEnvironmentVariable("ENCRYPTION_DATA_KEY") ?? _configuration["Encryption:DataKey"];
            
            // Clean the key string
            if (!string.IsNullOrEmpty(keyString))
            {
                keyString = keyString.Trim().Replace("\"", "").Replace("'", "");
            }

            if (string.IsNullOrEmpty(keyString) || keyString.Contains("YOUR_ENCRYPTION_KEY") || !IsValidBase64(keyString))
            {
                _logger.LogWarning("Valid encryption key not found in environment or configuration. Generating a temporary key for this session.");
                keyString = GenerateBase64Key();
            }

            try 
            {
                // Support Base64Url keys as well, just in case
                string base64 = keyString.Trim().Replace('-', '+').Replace('_', '/').Replace("\"", "").Replace("'", "");
                switch (base64.Length % 4)
                {
                    case 2: base64 += "=="; break;
                    case 3: base64 += "="; break;
                }
                _encryptionKey = Convert.FromBase64String(base64);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to parse encryption key as Base64. Generating a temporary key.");
                _encryptionKey = Convert.FromBase64String(GenerateBase64Key());
            }
        }

        private bool IsValidBase64(string base64)
        {
            if (string.IsNullOrEmpty(base64))
                return false;

            // Remove any whitespace
            base64 = base64.Trim();

            // Base64 length must be a multiple of 4
            if (base64.Length % 4 != 0)
                return false;

            // Check for valid characters using Regex
            // Base64 characters: A-Z, a-z, 0-9, +, /, and = (padding)
            return Regex.IsMatch(base64, @"^[a-zA-Z0-9\+/]*={0,2}$");
        }

        /// <summary>
        /// Encrypts a string value using AES encryption
        /// </summary>
        public string EncryptString(string plainText)
        {
            if (string.IsNullOrEmpty(plainText))
                return string.Empty;

            try
            {
                using var aes = Aes.Create();
                aes.Key = _encryptionKey;
                aes.GenerateIV();

                using var encryptor = aes.CreateEncryptor();
                using var msEncrypt = new MemoryStream();
                
                // Write IV to the beginning of the stream
                msEncrypt.Write(aes.IV, 0, aes.IV.Length);
                
                using (var csEncrypt = new CryptoStream(msEncrypt, encryptor, CryptoStreamMode.Write))
                using (var swEncrypt = new StreamWriter(csEncrypt))
                {
                    swEncrypt.Write(plainText);
                }

                return Convert.ToBase64String(msEncrypt.ToArray());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error encrypting string");
                throw new InvalidOperationException("Encryption failed", ex);
            }
        }

        /// <summary>
        /// Decrypts an AES encrypted string
        /// </summary>
        public string DecryptString(string encryptedText)
        {
            if (string.IsNullOrEmpty(encryptedText))
                return string.Empty;

            try
            {
                // Clean the input string (remove any potential whitespace or quotes)
                encryptedText = encryptedText.Trim().Replace("\"", "").Replace("'", "");
                
                // Support both standard Base64 and Base64Url
                string base64 = encryptedText.Replace('-', '+').Replace('_', '/');
                switch (base64.Length % 4)
                {
                    case 2: base64 += "=="; break;
                    case 3: base64 += "="; break;
                }
                
                var fullCipher = Convert.FromBase64String(base64);

                using var aes = Aes.Create();
                aes.Key = _encryptionKey;

                // Extract IV from the beginning of the encrypted data
                var iv = new byte[IV_SIZE];
                Array.Copy(fullCipher, 0, iv, 0, IV_SIZE);
                aes.IV = iv;

                // Extract the actual encrypted data
                var cipher = new byte[fullCipher.Length - IV_SIZE];
                Array.Copy(fullCipher, IV_SIZE, cipher, 0, cipher.Length);

                using var decryptor = aes.CreateDecryptor();
                using var msDecrypt = new MemoryStream(cipher);
                using var csDecrypt = new CryptoStream(msDecrypt, decryptor, CryptoStreamMode.Read);
                using var srDecrypt = new StreamReader(csDecrypt);

                return srDecrypt.ReadToEnd();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error decrypting string");
                throw new InvalidOperationException("Decryption failed", ex);
            }
        }

        /// <summary>
        /// Encrypts an object to JSON and then encrypts the JSON string
        /// </summary>
        public string EncryptObject<T>(T obj)
        {
            if (obj == null)
                return string.Empty;

            try
            {
                var json = JsonSerializer.Serialize(obj);
                return EncryptString(json);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error encrypting object of type {Type}", typeof(T).Name);
                throw new InvalidOperationException($"Object encryption failed for type {typeof(T).Name}", ex);
            }
        }

        /// <summary>
        /// Decrypts an encrypted JSON string and deserializes to object
        /// </summary>
        public T DecryptObject<T>(string encryptedJson)
        {
            if (string.IsNullOrEmpty(encryptedJson))
                return default(T)!;

            try
            {
                var json = DecryptString(encryptedJson);
                var options = new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true,
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                };
                return JsonSerializer.Deserialize<T>(json, options)!;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error decrypting object of type {Type}", typeof(T).Name);
                throw new InvalidOperationException($"Object decryption failed for type {typeof(T).Name}", ex);
            }
        }

        /// <summary>
        /// Generates a secure random password
        /// </summary>
        public string GenerateSecurePassword(int length = 12, bool includeSpecialChars = true)
        {
            const string lowercase = "abcdefghijklmnopqrstuvwxyz";
            const string uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            const string digits = "0123456789";
            const string specialChars = "!@#$%^&*()_+-=[]{}|;:,.<>?";

            var chars = lowercase + uppercase + digits;
            if (includeSpecialChars)
                chars += specialChars;

            var random = new Random();
            var password = new StringBuilder();

            // Ensure at least one character from each category
            password.Append(lowercase[random.Next(lowercase.Length)]);
            password.Append(uppercase[random.Next(uppercase.Length)]);
            password.Append(digits[random.Next(digits.Length)]);
            
            if (includeSpecialChars)
                password.Append(specialChars[random.Next(specialChars.Length)]);

            // Fill the rest randomly
            var remainingLength = length - password.Length;
            for (int i = 0; i < remainingLength; i++)
            {
                password.Append(chars[random.Next(chars.Length)]);
            }

            // Shuffle the password
            var passwordArray = password.ToString().ToCharArray();
            for (int i = passwordArray.Length - 1; i > 0; i--)
            {
                int j = random.Next(i + 1);
                (passwordArray[i], passwordArray[j]) = (passwordArray[j], passwordArray[i]);
            }

            return new string(passwordArray);
        }

        /// <summary>
        /// Generates a secure username based on client name
        /// Note: This method generates a username but doesn't check for uniqueness.
        /// Use GenerateUniqueUsername for database-aware unique username generation.
        /// </summary>
        public string GenerateUsername(string clientName)
        {
            if (string.IsNullOrEmpty(clientName))
                throw new ArgumentException("Client name cannot be null or empty", nameof(clientName));

            try
            {
                // Clean the client name - remove special characters and spaces
                var cleanName = Regex.Replace(clientName.ToLower(), @"[^a-z0-9]", "");
                
                // Take first 8 characters or pad if shorter
                var baseUsername = cleanName.Length >= 8 ? cleanName[..8] : cleanName.PadRight(8, '0');
                
                // Add random suffix for uniqueness
                var random = new Random();
                var suffix = random.Next(100, 999);
                
                return $"{baseUsername}{suffix}";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating username for client: {ClientName}", clientName);
                throw new InvalidOperationException("Username generation failed", ex);
            }
        }

        /// <summary>
        /// Generates a base64 encoded encryption key
        /// </summary>
        private string GenerateBase64Key()
        {
            using var aes = Aes.Create();
            aes.GenerateKey();
            return Convert.ToBase64String(aes.Key);
        }
    }
}