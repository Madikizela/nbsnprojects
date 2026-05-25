# Add firewall rule for Backend API port 5213
Write-Host "Adding firewall rule for port 5213..." -ForegroundColor Cyan

# Remove existing rule if it exists
netsh advfirewall firewall delete rule name="Backend API Port 5213"

# Add inbound rule
netsh advfirewall firewall add rule name="Backend API Port 5213" dir=in action=allow protocol=TCP localport=5213

# Add outbound rule
netsh advfirewall firewall add rule name="Backend API Port 5213 Out" dir=out action=allow protocol=TCP localport=5213

Write-Host "Firewall rules added successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Testing connection..." -ForegroundColor Cyan

# Test if port is listening
$listening = netstat -an | Select-String "5213"
if ($listening) {
    Write-Host "Backend is listening on port 5213" -ForegroundColor Green
} else {
    Write-Host "Backend is NOT listening on port 5213" -ForegroundColor Red
}
