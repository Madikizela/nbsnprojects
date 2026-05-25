# Restart Frontend Development Server
Write-Host "🔄 Restarting Frontend Development Server..." -ForegroundColor Yellow

# Kill any existing npm/node processes on port 5173
Write-Host "Stopping existing processes..." -ForegroundColor Gray
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -eq "node" } | Stop-Process -Force -ErrorAction SilentlyContinue

# Wait a moment
Start-Sleep -Seconds 2

# Navigate to frontend directory and start
Write-Host "Starting frontend server..." -ForegroundColor Green
Set-Location "frontend"

# Start the development server
Write-Host "Running: npm run dev" -ForegroundColor Cyan
Start-Process -FilePath "npm" -ArgumentList "run", "dev" -NoNewWindow

Write-Host "✅ Frontend server starting..." -ForegroundColor Green
Write-Host "🌐 Frontend should be available at: http://localhost:5173" -ForegroundColor Blue
Write-Host "⏳ Wait a few seconds for the server to start, then test the login." -ForegroundColor Yellow