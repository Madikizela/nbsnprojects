param(
    [string]$Port,
    [string]$DbName,
    [string]$Password
)

$env:PGPASSWORD = $Password
$psqlPath = "C:\Program Files\PostgreSQL\$Port\bin\psql.exe" # Wait no, use correct version based on port? Let's just use 15's psql for 5433 and 18's for 5432
if ($Port -eq "5433") {
    $psqlPath = "C:\Program Files\PostgreSQL\15\bin\psql.exe"
} else {
    $psqlPath = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
}

Write-Host "Getting row counts for $DbName on port $Port..."

# Get all table names
$tables = & $psqlPath -U postgres -p $Port -d $DbName -t -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"

foreach ($table in $tables) {
    $table = $table.Trim()
    if (-not [string]::IsNullOrEmpty($table)) {
        $count = & $psqlPath -U postgres -p $Port -d $DbName -t -c "SELECT COUNT(*) FROM ""$table"";"
        $count = $count.Trim()
        Write-Host "$table : $count"
    }
}
