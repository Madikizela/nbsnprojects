# PowerShell script to import occupational unit standards from SQL file

# Read the SQL file
$sqlContent = Get-Content "occupational_unit_standards.sql" -Raw

# Extract INSERT statements with a better pattern
$insertPattern = "INSERT INTO `occupational_unit_standards`.*?VALUES\\s*\\((.*?)\\);"
$inserts = [regex]::Matches($sqlContent, $insertPattern, [System.Text.RegularExpressions.RegexOptions]::Singleline)

Write-Output "Found $($inserts.Count) INSERT statements"

# Parse each INSERT statement and extract values
$unitStandards = @()

foreach ($insert in $inserts) {
    $values = $insert.Groups[1].Value
    
    # Split values by comma, but handle quoted strings properly
    $parsedValues = @()
    $current = ""
    $inQuotes = $false
    
    for ($i = 0; $i -lt $values.Length; $i++) {
        $char = $values[$i]
        
        if ($char -eq "'" -and ($i -eq 0 -or $values[$i-1] -ne "\\")) {
            $inQuotes = -not $inQuotes
        }
        
        if ($char -eq "," -and -not $inQuotes) {
            $parsedValues += $current.Trim()
            $current = ""
        } else {
            $current += $char
        }
    }
    $parsedValues += $current.Trim()
    
    if ($parsedValues.Count -ge 7) {
        $unitStandard = @{
            id = $parsedValues[0].Trim("'")
            qualification_id = $parsedValues[1].Trim("'")
            Module_Code = $parsedValues[2].Trim("'")
            unit_standard_name = $parsedValues[3].Trim("'")
            module_type = $parsedValues[4].Trim("'")
            level = $parsedValues[5].Trim("'")
            credits = $parsedValues[6].Trim("'")
        }
        $unitStandards += $unitStandard
    }
}

Write-Output "Parsed $($unitStandards.Count) unit standards"

# Create SQL statements for SQLite
$sqliteStatements = @()
foreach ($us in $unitStandards) {
    # Escape single quotes in the unit standard name
    $escapedName = $us.unit_standard_name -replace "'", "''"
    $sql = "INSERT INTO occupational_unit_standards (id, qualification_id, Module_Code, unit_standard_name, module_type, level, credits) VALUES ($($us.id), '$($us.qualification_id)', '$($us.Module_Code)', '$escapedName', '$($us.module_type)', '$($us.level)', $($us.credits));"
    $sqliteStatements += $sql
}

# Save to file
$sqliteStatements | Out-File "unit_standards_sqlite.sql" -Encoding UTF8
Write-Output "Created SQLite import file with $($sqliteStatements.Count) statements"