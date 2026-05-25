# Test login with correct credentials
$body = @{
    email = "admin@system.local"
    password = "Admin@123!System"
} | ConvertTo-Json

Write-Host "Testing login with credentials: admin@system.local / Admin@123!System"

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -Body $body -ContentType "application/json"
    Write-Host "Login successful!"
    Write-Host "Response: $($response | ConvertTo-Json -Depth 10)"
} catch {
    Write-Host "Login failed!"
    Write-Host "Status Code: $($_.Exception.Response.StatusCode)"
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $reader.DiscardBufferedData()
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody"
    }
}