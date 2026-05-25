# Extract INSERT statements from the SQL file
$sqlFile = "occupational_unit_standards.sql"
$outputFile = "unit_standards_inserts.sql"

# Read the SQL file
$content = Get-Content $sqlFile -Raw

# Extract the INSERT statements using regex
$pattern = 'INSERT INTO `occupational_unit_standards` \([^)]+\) VALUES\s*([^;]+);'
$matches = [regex]::Matches($content, $pattern, [System.Text.RegularExpressions.RegexOptions]::Singleline)

Write-Host "Found $($matches.Count) INSERT statements"

# Process each match and create SQLite-compatible statements
$sqliteStatements = @()
foreach ($match in $matches) {
    $valuesSection = $match.Groups[1].Value
    
    # Replace MySQL-specific syntax
    $sqliteStatement = "INSERT INTO occupational_unit_standards (id, qualification_id, Module_Code, unit_standard_name, module_type, level, credits) VALUES $valuesSection;"
    
    # Remove backticks from table/column names (already done above)
    # Replace enum syntax (SQLite doesn't support ENUM, but we'll keep the values as text)
    
    $sqliteStatements += $sqliteStatement
}

# Write to output file
$sqliteStatements | Set-Content $outputFile

Write-Host "Created $outputFile with $($sqliteStatements.Count) INSERT statements"
Write-Host "First few statements:"
$sqliteStatements | Select-Object -First 3 | ForEach-Object { Write-Host $_ }