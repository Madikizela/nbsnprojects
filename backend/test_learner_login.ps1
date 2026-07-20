# Test Learner Login API
# Tests the learner-login endpoint with sbusiso.madikizela credentials

$headers = @{
    "Content-Type" = "application/json"
}

$body = @{
    login = "sbusiso.madikizela"
    password = "Smadikizela1"
} | ConvertTo-Json

Write-Host "Testing Learner Login API..." -ForegroundColor Cyan
Write-Host "URL: http://192.168.0.53:5213/api/Auth/learner-login" -ForegroundColor Gray
Write-Host "Username: sbusiso.madikizela" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "http://192.168.0.53:5213/api/Auth/learner-login" `
        -Method Post `
        -Headers $headers `
        -Body $body `
        -TimeoutSec 10

    Write-Host "✅ LOGIN SUCCESSFUL!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response Data:" -ForegroundColor Yellow
    Write-Host "─────────────────────────────────────────" -ForegroundColor Gray
    
    if ($response.token) {
        Write-Host "Token: $($response.token.Substring(0, 50))..." -ForegroundColor White
    }
    
    if ($response.user) {
        Write-Host "User ID: $($response.user.id)" -ForegroundColor White
        Write-Host "Name: $($response.user.name)" -ForegroundColor White
        Write-Host "Surname: $($response.user.surname)" -ForegroundColor White
        Write-Host "Full Name: $($response.user.name) $($response.user.surname)" -ForegroundColor Cyan
        Write-Host "Email: $($response.user.email)" -ForegroundColor White
        Write-Host "Username: $($response.user.username)" -ForegroundColor White
        Write-Host "Role: $($response.user.role)" -ForegroundColor White
        Write-Host "Must Change Password: $($response.user.mustChangePassword)" -ForegroundColor White
    }
    
    Write-Host "─────────────────────────────────────────" -ForegroundColor Gray
    Write-Host ""
    
    # Verify separate name and surname fields
    if ($response.user.name -and $response.user.surname) {
        Write-Host "✅ VERIFICATION: Name and Surname are separate fields" -ForegroundColor Green
        Write-Host "   name = '$($response.user.name)'" -ForegroundColor Gray
        Write-Host "   surname = '$($response.user.surname)'" -ForegroundColor Gray
    } else {
        Write-Host "❌ ERROR: Name and Surname are not separate!" -ForegroundColor Red
        if ($response.user.name -match " ") {
            Write-Host "   name contains space: '$($response.user.name)'" -ForegroundColor Yellow
            Write-Host "   This means backend is still combining them!" -ForegroundColor Yellow
        }
    }
    
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $statusDesc = $_.Exception.Response.StatusDescription
    
    Write-Host "❌ LOGIN FAILED!" -ForegroundColor Red
    Write-Host "Status Code: $statusCode - $statusDesc" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Error Details:" -ForegroundColor Yellow
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        Write-Host ""
        Write-Host "Server Response:" -ForegroundColor Yellow
        Write-Host $_.ErrorDetails.Message -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
