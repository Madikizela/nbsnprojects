using Microsoft.EntityFrameworkCore;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
using backend.Services;
using backend.Services.Interfaces;
using QuestPDF.Infrastructure;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using DotNetEnv;
using Npgsql;

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

// Configure Kestrel to listen on the PORT environment variable (Railway sets this)
// Default to 5213 for local development
var port = Environment.GetEnvironmentVariable("PORT") ?? "5213";
var portNumber = int.Parse(port);

Console.WriteLine($"🎯 Configuring server to listen on port {portNumber}");

builder.WebHost.ConfigureKestrel(serverOptions =>
{
    serverOptions.ListenAnyIP(portNumber); // Listen on the PORT env var or fallback to 5213
    
    // Increase timeouts for long-running operations like POE compilation
    serverOptions.Limits.KeepAliveTimeout = TimeSpan.FromMinutes(5);
    serverOptions.Limits.RequestHeadersTimeout = TimeSpan.FromMinutes(5);
    
    // Increase max request body size for file uploads
    serverOptions.Limits.MaxRequestBodySize = 100 * 1024 * 1024; // 100 MB
});

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

// Add database context (using PostgreSQL)
builder.Services.AddDbContext<backend.Models.ApplicationDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    
    var dbHost = Environment.GetEnvironmentVariable("DB_HOST") ?? Environment.GetEnvironmentVariable("PGHOST");
    var dbPort = Environment.GetEnvironmentVariable("DB_PORT") ?? Environment.GetEnvironmentVariable("PGPORT") ?? "5432";
    var dbName = Environment.GetEnvironmentVariable("DB_NAME") ?? Environment.GetEnvironmentVariable("PGDATABASE");
    var dbUser = Environment.GetEnvironmentVariable("DB_USER") ?? Environment.GetEnvironmentVariable("PGUSER");
    var dbPass = Environment.GetEnvironmentVariable("DB_PASS") ?? Environment.GetEnvironmentVariable("PGPASSWORD");
    var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");

    // Prefer DATABASE_URL if available (Railway provides this)
    if (!string.IsNullOrWhiteSpace(databaseUrl) && Uri.TryCreate(databaseUrl, UriKind.Absolute, out var databaseUri))
    {
        try
        {
            var userInfo = databaseUri.UserInfo.Split(':', 2);
            // Use SslMode.Prefer so it works on both Railway internal (.railway.internal, no SSL)
            // and external connections that may have SSL enabled.
            var isInternalHost = databaseUri.Host.EndsWith(".railway.internal");
            var railwayConnection = new NpgsqlConnectionStringBuilder
            {
                Host = databaseUri.Host,
                Port = databaseUri.Port > 0 ? databaseUri.Port : 5432,
                Database = databaseUri.AbsolutePath.TrimStart('/'),
                Username = userInfo.Length > 0 ? Uri.UnescapeDataString(userInfo[0]) : string.Empty,
                Password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : string.Empty,
                SslMode = isInternalHost ? SslMode.Disable : SslMode.Prefer
            };
            connectionString = railwayConnection.ConnectionString;
            Console.WriteLine("✅ Using DATABASE_URL connection string");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"⚠️ Failed to parse DATABASE_URL: {ex.Message}");
            // Fall through to manual construction
        }
    }
    
    // Fall back to manual construction from individual environment variables
    if (string.IsNullOrEmpty(connectionString) && !string.IsNullOrEmpty(dbHost) && !string.IsNullOrEmpty(dbName))
    {
        connectionString = $"Host={dbHost};Port={dbPort};Database={dbName};Username={dbUser};Password={dbPass}";
        Console.WriteLine($"✅ Using manual connection string from DB_* / PG* variables");
    }

    if (string.IsNullOrEmpty(connectionString))
    {
        throw new InvalidOperationException(
            "No database connection string configured. Set DATABASE_URL or provide DB_HOST, DB_NAME, DB_USER, and DB_PASS environment variables.");
    }

    Console.WriteLine($"📡 Database connection string configured for host: {dbHost ?? "(from DATABASE_URL)"}");

    options.UseNpgsql(connectionString, npgsqlOptions =>
       {
           npgsqlOptions.EnableRetryOnFailure(
               maxRetryCount: 3,
               maxRetryDelay: TimeSpan.FromSeconds(5),
               errorCodesToAdd: null);
       });
    // Only enable sensitive data logging in development — never in production
    if (builder.Environment.IsDevelopment())
    {
        options.EnableSensitiveDataLogging(true);
        options.EnableDetailedErrors(true);
    }
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

// Add HTTP clients
builder.Services.AddHttpClient("WhatsApp");
builder.Services.AddHttpClient("Resend");
builder.Services.AddScoped<IWhatsAppService, WhatsAppService>();

// Add SDP authorization service
builder.Services.AddScoped<ISDPAuthorizationService, SDPAuthorizationService>();

// Add daily attendance summary background service
builder.Services.AddHostedService<DailyAttendanceSummaryService>();

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
// Fail closed — no hardcoded fallback secret in production
var secretKey = Environment.GetEnvironmentVariable("JWT_SECRET")
    ?? jwtSettings["SecretKey"]
    ?? throw new InvalidOperationException("JWT_SECRET environment variable must be set.");
var issuer   = Environment.GetEnvironmentVariable("JWT_ISSUER")   ?? jwtSettings["Issuer"]   ?? "NBSNProjects";
var audience = Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? jwtSettings["Audience"] ?? "NBSNProjectsUsers";

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

// Rate limiting — strict on auth endpoints, general elsewhere
builder.Services.AddRateLimiter(options =>
{
    // Auth endpoints: 5 requests per 15 minutes per IP
    options.AddFixedWindowLimiter("auth", o =>
    {
        o.PermitLimit = 5;
        o.Window = TimeSpan.FromMinutes(15);
        o.QueueLimit = 0;
    });
    // General API: 300 requests per minute per IP
    options.AddFixedWindowLimiter("api", o =>
    {
        o.PermitLimit = 300;
        o.Window = TimeSpan.FromMinutes(1);
        o.QueueLimit = 0;
    });
    options.RejectionStatusCode = 429;
});

// Add CORS — explicit allow-list (mobile apps use custom schemes so AllowAnyOrigin is kept
// for the mobile-only entry point; web origins are locked down)
var allowedOrigins = new[]
{
    "https://nbsn-frontend-production.up.railway.app",
    "https://portal.nbsnprojects.co.za",
    "https://nbsn-frontend-production.up.railway.app",
    // Add any additional trusted web origins here
};

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        b => b
            .WithOrigins(allowedOrigins)
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials());

    // Separate open policy ONLY for mobile apps (no credentials)
    options.AddPolicy("AllowMobile",
        b => b
            .AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader());
});

var app = builder.Build();

// Add explicit database initialization and auto-migration (works on Railway and local)
try
{
    using (var scope = app.Services.CreateScope())
    {
        var context = scope.ServiceProvider.GetRequiredService<backend.Models.ApplicationDbContext>();

        // Create the database schema if it doesn't exist yet.
        // Use raw ADO.NET for the connection, then EnsureCreated for the full EF schema.
        Console.WriteLine("⏳ Checking database schema...");
        
        var conn = context.Database.GetDbConnection();
        await conn.OpenAsync();
        
        bool tablesExist = false;
        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'SystemAdmins' AND column_name = 'AccessLevel'";
            var result = await cmd.ExecuteScalarAsync();
            tablesExist = Convert.ToInt64(result) > 0;
        }
        Console.WriteLine($"  Schema is complete: {tablesExist}");
        
        if (!tablesExist)
        {
            Console.WriteLine("  Schema incomplete or missing — dropping partial tables and running EnsureCreated...");
            // Drop any partially-created tables so EnsureCreated starts fresh
            var dropTables = new[]
            {
                "SystemAdmins", "Users", "Clients", "SkillsDevelopmentProviders", "Departments",
                "OccupationalQualifications", "LegacyQualifications",
                "OccupationalUnitStandards", "LegacyUnitStandards"
            };
            foreach (var tbl in dropTables)
            {
                using (var cmd = conn.CreateCommand())
                {
                    cmd.CommandText = $"DROP TABLE IF EXISTS \"{tbl}\" CASCADE";
                    await cmd.ExecuteNonQueryAsync();
                }
            }
            Console.WriteLine("  Dropped partial tables, running EnsureCreated...");
        }
        
        await conn.CloseAsync();
        
        if (!tablesExist)
        {
            // EnsureCreated + EF retry wrappers don't work reliably on fresh Railway DBs.
            // Use raw ADO.NET to run the full CREATE TABLE statements directly.
            Console.WriteLine("  Creating full schema via raw SQL...");
            var conn3 = context.Database.GetDbConnection();
            if (conn3.State != System.Data.ConnectionState.Open)
                await conn3.OpenAsync();

            // Generate the CREATE TABLE SQL from EF model
            var createScript = context.Database.GenerateCreateScript();
            Console.WriteLine($"  Generated SQL script length: {createScript.Length} chars");
            
            using (var cmd = conn3.CreateCommand())
            {
                cmd.CommandText = createScript;
                cmd.CommandTimeout = 120;
                await cmd.ExecuteNonQueryAsync();
            }
            Console.WriteLine("✅ Schema created via GenerateCreateScript");
            
            // Verify
            using (var cmd = conn3.CreateCommand())
            {
                cmd.CommandText = "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'";
                var count = await cmd.ExecuteScalarAsync();
                Console.WriteLine($"✅ Total tables now: {count}");
            }
            await conn3.CloseAsync();
        }
        else
        {
            Console.WriteLine("✅ Database schema already complete");
        }

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

            // ── Safe column migrations — ADD COLUMN IF NOT EXISTS ───────────────
        // These run on every startup but are no-ops when the column already exists.
        Console.WriteLine("⏳ Running safe column migrations...");
        var migrationConn = context.Database.GetDbConnection();
        if (migrationConn.State != System.Data.ConnectionState.Open)
            await migrationConn.OpenAsync();

        var columnMigrations = new[]
        {
            // Users table — new columns added in feature batch
            "ALTER TABLE \"Users\" ADD COLUMN IF NOT EXISTS \"MustChangePassword\" boolean NOT NULL DEFAULT false",
            "ALTER TABLE \"Users\" ADD COLUMN IF NOT EXISTS \"LastLoginAt\" timestamptz NULL",
            // AdminAuditLogs table
            @"CREATE TABLE IF NOT EXISTS ""admin_audit_logs"" (
                ""Id"" serial PRIMARY KEY,
                ""PerformedBy"" varchar(200) NOT NULL DEFAULT 'System',
                ""Action"" varchar(100) NOT NULL,
                ""Description"" varchar(1000) NOT NULL DEFAULT '',
                ""EntityType"" varchar(50) NOT NULL DEFAULT '',
                ""EntityId"" integer NULL,
                ""EntityName"" varchar(200) NOT NULL DEFAULT '',
                ""Metadata"" varchar(2000) NULL,
                ""CreatedAt"" timestamptz NOT NULL DEFAULT NOW()
            )",
            // Notifications table
            @"CREATE TABLE IF NOT EXISTS ""notifications"" (
                ""Id"" serial PRIMARY KEY,
                ""UserId"" integer NULL,
                ""Type"" varchar(50) NOT NULL DEFAULT 'GENERAL',
                ""Title"" varchar(200) NOT NULL,
                ""Message"" varchar(1000) NOT NULL,
                ""ActionUrl"" varchar(500) NULL,
                ""Metadata"" varchar(2000) NULL,
                ""IsRead"" boolean NOT NULL DEFAULT false,
                ""CreatedAt"" timestamptz NOT NULL DEFAULT NOW(),
                ""ReadAt"" timestamptz NULL
            )",
            // LearnerDocument expiry columns
            "ALTER TABLE \"LearnerDocuments\" ADD COLUMN IF NOT EXISTS \"ExpiryDate\" timestamptz NULL",
            "ALTER TABLE \"LearnerDocuments\" ADD COLUMN IF NOT EXISTS \"ExpiryAlertSent\" boolean NOT NULL DEFAULT false",
            // Budget tables
            @"CREATE TABLE IF NOT EXISTS ""project_budget_phases"" (
                ""Id"" serial PRIMARY KEY,
                ""ProjectId"" integer NOT NULL,
                ""Name"" varchar(100) NOT NULL,
                ""Description"" varchar(500) NULL,
                ""AllocatedBudget"" numeric(18,2) NOT NULL DEFAULT 0,
                ""SpentBudget"" numeric(18,2) NOT NULL DEFAULT 0,
                ""StartDate"" varchar(20) NULL,
                ""EndDate"" varchar(20) NULL,
                ""PhaseOrder"" integer NOT NULL DEFAULT 1,
                ""CreatedAt"" timestamptz NOT NULL DEFAULT NOW(),
                ""UpdatedAt"" timestamptz NOT NULL DEFAULT NOW()
            )",
            @"CREATE TABLE IF NOT EXISTS ""project_budget_line_items"" (
                ""Id"" serial PRIMARY KEY,
                ""PhaseId"" integer NOT NULL,
                ""Category"" varchar(100) NOT NULL,
                ""Description"" varchar(500) NOT NULL,
                ""AllocatedAmount"" numeric(18,2) NOT NULL DEFAULT 0,
                ""SpentAmount"" numeric(18,2) NOT NULL DEFAULT 0,
                ""IsPerLearner"" boolean NOT NULL DEFAULT false,
                ""CostPerLearner"" numeric(18,2) NULL,
                ""LearnersCount"" integer NULL,
                ""IsEditable"" boolean NOT NULL DEFAULT true,
                ""CreatedAt"" timestamptz NOT NULL DEFAULT NOW(),
                ""UpdatedAt"" timestamptz NOT NULL DEFAULT NOW()
            )",
            // Generated Documents table
            @"CREATE TABLE IF NOT EXISTS ""generated_documents"" (
                ""Id"" serial PRIMARY KEY,
                ""DocumentType"" varchar(20) NOT NULL,
                ""DocumentTitle"" varchar(200) NOT NULL,
                ""ReferenceNumber"" varchar(100) NOT NULL DEFAULT '',
                ""ClientName"" varchar(200) NOT NULL DEFAULT '',
                ""FormDataJson"" text NOT NULL,
                ""PdfBase64"" text NULL,
                ""GeneratedByUserId"" integer NULL,
                ""GeneratedAt"" timestamptz NOT NULL DEFAULT NOW(),
                ""Status"" varchar(50) NOT NULL DEFAULT 'Draft'
            )",

            // ── Soft Delete columns ───────────────────────────────────────────
            // All use IF NOT EXISTS so they are safe to run on every deploy.
            // User Management
            "ALTER TABLE \"Users\" ADD COLUMN IF NOT EXISTS \"IsDeleted\" boolean NOT NULL DEFAULT false",
            "ALTER TABLE \"Users\" ADD COLUMN IF NOT EXISTS \"DeletedAt\" timestamptz NULL",
            "ALTER TABLE \"Users\" ADD COLUMN IF NOT EXISTS \"DeletedByUserId\" integer NULL",
            "ALTER TABLE \"SystemAdmins\" ADD COLUMN IF NOT EXISTS \"IsDeleted\" boolean NOT NULL DEFAULT false",
            "ALTER TABLE \"SystemAdmins\" ADD COLUMN IF NOT EXISTS \"DeletedAt\" timestamptz NULL",
            "ALTER TABLE \"SystemAdmins\" ADD COLUMN IF NOT EXISTS \"DeletedByUserId\" integer NULL",
            "ALTER TABLE \"Clients\" ADD COLUMN IF NOT EXISTS \"IsDeleted\" boolean NOT NULL DEFAULT false",
            "ALTER TABLE \"Clients\" ADD COLUMN IF NOT EXISTS \"DeletedAt\" timestamptz NULL",
            "ALTER TABLE \"Clients\" ADD COLUMN IF NOT EXISTS \"DeletedByUserId\" integer NULL",
            "ALTER TABLE \"SkillsDevelopmentProviders\" ADD COLUMN IF NOT EXISTS \"IsDeleted\" boolean NOT NULL DEFAULT false",
            "ALTER TABLE \"SkillsDevelopmentProviders\" ADD COLUMN IF NOT EXISTS \"DeletedAt\" timestamptz NULL",
            "ALTER TABLE \"SkillsDevelopmentProviders\" ADD COLUMN IF NOT EXISTS \"DeletedByUserId\" integer NULL",
            "ALTER TABLE \"Departments\" ADD COLUMN IF NOT EXISTS \"IsDeleted\" boolean NOT NULL DEFAULT false",
            "ALTER TABLE \"Departments\" ADD COLUMN IF NOT EXISTS \"DeletedAt\" timestamptz NULL",
            "ALTER TABLE \"Departments\" ADD COLUMN IF NOT EXISTS \"DeletedByUserId\" integer NULL",
            // LMS
            "ALTER TABLE \"Courses\" ADD COLUMN IF NOT EXISTS \"IsDeleted\" boolean NOT NULL DEFAULT false",
            "ALTER TABLE \"Courses\" ADD COLUMN IF NOT EXISTS \"DeletedAt\" timestamptz NULL",
            "ALTER TABLE \"Courses\" ADD COLUMN IF NOT EXISTS \"DeletedByUserId\" integer NULL",
            "ALTER TABLE \"Modules\" ADD COLUMN IF NOT EXISTS \"IsDeleted\" boolean NOT NULL DEFAULT false",
            "ALTER TABLE \"Modules\" ADD COLUMN IF NOT EXISTS \"DeletedAt\" timestamptz NULL",
            "ALTER TABLE \"Modules\" ADD COLUMN IF NOT EXISTS \"DeletedByUserId\" integer NULL",
            "ALTER TABLE \"Lessons\" ADD COLUMN IF NOT EXISTS \"IsDeleted\" boolean NOT NULL DEFAULT false",
            "ALTER TABLE \"Lessons\" ADD COLUMN IF NOT EXISTS \"DeletedAt\" timestamptz NULL",
            "ALTER TABLE \"Lessons\" ADD COLUMN IF NOT EXISTS \"DeletedByUserId\" integer NULL",
            "ALTER TABLE \"LearningMaterials\" ADD COLUMN IF NOT EXISTS \"IsDeleted\" boolean NOT NULL DEFAULT false",
            "ALTER TABLE \"LearningMaterials\" ADD COLUMN IF NOT EXISTS \"DeletedAt\" timestamptz NULL",
            "ALTER TABLE \"LearningMaterials\" ADD COLUMN IF NOT EXISTS \"DeletedByUserId\" integer NULL",
            // Documents
            "ALTER TABLE \"Documents\" ADD COLUMN IF NOT EXISTS \"IsDeleted\" boolean NOT NULL DEFAULT false",
            "ALTER TABLE \"Documents\" ADD COLUMN IF NOT EXISTS \"DeletedAt\" timestamptz NULL",
            "ALTER TABLE \"Documents\" ADD COLUMN IF NOT EXISTS \"DeletedByUserId\" integer NULL",
            "ALTER TABLE \"LearnerDocuments\" ADD COLUMN IF NOT EXISTS \"IsDeleted\" boolean NOT NULL DEFAULT false",
            "ALTER TABLE \"LearnerDocuments\" ADD COLUMN IF NOT EXISTS \"DeletedAt\" timestamptz NULL",
            "ALTER TABLE \"LearnerDocuments\" ADD COLUMN IF NOT EXISTS \"DeletedByUserId\" integer NULL",
            "ALTER TABLE \"GeneratedDocuments\" ADD COLUMN IF NOT EXISTS \"IsDeleted\" boolean NOT NULL DEFAULT false",
            "ALTER TABLE \"GeneratedDocuments\" ADD COLUMN IF NOT EXISTS \"DeletedAt\" timestamptz NULL",
            "ALTER TABLE \"GeneratedDocuments\" ADD COLUMN IF NOT EXISTS \"DeletedByUserId\" integer NULL",
            // Projects
            "ALTER TABLE \"Projects\" ADD COLUMN IF NOT EXISTS \"IsDeleted\" boolean NOT NULL DEFAULT false",
            "ALTER TABLE \"Projects\" ADD COLUMN IF NOT EXISTS \"DeletedAt\" timestamptz NULL",
            "ALTER TABLE \"Projects\" ADD COLUMN IF NOT EXISTS \"DeletedByUserId\" integer NULL",
            "ALTER TABLE \"ProjectAssignments\" ADD COLUMN IF NOT EXISTS \"IsDeleted\" boolean NOT NULL DEFAULT false",
            "ALTER TABLE \"ProjectAssignments\" ADD COLUMN IF NOT EXISTS \"DeletedAt\" timestamptz NULL",
            "ALTER TABLE \"ProjectAssignments\" ADD COLUMN IF NOT EXISTS \"DeletedByUserId\" integer NULL",
            "ALTER TABLE \"ProjectPhases\" ADD COLUMN IF NOT EXISTS \"IsDeleted\" boolean NOT NULL DEFAULT false",
            "ALTER TABLE \"ProjectPhases\" ADD COLUMN IF NOT EXISTS \"DeletedAt\" timestamptz NULL",
            "ALTER TABLE \"ProjectPhases\" ADD COLUMN IF NOT EXISTS \"DeletedByUserId\" integer NULL",
            "ALTER TABLE \"ProjectSites\" ADD COLUMN IF NOT EXISTS \"IsDeleted\" boolean NOT NULL DEFAULT false",
            "ALTER TABLE \"ProjectSites\" ADD COLUMN IF NOT EXISTS \"DeletedAt\" timestamptz NULL",
            "ALTER TABLE \"ProjectSites\" ADD COLUMN IF NOT EXISTS \"DeletedByUserId\" integer NULL",
            "ALTER TABLE \"ProjectQualifications\" ADD COLUMN IF NOT EXISTS \"IsDeleted\" boolean NOT NULL DEFAULT false",
            "ALTER TABLE \"ProjectQualifications\" ADD COLUMN IF NOT EXISTS \"DeletedAt\" timestamptz NULL",
            "ALTER TABLE \"ProjectQualifications\" ADD COLUMN IF NOT EXISTS \"DeletedByUserId\" integer NULL",
            "ALTER TABLE \"ProjectQualificationUnitStandards\" ADD COLUMN IF NOT EXISTS \"IsDeleted\" boolean NOT NULL DEFAULT false",
            "ALTER TABLE \"ProjectQualificationUnitStandards\" ADD COLUMN IF NOT EXISTS \"DeletedAt\" timestamptz NULL",
            "ALTER TABLE \"ProjectQualificationUnitStandards\" ADD COLUMN IF NOT EXISTS \"DeletedByUserId\" integer NULL",
            "ALTER TABLE \"LearningPathways\" ADD COLUMN IF NOT EXISTS \"IsDeleted\" boolean NOT NULL DEFAULT false",
            "ALTER TABLE \"LearningPathways\" ADD COLUMN IF NOT EXISTS \"DeletedAt\" timestamptz NULL",
            "ALTER TABLE \"LearningPathways\" ADD COLUMN IF NOT EXISTS \"DeletedByUserId\" integer NULL",
            "ALTER TABLE \"ProjectLearningPathways\" ADD COLUMN IF NOT EXISTS \"IsDeleted\" boolean NOT NULL DEFAULT false",
            "ALTER TABLE \"ProjectLearningPathways\" ADD COLUMN IF NOT EXISTS \"DeletedAt\" timestamptz NULL",
            "ALTER TABLE \"ProjectLearningPathways\" ADD COLUMN IF NOT EXISTS \"DeletedByUserId\" integer NULL",
            "ALTER TABLE \"QualificationTypes\" ADD COLUMN IF NOT EXISTS \"IsDeleted\" boolean NOT NULL DEFAULT false",
            "ALTER TABLE \"QualificationTypes\" ADD COLUMN IF NOT EXISTS \"DeletedAt\" timestamptz NULL",
            "ALTER TABLE \"QualificationTypes\" ADD COLUMN IF NOT EXISTS \"DeletedByUserId\" integer NULL",
            "ALTER TABLE \"ProjectPhaseQualifications\" ADD COLUMN IF NOT EXISTS \"IsDeleted\" boolean NOT NULL DEFAULT false",
            "ALTER TABLE \"ProjectPhaseQualifications\" ADD COLUMN IF NOT EXISTS \"DeletedAt\" timestamptz NULL",
            "ALTER TABLE \"ProjectPhaseQualifications\" ADD COLUMN IF NOT EXISTS \"DeletedByUserId\" integer NULL",
            "ALTER TABLE \"ProjectPhaseLearningPathways\" ADD COLUMN IF NOT EXISTS \"IsDeleted\" boolean NOT NULL DEFAULT false",
            "ALTER TABLE \"ProjectPhaseLearningPathways\" ADD COLUMN IF NOT EXISTS \"DeletedAt\" timestamptz NULL",
            "ALTER TABLE \"ProjectPhaseLearningPathways\" ADD COLUMN IF NOT EXISTS \"DeletedByUserId\" integer NULL",
            "ALTER TABLE \"PhaseActivities\" ADD COLUMN IF NOT EXISTS \"IsDeleted\" boolean NOT NULL DEFAULT false",
            "ALTER TABLE \"PhaseActivities\" ADD COLUMN IF NOT EXISTS \"DeletedAt\" timestamptz NULL",
            "ALTER TABLE \"PhaseActivities\" ADD COLUMN IF NOT EXISTS \"DeletedByUserId\" integer NULL",
            "ALTER TABLE \"PhaseSubActivities\" ADD COLUMN IF NOT EXISTS \"IsDeleted\" boolean NOT NULL DEFAULT false",
            "ALTER TABLE \"PhaseSubActivities\" ADD COLUMN IF NOT EXISTS \"DeletedAt\" timestamptz NULL",
            "ALTER TABLE \"PhaseSubActivities\" ADD COLUMN IF NOT EXISTS \"DeletedByUserId\" integer NULL",
            "ALTER TABLE \"ProjectBudgetPhases\" ADD COLUMN IF NOT EXISTS \"IsDeleted\" boolean NOT NULL DEFAULT false",
            "ALTER TABLE \"ProjectBudgetPhases\" ADD COLUMN IF NOT EXISTS \"DeletedAt\" timestamptz NULL",
            "ALTER TABLE \"ProjectBudgetPhases\" ADD COLUMN IF NOT EXISTS \"DeletedByUserId\" integer NULL",
            "ALTER TABLE \"ProjectBudgetLineItems\" ADD COLUMN IF NOT EXISTS \"IsDeleted\" boolean NOT NULL DEFAULT false",
            "ALTER TABLE \"ProjectBudgetLineItems\" ADD COLUMN IF NOT EXISTS \"DeletedAt\" timestamptz NULL",
            "ALTER TABLE \"ProjectBudgetLineItems\" ADD COLUMN IF NOT EXISTS \"DeletedByUserId\" integer NULL",
            // Tasks
            "ALTER TABLE \"Tasks\" ADD COLUMN IF NOT EXISTS \"IsDeleted\" boolean NOT NULL DEFAULT false",
            "ALTER TABLE \"Tasks\" ADD COLUMN IF NOT EXISTS \"DeletedAt\" timestamptz NULL",
            "ALTER TABLE \"Tasks\" ADD COLUMN IF NOT EXISTS \"DeletedByUserId\" integer NULL",
            "ALTER TABLE \"TaskReminders\" ADD COLUMN IF NOT EXISTS \"IsDeleted\" boolean NOT NULL DEFAULT false",
            "ALTER TABLE \"TaskReminders\" ADD COLUMN IF NOT EXISTS \"DeletedAt\" timestamptz NULL",
            "ALTER TABLE \"TaskReminders\" ADD COLUMN IF NOT EXISTS \"DeletedByUserId\" integer NULL",
            // Qualifications
            "ALTER TABLE \"OccupationalQualifications\" ADD COLUMN IF NOT EXISTS \"IsDeleted\" boolean NOT NULL DEFAULT false",
            "ALTER TABLE \"OccupationalQualifications\" ADD COLUMN IF NOT EXISTS \"DeletedAt\" timestamptz NULL",
            "ALTER TABLE \"OccupationalQualifications\" ADD COLUMN IF NOT EXISTS \"DeletedByUserId\" integer NULL",
            "ALTER TABLE \"LegacyQualifications\" ADD COLUMN IF NOT EXISTS \"IsDeleted\" boolean NOT NULL DEFAULT false",
            "ALTER TABLE \"LegacyQualifications\" ADD COLUMN IF NOT EXISTS \"DeletedAt\" timestamptz NULL",
            "ALTER TABLE \"LegacyQualifications\" ADD COLUMN IF NOT EXISTS \"DeletedByUserId\" integer NULL",
            "ALTER TABLE \"OccupationalUnitStandards\" ADD COLUMN IF NOT EXISTS \"IsDeleted\" boolean NOT NULL DEFAULT false",
            "ALTER TABLE \"OccupationalUnitStandards\" ADD COLUMN IF NOT EXISTS \"DeletedAt\" timestamptz NULL",
            "ALTER TABLE \"OccupationalUnitStandards\" ADD COLUMN IF NOT EXISTS \"DeletedByUserId\" integer NULL",
            "ALTER TABLE \"LegacyUnitStandards\" ADD COLUMN IF NOT EXISTS \"IsDeleted\" boolean NOT NULL DEFAULT false",
            "ALTER TABLE \"LegacyUnitStandards\" ADD COLUMN IF NOT EXISTS \"DeletedAt\" timestamptz NULL",
            "ALTER TABLE \"LegacyUnitStandards\" ADD COLUMN IF NOT EXISTS \"DeletedByUserId\" integer NULL",
            // Assessments
            "ALTER TABLE \"FormativeAssessments\" ADD COLUMN IF NOT EXISTS \"IsDeleted\" boolean NOT NULL DEFAULT false",
            "ALTER TABLE \"FormativeAssessments\" ADD COLUMN IF NOT EXISTS \"DeletedAt\" timestamptz NULL",
            "ALTER TABLE \"FormativeAssessments\" ADD COLUMN IF NOT EXISTS \"DeletedByUserId\" integer NULL",
            "ALTER TABLE \"SummativeAssessments\" ADD COLUMN IF NOT EXISTS \"IsDeleted\" boolean NOT NULL DEFAULT false",
            "ALTER TABLE \"SummativeAssessments\" ADD COLUMN IF NOT EXISTS \"DeletedAt\" timestamptz NULL",
            "ALTER TABLE \"SummativeAssessments\" ADD COLUMN IF NOT EXISTS \"DeletedByUserId\" integer NULL",
            "ALTER TABLE \"FormativeAssessmentQuestions\" ADD COLUMN IF NOT EXISTS \"IsDeleted\" boolean NOT NULL DEFAULT false",
            "ALTER TABLE \"FormativeAssessmentQuestions\" ADD COLUMN IF NOT EXISTS \"DeletedAt\" timestamptz NULL",
            "ALTER TABLE \"FormativeAssessmentQuestions\" ADD COLUMN IF NOT EXISTS \"DeletedByUserId\" integer NULL",
            "ALTER TABLE \"SummativeAssessmentQuestions\" ADD COLUMN IF NOT EXISTS \"IsDeleted\" boolean NOT NULL DEFAULT false",
            "ALTER TABLE \"SummativeAssessmentQuestions\" ADD COLUMN IF NOT EXISTS \"DeletedAt\" timestamptz NULL",
            "ALTER TABLE \"SummativeAssessmentQuestions\" ADD COLUMN IF NOT EXISTS \"DeletedByUserId\" integer NULL",
            "ALTER TABLE \"AssessmentStrategyPlans\" ADD COLUMN IF NOT EXISTS \"IsDeleted\" boolean NOT NULL DEFAULT false",
            "ALTER TABLE \"AssessmentStrategyPlans\" ADD COLUMN IF NOT EXISTS \"DeletedAt\" timestamptz NULL",
            "ALTER TABLE \"AssessmentStrategyPlans\" ADD COLUMN IF NOT EXISTS \"DeletedByUserId\" integer NULL",
            "ALTER TABLE \"LogbookEntries\" ADD COLUMN IF NOT EXISTS \"IsDeleted\" boolean NOT NULL DEFAULT false",
            "ALTER TABLE \"LogbookEntries\" ADD COLUMN IF NOT EXISTS \"DeletedAt\" timestamptz NULL",
            "ALTER TABLE \"LogbookEntries\" ADD COLUMN IF NOT EXISTS \"DeletedByUserId\" integer NULL",
            "ALTER TABLE \"LearnerAssessmentAnswers\" ADD COLUMN IF NOT EXISTS \"IsDeleted\" boolean NOT NULL DEFAULT false",
            "ALTER TABLE \"LearnerAssessmentAnswers\" ADD COLUMN IF NOT EXISTS \"DeletedAt\" timestamptz NULL",
            "ALTER TABLE \"LearnerAssessmentAnswers\" ADD COLUMN IF NOT EXISTS \"DeletedByUserId\" integer NULL",
            "ALTER TABLE \"LearnerAssessmentProgress\" ADD COLUMN IF NOT EXISTS \"IsDeleted\" boolean NOT NULL DEFAULT false",
            "ALTER TABLE \"LearnerAssessmentProgress\" ADD COLUMN IF NOT EXISTS \"DeletedAt\" timestamptz NULL",
            "ALTER TABLE \"LearnerAssessmentProgress\" ADD COLUMN IF NOT EXISTS \"DeletedByUserId\" integer NULL",
            "ALTER TABLE \"AssessmentTypes\" ADD COLUMN IF NOT EXISTS \"IsDeleted\" boolean NOT NULL DEFAULT false",
            "ALTER TABLE \"AssessmentTypes\" ADD COLUMN IF NOT EXISTS \"DeletedAt\" timestamptz NULL",
            "ALTER TABLE \"AssessmentTypes\" ADD COLUMN IF NOT EXISTS \"DeletedByUserId\" integer NULL",
            "ALTER TABLE \"UnitStandardAssessments\" ADD COLUMN IF NOT EXISTS \"IsDeleted\" boolean NOT NULL DEFAULT false",
            "ALTER TABLE \"UnitStandardAssessments\" ADD COLUMN IF NOT EXISTS \"DeletedAt\" timestamptz NULL",
            "ALTER TABLE \"UnitStandardAssessments\" ADD COLUMN IF NOT EXISTS \"DeletedByUserId\" integer NULL",
            "ALTER TABLE \"AssessmentQuestions\" ADD COLUMN IF NOT EXISTS \"IsDeleted\" boolean NOT NULL DEFAULT false",
            "ALTER TABLE \"AssessmentQuestions\" ADD COLUMN IF NOT EXISTS \"DeletedAt\" timestamptz NULL",
            "ALTER TABLE \"AssessmentQuestions\" ADD COLUMN IF NOT EXISTS \"DeletedByUserId\" integer NULL",
            // Site / Learner management
            "ALTER TABLE \"SiteClasses\" ADD COLUMN IF NOT EXISTS \"IsDeleted\" boolean NOT NULL DEFAULT false",
            "ALTER TABLE \"SiteClasses\" ADD COLUMN IF NOT EXISTS \"DeletedAt\" timestamptz NULL",
            "ALTER TABLE \"SiteClasses\" ADD COLUMN IF NOT EXISTS \"DeletedByUserId\" integer NULL",
            "ALTER TABLE \"Learners\" ADD COLUMN IF NOT EXISTS \"IsDeleted\" boolean NOT NULL DEFAULT false",
            "ALTER TABLE \"Learners\" ADD COLUMN IF NOT EXISTS \"DeletedAt\" timestamptz NULL",
            "ALTER TABLE \"Learners\" ADD COLUMN IF NOT EXISTS \"DeletedByUserId\" integer NULL",
            "ALTER TABLE \"ClassEnrollments\" ADD COLUMN IF NOT EXISTS \"IsDeleted\" boolean NOT NULL DEFAULT false",
            "ALTER TABLE \"ClassEnrollments\" ADD COLUMN IF NOT EXISTS \"DeletedAt\" timestamptz NULL",
            "ALTER TABLE \"ClassEnrollments\" ADD COLUMN IF NOT EXISTS \"DeletedByUserId\" integer NULL",
            "ALTER TABLE \"ClassTeachers\" ADD COLUMN IF NOT EXISTS \"IsDeleted\" boolean NOT NULL DEFAULT false",
            "ALTER TABLE \"ClassTeachers\" ADD COLUMN IF NOT EXISTS \"DeletedAt\" timestamptz NULL",
            "ALTER TABLE \"ClassTeachers\" ADD COLUMN IF NOT EXISTS \"DeletedByUserId\" integer NULL",
            // Attendance
            "ALTER TABLE \"LearnerAttendances\" ADD COLUMN IF NOT EXISTS \"IsDeleted\" boolean NOT NULL DEFAULT false",
            "ALTER TABLE \"LearnerAttendances\" ADD COLUMN IF NOT EXISTS \"DeletedAt\" timestamptz NULL",
            "ALTER TABLE \"LearnerAttendances\" ADD COLUMN IF NOT EXISTS \"DeletedByUserId\" integer NULL",
            "ALTER TABLE \"AttendanceLogs\" ADD COLUMN IF NOT EXISTS \"IsDeleted\" boolean NOT NULL DEFAULT false",
            "ALTER TABLE \"AttendanceLogs\" ADD COLUMN IF NOT EXISTS \"DeletedAt\" timestamptz NULL",
            "ALTER TABLE \"AttendanceLogs\" ADD COLUMN IF NOT EXISTS \"DeletedByUserId\" integer NULL",
            "ALTER TABLE \"SickNotes\" ADD COLUMN IF NOT EXISTS \"IsDeleted\" boolean NOT NULL DEFAULT false",
            "ALTER TABLE \"SickNotes\" ADD COLUMN IF NOT EXISTS \"DeletedAt\" timestamptz NULL",
            "ALTER TABLE \"SickNotes\" ADD COLUMN IF NOT EXISTS \"DeletedByUserId\" integer NULL",
            // Other
            "ALTER TABLE \"Announcements\" ADD COLUMN IF NOT EXISTS \"IsDeleted\" boolean NOT NULL DEFAULT false",
            "ALTER TABLE \"Announcements\" ADD COLUMN IF NOT EXISTS \"DeletedAt\" timestamptz NULL",
            "ALTER TABLE \"Announcements\" ADD COLUMN IF NOT EXISTS \"DeletedByUserId\" integer NULL",
            "ALTER TABLE \"ExternalUserAccess\" ADD COLUMN IF NOT EXISTS \"IsDeleted\" boolean NOT NULL DEFAULT false",
            "ALTER TABLE \"ExternalUserAccess\" ADD COLUMN IF NOT EXISTS \"DeletedAt\" timestamptz NULL",
            "ALTER TABLE \"ExternalUserAccess\" ADD COLUMN IF NOT EXISTS \"DeletedByUserId\" integer NULL",
            "ALTER TABLE \"Notifications\" ADD COLUMN IF NOT EXISTS \"IsDeleted\" boolean NOT NULL DEFAULT false",
            "ALTER TABLE \"Notifications\" ADD COLUMN IF NOT EXISTS \"DeletedAt\" timestamptz NULL",
            "ALTER TABLE \"Notifications\" ADD COLUMN IF NOT EXISTS \"DeletedByUserId\" integer NULL",
            "ALTER TABLE \"AdminAuditLogs\" ADD COLUMN IF NOT EXISTS \"IsDeleted\" boolean NOT NULL DEFAULT false",
            "ALTER TABLE \"AdminAuditLogs\" ADD COLUMN IF NOT EXISTS \"DeletedAt\" timestamptz NULL",
            "ALTER TABLE \"AdminAuditLogs\" ADD COLUMN IF NOT EXISTS \"DeletedByUserId\" integer NULL"
            // ── end soft delete columns ────────────────────────────────────────
        };

        foreach (var sql in columnMigrations)
        {
            try
            {
                using var cmd = migrationConn.CreateCommand();
                cmd.CommandText = sql;
                await cmd.ExecuteNonQueryAsync();
            }
            catch (Exception migEx)
            {
                Console.WriteLine($"⚠️ Migration warning (non-fatal): {migEx.Message}");
            }
        }
        Console.WriteLine("✅ Column migrations complete");

        var adminCount = context.SystemAdmins.Count();
        var userCount = context.Users.Count();
        Console.WriteLine($"✅ Database context initialized - Found {adminCount} admins and {userCount} users");
    }
}
catch (Exception ex)
{
    // Log but do NOT crash — allow the app to start so /health is reachable.
    // DB errors are retried on the next request.
    Console.WriteLine($"⚠️ Database initialization warning: {ex.Message}");
    Console.WriteLine($"Stack trace: {ex.StackTrace}");
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// Use CORS
app.UseCors("AllowReactApp");

// Create uploads directory if it doesn't exist
var uploadsPath = Path.Combine(builder.Environment.ContentRootPath, "uploads");
if (!Directory.Exists(uploadsPath))
{
    Directory.CreateDirectory(uploadsPath);
    Console.WriteLine($"✅ Created uploads directory: {uploadsPath}");
}
else
{
    Console.WriteLine($"✅ Uploads directory exists: {uploadsPath}");
}

// NOTE: /uploads is NOT served as static files — documents must be accessed
// through the authenticated download endpoints only (security hardening H-1).

// Global error handler — never return internal exception details to clients
app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (Exception ex)
    {
        var correlationId = Guid.NewGuid().ToString("N")[..8];
        var logger = context.RequestServices.GetService<ILogger<Program>>();
        logger?.LogError(ex, "Unhandled exception [{CorrelationId}]: {Path}", correlationId, context.Request.Path);

        context.Response.StatusCode = 500;
        await context.Response.WriteAsJsonAsync(new
        {
            message = "An internal server error occurred.",
            correlationId   // Caller can reference this in support requests
        });
    }
});

// Use Authentication and Authorization
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

// Health check endpoint (used by Railway healthcheck)
app.MapGet("/health", async (backend.Models.ApplicationDbContext dbCtx) => {
    try {
        await dbCtx.Database.CanConnectAsync();
        return Results.Ok(new { status = "healthy", db = "connected", timestamp = DateTime.UtcNow });
    } catch (Exception ex) {
        return Results.Ok(new { status = "healthy", db = "unreachable", error = ex.Message, timestamp = DateTime.UtcNow });
    }
});

// Map controllers
app.MapControllers();

app.Run();

