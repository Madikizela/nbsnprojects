namespace backend.Services.Interfaces
{
    public interface ISDPAuthorizationService
    {
        /// <summary>
        /// Checks if a user can access a specific project
        /// </summary>
        /// <param name="userId">The user ID to check</param>
        /// <param name="projectId">The project ID to check access for</param>
        /// <returns>True if the user can access the project, false otherwise</returns>
        Task<bool> CanAccessProject(int userId, int projectId);

        /// <summary>
        /// Checks if a user can update a specific project
        /// </summary>
        /// <param name="userId">The user ID to check</param>
        /// <param name="projectId">The project ID to check update access for</param>
        /// <returns>True if the user can update the project, false otherwise</returns>
        Task<bool> CanUpdateProject(int userId, int projectId);

        /// <summary>
        /// Gets all project IDs that a user is authorized to access
        /// </summary>
        /// <param name="userId">The user ID to get authorized projects for</param>
        /// <returns>List of project IDs the user can access</returns>
        Task<List<int>> GetAuthorizedProjectIds(int userId);

        /// <summary>
        /// Gets the SDP ID for a given user
        /// </summary>
        /// <param name="userId">The user ID to get SDP for</param>
        /// <returns>SDP ID if user is associated with an SDP, null otherwise</returns>
        Task<int?> GetUserSDPId(int userId);

        /// <summary>
        /// Checks if a user has SDP administrator role
        /// </summary>
        /// <param name="userId">The user ID to check</param>
        /// <returns>True if user is SDP administrator, false otherwise</returns>
        Task<bool> IsSDPAdministrator(int userId);
    }
}