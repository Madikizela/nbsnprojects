@echo off
echo Resetting admin password to Admin@123...
cd /d "C:\Users\madik\Documents\New_version\backend"
"C:\Program Files\dotnet\dotnet.exe" run --no-build -- reset-admin-password
