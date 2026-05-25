@echo off
echo ========================================
echo Starting NBSN Mobile App on Emulator
echo ========================================
echo.

echo Step 1: Starting Android Emulator...
echo This may take a minute...
echo.

REM Set Android SDK path
set ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk
set PATH=%ANDROID_HOME%\emulator;%ANDROID_HOME%\platform-tools;%PATH%

REM Start emulator in background
start "Android Emulator" "%ANDROID_HOME%\emulator\emulator.exe" -avd flutter_emulator

echo Waiting for emulator to boot (30 seconds)...
timeout /t 30 /nobreak

echo.
echo Step 2: Starting Expo on Android...
echo.

cd mobile
call npx expo start --android

pause
