# Start the backend server
Write-Host "Starting .NET backend..." -ForegroundColor Green

$dotnetPath = "C:\Program Files\dotnet\dotnet.exe"

if (Test-Path $dotnetPath) {
    Write-Host "Found .NET at: $dotnetPath" -ForegroundColor Yellow
    Set-Location "C:\Users\madik\Documents\New_version\backend"
    & $dotnetPath run
} else {
    Write-Host ".NET not found at expected location. Trying system PATH..." -ForegroundColor Yellow
    Set-Location "C:\Users\madik\Documents\New_version\backend"
    dotnet run
}
