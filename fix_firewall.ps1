# Fix Windows Firewall for Expo/React Native
Write-Host "Adding Windows Firewall rules for Expo Metro Bundler..." -ForegroundColor Green

# Remove old rules if they exist
netsh advfirewall firewall delete rule name="Expo Metro Bundler" 2>$null
netsh advfirewall firewall delete rule name="Expo Dev Server" 2>$null
netsh advfirewall firewall delete rule name="Node.js Server" 2>$null

# Add new rules for Expo ports
Write-Host "`nAdding rule for port 8081 (Metro Bundler)..." -ForegroundColor Yellow
netsh advfirewall firewall add rule name="Expo Metro Bundler" dir=in action=allow protocol=TCP localport=8081

Write-Host "Adding rule for port 19000 (Expo Dev Tools)..." -ForegroundColor Yellow
netsh advfirewall firewall add rule name="Expo Dev Server" dir=in action=allow protocol=TCP localport=19000-19001

Write-Host "Adding rule for port 5213 (Backend API)..." -ForegroundColor Yellow
netsh advfirewall firewall add rule name="Backend API Server" dir=in action=allow protocol=TCP localport=5213

Write-Host "`n✅ Firewall rules added successfully!" -ForegroundColor Green
Write-Host "`nYou can now try connecting from your phone." -ForegroundColor Cyan
Write-Host "Use: exp://192.168.31.166:8081" -ForegroundColor White
