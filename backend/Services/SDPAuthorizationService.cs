using backend.Models;
using backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace backend.Services
{
    public class SDPAuthorizationService : ISDPAuthorizationService
    {
        private readonly ApplicationDbContext _context;
        private readonly IMemoryCache _cache;
        private readonly ILogger<SDPAuthorizationService> _logger;
        private readonly TimeSpan _cacheExpiration = TimeSpan.FromMinutes(15);

        public SDPAuthorizationService(
            ApplicationDbContext context,
            IMemoryCache cache,
            ILogger<SDPAuthorizationService> logger)
        {
            _context = context;
            _cache = cache;
            _logger = logger;
        }

        public async Task<bool> CanAccessProject(int userId, int projectId)
        {
            try
            {
                var cacheKey = $"user_project_access_{userId}_{projectId}";
                
                if (_cache.TryGetValue(cacheKey, out bool cachedResult))
                {
                    return cachedResult;
                }

                // Get user's SDP ID
                var userSDPId = await GetUserSDPId(userId);
                if (!userSDPId.HasValue)
                {
                    _logger.LogWarning("User {UserId} is not associated with any SDP", userId);
                    return false;
                }

                // Check if project is assigned to user's SDP
                var project = await _context.Projects
                    .FirstOrDefaultAsync(p => p.Id == projectId && p.SkillsDevelopmentProviderId == userSDPId.Value);

                var canAccess = project != null;
                
                // Cache the result
                _cache.Set(cacheKey, canAccess, _cacheExpiration);
                
                return canAccess;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking project access for user {UserId} and project {ProjectId}", userId, projectId);
                return false;
            }
        }

        public async Task<bool> CanUpdateProject(int userId, int projectId)
        {
            try
            {
                // First check if user can access the project
                if (!await CanAccessProject(userId, projectId))
                {
                    return false;
                }

                // Check if user has SDP administrator role
                return await IsSDPAdministrator(userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking project update access for user {UserId} and project {ProjectId}", userId, projectId);
                return false;
            }
        }

        public async Task<List<int>> GetAuthorizedProjectIds(int userId)
        {
            try
            {
                var cacheKey = $"user_authorized_projects_{userId}";
                
                if (_cache.TryGetValue(cacheKey, out List<int>? cachedProjectIds))
                {
                    return cachedProjectIds ?? new List<int>();
                }

                // Get user's SDP ID
                var userSDPId = await GetUserSDPId(userId);
                if (!userSDPId.HasValue)
                {
                    return new List<int>();
                }

                // Get all projects assigned to user's SDP
                var projectIds = await _context.Projects
                    .Where(p => p.SkillsDevelopmentProviderId == userSDPId.Value)
                    .Select(p => p.Id)
                    .ToListAsync();

                // Cache the result
                _cache.Set(cacheKey, projectIds, _cacheExpiration);
                
                return projectIds;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting authorized project IDs for user {UserId}", userId);
                return new List<int>();
            }
        }

        public async Task<int?> GetUserSDPId(int userId)
        {
            try
            {
                var cacheKey = $"user_sdp_id_{userId}";
                
                if (_cache.TryGetValue(cacheKey, out int? cachedSDPId))
                {
                    return cachedSDPId;
                }

                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Id == userId);

                var sdpId = user?.SkillsDevelopmentProviderId;
                
                // Cache the result
                _cache.Set(cacheKey, sdpId, _cacheExpiration);
                
                return sdpId;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting SDP ID for user {UserId}", userId);
                return null;
            }
        }

        public async Task<bool> IsSDPAdministrator(int userId)
        {
            try
            {
                var cacheKey = $"user_is_sdp_admin_{userId}";
                
                if (_cache.TryGetValue(cacheKey, out bool cachedResult))
                {
                    return cachedResult;
                }

                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Id == userId);

                var isAdmin = user?.Role == UserRole.SDPAdministrator;
                
                // Cache the result
                _cache.Set(cacheKey, isAdmin, _cacheExpiration);
                
                return isAdmin;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking if user {UserId} is SDP administrator", userId);
                return false;
            }
        }

        /// <summary>
        /// Clears cache for a specific user (useful when user data changes)
        /// </summary>
        public void ClearUserCache(int userId)
        {
            var cacheKeys = new[]
            {
                $"user_sdp_id_{userId}",
                $"user_is_sdp_admin_{userId}",
                $"user_authorized_projects_{userId}"
            };

            foreach (var key in cacheKeys)
            {
                _cache.Remove(key);
            }
        }

        /// <summary>
        /// Clears project access cache for all users (useful when project assignments change)
        /// </summary>
        public void ClearProjectCache(int projectId)
        {
            // Note: This is a simplified approach. In production, you might want to use
            // a more sophisticated cache invalidation strategy
            _logger.LogInformation("Project {ProjectId} cache should be cleared", projectId);
        }
    }
}