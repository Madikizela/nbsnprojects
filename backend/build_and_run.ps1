# PowerShell script to build and run the backend
Write-Host "Building backend project..." -ForegroundColor Green

# Try to find MSBuild
$msbuildPaths = @(
    "${env:ProgramFiles}\Microsoft Visual Studio\2022\Enterprise\MSBuild\Current\Bin\MSBuild.exe",
    "${env:ProgramFiles}\Microsoft Visual Studio\2022\Professional\MSBuild\Current\Bin\MSBuild.exe",
    "${env:ProgramFiles}\Microsoft Visual Studio\2022\Community\MSBuild\Current\Bin\MSBuild.exe",
    "${env:ProgramFiles(x86)}\Microsoft Visual Studio\2019\Enterprise\MSBuild\Current\Bin\MSBuild.exe",
    "${env:ProgramFiles(x86)}\Microsoft Visual Studio\2019\Professional\MSBuild\Current\Bin\MSBuild.exe",
    "${env:ProgramFiles(x86)}\Microsoft Visual Studio\2019\Community\MSBuild\Current\Bin\MSBuild.exe"
)

$msbuild = $null
foreach ($path in $msbuildPaths) {
    if (Test-Path $path) {
        $msbuild = $path
        break
    }
}

if ($msbuild) {
    Write-Host "Found MSBuild at: $msbuild" -ForegroundColor Yellow
    & $msbuild "backend.csproj" /p:Configuration=Debug /p:Platform="Any CPU"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Build successful! Starting backend..." -ForegroundColor Green
        Set-Location "bin\Debug\net9.0"
        & ".\backend.exe"
    } else {
        Write-Host "Build failed!" -ForegroundColor Red
    }
} else {
    Write-Host "MSBuild not found. Trying to run existing executable..." -ForegroundColor Yellow
    Set-Location "bin\Debug\net9.0"
    if (Test-Path "backend.exe") {
        Write-Host "Running existing backend.exe..." -ForegroundColor Green
        & ".\backend.exe"
    } else {
        Write-Host "No backend.exe found!" -ForegroundColor Red
    }
}