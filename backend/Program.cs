using Microsoft.EntityFrameworkCore;
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
    
    // Log available environment variables for debugging
    Console.WriteLine("🔍 Database Configuration Debug Info:");
    Console.WriteLine($"  DB_HOST: {Environment.GetEnvironmentVariable("DB_HOST") ?? "(not set)"}");
    Console.WriteLine($"  PGHOST: {Environment.GetEnvironmentVariable("PGHOST") ?? "(not set)"}");
    Console.WriteLine($"  DB_PORT: {Environment.GetEnvironmentVariable("DB_PORT") ?? "(not set)"}");
    Console.WriteLine($"  PGPORT: {Environment.GetEnvironmentVariable("PGPORT") ?? "(not set)"}");
    Console.WriteLine($"  DB_NAME: {Environment.GetEnvironmentVariable("DB_NAME") ?? "(not set)"}");
    Console.WriteLine($"  PGDATABASE: {Environment.GetEnvironmentVariable("PGDATABASE") ?? "(not set)"}");
    Console.WriteLine($"  DATABASE_URL: {(string.IsNullOrEmpty(Environment.GetEnvironmentVariable("DATABASE_URL")) ? "(not set)" : "(set)")}");
    
    // Support both the application's DB_* names and Railway's standard PG* names.
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
            .AllowAnyOrigin() // Allow all origins (mobile apps don't send Origin header)
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

        // Test a simple query to ensure the context is working
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

// Serve static files from uploads directory
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(uploadsPath),
    RequestPath = "/uploads"
});

// Global logging and error handling middleware
app.Use(async (context, next) =>
{
    var logPath = Path.Combine(builder.Environment.ContentRootPath, "poe_error.log");
    var logMsg = $"[{DateTime.Now}] Incoming Request: {context.Request.Method} {context.Request.Path}{context.Request.QueryString}\n";
    Console.Write(logMsg);
    try { System.IO.File.AppendAllText(logPath, logMsg); } catch {}
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
        
        var errorMsg = $"[{DateTime.Now}] 🔥 UNHANDLED EXCEPTION: {ex.GetType().Name}: {ex.Message}\n{ex.StackTrace}\n\n";
        try { System.IO.File.AppendAllText(logPath, errorMsg); } catch {}
        
        context.Response.StatusCode = 500;
        await context.Response.WriteAsJsonAsync(new { message = "An internal server error occurred.", details = ex.Message });
    }
});

// Use Authentication and Authorization
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

