# Extract legacy unit standards INSERT statements and convert to SQLite format
$inputFile = "legacy_unit_standards_new.sql"
$outputFile = "legacy_unit_standards_inserts.sql"

Write-Host "Extracting legacy unit standards INSERT statements..."

# Read the SQL file
$sqlContent = Get-Content $inputFile -Raw

# Extract all value tuples from the INSERT statements
$pattern = '\((\d+),\s*(\d+|NULL),\s*(\d+|NULL),\s*''([^'']*)'',\s*''([^'']*)'',\s*(\d+|NULL),\s*(\d+|NULL)\)'
$matches = [regex]::Matches($sqlContent, $pattern, [System.Text.RegularExpressions.RegexOptions]::Singleline)

Write-Host "Found $($matches.Count) value tuples"

$insertStatements = @()

foreach ($match in $matches) {
    $id = $match.Groups[1].Value
    $unitstandard_id = if ($match.Groups[2].Value -eq 'NULL') { 'NULL' } else { $match.Groups[2].Value }
    $qualification_id = if ($match.Groups[3].Value -eq 'NULL') { 'NULL' } else { $match.Groups[3].Value }
    $unit_standard_name = $match.Groups[4].Value.Replace("'", "''")  # Escape single quotes
    $level = $match.Groups[5].Value.Replace("'", "''")  # Escape single quotes
    $credits = if ($match.Groups[6].Value -eq 'NULL') { 'NULL' } else { $match.Groups[6].Value }
    $synced = if ($match.Groups[7].Value -eq 'NULL') { 'NULL' } else { $match.Groups[7].Value }
    
    # Create SQLite-compatible INSERT statement
    $insertStatement = "INSERT INTO LegacyUnitStandard (id, unitStandardId, qualificationId, unitStandardName, level, credits, synced) VALUES ($id, $unitstandard_id, $qualification_id, '$unit_standard_name', '$level', $credits, $synced);"
    $insertStatements += $insertStatement
}

# Write to output file
$insertStatements | Out-File $outputFile -Encoding UTF8

Write-Host "Extracted $($insertStatements.Count) INSERT statements to $outputFile"

# Show first few lines as sample
Write-Host "`nSample INSERT statements:"
$insertStatements[0..4] | ForEach-Object { Write-Host $_ }