# Add Windows Firewall Rules for Mobile Debugging
# Run as Administrator

Write-Host "Adding Windows Firewall rules for mobile debugging..." -ForegroundColor Cyan

# Add rule for Backend API (port 5213)
netsh advfirewall firewall add rule name="NBSN Backend API - Mobile Debug" dir=in action=allow protocol=TCP localport=5213
Write-Host "✅ Backend API port 5213 allowed" -ForegroundColor Green

# Add rule for Frontend (port 5174)
netsh advfirewall firewall add rule name="NBSN Frontend - Mobile Debug" dir=in action=allow protocol=TCP localport=5174
Write-Host "✅ Frontend port 5174 allowed" -ForegroundColor Green

Write-Host "`n✅ Firewall rules added successfully!" -ForegroundColor Green
Write-Host "Your mobile device can now access:" -ForegroundColor Yellow
Write-Host "  - Frontend: http://192.168.0.68:5174" -ForegroundColor White
Write-Host "  - Backend:  http://192.168.0.68:5213" -ForegroundColor White
Write-Host "`nMake sure your mobile device is on the same Wi-Fi network!" -ForegroundColor Cyan
