$body = @{
    email = "admin@system.local"
    password = "Admin@123"
} | ConvertTo-Json

Write-Host "Testing login with Admin@123..." -ForegroundColor Cyan
Write-Host "URL: http://localhost:5213/api/auth/login" -ForegroundColor Yellow
Write-Host "Body: $body" -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5213/api/auth/login" `
        -Method Post `
        -Body $body `
        -ContentType "application/json" `
        -UseBasicParsing
    
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Green
    Write-Host $response.Content
}
catch {
    Write-Host "❌ FAILED" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "Response:" -ForegroundColor Red
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    Write-Host $reader.ReadToEnd()
}
