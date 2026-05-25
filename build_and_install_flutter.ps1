# Build and Install Flutter App
# This script builds the Flutter app and installs it on the connected device

Write-Host "🚀 Building Flutter App..." -ForegroundColor Cyan
Write-Host ""

# Navigate to Flutter project
Set-Location mobile_flutter

# Clean previous build
Write-Host "🧹 Cleaning previous build..." -ForegroundColor Yellow
flutter clean

# Get dependencies
Write-Host "📦 Getting dependencies..." -ForegroundColor Yellow
flutter pub get

# Build APK
Write-Host "🔨 Building APK..." -ForegroundColor Yellow
flutter build apk --release

# Check if build was successful
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Build successful!" -ForegroundColor Green
    Write-Host ""
    
    # Check for connected devices
    Write-Host "📱 Checking for connected devices..." -ForegroundColor Cyan
    $devices = flutter devices
    
    if ($devices -match "RZ8X101VLSE") {
        Write-Host "✅ Device found: RZ8X101VLSE" -ForegroundColor Green
        Write-Host ""
        Write-Host "📲 Installing on device..." -ForegroundColor Yellow
        flutter install
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "✅ App installed successfully!" -ForegroundColor Green
            Write-Host ""
            Write-Host "🎉 You can now test the Teacher Dashboard!" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "Test Credentials:" -ForegroundColor White
            Write-Host "  Teacher Email: [teacher email from database]" -ForegroundColor Gray
            Write-Host "  Password: [system generated password]" -ForegroundColor Gray
        } else {
            Write-Host ""
            Write-Host "❌ Installation failed!" -ForegroundColor Red
        }
    } else {
        Write-Host "⚠️  No device found. Please connect your device and try again." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "APK Location:" -ForegroundColor White
        Write-Host "  mobile_flutter/build/app/outputs/flutter-apk/app-release.apk" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Manual Install:" -ForegroundColor White
        Write-Host "  adb install build/app/outputs/flutter-apk/app-release.apk" -ForegroundColor Gray
    }
} else {
    Write-Host ""
    Write-Host "❌ Build failed! Check the errors above." -ForegroundColor Red
}

Write-Host ""
Set-Location ..
