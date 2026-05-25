@echo off
echo ========================================
echo NUCLEAR OPTION - COMPLETE REBUILD
echo ========================================
echo.

echo [1/6] Killing ALL .NET processes...
taskkill /F /IM backend.exe 2>nul
taskkill /F /IM dotnet.exe 2>nul
timeout /t 3 /nobreak >nul

echo [2/6] Cleaning backend build artifacts...
cd backend
if exist bin rmdir /s /q bin
if exist obj rmdir /s /q obj

echo [3/6] Cleaning NuGet cache for this project...
dotnet nuget locals all --clear

echo [4/6] Restoring packages...
dotnet restore --force

echo [5/6] Building with full rebuild...
dotnet build --no-incremental --force

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ========================================
    echo BUILD FAILED!
    echo ========================================
    cd ..
    pause
    exit /b 1
)

echo [6/6] Starting backend...
echo.
echo ========================================
echo Backend starting...
echo Watch for the debug output when you
echo try to add a logbook entry
echo ========================================
echo.

dotnet run

cd ..
