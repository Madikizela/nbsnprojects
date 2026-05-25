@echo off
echo ========================================
echo Flutter Mobile App Launcher
echo ========================================
echo.
echo Current Configuration:
echo - Backend: http://192.168.31.166:5213
echo - Device: Samsung A155F
echo - Credentials: admin@system.local / Admin@123
echo.
echo Starting Flutter app in RELEASE mode...
echo.

cd mobile_flutter
flutter run --release

pause
