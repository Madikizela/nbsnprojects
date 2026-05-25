# This script updates the admin password to "Admin@123"
# BCrypt hash generated for "Admin@123" with work factor 12

$connectionString = "Host=localhost;Database=rlms;Username=postgres;Password=12345"

# BCrypt hash for "Admin@123" - you'll need to generate this properly
# For now, let's use the backend's password hashing service

Write-Host "Updating admin password to 'Admin@123'..." -ForegroundColor Yellow

# Call the backend API to use forgot-password and reset-password flow
$forgotBody = @{
    email = "admin@system.local"
} | ConvertTo-Json

try {
    Write-Host "Step 1: Requesting password reset..." -ForegroundColor Cyan
    $forgotResponse = Invoke-RestMethod -Uri "http://localhost:5213/api/auth/forgot-password" `
        -Method Post `
        -Body $forgotBody `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    Write-Host "✅ Password reset email would be sent (check backend logs for reset token)" -ForegroundColor Green
    Write-Host $forgotResponse.message -ForegroundColor Green
}
catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Check the backend console output for the reset token and link." -ForegroundColor Yellow
Write-Host "Then use that token to reset the password to 'Admin@123'" -ForegroundColor Yellow
