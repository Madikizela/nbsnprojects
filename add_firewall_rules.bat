@echo off
echo ========================================
echo Adding Windows Firewall Rules for Expo
echo ========================================
echo.
echo This will allow Expo and Backend through Windows Firewall
echo.

REM Check for admin rights
net session >nul 2>&1
if %errorLevel% == 0 (
    echo Running as Administrator...
    echo.
    
    echo Adding rule for Expo Metro Bundler (port 8081)...
    netsh advfirewall firewall add rule name="Expo Metro Bundler" dir=in action=allow protocol=TCP localport=8081
    
    echo Adding rule for Expo Dev Tools (ports 19000-19001)...
    netsh advfirewall firewall add rule name="Expo Dev Tools" dir=in action=allow protocol=TCP localport=19000-19001
    
    echo Adding rule for Backend API (port 5213)...
    netsh advfirewall firewall add rule name="Backend API Server" dir=in action=allow protocol=TCP localport=5213
    
    echo.
    echo ========================================
    echo SUCCESS! Firewall rules added.
    echo ========================================
    echo.
    echo You can now connect from your phone!
    echo Use: exp://192.168.31.166:8081
    echo.
) else (
    echo ERROR: This script must be run as Administrator!
    echo.
    echo Right-click this file and select "Run as administrator"
    echo.
)

pause
