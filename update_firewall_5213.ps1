# Run this script as Administrator to ensure port 5213 is accessible

Write-Host "Checking firewall rules for port 5213..." -ForegroundColor Cyan

# Remove old rules if they exist
$oldRules = Get-NetFirewallRule -DisplayName "Backend API Port 5213*" -ErrorAction SilentlyContinue
if ($oldRules) {
    Write-Host "Removing old firewall rules..." -ForegroundColor Yellow
    Remove-NetFirewallRule -DisplayName "Backend API Port 5213*"
}

# Add new inbound rule
Write-Host "Adding inbound firewall rule for port 5213..." -ForegroundColor Green
New-NetFirewallRule -DisplayName "Backend API Port 5213 (Inbound)" `
    -Direction Inbound `
    -LocalPort 5213 `
    -Protocol TCP `
    -Action Allow `
    -Profile Any

# Add new outbound rule
Write-Host "Adding outbound firewall rule for port 5213..." -ForegroundColor Green
New-NetFirewallRule -DisplayName "Backend API Port 5213 (Outbound)" `
    -Direction Outbound `
    -LocalPort 5213 `
    -Protocol TCP `
    -Action Allow `
    -Profile Any

Write-Host "`n✅ Firewall rules updated successfully!" -ForegroundColor Green
Write-Host "Port 5213 is now accessible from your phone." -ForegroundColor Green
