# Script to install the Flutter app to connected phone
Write-Host "Checking for connected devices..." -ForegroundColor Cyan

cd mobile_flutter

# Check if phone is connected
$devices = flutter devices 2>&1 | Out-String

if ($devices -match "SM A155F" -or $devices -match "android") {
    Write-Host "Phone detected! Installing app..." -ForegroundColor Green
    flutter install
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✓ App installed successfully!" -ForegroundColor Green
        Write-Host "`nYou can now:" -ForegroundColor Yellow
        Write-Host "1. Open the NBSN app on your phone"
        Write-Host "2. Login as teacher (sthembisomaphango@gmail.com / Teacher123!)"
        Write-Host "3. Select a class"
        Write-Host "4. Tap fingerprint icon and scan"
    } else {
        Write-Host "`n✗ Installation failed" -ForegroundColor Red
    }
} else {
    Write-Host "`n✗ Phone not detected!" -ForegroundColor Red
    Write-Host "`nPlease:" -ForegroundColor Yellow
    Write-Host "1. Connect your phone via USB cable"
    Write-Host "2. Enable USB debugging on your phone"
    Write-Host "3. Accept the USB debugging prompt on your phone"
    Write-Host "4. Run this script again"
    Write-Host "`nOR copy the APK manually:" -ForegroundColor Yellow
    Write-Host "APK location: mobile_flutter\build\app\outputs\flutter-apk\app-release.apk"
}

cd ..
