# Check what admin accounts exist in the database
$env:PGPASSWORD = "postgres"

Write-Host "Checking SystemAdmins table..." -ForegroundColor Green
Write-Host ""

# Use psql to query the database
$query = "SELECT `"Id`", `"Email`", `"FirstName`", `"LastName`", `"Status`", `"CreatedAt`" FROM `"SystemAdmins`";"

try {
    & "C:\Program Files\PostgreSQL\16\bin\psql.exe" -h localhost -p 5433 -U postgres -d rlms -c $query
}
catch {
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "If psql is not found, trying alternative method..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Checking Users table..." -ForegroundColor Green
Write-Host ""

$query2 = "SELECT `"Id`", `"Email`", `"FirstName`", `"LastName`", `"Role`", `"Status`" FROM `"Users`" LIMIT 5;"

try {
    & "C:\Program Files\PostgreSQL\16\bin\psql.exe" -h localhost -p 5433 -U postgres -d rlms -c $query2
}
catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
