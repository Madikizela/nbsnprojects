
# Read SQL file
$sqlPath = "C:\Users\madik\Downloads\nbsnproject (1).sql"
$sqlContent = Get-Content $sqlPath -Raw

# Find all CREATE TABLE statements (with backticks, quotes, etc.)
$matches = [regex]::Matches($sqlContent, "CREATE TABLE\s+[`"\[]([^\]`"]+)[`"\]]\s*\(", [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)

Write-Host "=== Tables in nbsnproject.sql ==="
$tables = @()
foreach ($match in $matches) {
    $tableName = $match.Groups[1].Value
    $tables += $tableName
    Write-Host "- $tableName"
}

# Now get tables from PostgreSQL's rlms database
Write-Host "`n=== Tables in PostgreSQL's rlms database ==="
$env:PGPASSWORD='12345'
$psqlPath = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
$pgTables = & $psqlPath -U postgres -p 5432 -d rlms -t -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"
foreach ($table in $pgTables) {
    $t = $table.Trim()
    if (-not [string]::IsNullOrEmpty($t)) {
        Write-Host "- $t"
    }
}
