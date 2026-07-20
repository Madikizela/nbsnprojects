#!/usr/bin/env pwsh
# Start All NBSN Services
# Run this script to start PostgreSQL, Backend, and Frontend

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🚀 Starting NBSN Services" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Step 1: Start PostgreSQL
Write-Host "📊 Step 1: Starting PostgreSQL 18..." -ForegroundColor Yellow
$pgPath = "C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe"
$pgData = "C:\Program Files\PostgreSQL\18\data"

if (Test-Path $pgPath) {
    try {
        & $pgPath -D $pgData start
        Start-Sleep -Seconds 3
        Write-Host "   ✅ PostgreSQL started" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️  PostgreSQL may already be running or needs manual start" -ForegroundColor Yellow
        Write-Host "   Run: services.msc and start 'postgresql-x64-18'" -ForegroundColor Cyan
    }
} else {
    Write-Host "   ⚠️  PostgreSQL not found at expected path" -ForegroundColor Yellow
    Write-Host "   Please start PostgreSQL manually" -ForegroundColor Cyan
}

Write-Host ""

# Step 2: Start Backend
Write-Host "🔧 Step 2: Starting Backend API..." -ForegroundColor Yellow
Write-Host "   Opening new terminal for backend..." -ForegroundColor Cyan

Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\madik\Documents\nbsnprojects\backend'; dotnet run"

Start-Sleep -Seconds 2
Write-Host "   ✅ Backend terminal opened (check for startup messages)" -ForegroundColor Green
Write-Host "   URL: http://192.168.0.53:5213" -ForegroundColor Cyan

Write-Host ""

# Step 3: Start Frontend
Write-Host "🌐 Step 3: Starting Frontend..." -ForegroundColor Yellow
Write-Host "   Opening new terminal for frontend..." -ForegroundColor Cyan

Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\madik\Documents\nbsnprojects\frontend'; npm run dev"

Start-Sleep -Seconds 2
Write-Host "   ✅ Frontend terminal opened (check for startup messages)" -ForegroundColor Green
Write-Host "   URL: http://192.168.0.53:5174" -ForegroundColor Cyan

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ All services starting..." -ForegroundColor Green
Write-Host ""
Write-Host "Check the new terminal windows for:" -ForegroundColor Yellow
Write-Host "  • Backend: Should show 'Now listening on: http://192.168.0.53:5213'" -ForegroundColor White
Write-Host "  • Frontend: Should show 'Local: http://192.168.0.53:5174'" -ForegroundColor White
Write-Host ""
Write-Host "If PostgreSQL didn't start, open services.msc and start it manually" -ForegroundColor Cyan
Write-Host ""
