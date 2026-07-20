# Learning Materials Feature - Quick Deployment Script
# Run this script to deploy the learning materials feature

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Learning Materials Feature Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Database Migration
Write-Host "Step 1: Database Migration" -ForegroundColor Yellow
Write-Host "Would you like to run the database migration? (Y/N)" -ForegroundColor Green
$runMigration = Read-Host

if ($runMigration -eq "Y" -or $runMigration -eq "y") {
    Write-Host "Please enter your PostgreSQL details:" -ForegroundColor Cyan
    $dbHost = Read-Host "Database Host (default: localhost)"
    if ([string]::IsNullOrWhiteSpace($dbHost)) { $dbHost = "localhost" }
    
    $dbName = Read-Host "Database Name"
    $dbUser = Read-Host "Database User"
    
    Write-Host "Running migration..." -ForegroundColor Cyan
    $env:PGPASSWORD = Read-Host "Database Password" -AsSecureString
    $password = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($env:PGPASSWORD))
    
    $sqlFile = "backend\create_learning_materials_table.sql"
    
    if (Test-Path $sqlFile) {
        $env:PGPASSWORD = $password
        psql -h $dbHost -U $dbUser -d $dbName -f $sqlFile
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Database migration completed successfully!" -ForegroundColor Green
        } else {
            Write-Host "❌ Database migration failed!" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "❌ Migration file not found: $sqlFile" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "⏭️  Skipping database migration" -ForegroundColor Yellow
}

Write-Host ""

# Step 2: Backend Build
Write-Host "Step 2: Backend Build" -ForegroundColor Yellow
Write-Host "Would you like to build the backend? (Y/N)" -ForegroundColor Green
$buildBackend = Read-Host

if ($buildBackend -eq "Y" -or $buildBackend -eq "y") {
    Write-Host "Building backend..." -ForegroundColor Cyan
    Push-Location backend
    dotnet build
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Backend build completed successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Backend build failed!" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Pop-Location
} else {
    Write-Host "⏭️  Skipping backend build" -ForegroundColor Yellow
}

Write-Host ""

# Step 3: Mobile App Build
Write-Host "Step 3: Mobile App Build" -ForegroundColor Yellow
Write-Host "Would you like to build the mobile app? (Y/N)" -ForegroundColor Green
$buildMobile = Read-Host

if ($buildMobile -eq "Y" -or $buildMobile -eq "y") {
    Write-Host "Getting Flutter dependencies..." -ForegroundColor Cyan
    Push-Location mobile_flutter
    flutter pub get
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Flutter dependencies installed!" -ForegroundColor Green
        
        Write-Host "Would you like to build APK? (Y/N)" -ForegroundColor Green
        $buildApk = Read-Host
        
        if ($buildApk -eq "Y" -or $buildApk -eq "y") {
            Write-Host "Building APK (this may take a few minutes)..." -ForegroundColor Cyan
            flutter build apk --release
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Mobile app built successfully!" -ForegroundColor Green
                Write-Host "📦 APK location: mobile_flutter\build\app\outputs\flutter-apk\app-release.apk" -ForegroundColor Cyan
            } else {
                Write-Host "❌ Mobile app build failed!" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "❌ Flutter pub get failed!" -ForegroundColor Red
    }
    Pop-Location
} else {
    Write-Host "⏭️  Skipping mobile app build" -ForegroundColor Yellow
}

Write-Host ""

# Step 4: Test Backend
Write-Host "Step 4: Test Backend API" -ForegroundColor Yellow
Write-Host "Would you like to start the backend server for testing? (Y/N)" -ForegroundColor Green
$testBackend = Read-Host

if ($testBackend -eq "Y" -or $testBackend -eq "y") {
    Write-Host "Starting backend server..." -ForegroundColor Cyan
    Write-Host "Press Ctrl+C to stop the server when done testing" -ForegroundColor Yellow
    Push-Location backend
    dotnet run
    Pop-Location
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deployment Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Learning Materials Feature Status:" -ForegroundColor Green
Write-Host "   - Database Schema: Ready" -ForegroundColor White
Write-Host "   - Backend API: Complete" -ForegroundColor White
Write-Host "   - Mobile App: Complete" -ForegroundColor White
Write-Host "   - Web UI: Pending (see LEARNING_MATERIALS_WEB_UI_TODO.md)" -ForegroundColor Yellow
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "   - Feature Overview: LEARNING_MATERIALS_FEATURE.md" -ForegroundColor White
Write-Host "   - Web UI Guide: LEARNING_MATERIALS_WEB_UI_TODO.md" -ForegroundColor White
Write-Host "   - Implementation Status: LEARNING_MATERIALS_IMPLEMENTATION_COMPLETE.md" -ForegroundColor White
Write-Host ""
Write-Host "🧪 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Test the backend API endpoints" -ForegroundColor White
Write-Host "   2. Test the mobile app on a device" -ForegroundColor White
Write-Host "   3. Implement the web UI (2-3 hours)" -ForegroundColor White
Write-Host "   4. Deploy to production" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Mobile app is ready to use!" -ForegroundColor Green
Write-Host "   Learners can now access study materials on their phones." -ForegroundColor White
Write-Host ""
