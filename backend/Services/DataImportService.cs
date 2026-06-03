using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using backend.Services.Interfaces;

namespace backend.Services
{
    public class DataImportService : IDataImportService
    {
        public async Task ImportDataFromLocalDatabaseAsync(string localConnectionString, string remoteConnectionString)
        {
            await ImportFromBackupFileAsync(@"..\db_backups\nbsnproject_postgres.sql", remoteConnectionString);
        }

        public async Task ImportFromBackupFileAsync(string backupFilePath, string remoteConnectionString)
        {
            Console.WriteLine("Starting import from backup file...");

            // Create remote DbContext
            var remoteOptions = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseNpgsql(remoteConnectionString, options => options.EnableRetryOnFailure(0))
                .Options;

            using var remoteContext = new ApplicationDbContext(remoteOptions);

            // Test connection
            Console.WriteLine("Testing remote database connection...");
            await remoteContext.Database.CanConnectAsync();
            Console.WriteLine("✅ Remote database connected successfully.");

            // Read SQL file
            Console.WriteLine($"Reading backup file: {backupFilePath}");
            // Get project root directory (go up from backend/bin/Debug/net9.0 to backend, then to root)
            var projectRoot = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));
            var fullPath = Path.GetFullPath(Path.Combine(projectRoot, "db_backups", "nbsnproject_postgres.sql"));
            Console.WriteLine($"Full path: {fullPath}");
            if (!File.Exists(fullPath))
            {
                throw new FileNotFoundException($"Backup file not found: {fullPath}");
            }

            var sqlContent = await File.ReadAllTextAsync(fullPath);
            Console.WriteLine("✅ Backup file read successfully.");

            // Split into individual statements (simple splitting by semicolon, skipping comments)
            var statements = SplitSqlStatements(sqlContent);
            Console.WriteLine($"Found {statements.Count} SQL statements to execute.");

            // Execute each statement
            int executed = 0;
            int errors = 0;
            foreach (var statement in statements)
            {
                if (string.IsNullOrWhiteSpace(statement))
                    continue;

                try
                {
                    await remoteContext.Database.ExecuteSqlRawAsync(statement);
                    executed++;
                    Console.Write($"\rExecuted {executed}/{statements.Count} statements...");
                }
                catch (Exception ex)
                {
                    errors++;
                    Console.WriteLine($"\n❌ Error executing statement: {ex.Message}");
                    // Continue on error to try to import as much as possible
                }
            }

            Console.WriteLine($"\n✅ Import completed! {executed} statements executed, {errors} errors.");
        }

        private List<string> SplitSqlStatements(string sql)
        {
            var statements = new List<string>();
            var currentStatement = "";
            var inString = false;
            var stringChar = '\0';
            var inComment = false;
            var inMultiLineComment = false;

            for (int i = 0; i < sql.Length; i++)
            {
                char c = sql[i];
                char next = i < sql.Length - 1 ? sql[i + 1] : '\0';

                if (inComment)
                {
                    if (c == '\n')
                    {
                        inComment = false;
                    }
                    continue;
                }

                if (inMultiLineComment)
                {
                    if (c == '*' && next == '/')
                    {
                        inMultiLineComment = false;
                        i++; // Skip '/'
                    }
                    continue;
                }

                if (inString)
                {
                    currentStatement += c;
                    if (c == stringChar && (i == 0 || sql[i - 1] != '\\'))
                    {
                        inString = false;
                    }
                    continue;
                }

                if (c == '-' && next == '-')
                {
                    inComment = true;
                    i++; // Skip '-'
                    continue;
                }

                if (c == '/' && next == '*')
                {
                    inMultiLineComment = true;
                    i++; // Skip '*'
                    continue;
                }

                if (c == '\'' || c == '"')
                {
                    inString = true;
                    stringChar = c;
                    currentStatement += c;
                    continue;
                }

                if (c == ';')
                {
                    statements.Add(currentStatement.Trim());
                    currentStatement = "";
                    continue;
                }

                currentStatement += c;
            }

            if (!string.IsNullOrWhiteSpace(currentStatement.Trim()))
            {
                statements.Add(currentStatement.Trim());
            }

            return statements;
        }

        [Obsolete("Use ImportFromBackupFileAsync instead")]
        private async Task ImportTableAsync<T>(ApplicationDbContext localContext, ApplicationDbContext remoteContext, DbSet<T> localSet, DbSet<T> remoteSet) where T : class
        {
            var tableName = typeof(T).Name;
            Console.WriteLine($"Importing {tableName}...");

            try
            {
                // Get all data from local
                var data = await localSet.AsNoTracking().ToListAsync();

                if (data.Any())
                {
                    // Add to remote context
                    remoteSet.AddRange(data);
                    await remoteContext.SaveChangesAsync();
                    Console.WriteLine($"   ✅ Imported {data.Count} records to {tableName}");
                }
                else
                {
                    Console.WriteLine($"   ℹ️ No records found in {tableName}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"   ❌ Failed to import {tableName}");
                Console.WriteLine($"   Error: {ex.Message}");
                Console.WriteLine($"   Stack Trace: {ex.StackTrace}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"   Inner Error: {ex.InnerException.Message}");
                    Console.WriteLine($"   Inner Stack Trace: {ex.InnerException.StackTrace}");
                }
                throw;
            }
        }
    }
}
