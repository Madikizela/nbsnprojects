# Simple script to import unit standards data
$sqlFile = "occupational_unit_standards.sql"
$dbFile = "skills_development.db"

Write-Host "Importing unit standards data..."

# Check if SQL file exists
if (!(Test-Path $sqlFile)) {
    Write-Host "SQL file not found: $sqlFile"
    exit 1
}

# Read the SQL file content
$sqlContent = Get-Content $sqlFile -Raw

# Extract just the INSERT statements (skip the CREATE TABLE part)
$insertStatements = $sqlContent -split ';' | Where-Object { $_ -match 'INSERT INTO occupational_unit_standards' }

Write-Host "Found $($insertStatements.Count) INSERT statements"

# Create a new SQL file with just the INSERT statements
$insertOnlySql = $insertStatements -join ";`n"
Set-Content -Path "unit_standards_inserts.sql" -Value $insertOnlySql

Write-Host "Created unit_standards_inserts.sql with INSERT statements only"
Write-Host "Now you can manually run: sqlite3 $dbFile < unit_standards_inserts.sql"