#!/usr/bin/env pwsh
# Deploy Mobile App to Samsung Phone
# Quick deployment script for NBSN Mobile App

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  📱 NBSN Mobile App Deployment Script" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Flutter installation
Write-Host "🔍 Step 1: Checking Flutter installation..." -ForegroundColor Yellow
try {
    $flutterVersion = flutter --version 2>&1 | Select-String "Flutter" | Select-Object -First 1
    Write-Host "   ✅ Flutter found: $flutterVersion" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Flutter not found. Please install Flutter first." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Check for connected devices
Write-Host "🔍 Step 2: Checking for connected devices..." -ForegroundColor Yellow
$devices = flutter devices 2>&1 | Out-String

if ($devices -match "Found (\d+) connected device") {
    $deviceCount = $matches[1]
    Write-Host "   ✅ Found $deviceCount connected device(s)" -ForegroundColor Green
    Write-Host ""
    Write-Host "   Available devices:" -ForegroundColor Cyan
    flutter devices | Select-String -Pattern "•" | ForEach-Object {
        Write-Host "   $_" -ForegroundColor White
    }
} else {
    Write-Host "   ⚠️  No devices found" -ForegroundColor Yellow
}

Write-Host ""

# Check specifically for Android devices
if ($devices -match "SM A155F|android" -or $devices -match "emulator") {
    Write-Host "   🎉 Android device detected!" -ForegroundColor Green
    $hasAndroid = $true
} else {
    Write-Host "   ⚠️  No Android device detected" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   To connect your Samsung phone:" -ForegroundColor Cyan
    Write-Host "   • USB: Connect via cable and enable USB debugging" -ForegroundColor White
    Write-Host "   • WiFi: Settings → Developer Options → Wireless debugging" -ForegroundColor White
    Write-Host ""
    
    $continue = Read-Host "   Continue with available devices? (y/N)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        Write-Host ""
        Write-Host "📖 See DEPLOY_MOBILE_NOW.md for connection instructions" -ForegroundColor Cyan
        exit 0
    }
    $hasAndroid = $false
}

Write-Host ""

# Step 3: Check if we're in the right directory
Write-Host "🔍 Step 3: Checking project directory..." -ForegroundColor Yellow
$currentDir = Get-Location
if (-not (Test-Path "pubspec.yaml")) {
    Write-Host "   ❌ Not in Flutter project directory" -ForegroundColor Red
    Write-Host "   Current: $currentDir" -ForegroundColor White
    Write-Host "   Expected: mobile_flutter directory with pubspec.yaml" -ForegroundColor White
    exit 1
}
Write-Host "   ✅ In correct directory: $currentDir" -ForegroundColor Green
Write-Host ""

# Step 4: Show what will be deployed
Write-Host "📦 Step 4: Deployment Summary" -ForegroundColor Yellow
Write-Host ""
Write-Host "   This will deploy the following fixes:" -ForegroundColor Cyan
Write-Host "   ✅ Learner login database fix (surname handling)" -ForegroundColor White
Write-Host "   ✅ Attendance history screen (new feature)" -ForegroundColor White
Write-Host "   ✅ All existing features" -ForegroundColor White
Write-Host ""

# Step 5: Offer deployment options
Write-Host "🚀 Step 5: Deployment Options" -ForegroundColor Yellow
Write-Host ""
Write-Host "   1. Deploy to device (flutter run) - Recommended for testing" -ForegroundColor White
Write-Host "   2. Build APK only (flutter build apk --debug)" -ForegroundColor White
Write-Host "   3. Clean and rebuild (flutter clean + run)" -ForegroundColor White
Write-Host "   4. Check diagnostics (flutter doctor)" -ForegroundColor White
Write-Host "   5. Cancel" -ForegroundColor White
Write-Host ""

$choice = Read-Host "   Select option (1-5)"

Write-Host ""

switch ($choice) {
    "1" {
        Write-Host "🚀 Deploying to device..." -ForegroundColor Cyan
        Write-Host ""
        Write-Host "⏱️  This will take ~5-7 minutes on first build" -ForegroundColor Yellow
        Write-Host "📱 Keep your phone screen active during build!" -ForegroundColor Yellow
        Write-Host ""
        
        # Run flutter with release mode for better performance
        flutter run
    }
    
    "2" {
        Write-Host "🔨 Building APK..." -ForegroundColor Cyan
        Write-Host ""
        flutter build apk --debug
        Write-Host ""
        Write-Host "✅ APK built successfully!" -ForegroundColor Green
        Write-Host "📁 Location: build\app\outputs\flutter-apk\app-debug.apk" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "📱 Transfer this APK to your phone and install it" -ForegroundColor Yellow
    }
    
    "3" {
        Write-Host "🧹 Cleaning project..." -ForegroundColor Cyan
        flutter clean
        Write-Host ""
        Write-Host "📦 Getting dependencies..." -ForegroundColor Cyan
        flutter pub get
        Write-Host ""
        Write-Host "🚀 Deploying to device..." -ForegroundColor Cyan
        Write-Host ""
        flutter run
    }
    
    "4" {
        Write-Host "🔍 Running Flutter doctor..." -ForegroundColor Cyan
        Write-Host ""
        flutter doctor -v
        Write-Host ""
        Write-Host "💡 Check for any issues marked with ❌" -ForegroundColor Yellow
    }
    
    "5" {
        Write-Host "❌ Deployment cancelled" -ForegroundColor Yellow
        exit 0
    }
    
    default {
        Write-Host "❌ Invalid option" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📖 For more help, see: DEPLOY_MOBILE_NOW.md" -ForegroundColor Cyan
Write-Host ""
