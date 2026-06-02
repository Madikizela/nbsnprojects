using Microsoft.EntityFrameworkCore;
using backend.Services;
using QuestPDF.Infrastructure;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using DotNetEnv;

// Load environment variables from .env file
var root = Directory.GetCurrentDirectory();
var envPath = Path.Combine(root, ".env");
if (!File.Exists(envPath))
{
    // Try one level up if not found (common in dev environments)
    envPath = Path.Combine(root, "..", ".env");
}

if (File.Exists(envPath))
{
    Console.WriteLine($"✅ Loading environment variables from: {envPath}");
    DotNetEnv.Env.Load(envPath);
}
else
{
    Console.WriteLine("⚠️ Warning: .env file not found. Falling back to appsettings.json or system environment variables.");
}

// Configure Npgsql to handle DateTime as UTC
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

// Configure QuestPDF license
QuestPDF.Settings.License = LicenseType.Community;

// Configure Kestrel to listen on all network interfaces
builder.WebHost.ConfigureKestrel(serverOptions =>
{
    serverOptions.ListenAnyIP(5213); // Listen on all network interfaces on port 5213
});

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

// Add database context (using MySQL)
builder.Services.AddDbContext<backend.Models.ApplicationDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    
    // Check for environment variables to override connection string
    var dbHost = Environment.GetEnvironmentVariable("DB_HOST");
    var dbPort = Environment.GetEnvironmentVariable("DB_PORT") ?? "3306";
    var dbName = Environment.GetEnvironmentVariable("DB_NAME");
    var dbUser = Environment.GetEnvironmentVariable("DB_USER");
    var dbPass = Environment.GetEnvironmentVariable("DB_PASS");

    if (!string.IsNullOrEmpty(dbHost) && !string.IsNullOrEmpty(dbName))
    {
        connectionString = $"Server={dbHost};Port={dbPort};Database={dbName};User={dbUser};Password={dbPass}";
    }

    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString), mysqlOptions =>
       {
           mysqlOptions.EnableRetryOnFailure(
               maxRetryCount: 3,
               maxRetryDelay: TimeSpan.FromSeconds(5),
               errorNumbersToAdd: null);
       });
    options.EnableSensitiveDataLogging(true);
    options.EnableDetailedErrors(true);
    options.LogTo(Console.WriteLine, LogLevel.Information);
}, ServiceLifetime.Scoped);

// Add password hashing service
builder.Services.AddScoped<IPasswordHashingService, PasswordHashingService>();

// Add data seeding service
builder.Services.AddScoped<IDataSeedingService, DataSeedingService>();

// Add document management services
builder.Services.AddScoped<IFileEncryptionService, FileEncryptionService>();
builder.Services.AddScoped<IDocumentUploadService, DocumentUploadService>();
builder.Services.AddScoped<IDocumentAccessControlService, DocumentAccessControlService>();
builder.Services.AddScoped<IDocumentAuditService, DocumentAuditService>();
builder.Services.AddScoped<IVirusScanningService, MockVirusScanningService>();

// Add learner document encryption service
builder.Services.AddScoped<ILearnerDocumentEncryptionService, LearnerDocumentEncryptionService>();

// Add data encryption and email services
builder.Services.AddScoped<IDataEncryptionService, DataEncryptionService>();
builder.Services.AddScoped<IEmailService, EmailService>();

// Add SDP authorization service
builder.Services.AddScoped<ISDPAuthorizationService, SDPAuthorizationService>();

// Add memory cache for authorization service
builder.Services.AddMemoryCache();

// Add controllers
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

// Add JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = Environment.GetEnvironmentVariable("JWT_SECRET") ?? jwtSettings["SecretKey"] ?? "YourSuperSecretKeyThatIsAtLeast32CharactersLong!";
var issuer = Environment.GetEnvironmentVariable("JWT_ISSUER") ?? jwtSettings["Issuer"] ?? "YourAppName";
var audience = Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? jwtSettings["Audience"] ?? "YourAppUsers";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = issuer,
            ValidAudience = audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
        };
    });

builder.Services.AddAuthorization();

// Add CORS for React frontend and mobile app
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", 
        builder => builder
            .WithOrigins(
                "https://renewed-spirit-production.up.railway.app",
                "http://localhost:5174",
                "http://localhost:3000",
                "http://127.0.0.1:5174",
                "http://127.0.0.1:3000"
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials());
});

var app = builder.Build();

// Database should already be created and migrated, so we don't need EnsureCreated()
// This prevents conflicts with existing PostgreSQL database

// Add explicit database initialization
try
{
    using (var scope = app.Services.CreateScope())
    {
        var context = scope.ServiceProvider.GetRequiredService<backend.Models.ApplicationDbContext>();
        
        // Test the connection by attempting to open it
        var connection = context.Database.GetDbConnection();
        Console.WriteLine($"🔍 Database Connection Type: {connection.GetType().Name}");
        Console.WriteLine($"🔍 Connection String: {connection.ConnectionString}");
        
        if (connection.State != System.Data.ConnectionState.Open)
        {
            connection.Open();
            Console.WriteLine("✅ Database connection established successfully");
            Console.WriteLine($"   Database: {connection.Database}");
            Console.WriteLine($"   Server: {connection.DataSource}");
            connection.Close();
        }
        
        // Seed the database (don't use EnsureCreated as it creates SQLite)
        var seedingService = scope.ServiceProvider.GetRequiredService<backend.Services.IDataSeedingService>();
        await seedingService.SeedInitialDataAsync();

        // Test a simple query to ensure the context is working
        var adminCount = context.SystemAdmins.Count();
        var userCount = context.Users.Count();
        Console.WriteLine($"✅ Database context initialized - Found {adminCount} admins and {userCount} users");
    }
}
catch (Exception ex)
{
    Console.WriteLine($"❌ Database initialization error: {ex.Message}");
    Console.WriteLine($"Stack trace: {ex.StackTrace}");
    throw;
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// Use CORS
app.UseCors("AllowReactApp");

// Global logging and error handling middleware
app.Use(async (context, next) =>
{
    Console.WriteLine($"Incoming Request: {context.Request.Method} {context.Request.Path}");
    try
    {
        await next();
    }
    catch (Exception ex)
    {
        Console.WriteLine("--------------------------------------------------");
        Console.WriteLine($"🔥 UNHANDLED EXCEPTION: {ex.GetType().Name}");
        Console.WriteLine($"Message: {ex.Message}");
        Console.WriteLine($"Stack Trace: {ex.StackTrace}");
        if (ex.InnerException != null)
        {
            Console.WriteLine($"Inner Exception: {ex.InnerException.Message}");
            Console.WriteLine($"Inner Stack Trace: {ex.InnerException.StackTrace}");
        }
        Console.WriteLine("--------------------------------------------------");
        
        context.Response.StatusCode = 500;
        await context.Response.WriteAsJsonAsync(new { message = "An internal server error occurred.", details = ex.Message });
    }
});

// Use Authentication and Authorization
app.UseAuthentication();
app.UseAuthorization();

// Map controllers
app.MapControllers();

app.Run();

