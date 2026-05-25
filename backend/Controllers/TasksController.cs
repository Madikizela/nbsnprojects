using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using backend.Models.DTOs;
using backend.Services.Interfaces;
using System.Security.Claims;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TasksController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IEmailService _emailService;
        private readonly ILogger<TasksController> _logger;

        public TasksController(
            ApplicationDbContext context,
            IEmailService emailService,
            ILogger<TasksController> logger)
        {
            _context = context;
            _emailService = emailService;
            _logger = logger;
        }

        // GET: api/Tasks
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TaskDto>>> GetTasks(
            [FromQuery] int? projectId = null,
            [FromQuery] int? departmentId = null,
            [FromQuery] int? assignedToUserId = null,
            [FromQuery] Models.TaskStatus? status = null,
            [FromQuery] Models.TaskPriority? priority = null)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (!currentUserId.HasValue)
                {
                    return Unauthorized("User ID not found in token");
                }

                var query = _context.Tasks
                    .Include(t => t.AssignedToUser)
                    .Include(t => t.CreatedByUser)
                    .Include(t => t.Project)
                    .Include(t => t.Department)
                    .Include(t => t.Reminders)
                    .AsQueryable();

                // Apply filters
                if (projectId.HasValue)
                    query = query.Where(t => t.ProjectId == projectId.Value);

                if (departmentId.HasValue)
                    query = query.Where(t => t.DepartmentId == departmentId.Value);

                if (assignedToUserId.HasValue)
                    query = query.Where(t => t.AssignedToUserId == assignedToUserId.Value);

                if (status.HasValue)
                    query = query.Where(t => t.Status == status.Value);

                if (priority.HasValue)
                    query = query.Where(t => t.Priority == priority.Value);

                // Only show tasks that the user can see (assigned to them, created by them, or in their department/project)
                var currentUser = await _context.Users
                    .Include(u => u.Department)
                    .FirstOrDefaultAsync(u => u.Id == currentUserId.Value);

                if (currentUser != null)
                {
                    query = query.Where(t => 
                        t.AssignedToUserId == currentUserId.Value ||
                        t.CreatedByUserId == currentUserId.Value ||
                        (currentUser.DepartmentId.HasValue && t.DepartmentId == currentUser.DepartmentId) ||
                        (currentUser.SkillsDevelopmentProviderId.HasValue && t.Project != null && t.Project.SkillsDevelopmentProviderId == currentUser.SkillsDevelopmentProviderId));
                }

                var tasks = await query
                    .OrderByDescending(t => t.CreatedAt)
                    .Select(t => new TaskDto
                    {
                        Id = t.Id,
                        Title = t.Title,
                        Description = t.Description,
                        DueDate = t.DueDate,
                        Status = t.Status,
                        Priority = t.Priority,
                        AssignedToUserId = t.AssignedToUserId,
                        AssignedToUserName = t.AssignedToUser.FirstName + " " + t.AssignedToUser.LastName,
                        AssignedToUserEmail = t.AssignedToUser.Email,
                        CreatedByUserId = t.CreatedByUserId,
                        CreatedByUserName = t.CreatedByUser.FirstName + " " + t.CreatedByUser.LastName,
                        ProjectId = t.ProjectId,
                        ProjectName = t.Project != null ? t.Project.ProjectName : null,
                        DepartmentId = t.DepartmentId,
                        DepartmentName = t.Department != null ? t.Department.Name : null,
                        CreatedAt = t.CreatedAt,
                        UpdatedAt = t.UpdatedAt,
                        CompletionNotes = t.CompletionNotes,
                        CompletedAt = t.CompletedAt,
                        Reminders = t.Reminders.Select(r => new TaskReminderDto
                        {
                            Id = r.Id,
                            TaskId = r.TaskId,
                            ReminderDateTime = r.ReminderDateTime,
                            Type = r.Type,
                            Message = r.Message,
                            IsSent = r.IsSent,
                            SentAt = r.SentAt,
                            CreatedAt = r.CreatedAt
                        }).ToList()
                    })
                    .ToListAsync();

                return Ok(tasks);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting tasks");
                return StatusCode(500, new { message = "Error occurred", error = ex.Message });
            }
        }

        // GET: api/Tasks/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<TaskDto>> GetTask(int id)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (!currentUserId.HasValue)
                {
                    return Unauthorized("User ID not found in token");
                }

                var task = await _context.Tasks
                    .Include(t => t.AssignedToUser)
                    .Include(t => t.CreatedByUser)
                    .Include(t => t.Project)
                    .Include(t => t.Department)
                    .Include(t => t.Reminders)
                    .FirstOrDefaultAsync(t => t.Id == id);

                if (task == null)
                {
                    return NotFound(new { message = "Task not found" });
                }

                // Check if user can access this task
                var currentUser = await _context.Users
                    .Include(u => u.Department)
                    .FirstOrDefaultAsync(u => u.Id == currentUserId.Value);

                if (currentUser != null)
                {
                    bool canAccess = task.AssignedToUserId == currentUserId.Value ||
                                   task.CreatedByUserId == currentUserId.Value ||
                                   (currentUser.DepartmentId.HasValue && task.DepartmentId == currentUser.DepartmentId) ||
                                   (currentUser.SkillsDevelopmentProviderId.HasValue && task.Project != null && task.Project.SkillsDevelopmentProviderId == currentUser.SkillsDevelopmentProviderId);

                    if (!canAccess)
                    {
                        return Forbid("You don't have permission to access this task");
                    }
                }

                var taskDto = new TaskDto
                {
                    Id = task.Id,
                    Title = task.Title,
                    Description = task.Description,
                    DueDate = task.DueDate,
                    Status = task.Status,
                    Priority = task.Priority,
                    AssignedToUserId = task.AssignedToUserId,
                    AssignedToUserName = task.AssignedToUser.FirstName + " " + task.AssignedToUser.LastName,
                    AssignedToUserEmail = task.AssignedToUser.Email,
                    CreatedByUserId = task.CreatedByUserId,
                    CreatedByUserName = task.CreatedByUser.FirstName + " " + task.CreatedByUser.LastName,
                    ProjectId = task.ProjectId,
                    ProjectName = task.Project?.ProjectName,
                    DepartmentId = task.DepartmentId,
                    DepartmentName = task.Department?.Name,
                    CreatedAt = task.CreatedAt,
                    UpdatedAt = task.UpdatedAt,
                    CompletionNotes = task.CompletionNotes,
                    CompletedAt = task.CompletedAt,
                    Reminders = task.Reminders.Select(r => new TaskReminderDto
                    {
                        Id = r.Id,
                        TaskId = r.TaskId,
                        ReminderDateTime = r.ReminderDateTime,
                        Type = r.Type,
                        Message = r.Message,
                        IsSent = r.IsSent,
                        SentAt = r.SentAt,
                        CreatedAt = r.CreatedAt
                    }).ToList()
                };

                return Ok(taskDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting task {TaskId}", id);
                return StatusCode(500, new { message = "Error occurred", error = ex.Message });
            }
        }

        // POST: api/Tasks
        [HttpPost]
        public async Task<ActionResult<TaskDto>> CreateTask(CreateTaskDto createTaskDto)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (!currentUserId.HasValue)
                {
                    return Unauthorized("User ID not found in token");
                }

                // Validate assigned user exists
                var assignedUser = await _context.Users.FindAsync(createTaskDto.AssignedToUserId);
                if (assignedUser == null)
                {
                    return BadRequest(new { message = "Assigned user not found" });
                }

                // Validate project if specified
                if (createTaskDto.ProjectId.HasValue)
                {
                    var project = await _context.Projects.FindAsync(createTaskDto.ProjectId.Value);
                    if (project == null)
                    {
                        return BadRequest(new { message = "Project not found" });
                    }
                }

                // Validate department if specified
                if (createTaskDto.DepartmentId.HasValue)
                {
                    var department = await _context.Departments.FindAsync(createTaskDto.DepartmentId.Value);
                    if (department == null)
                    {
                        return BadRequest(new { message = "Department not found" });
                    }
                }

                var task = new ProjectTask
                {
                    Title = createTaskDto.Title,
                    Description = createTaskDto.Description,
                    DueDate = createTaskDto.DueDate,
                    Priority = createTaskDto.Priority,
                    AssignedToUserId = createTaskDto.AssignedToUserId,
                    CreatedByUserId = currentUserId.Value,
                    ProjectId = createTaskDto.ProjectId,
                    DepartmentId = createTaskDto.DepartmentId,
                    Status = Models.TaskStatus.Pending,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Tasks.Add(task);
                await _context.SaveChangesAsync();

                // Add reminders
                foreach (var reminderDto in createTaskDto.Reminders)
                {
                    var reminder = new TaskReminder
                    {
                        TaskId = task.Id,
                        ReminderDateTime = reminderDto.ReminderDateTime,
                        Type = reminderDto.Type,
                        Message = reminderDto.Message,
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.TaskReminders.Add(reminder);
                }

                await _context.SaveChangesAsync();

                // Send notification email to assigned user
                await SendTaskAssignmentEmail(task, assignedUser);

                // Reload task with all related data
                var createdTask = await _context.Tasks
                    .Include(t => t.AssignedToUser)
                    .Include(t => t.CreatedByUser)
                    .Include(t => t.Project)
                    .Include(t => t.Department)
                    .Include(t => t.Reminders)
                    .FirstOrDefaultAsync(t => t.Id == task.Id);

                var taskDto = new TaskDto
                {
                    Id = createdTask!.Id,
                    Title = createdTask.Title,
                    Description = createdTask.Description,
                    DueDate = createdTask.DueDate,
                    Status = createdTask.Status,
                    Priority = createdTask.Priority,
                    AssignedToUserId = createdTask.AssignedToUserId,
                    AssignedToUserName = createdTask.AssignedToUser.FirstName + " " + createdTask.AssignedToUser.LastName,
                    AssignedToUserEmail = createdTask.AssignedToUser.Email,
                    CreatedByUserId = createdTask.CreatedByUserId,
                    CreatedByUserName = createdTask.CreatedByUser.FirstName + " " + createdTask.CreatedByUser.LastName,
                    ProjectId = createdTask.ProjectId,
                    ProjectName = createdTask.Project?.ProjectName,
                    DepartmentId = createdTask.DepartmentId,
                    DepartmentName = createdTask.Department?.Name,
                    CreatedAt = createdTask.CreatedAt,
                    UpdatedAt = createdTask.UpdatedAt,
                    CompletionNotes = createdTask.CompletionNotes,
                    CompletedAt = createdTask.CompletedAt,
                    Reminders = createdTask.Reminders.Select(r => new TaskReminderDto
                    {
                        Id = r.Id,
                        TaskId = r.TaskId,
                        ReminderDateTime = r.ReminderDateTime,
                        Type = r.Type,
                        Message = r.Message,
                        IsSent = r.IsSent,
                        SentAt = r.SentAt,
                        CreatedAt = r.CreatedAt
                    }).ToList()
                };

                return CreatedAtAction(nameof(GetTask), new { id = task.Id }, taskDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating task");
                return StatusCode(500, new { message = "Error occurred", error = ex.Message });
            }
        }

        // PUT: api/Tasks/{id}
        [HttpPut("{id}")]
        public async Task<ActionResult<TaskDto>> UpdateTask(int id, UpdateTaskDto updateTaskDto)
        {
            try
            {
                if (id != updateTaskDto.Id)
                {
                    return BadRequest(new { message = "Task ID mismatch" });
                }

                var currentUserId = GetCurrentUserId();
                if (!currentUserId.HasValue)
                {
                    return Unauthorized("User ID not found in token");
                }

                var task = await _context.Tasks
                    .Include(t => t.AssignedToUser)
                    .Include(t => t.CreatedByUser)
                    .Include(t => t.Project)
                    .Include(t => t.Department)
                    .Include(t => t.Reminders)
                    .FirstOrDefaultAsync(t => t.Id == id);

                if (task == null)
                {
                    return NotFound(new { message = "Task not found" });
                }

                // Check if user can update this task
                if (task.CreatedByUserId != currentUserId.Value && task.AssignedToUserId != currentUserId.Value)
                {
                    return Forbid("You don't have permission to update this task");
                }

                // Update task properties
                task.Title = updateTaskDto.Title;
                task.Description = updateTaskDto.Description;
                task.DueDate = updateTaskDto.DueDate;
                task.Priority = updateTaskDto.Priority;
                task.AssignedToUserId = updateTaskDto.AssignedToUserId;
                task.ProjectId = updateTaskDto.ProjectId;
                task.DepartmentId = updateTaskDto.DepartmentId;
                task.UpdatedAt = DateTime.UtcNow;

                // Handle status change
                if (task.Status != updateTaskDto.Status)
                {
                    task.Status = updateTaskDto.Status;
                    
                    if (updateTaskDto.Status == Models.TaskStatus.Completed)
                    {
                        task.CompletedAt = DateTime.UtcNow;
                        task.CompletionNotes = updateTaskDto.CompletionNotes;
                    }
                    else
                    {
                        task.CompletedAt = null;
                        task.CompletionNotes = null;
                    }
                }

                await _context.SaveChangesAsync();

                var taskDto = new TaskDto
                {
                    Id = task.Id,
                    Title = task.Title,
                    Description = task.Description,
                    DueDate = task.DueDate,
                    Status = task.Status,
                    Priority = task.Priority,
                    AssignedToUserId = task.AssignedToUserId,
                    AssignedToUserName = task.AssignedToUser.FirstName + " " + task.AssignedToUser.LastName,
                    AssignedToUserEmail = task.AssignedToUser.Email,
                    CreatedByUserId = task.CreatedByUserId,
                    CreatedByUserName = task.CreatedByUser.FirstName + " " + task.CreatedByUser.LastName,
                    ProjectId = task.ProjectId,
                    ProjectName = task.Project?.ProjectName,
                    DepartmentId = task.DepartmentId,
                    DepartmentName = task.Department?.Name,
                    CreatedAt = task.CreatedAt,
                    UpdatedAt = task.UpdatedAt,
                    CompletionNotes = task.CompletionNotes,
                    CompletedAt = task.CompletedAt,
                    Reminders = task.Reminders.Select(r => new TaskReminderDto
                    {
                        Id = r.Id,
                        TaskId = r.TaskId,
                        ReminderDateTime = r.ReminderDateTime,
                        Type = r.Type,
                        Message = r.Message,
                        IsSent = r.IsSent,
                        SentAt = r.SentAt,
                        CreatedAt = r.CreatedAt
                    }).ToList()
                };

                return Ok(taskDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating task {TaskId}", id);
                return StatusCode(500, new { message = "Error occurred", error = ex.Message });
            }
        }

        // DELETE: api/Tasks/{id}
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteTask(int id)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (!currentUserId.HasValue)
                {
                    return Unauthorized("User ID not found in token");
                }

                var task = await _context.Tasks
                    .Include(t => t.Reminders)
                    .FirstOrDefaultAsync(t => t.Id == id);

                if (task == null)
                {
                    return NotFound(new { message = "Task not found" });
                }

                // Only creator can delete the task
                if (task.CreatedByUserId != currentUserId.Value)
                {
                    return Forbid("You don't have permission to delete this task");
                }

                // Remove reminders first
                _context.TaskReminders.RemoveRange(task.Reminders);
                
                // Remove task
                _context.Tasks.Remove(task);
                
                await _context.SaveChangesAsync();

                return Ok(new { message = "Task deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting task {TaskId}", id);
                return StatusCode(500, new { message = "Error occurred", error = ex.Message });
            }
        }

        // GET: api/Tasks/Summary
        [HttpGet("Summary")]
        public async Task<ActionResult<TaskSummaryDto>> GetTaskSummary(
            [FromQuery] int? projectId = null,
            [FromQuery] int? departmentId = null)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (!currentUserId.HasValue)
                {
                    return Unauthorized("User ID not found in token");
                }

                var query = _context.Tasks.AsQueryable();

                // Apply filters
                if (projectId.HasValue)
                    query = query.Where(t => t.ProjectId == projectId.Value);

                if (departmentId.HasValue)
                    query = query.Where(t => t.DepartmentId == departmentId.Value);

                // Only show tasks that the user can see
                var currentUser = await _context.Users
                    .Include(u => u.Department)
                    .FirstOrDefaultAsync(u => u.Id == currentUserId.Value);

                if (currentUser != null)
                {
                    query = query.Where(t => 
                        t.AssignedToUserId == currentUserId.Value ||
                        t.CreatedByUserId == currentUserId.Value ||
                        (currentUser.DepartmentId.HasValue && t.DepartmentId == currentUser.DepartmentId) ||
                        (currentUser.SkillsDevelopmentProviderId.HasValue && t.Project != null && t.Project.SkillsDevelopmentProviderId == currentUser.SkillsDevelopmentProviderId));
                }

                var now = DateTime.UtcNow;
                var tasks = await query.ToListAsync();

                var summary = new TaskSummaryDto
                {
                    TotalTasks = tasks.Count,
                    PendingTasks = tasks.Count(t => t.Status == Models.TaskStatus.Pending),
                    InProgressTasks = tasks.Count(t => t.Status == Models.TaskStatus.InProgress),
                    CompletedTasks = tasks.Count(t => t.Status == Models.TaskStatus.Completed),
                    OverdueTasks = tasks.Count(t => t.Status != Models.TaskStatus.Completed && t.DueDate < now),
                    HighPriorityTasks = tasks.Count(t => t.Priority == Models.TaskPriority.High && t.Status != Models.TaskStatus.Completed),
                    CriticalPriorityTasks = tasks.Count(t => t.Priority == Models.TaskPriority.Critical && t.Status != Models.TaskStatus.Completed)
                };

                return Ok(summary);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting task summary");
                return StatusCode(500, new { message = "Error occurred", error = ex.Message });
            }
        }

        // GET: api/Tasks/Users
        [HttpGet("Users")]
        public async Task<ActionResult<IEnumerable<object>>> GetAvailableUsers()
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (!currentUserId.HasValue)
                {
                    return Unauthorized("User ID not found in token");
                }

                var currentUser = await _context.Users
                    .Include(u => u.Department)
                    .FirstOrDefaultAsync(u => u.Id == currentUserId.Value);

                if (currentUser == null)
                {
                    return BadRequest(new { message = "Current user not found" });
                }

                var query = _context.Users.AsQueryable();

                // Filter users based on current user's context
                if (currentUser.DepartmentId.HasValue)
                {
                    // Department managers can only assign tasks to users in their specific department
                    query = query.Where(u => u.DepartmentId == currentUser.DepartmentId);
                }
                else if (currentUser.SkillsDevelopmentProviderId.HasValue)
                {
                    // SDP users (without department) can assign tasks to users in their SDP
                    query = query.Where(u => u.SkillsDevelopmentProviderId == currentUser.SkillsDevelopmentProviderId);
                }

                var users = await query
                    .Where(u => u.Status == UserStatus.Active)
                    .Select(u => new {
                        Id = u.Id,
                        Name = u.FirstName + " " + u.LastName,
                        Email = u.Email,
                        Role = u.Role.ToString(),
                        DepartmentName = u.Department != null ? u.Department.Name : null
                    })
                    .OrderBy(u => u.Name)
                    .ToListAsync();

                return Ok(users);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting available users");
                return StatusCode(500, new { message = "Error occurred", error = ex.Message });
            }
        }

        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(userIdClaim, out int userId))
            {
                return userId;
            }
            return null;
        }

        private async System.Threading.Tasks.Task SendTaskAssignmentEmail(ProjectTask task, User assignedUser)
        {
            try
            {
                var subject = $"New Task Assigned: {task.Title}";
                var body = $@"
                    <h3>You have been assigned a new task</h3>
                    <p><strong>Task:</strong> {task.Title}</p>
                    <p><strong>Description:</strong> {task.Description}</p>
                    <p><strong>Due Date:</strong> {task.DueDate:yyyy-MM-dd HH:mm}</p>
                    <p><strong>Priority:</strong> {task.Priority}</p>
                    <p>Please log in to the system to view more details and manage this task.</p>
                ";

                await _emailService.SendEmailAsync(assignedUser.Email, subject, body);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending task assignment email to {Email}", assignedUser.Email);
            }
        }
    }
}