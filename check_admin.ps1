$connectionString = "Host=localhost;Port=5433;Database=rlms;Username=postgres;Password=postgres"

Add-Type -Path "C:\Users\madik\.nuget\packages\npgsql\9.0.2\lib\net9.0\Npgsql.dll"

try {
    $conn = New-Object Npgsql.NpgsqlConnection($connectionString)
    $conn.Open()
    
    $cmd = $conn.CreateCommand()
    $cmd.CommandText = "SELECT ""Id"", ""Email"", ""FirstName"", ""LastName"", ""Status"" FROM ""SystemAdmins"""
    
    $reader = $cmd.ExecuteReader()
    
    Write-Host "System Admin Accounts:" -ForegroundColor Green
    Write-Host "=====================" -ForegroundColor Green
    
    while ($reader.Read()) {
        Write-Host ""
        Write-Host "ID: $($reader['Id'])" -ForegroundColor Cyan
        Write-Host "Email: $($reader['Email'])" -ForegroundColor Cyan
        Write-Host "Name: $($reader['FirstName']) $($reader['LastName'])" -ForegroundColor Cyan
        Write-Host "Status: $($reader['Status'])" -ForegroundColor Cyan
    }
    
    $reader.Close()
    $conn.Close()
}
catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
