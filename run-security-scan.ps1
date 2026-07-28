# Quick Security Scan Script
# Run this to perform local security checks

Write-Host "🔒 NBSN Projects Security Scan" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if Snyk is installed
Write-Host "📦 Checking Snyk installation..." -ForegroundColor Yellow
if (Get-Command snyk -ErrorAction SilentlyContinue) {
    Write-Host "✅ Snyk is installed" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "🔍 Scanning Frontend dependencies..." -ForegroundColor Yellow
    Set-Location frontend
    snyk test --severity-threshold=medium
    Set-Location ..
    
    Write-Host ""
    Write-Host "🔍 Scanning Backend dependencies..." -ForegroundColor Yellow
    Set-Location backend
    snyk test --file=backend.csproj --severity-threshold=medium
    Set-Location ..
    
    Write-Host ""
    Write-Host "🔍 Running Snyk Code analysis..." -ForegroundColor Yellow
    snyk code test
} else {
    Write-Host "⚠️  Snyk not installed. Install with: npm install -g snyk" -ForegroundColor Red
    Write-Host "   Then authenticate with: snyk auth" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📊 Checking npm audit..." -ForegroundColor Yellow
Set-Location frontend
$npmAudit = npm audit --json | ConvertFrom-Json
if ($npmAudit.metadata.vulnerabilities.total -gt 0) {
    Write-Host "⚠️  Found $($npmAudit.metadata.vulnerabilities.total) vulnerabilities in frontend" -ForegroundColor Red
    Write-Host "   Critical: $($npmAudit.metadata.vulnerabilities.critical)" -ForegroundColor Red
    Write-Host "   High: $($npmAudit.metadata.vulnerabilities.high)" -ForegroundColor Red
    Write-Host "   Medium: $($npmAudit.metadata.vulnerabilities.moderate)" -ForegroundColor Yellow
    Write-Host "   Low: $($npmAudit.metadata.vulnerabilities.low)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Run 'npm audit fix' to fix automatically" -ForegroundColor Cyan
} else {
    Write-Host "✅ No vulnerabilities found in frontend dependencies" -ForegroundColor Green
}
Set-Location ..

Write-Host ""
Write-Host "🔍 Checking for common security issues..." -ForegroundColor Yellow

# Check for hardcoded secrets
Write-Host "   - Checking for hardcoded passwords/secrets..." -ForegroundColor Gray
$secretPatterns = @(
    "password\s*=\s*['""][^'""]+['""]",
    "api[_-]?key\s*=\s*['""][^'""]+['""]",
    "secret\s*=\s*['""][^'""]+['""]",
    "token\s*=\s*['""][^'""]+['""]"
)

$foundSecrets = $false
foreach ($pattern in $secretPatterns) {
    $results = Get-ChildItem -Recurse -Include *.cs,*.tsx,*.ts,*.js -Exclude node_modules,bin,obj | 
        Select-String -Pattern $pattern -CaseSensitive:$false
    
    if ($results) {
        $foundSecrets = $true
        Write-Host "   ⚠️  Potential hardcoded secrets found:" -ForegroundColor Red
        $results | ForEach-Object {
            Write-Host "      $($_.Filename):$($_.LineNumber)" -ForegroundColor Red
        }
    }
}

if (-not $foundSecrets) {
    Write-Host "   ✅ No obvious hardcoded secrets detected" -ForegroundColor Green
}

# Check for SQL injection risks
Write-Host "   - Checking for potential SQL injection risks..." -ForegroundColor Gray
$sqlPatterns = @(
    'string\.Format.*SELECT',
    '\$".*SELECT.*\{',
    '\+ "SELECT'
)

$foundSqlRisks = $false
foreach ($pattern in $sqlPatterns) {
    $results = Get-ChildItem -Recurse -Include *.cs -Exclude node_modules,bin,obj | 
        Select-String -Pattern $pattern
    
    if ($results) {
        $foundSqlRisks = $true
        Write-Host "   ⚠️  Potential SQL injection risk:" -ForegroundColor Red
        $results | Select-Object -First 5 | ForEach-Object {
            Write-Host "      $($_.Filename):$($_.LineNumber)" -ForegroundColor Red
        }
    }
}

if (-not $foundSqlRisks) {
    Write-Host "   ✅ No obvious SQL injection patterns detected" -ForegroundColor Green
}

# Check for XSS risks
Write-Host "   - Checking for potential XSS risks..." -ForegroundColor Gray
$xssPatterns = @(
    'dangerouslySetInnerHTML',
    'v-html',
    'innerHTML\s*='
)

$foundXssRisks = $false
foreach ($pattern in $xssPatterns) {
    $results = Get-ChildItem -Recurse -Include *.tsx,*.jsx,*.ts,*.js -Exclude node_modules | 
        Select-String -Pattern $pattern
    
    if ($results) {
        $foundXssRisks = $true
        Write-Host "   ⚠️  Potential XSS risk:" -ForegroundColor Yellow
        $results | Select-Object -First 5 | ForEach-Object {
            Write-Host "      $($_.Filename):$($_.LineNumber)" -ForegroundColor Yellow
        }
    }
}

if (-not $foundXssRisks) {
    Write-Host "   ✅ No obvious XSS patterns detected" -ForegroundColor Green
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "🎯 Scan Summary" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Quick security scan completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Recommendations:" -ForegroundColor Yellow
Write-Host "   1. Review any warnings above" -ForegroundColor White
Write-Host "   2. Run 'npm audit fix' in frontend folder" -ForegroundColor White
Write-Host "   3. Check GitHub Actions for full scan results" -ForegroundColor White
Write-Host "   4. Install and run Snyk for comprehensive analysis" -ForegroundColor White
Write-Host ""
Write-Host "🔗 View detailed results in:" -ForegroundColor Cyan
Write-Host "   - GitHub Actions: https://github.com/Madikizela/nbsnprojects/actions" -ForegroundColor White
Write-Host "   - Security tab: https://github.com/Madikizela/nbsnprojects/security" -ForegroundColor White
Write-Host ""
