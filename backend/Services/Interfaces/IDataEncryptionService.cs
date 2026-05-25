namespace backend.Services.Interfaces
{
    /// <summary>
    /// Interface for AES data encryption and decryption operations for database storage and transmission
    /// </summary>
    public interface IDataEncryptionService
    {
        /// <summary>
        /// Encrypts a string value using AES encryption
        /// </summary>
        /// <param name="plainText">The plain text to encrypt</param>
        /// <returns>Base64 encoded encrypted string</returns>
        string EncryptString(string plainText);

        /// <summary>
        /// Decrypts an AES encrypted string
        /// </summary>
        /// <param name="encryptedText">Base64 encoded encrypted string</param>
        /// <returns>Decrypted plain text</returns>
        string DecryptString(string encryptedText);

        /// <summary>
        /// Encrypts an object to JSON and then encrypts the JSON string
        /// </summary>
        /// <typeparam name="T">Type of object to encrypt</typeparam>
        /// <param name="obj">Object to encrypt</param>
        /// <returns>Base64 encoded encrypted JSON string</returns>
        string EncryptObject<T>(T obj);

        /// <summary>
        /// Decrypts an encrypted JSON string and deserializes to object
        /// </summary>
        /// <typeparam name="T">Type of object to deserialize to</typeparam>
        /// <param name="encryptedJson">Base64 encoded encrypted JSON string</param>
        /// <returns>Deserialized object</returns>
        T DecryptObject<T>(string encryptedJson);

        /// <summary>
        /// Generates a secure random password
        /// </summary>
        /// <param name="length">Length of the password (default: 12)</param>
        /// <param name="includeSpecialChars">Include special characters (default: true)</param>
        /// <returns>Generated password</returns>
        string GenerateSecurePassword(int length = 12, bool includeSpecialChars = true);

        /// <summary>
        /// Generates a secure username based on client name
        /// </summary>
        /// <param name="clientName">Client name to base username on</param>
        /// <returns>Generated username</returns>
        string GenerateUsername(string clientName);
    }
}