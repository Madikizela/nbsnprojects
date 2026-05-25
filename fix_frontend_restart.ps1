Write-Host "🔄 Fixing Frontend Routing Issue..." -ForegroundColor Yellow
Write-Host ""

# Step 1: Kill existing processes
Write-Host "Step 1: Stopping existing frontend processes..." -ForegroundColor Cyan
try {
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Stopped existing processes" -ForegroundColor Green
} catch {
    Write-Host "ℹ️ No existing processes to stop" -ForegroundColor Gray
}

# Step 2: Wait
Write-Host "Step 2: Waiting for processes to close..." -ForegroundColor Cyan
Start-Sleep -Seconds 3

# Step 3: Navigate to frontend directory
Write-Host "Step 3: Navigating to frontend directory..." -ForegroundColor Cyan
if (Test-Path "frontend") {
    Set-Location "frontend"
    Write-Host "✅ In frontend directory" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend directory not found!" -ForegroundColor Red
    exit 1
}

# Step 4: Start development server
Write-Host "Step 4: Starting development server..." -ForegroundColor Cyan
Write-Host "Running: npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Frontend will be available at: http://localhost:5173" -ForegroundColor Blue
Write-Host "⏳ Wait for 'Local:   http://localhost:5173/' message" -ForegroundColor Yellow
Write-Host "🔍 Then test login with: zondis411@gmail.com" -ForegroundColor Magenta
Write-Host ""

# Start the server
npm run dev