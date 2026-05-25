$body = @{
    email = "admin@system.local"
    password = "Admin@123!System"
} | ConvertTo-Json

Write-Host "Testing admin login with credentials:" -ForegroundColor Yellow
Write-Host "Email: admin@system.local" -ForegroundColor Cyan
Write-Host "Password: Admin@123!System" -ForegroundColor Cyan
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5213/api/auth/login" `
        -Method Post `
        -Body $body `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    Write-Host "✅ Login successful!" -ForegroundColor Green
    Write-Host "Token: $($response.token.Substring(0, 50))..." -ForegroundColor Green
    Write-Host "User: $($response.user.name)" -ForegroundColor Green
    Write-Host "Role: $($response.user.role)" -ForegroundColor Green
    Write-Host "Email: $($response.user.email)" -ForegroundColor Green
}
catch {
    Write-Host "❌ Login failed!" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}
