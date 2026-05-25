Write-Host "🔄 FORCE RESTARTING FRONTEND..." -ForegroundColor Red
Write-Host ""

# Kill all node processes
Write-Host "1. Killing all Node.js processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Navigate to frontend
Write-Host "2. Navigating to frontend directory..." -ForegroundColor Yellow
if (Test-Path "frontend") {
    Set-Location "frontend"
} else {
    Write-Host "❌ Frontend directory not found!" -ForegroundColor Red
    exit 1
}

# Clear npm cache
Write-Host "3. Clearing npm cache..." -ForegroundColor Yellow
npm cache clean --force

# Delete node_modules and package-lock.json
Write-Host "4. Removing node_modules and package-lock.json..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules"
}
if (Test-Path "package-lock.json") {
    Remove-Item -Force "package-lock.json"
}

# Reinstall dependencies
Write-Host "5. Reinstalling dependencies..." -ForegroundColor Yellow
npm install

# Start development server
Write-Host "6. Starting development server..." -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Frontend will be available at: http://localhost:5173" -ForegroundColor Blue
Write-Host "🎯 Test with: zondis411@gmail.com / hlvp2WdoDK(a" -ForegroundColor Magenta
Write-Host "🔍 Look for: '🎯 DETECTED QA MANAGER (Role 7)' in console" -ForegroundColor Cyan
Write-Host ""

npm run dev