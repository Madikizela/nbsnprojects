@echo off
echo Switching to PostgreSQL...
echo.

echo Step 1: Stopping backend...
taskkill /F /IM backend.exe 2>nul
taskkill /F /IM dotnet.exe 2>nul
timeout /t 2 /nobreak >nul

echo Step 2: Deleting SQLite database...
cd /d "C:\Users\madik\Documents\New_version\backend"
if exist "skills_development.db" (
    del "skills_development.db"
    echo ✓ Deleted skills_development.db
) else (
    echo - SQLite database not found
)

echo.
echo Step 3: Starting backend with PostgreSQL...
cd /d "C:\Users\madik\Documents\New_version\backend"
start "RLMS Backend" "C:\Program Files\dotnet\dotnet.exe" run

echo.
echo ✓ Backend is starting with PostgreSQL
echo   Check the new window for startup logs
echo.
pause
