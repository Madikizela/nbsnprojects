# Complete password reset flow
Write-Host "=== Admin Password Reset to 'Admin@123' ===" -ForegroundColor Green
Write-Host ""

# Step 1: Request password reset
Write-Host "Step 1: Requesting password reset for admin@system.local..." -ForegroundColor Cyan
$forgotBody = @{
    email = "admin@system.local"
} | ConvertTo-Json

try {
    $forgotResponse = Invoke-RestMethod -Uri "http://localhost:5213/api/auth/forgot-password" `
        -Method Post `
        -Body $forgotBody `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    Write-Host "✅ Reset request sent" -ForegroundColor Green
    Write-Host ""
    Write-Host "IMPORTANT: Check the backend console window for a line like:" -ForegroundColor Yellow
    Write-Host "  'Generated reset token <GUID> for email admin@system.local'" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Copy the GUID token and paste it below:" -ForegroundColor Yellow
    $token = Read-Host "Reset Token"
    
    if ($token) {
        Write-Host ""
        Write-Host "Step 2: Resetting password to 'Admin@123'..." -ForegroundColor Cyan
        
        $resetBody = @{
            token = $token.Trim()
            newPassword = "Admin@123"
        } | ConvertTo-Json
        
        $resetResponse = Invoke-RestMethod -Uri "http://localhost:5213/api/auth/reset-password" `
            -Method Post `
            -Body $resetBody `
            -ContentType "application/json" `
            -ErrorAction Stop
        
        Write-Host "✅ Password reset successful!" -ForegroundColor Green
        Write-Host $resetResponse.message -ForegroundColor Green
        Write-Host ""
        Write-Host "You can now login with:" -ForegroundColor Green
        Write-Host "  Email: admin@system.local" -ForegroundColor Cyan
        Write-Host "  Password: Admin@123" -ForegroundColor Cyan
    }
}
catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}
