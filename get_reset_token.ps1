$logFile = "C:\Users\madik\Documents\New_version\backend\backend.log"
$content = Get-Content $logFile | Select-String "Generated reset token" | Select-Object -Last 1

if ($content) {
    Write-Host "Found reset token line:" -ForegroundColor Green
    Write-Host $content -ForegroundColor Cyan
    
    # Extract the token (GUID format)
    if ($content -match '([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})') {
        $token = $matches[1]
        Write-Host ""
        Write-Host "Reset Token: $token" -ForegroundColor Yellow
        
        # Now reset the password
        $resetBody = @{
            token = $token
            newPassword = "Admin@123"
        } | ConvertTo-Json
        
        Write-Host ""
        Write-Host "Resetting password to 'Admin@123'..." -ForegroundColor Cyan
        
        try {
            $response = Invoke-RestMethod -Uri "http://localhost:5213/api/auth/reset-password" `
                -Method Post `
                -Body $resetBody `
                -ContentType "application/json" `
                -ErrorAction Stop
            
            Write-Host "✅ Password reset successful!" -ForegroundColor Green
            Write-Host $response.message -ForegroundColor Green
        }
        catch {
            Write-Host "❌ Password reset failed: $_" -ForegroundColor Red
        }
    }
} else {
    Write-Host "No reset token found in logs" -ForegroundColor Red
}
