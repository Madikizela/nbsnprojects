# Splits the seed SQL into chunks small enough for Railway's web console
# Output: seed_part1_quals.sql, seed_part2_us_1to3000.sql, seed_part2_us_3001to6000.sql, seed_part2_us_6001to9084.sql

$lines = Get-Content "seed_railway_qualifications.sql"

# Part 1: qualifications only (lines 1 to ~540)
$part1 = @("BEGIN;", "TRUNCATE TABLE legacy_qualifications RESTART IDENTITY CASCADE;", "")
$part1 += $lines | Where-Object { $_ -match "INSERT INTO legacy_qualifications" }
$part1 += ""
$part1 += "SELECT setval('legacy_qualifications_id_seq', (SELECT MAX(id) FROM legacy_qualifications));"
$part1 += "COMMIT;"
$part1 | Out-File "seed_part1_quals.sql" -Encoding utf8
Write-Host "Part 1: $($part1.Count) lines (qualifications)"

# Get all unit standard lines
$usLines = $lines | Where-Object { $_ -match "INSERT INTO legacy_unit_standards" }
$total = $usLines.Count
Write-Host "Total unit standard lines: $total"

# Split into 3 batches of ~3000
$batch1 = $usLines | Select-Object -First 3000
$batch2 = $usLines | Select-Object -Skip 3000 -First 3000
$batch3 = $usLines | Select-Object -Skip 6000

# Part 2a
$part2a = @("BEGIN;")
if ((& { $r = Invoke-Expression ""; $r }) -eq $null) {}
# Add truncate only in first batch
$part2a += "TRUNCATE TABLE legacy_unit_standards RESTART IDENTITY CASCADE;"
$part2a += ""
$part2a += $batch1
$part2a += "COMMIT;"
$part2a | Out-File "seed_part2a_us.sql" -Encoding utf8
Write-Host "Part 2a: $($batch1.Count) unit standards"

# Part 2b
$part2b = @("BEGIN;")
$part2b += $batch2
$part2b += "COMMIT;"
$part2b | Out-File "seed_part2b_us.sql" -Encoding utf8
Write-Host "Part 2b: $($batch2.Count) unit standards"

# Part 2c
$part2c = @("BEGIN;")
$part2c += $batch3
$part2c += ""
$part2c += "SELECT setval('legacy_unit_standards_id_seq', (SELECT MAX(id) FROM legacy_unit_standards));"
$part2c += "COMMIT;"
$part2c | Out-File "seed_part2c_us.sql" -Encoding utf8
Write-Host "Part 2c: $($batch3.Count) unit standards"

Write-Host "`nDone! 4 files created. Run them in order in Railway Database console."
