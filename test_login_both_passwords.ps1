# Test both possible admin passwords

Write-Host "Testing Admin Login - Attempt 1" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""

# Test 1: Admin@123!System (default from DataSeedingService)
$body1 = @{
    email = "admin@system.local"
    password = "Admin@123!System"
} | ConvertTo-Json

Write-Host "Trying: admin@system.local / Admin@123!System" -ForegroundColor Cyan

try {
    $response1 = Invoke-RestMethod -Uri "http://localhost:5213/api/auth/login" `
        -Method Post `
        -Body $body1 `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    Write-Host "✅ SUCCESS with Admin@123!System" -ForegroundColor Green
    Write-Host "Token: $($response1.token.Substring(0, 50))..." -ForegroundColor Green
    Write-Host "User: $($response1.user.name)" -ForegroundColor Green
    Write-Host "Role: $($response1.user.role)" -ForegroundColor Green
}
catch {
    Write-Host "❌ FAILED with Admin@123!System" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Error: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Testing Admin Login - Attempt 2" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""

# Test 2: Admin@123 (what user wants)
$body2 = @{
    email = "admin@system.local"
    password = "Admin@123"
} | ConvertTo-Json

Write-Host "Trying: admin@system.local / Admin@123" -ForegroundColor Cyan

try {
    $response2 = Invoke-RestMethod -Uri "http://localhost:5213/api/auth/login" `
        -Method Post `
        -Body $body2 `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    Write-Host "✅ SUCCESS with Admin@123" -ForegroundColor Green
    Write-Host "Token: $($response2.token.Substring(0, 50))..." -ForegroundColor Green
    Write-Host "User: $($response2.user.name)" -ForegroundColor Green
    Write-Host "Role: $($response2.user.role)" -ForegroundColor Green
}
catch {
    Write-Host "❌ FAILED with Admin@123" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Error: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Testing proxy through frontend (port 5173)" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green
Write-Host ""

# Test 3: Through the Vite proxy
$body3 = @{
    email = "admin@system.local"
    password = "Admin@123!System"
} | ConvertTo-Json

Write-Host "Trying via proxy: http://localhost:5173/api/auth/login" -ForegroundColor Cyan

try {
    $response3 = Invoke-RestMethod -Uri "http://localhost:5173/api/auth/login" `
        -Method Post `
        -Body $body3 `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    Write-Host "✅ SUCCESS through proxy" -ForegroundColor Green
    Write-Host "Token: $($response3.token.Substring(0, 50))..." -ForegroundColor Green
}
catch {
    Write-Host "❌ FAILED through proxy" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Error: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}
