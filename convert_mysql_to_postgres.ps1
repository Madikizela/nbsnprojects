
# MySQL to PostgreSQL conversion script
$inputPath = "C:\Users\madik\Downloads\nbsnproject (1).sql"
$outputPath = "c:\Users\madik\Documents\New_version\db_backups\nbsnproject_postgres.sql"

Write-Host "Reading input file..."
$sql = Get-Content $inputPath -Raw

Write-Host "Converting MySQL to PostgreSQL..."

# Step 1: Remove MySQL-specific comments /*! ... */
$sql = [regex]::Replace($sql, "/\*!\d+\s", "")
$sql = [regex]::Replace($sql, "\*/", "")

# Step 2: Replace backticks with double quotes
$sql = $sql.Replace("``", "`"")

# Step 3: Remove ENGINE=InnoDB and other MySQL table options
$sql = [regex]::Replace($sql, "\)\s*ENGINE=\w+.*?;", ");")

# Step 4: Replace int(N) with int
$sql = [regex]::Replace($sql, "int\(\d+\)", "int")

# Step 5: Replace longtext with text
$sql = $sql.Replace("longtext", "text")

# Step 6: Replace datetime(6) with timestamp(6)
$sql = $sql.Replace("datetime(6)", "timestamp(6)")
$sql = $sql.Replace("datetime", "timestamp")

# Step 7: Replace DEFAULT current_timestamp() with DEFAULT current_timestamp
$sql = $sql.Replace("DEFAULT current_timestamp()", "DEFAULT current_timestamp")
$sql = $sql.Replace("DEFAULT CURRENT_TIMESTAMP()", "DEFAULT current_timestamp")
$sql = $sql.Replace("DEFAULT NULL", "NULL")

# Step 8: Remove ON UPDATE current_timestamp()
$sql = [regex]::Replace($sql, "ON UPDATE current_timestamp\(\)", "", [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
$sql = [regex]::Replace($sql, "ON UPDATE CURRENT_TIMESTAMP", "", [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)

# Step 9: Remove SET statements and START TRANSACTION/COMMIT
$sql = [regex]::Replace($sql, "(?m)^SET .*?;$", "")
$sql = [regex]::Replace($sql, "(?m)^START TRANSACTION;$", "")
$sql = [regex]::Replace($sql, "(?m)^COMMIT;$", "")
$sql = [regex]::Replace($sql, "(?m)^USE .*?;$", "")
$sql = [regex]::Replace($sql, "(?m)^-- Database:.*$", "")
$sql = [regex]::Replace($sql, "(?m)^-- --------------------------------------------------------$", "")
$sql = [regex]::Replace($sql, "(?m)^--$", "")
$sql = [regex]::Replace($sql, "(?m)^-- Table structure for table.*$", "")
$sql = [regex]::Replace($sql, "(?m)^-- Dumping data for table.*$", "")

# Step 10: Handle AUTO_INCREMENT
# For tables that have Id column with AUTO_INCREMENT, replace with SERIAL or GENERATED AS IDENTITY
# Let's first extract all CREATE TABLE statements and process them
$createTableMatches = [regex]::Matches($sql, "(CREATE TABLE\s+""?[\w]+""?\s*\([\s\S]*?\);)", [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
foreach ($match in $createTableMatches) {
    $originalCreate = $match.Value
    $modifiedCreate = $originalCreate
    # Look for Id with AUTO_INCREMENT or just Id int NOT NULL
    if ($modifiedCreate -match "`"Id`"\s+int\s+NOT NULL\s+AUTO_INCREMENT") {
        $modifiedCreate = $modifiedCreate.Replace("`"Id`" int NOT NULL AUTO_INCREMENT", "`"Id`" serial PRIMARY KEY")
    } elseif ($modifiedCreate -match "`"Id`"\s+int\s+NOT NULL") {
        $modifiedCreate = $modifiedCreate.Replace("`"Id`" int NOT NULL", "`"Id`" serial PRIMARY KEY")
    }
    $sql = $sql.Replace($originalCreate, $modifiedCreate)
}

# Step 11: Remove COLLATE and CHARSET
$sql = [regex]::Replace($sql, "COLLATE\s+\w+", "")
$sql = [regex]::Replace($sql, "CHARSET=\w+", "")
$sql = [regex]::Replace($sql, "CHARACTER SET\s+\w+", "")

# Step 12: Replace tinyint with smallint
$sql = $sql.Replace("tinyint", "smallint")

# Step 13: Keep Id column in INSERT statements—we'll fix the sequences later!

# Step 14: Remove extra newlines
$sql = [regex]::Replace($sql, "`n{3,}", "`n`n")

Write-Host "Writing output file..."
Set-Content -Path $outputPath -Value $sql -Encoding UTF8

Write-Host "Done! Converted file saved to $outputPath"
