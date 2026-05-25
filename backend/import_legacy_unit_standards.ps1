# PowerShell script to import legacy unit standards into SQLite database

$dbPath = "skills_development.db"
$sqlFile = "legacy_unit_standards_inserts.sql"

Write-Host "Starting legacy unit standards import..."

# Check if database exists
if (-not (Test-Path $dbPath)) {
    Write-Host "Error: Database $dbPath not found!" -ForegroundColor Red
    exit 1
}

# Check if SQL file exists
if (-not (Test-Path $sqlFile)) {
    Write-Host "Error: SQL file $sqlFile not found!" -ForegroundColor Red
    exit 1
}

# Create LegacyUnitStandard table if it doesn't exist
$createTableSQL = @"
CREATE TABLE IF NOT EXISTS LegacyUnitStandard (
    id INTEGER PRIMARY KEY,
    unitStandardId INTEGER,
    qualificationId INTEGER,
    unitStandardName TEXT,
    level TEXT,
    credits INTEGER,
    synced INTEGER
);
"@

Write-Host "Creating LegacyUnitStandard table if needed..."
sqlite3 $dbPath $createTableSQL

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error creating table!" -ForegroundColor Red
    exit 1
}

# Read SQL file and execute INSERT statements
Write-Host "Reading SQL file and executing INSERT statements..."

# Count total lines first
$totalLines = (Get-Content $sqlFile).Count
Write-Host "Found $totalLines SQL statements to execute"

# Execute the SQL file
$startTime = Get-Date
$sqlContent = Get-Content $sqlFile -Raw

# Split into individual statements and execute
$statements = $sqlContent -split ";" | Where-Object { $_.Trim() -ne "" }

$successCount = 0
$errorCount = 0

foreach ($i in 0..($statements.Count - 1)) {
    $statement = $statements[$i].Trim()
    if ($statement) {
        try {
            sqlite3 $dbPath $statement
            $successCount++
            
            if (($i + 1) % 1000 -eq 0) {
                Write-Host "Progress: $($i + 1)/$($statements.Count) statements executed"
            }
        }
        catch {
            $errorCount++
            Write-Host "Error executing statement $($i + 1): $($_.Exception.Message)" -ForegroundColor Yellow
            Write-Host "Statement: $($statement.Substring(0, [Math]::Min(100, $statement.Length)))..." -ForegroundColor Gray
        }
    }
}

$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host ""
Write-Host "Import completed!" -ForegroundColor Green
Write-Host "Successfully executed: $successCount statements" -ForegroundColor Green
Write-Host "Errors: $errorCount" -ForegroundColor Yellow
Write-Host "Duration: $($duration.TotalSeconds) seconds" -ForegroundColor Cyan

# Verify the import by counting records
$countResult = sqlite3 $dbPath "SELECT COUNT(*) FROM LegacyUnitStandard;"
Write-Host "Total records in LegacyUnitStandard table: $countResult" -ForegroundColor Green

# Show a few sample records
Write-Host ""
Write-Host "Sample records:" -ForegroundColor Cyan
$samples = sqlite3 $dbPath "SELECT id, unitStandardId, unitStandardName FROM LegacyUnitStandard LIMIT 5;"
foreach ($sample in $samples) {
    Write-Host "  $sample"
}

Write-Host ""
Write-Host "Legacy unit standards import completed successfully!" -ForegroundColor Green