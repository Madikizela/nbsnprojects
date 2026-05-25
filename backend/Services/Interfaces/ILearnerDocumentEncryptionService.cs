namespace backend.Services.Interfaces
{
    public interface ILearnerDocumentEncryptionService
    {
        /// <summary>
        /// Encrypts a file and saves it to disk
        /// </summary>
        /// <param name="fileContent">Original file content</param>
        /// <param name="fileName">Original file name</param>
        /// <returns>Tuple containing (encrypted file path, IV, file hash)</returns>
        Task<(string encryptedPath, string iv, string hash)> EncryptAndSaveFileAsync(byte[] fileContent, string fileName);

        /// <summary>
        /// Decrypts a file from disk
        /// </summary>
        /// <param name="encryptedPath">Path to encrypted file</param>
        /// <param name="iv">Initialization Vector used during encryption</param>
        /// <returns>Decrypted file content</returns>
        Task<byte[]> DecryptFileAsync(string encryptedPath, string iv);

        /// <summary>
        /// Verifies file integrity using SHA256 hash
        /// </summary>
        /// <param name="fileContent">File content to verify</param>
        /// <param name="expectedHash">Expected SHA256 hash</param>
        /// <returns>True if hash matches</returns>
        bool VerifyFileIntegrity(byte[] fileContent, string expectedHash);

        /// <summary>
        /// Deletes an encrypted file from disk
        /// </summary>
        /// <param name="encryptedPath">Path to encrypted file</param>
        Task DeleteEncryptedFileAsync(string encryptedPath);
    }
}
