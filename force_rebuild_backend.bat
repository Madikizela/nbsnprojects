@echo off
echo ========================================
echo FORCE REBUILD BACKEND
echo ========================================
echo.

echo [1/5] Stopping all backend processes...
taskkill /F /IM backend.exe 2>nul
taskkill /F /IM dotnet.exe /FI "WINDOWTITLE eq *backend*" 2>nul
timeout /t 3 /nobreak >nul

echo [2/5] Cleaning build artifacts...
cd backend
if exist bin rmdir /s /q bin
if exist obj rmdir /s /q obj

echo [3/5] Restoring packages...
dotnet restore

echo [4/5] Building...
dotnet build --no-incremental

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ========================================
    echo BUILD FAILED!
    echo ========================================
    pause
    exit /b 1
)

echo [5/5] Starting backend...
start "Backend Server" dotnet run

echo.
echo ========================================
echo Backend is starting in a new window
echo Wait 10-15 seconds for it to fully start
echo Then try the logbook again
echo ========================================
echo.
pause
