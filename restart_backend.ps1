# Stop the backend process
Write-Host "Stopping backend..." -ForegroundColor Yellow
Get-Process -Name "backend" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Start the backend
Write-Host "Starting backend..." -ForegroundColor Green
Set-Location backend
Start-Process -FilePath "dotnet" -ArgumentList "run" -NoNewWindow
Write-Host "Backend started!" -ForegroundColor Green
Write-Host "Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
Write-Host "Backend should be ready at http://localhost:5001" -ForegroundColor Cyan
