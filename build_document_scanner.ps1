# Build Document Scanner App with CamScanner Features
# This script will configure and build your app with professional document scanning

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Building Document Scanner App" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to mobile directory
Set-Location "C:\Users\madik\Documents\New_version\mobile"

Write-Host "Step 1: Configuring EAS Build..." -ForegroundColor Yellow
npx eas build:configure

Write-Host ""
Write-Host "Step 2: Starting build process..." -ForegroundColor Yellow
Write-Host "This will take 15-20 minutes. You can close this window." -ForegroundColor Green
Write-Host "Check build status at: https://expo.dev" -ForegroundColor Green
Write-Host ""

npx eas build --profile development --platform android

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Build Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Download the APK from the link above" -ForegroundColor White
Write-Host "2. Install it on your phone" -ForegroundColor White
Write-Host "3. Run: npx expo start --dev-client" -ForegroundColor White
Write-Host "4. Scan QR code with your phone" -ForegroundColor White
Write-Host "5. Test document scanning!" -ForegroundColor White
Write-Host ""
