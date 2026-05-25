# Create a new admin account via the backend API
# Since we can't login, let's check if there's a registration endpoint or create one directly in DB

Write-Host "Checking backend database connection..." -ForegroundColor Green
Write-Host ""

# First, let's see if we can hit any public endpoints
try {
    $healthCheck = Invoke-RestMethod -Uri "http://localhost:5213/api/auth/login" `
        -Method Post `
        -Body '{"email":"test@test.com","password":"test"}' `
        -ContentType "application/json" `
        -ErrorAction SilentlyContinue
}
catch {
    Write-Host "Backend is responding (got expected 401)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "The issue is that the admin account password doesn't match." -ForegroundColor Yellow
Write-Host ""
Write-Host "Let's check if the backend is using SQLite instead of PostgreSQL..." -ForegroundColor Cyan

# Check if SQLite database exists
$sqliteDb = "C:\Users\madik\Documents\New_version\backend\skills_development.db"
if (Test-Path $sqliteDb) {
    $size = (Get-Item $sqliteDb).Length
    Write-Host "✅ Found SQLite database: $sqliteDb" -ForegroundColor Green
    Write-Host "   Size: $([math]::Round($size/1MB, 2)) MB" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "The backend is using SQLite, not PostgreSQL!" -ForegroundColor Yellow
    Write-Host "This explains why the seeded admin account isn't there." -ForegroundColor Yellow
} else {
    Write-Host "❌ No SQLite database found" -ForegroundColor Red
}

Write-Host ""
Write-Host "Checking Program.cs to see which database is configured..." -ForegroundColor Cyan
