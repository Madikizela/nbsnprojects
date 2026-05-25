# Stop all backend processes
Write-Host "Stopping all backend processes..." -ForegroundColor Yellow
Get-Process -Name "backend" -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process -Name "dotnet" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*backend*" } | Stop-Process -Force
Start-Sleep -Seconds 3

# Clean build artifacts
Write-Host "Cleaning build artifacts..." -ForegroundColor Yellow
Set-Location backend
if (Test-Path "bin") { Remove-Item -Recurse -Force "bin" }
if (Test-Path "obj") { Remove-Item -Recurse -Force "obj" }

# Rebuild
Write-Host "Rebuilding backend..." -ForegroundColor Green
dotnet build --no-incremental

if ($LASTEXITCODE -eq 0) {
    Write-Host "Build successful! Starting backend..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; dotnet run"
    Write-Host "Backend is starting in a new window..." -ForegroundColor Cyan
    Write-Host "Wait about 10 seconds for it to fully start, then try again." -ForegroundColor Cyan
} else {
    Write-Host "Build failed! Check the errors above." -ForegroundColor Red
}

Set-Location ..
