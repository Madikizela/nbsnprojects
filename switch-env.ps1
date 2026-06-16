# Environment Switcher Script for NBSN Project
# Usage: .\switch-env.ps1 local    (for local development)
#        .\switch-env.ps1 production (for production testing)

param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("local", "production")]
    [string]$Environment
)

Write-Host "🔄 Switching to $Environment environment..." -ForegroundColor Cyan

if ($Environment -eq "local") {
    # Copy local environment
    Copy-Item ".\.env.example" ".\.env" -Force
    
    # Update frontend to point to local backend
    $frontendEnv = @"
VITE_API_URL=http://localhost:5213
"@
    $frontendEnv | Out-File -FilePath ".\frontend\.env.local" -Encoding UTF8
    
    Write-Host "✅ Switched to LOCAL environment" -ForegroundColor Green
    Write-Host "   Backend:  http://localhost:5213" -ForegroundColor Gray
    Write-Host "   Frontend: http://localhost:5174" -ForegroundColor Gray
    Write-Host "   Database: Local PostgreSQL" -ForegroundColor Gray
    Write-Host ""
    Write-Host "To start development:" -ForegroundColor Yellow
    Write-Host "   Backend:  cd backend && dotnet run" -ForegroundColor Gray
    Write-Host "   Frontend: cd frontend && npm run dev" -ForegroundColor Gray
}
else {
    # Copy railway environment (for reference)
    Copy-Item ".\.env.railway" ".\.env" -Force
    
    Write-Host "⚠️  Switched to PRODUCTION environment reference" -ForegroundColor Yellow
    Write-Host "   This .env file is for REFERENCE ONLY" -ForegroundColor Red
    Write-Host "   Actual production runs on Railway with Railway variables" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Production URLs:" -ForegroundColor Yellow
    Write-Host "   Update these with your actual Railway URLs:" -ForegroundColor Gray
    Write-Host "   Backend:  https://your-backend.up.railway.app" -ForegroundColor Gray
    Write-Host "   Frontend: https://your-frontend.up.railway.app" -ForegroundColor Gray
}

Write-Host ""
Write-Host "📱 Don't forget to update mobile app server URL in:" -ForegroundColor Yellow
Write-Host "   mobile_flutter/lib/services/server_config_service.dart" -ForegroundColor Gray