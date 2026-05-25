@echo off
echo Cleaning up and restarting backend...
echo.

echo Step 1: Stopping backend...
taskkill /F /IM backend.exe 2>nul
taskkill /F /IM dotnet.exe 2>nul
timeout /t 2 /nobreak >nul

echo Step 2: Deleting ALL SQLite databases...
del "C:\Users\madik\Documents\New_version\backend\skills_development.db" 2>nul
del "C:\Users\madik\Documents\New_version\backend\bin\Debug\net9.0\skills_development.db" 2>nul
del "C:\Users\madik\Documents\New_version\skills_development.db" 2>nul
echo ✓ SQLite databases deleted

echo.
echo Step 3: Starting backend with PostgreSQL...
cd /d "C:\Users\madik\Documents\New_version\backend"
"C:\Program Files\dotnet\dotnet.exe" run

pause
