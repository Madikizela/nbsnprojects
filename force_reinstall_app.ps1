# Force reinstall the Flutter app
Write-Host "=== Force Reinstall NBSN App ===" -ForegroundColor Cyan
Write-Host ""

cd mobile_flutter

# Check for devices
Write-Host "Checking for connected devices..." -ForegroundColor Yellow
flutter devices

Write-Host ""
$continue = Read-Host "Is your phone (SM A155F) listed above? (y/n)"

if ($continue -ne 'y') {
    Write-Host ""
    Write-Host "Please connect your phone and enable USB debugging, then run this script again." -ForegroundColor Red
    Write-Host ""
    Write-Host "OR manually:" -ForegroundColor Yellow
    Write-Host "1. Uninstall the NBSN app from your phone"
    Write-Host "2. Copy this file to your phone: mobile_flutter\build\app\outputs\flutter-apk\app-release.apk"
    Write-Host "3. Install it on your phone"
    cd ..
    exit
}

Write-Host ""
Write-Host "Step 1: Uninstalling old version..." -ForegroundColor Yellow
flutter uninstall

Write-Host ""
Write-Host "Step 2: Installing new version..." -ForegroundColor Yellow
flutter install

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ App reinstalled successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "The new version includes:" -ForegroundColor Cyan
    Write-Host "  - Fixed parameter names (ClassId, TeacherId, FingerprintTemplate)"
    Write-Host "  - Normalized fingerprint comparison"
    Write-Host "  - Debug logging"
    Write-Host ""
    Write-Host "Now test on your phone:" -ForegroundColor Yellow
    Write-Host "1. Open NBSN app"
    Write-Host "2. Login as teacher"
    Write-Host "3. Select class"
    Write-Host "4. Tap fingerprint icon and scan"
} else {
    Write-Host ""
    Write-Host "✗ Installation failed!" -ForegroundColor Red
    Write-Host "Try manual installation instead." -ForegroundColor Yellow
}

cd ..
