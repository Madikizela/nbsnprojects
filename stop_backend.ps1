# Stop all backend processes
Write-Host "Stopping all backend processes..." -ForegroundColor Yellow

$backendProcesses = Get-Process -Name "backend" -ErrorAction SilentlyContinue
if ($backendProcesses) {
    $backendProcesses | Stop-Process -Force
    Write-Host "Stopped $($backendProcesses.Count) backend process(es)" -ForegroundColor Green
} else {
    Write-Host "No backend processes found" -ForegroundColor Yellow
}

$dotnetProcesses = Get-Process -Name "dotnet" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*backend*" }
if ($dotnetProcesses) {
    $dotnetProcesses | Stop-Process -Force
    Write-Host "Stopped $($dotnetProcesses.Count) dotnet process(es)" -ForegroundColor Green
}

Write-Host "`nBackend stopped. You can now restart it with:" -ForegroundColor Cyan
Write-Host "  cd backend" -ForegroundColor White
Write-Host "  dotnet run" -ForegroundColor White
