$output = @()
$output += "-- Railway PostgreSQL Seed: Qualifications & Unit Standards"
$output += "BEGIN;"
$output += ""
$output += "-- Legacy Qualifications"
$output += "TRUNCATE TABLE legacy_qualifications RESTART IDENTITY CASCADE;"
$output += ""

# Parse legacy qualifications from MySQL dump
Write-Host "Parsing legacy qualifications..."
$qualContent = Get-Content "legacy_qualifications_import.sql" -Raw
$matches = [regex]::Matches($qualContent, '\((\d+),\s*(\d+),\s*''((?:[^''\\]|'''')*)'',\s*''((?:[^''\\]|'''')*)'',\s*''((?:[^''\\]|'''')*)'',\s*(\d+),\s*''((?:[^''\\]|'''')*)'',\s*''((?:[^''\\]|'''')*)''\)')
$qualCount = 0
foreach ($m in $matches) {
    $id    = $m.Groups[1].Value
    $qid   = $m.Groups[2].Value
    $name  = $m.Groups[3].Value -replace "'", "''"
    $desc  = $m.Groups[4].Value -replace "'", "''"
    $level = $m.Groups[5].Value -replace "'", "''"
    $cred  = $m.Groups[6].Value
    $type  = $m.Groups[7].Value -replace "'", "''"
    $cat   = $m.Groups[8].Value
    $output += "INSERT INTO legacy_qualifications (id, qualification_id, name, description, level, credits, qualification_type, has_cat) VALUES ($id, $qid, '$name', '$desc', '$level', $cred, '$type', '$cat') ON CONFLICT (id) DO NOTHING;"
    $qualCount++
}
Write-Host "  Found $qualCount qualifications"

$output += ""
$output += "SELECT setval('legacy_qualifications_id_seq', (SELECT MAX(id) FROM legacy_qualifications));"
$output += ""
$output += "-- Legacy Unit Standards"
$output += "TRUNCATE TABLE legacy_unit_standards RESTART IDENTITY CASCADE;"
$output += ""

# Parse legacy unit standards (already clean INSERT format)
Write-Host "Parsing legacy unit standards..."
$usLines = Get-Content "legacy_unit_standards_inserts.sql"
$usCount = 0
foreach ($line in $usLines) {
    if ($line -match "^INSERT INTO LegacyUnitStandard") {
        $line = $line -replace "INSERT INTO LegacyUnitStandard \(id, unitStandardId, qualificationId, unitStandardName, level, credits, synced\)",
                               "INSERT INTO legacy_unit_standards (id, unitstandard_id, qualification_id, unit_standard_name, level, credits, synced)"
        $line = $line.TrimEnd(';') + " ON CONFLICT (id) DO NOTHING;"
        $output += $line
        $usCount++
    }
}
Write-Host "  Found $usCount unit standards"

$output += ""
$output += "SELECT setval('legacy_unit_standards_id_seq', (SELECT MAX(id) FROM legacy_unit_standards));"
$output += ""
$output += "COMMIT;"
$output += ""
$output += "-- Summary: $qualCount qualifications, $usCount unit standards"

$output | Out-File -FilePath "seed_railway_qualifications.sql" -Encoding utf8
Write-Host "`nDone! Written to seed_railway_qualifications.sql"
Write-Host "Qualifications: $qualCount  |  Unit Standards: $usCount"
