# Railway Setup Script
# This script helps you set up Railway deployment

Write-Host "🚀 Railway Deployment Setup" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

# Check if Railway CLI is installed
$railwayInstalled = Get-Command railway -ErrorAction SilentlyContinue
if (-not $railwayInstalled) {
    Write-Host "❌ Railway CLI not found. Installing..." -ForegroundColor Red
    npm install -g @railway/cli
    Write-Host "✅ Railway CLI installed" -ForegroundColor Green
}
else {
    Write-Host "✅ Railway CLI already installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "🔑 Next Steps:" -ForegroundColor Yellow
Write-Host "===============" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Login to Railway:" -ForegroundColor White
Write-Host "   railway login" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Create a new project:" -ForegroundColor White
Write-Host "   - Go to https://railway.app/dashboard" -ForegroundColor Gray
Write-Host "   - Click 'New Project'" -ForegroundColor Gray
Write-Host "   - Choose 'Deploy from GitHub repo'" -ForegroundColor Gray
Write-Host "   - Select your repository" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Add PostgreSQL database:" -ForegroundColor White
Write-Host "   - In your project, click 'New'" -ForegroundColor Gray
Write-Host "   - Select 'Database' → 'PostgreSQL'" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Create Backend service:" -ForegroundColor White
Write-Host "   - Click 'New' → 'GitHub Repo'" -ForegroundColor Gray
Write-Host "   - Set Root Directory: backend" -ForegroundColor Gray
Write-Host "   - Add environment variables (see RAILWAY_DEPLOYMENT_GUIDE.md)" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Create Frontend service:" -ForegroundColor White
Write-Host "   - Click 'New' → 'GitHub Repo'" -ForegroundColor Gray
Write-Host "   - Set Root Directory: frontend" -ForegroundColor Gray
Write-Host "   - Set VITE_API_URL to your backend URL" -ForegroundColor Gray
Write-Host ""
Write-Host "6. Run database migrations:" -ForegroundColor White
Write-Host "   - Update local .env with Railway database credentials" -ForegroundColor Gray
Write-Host "   - Run: cd backend && dotnet ef database update" -ForegroundColor Gray
Write-Host "   - Restore local .env file" -ForegroundColor Gray
Write-Host ""
Write-Host "📚 For detailed instructions, see:" -ForegroundColor Green
Write-Host "   RAILWAY_DEPLOYMENT_GUIDE.md" -ForegroundColor Gray
Write-Host ""
Write-Host "🔧 Environment Management:" -ForegroundColor Yellow
Write-Host "   Local:      .\switch-env.ps1 local" -ForegroundColor Gray
Write-Host "   Production: .\switch-env.ps1 production" -ForegroundColor Gray