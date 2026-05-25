# Fix DateTime.UtcNow to use DateTime.SpecifyKind for PostgreSQL compatibility

$files = @(
    "Controllers\DepartmentsController.cs",
    "Controllers\SkillsDevelopmentProvidersController.cs", 
    "Controllers\AuthController.cs",
    "Controllers\UsersController.cs",
    "Controllers\TestController.cs",
    "Controllers\ModulesController.cs",
    "Controllers\LessonsController.cs",
    "Controllers\DocumentsController.cs",
    "Controllers\ClientsController.cs",
    "Controllers\CoursesController.cs"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Fixing $file..."
        $content = Get-Content $file -Raw
        $content = $content -replace 'DateTime\.UtcNow', 'DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc)'
        Set-Content $file -Value $content -NoNewline
    }
}

Write-Host "DateTime fixes completed!"
