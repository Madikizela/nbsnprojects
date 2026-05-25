# PowerShell script to query SQLite database directly
Add-Type -Path "System.Data.SQLite.dll"

# Set the database path
$dbPath = "C:\Users\madik\Documents\New_version\backend\skills_development.db"

# Create connection string
$connectionString = "Data Source=$dbPath;Version=3;"

# Create connection
$connection = New-Object System.Data.SQLite.SQLiteConnection($connectionString)

try {
    $connection.Open()
    
    # Query for qualification_id 91761
    $query = "SELECT COUNT(*) FROM occupational_unit_standards WHERE qualification_id = '91761'"
    $command = New-Object System.Data.SQLite.SQLiteCommand($query, $connection)
    $count = $command.ExecuteScalar()
    Write-Host "Records with qualification_id '91761': $count"
    
    # Get sample records
    $query = "SELECT id, qualification_id, unit_standard_name FROM occupational_unit_standards WHERE qualification_id = '91761' LIMIT 3"
    $command = New-Object System.Data.SQLite.SQLiteCommand($query, $connection)
    $reader = $command.ExecuteReader()
    
    Write-Host "Sample records:"
    while ($reader.Read()) {
        Write-Host "ID: $($reader['id']), QualificationID: $($reader['qualification_id']), Name: $($reader['unit_standard_name'])"
    }
    $reader.Close()
    
    # Check table schema
    $query = "PRAGMA table_info(occupational_unit_standards)"
    $command = New-Object System.Data.SQLite.SQLiteCommand($query, $connection)
    $reader = $command.ExecuteReader()
    
    Write-Host "Table schema:"
    while ($reader.Read()) {
        Write-Host "Column: $($reader['name']), Type: $($reader['type'])"
    }
    $reader.Close()
    
} catch {
    Write-Host "Error: $($_.Exception.Message)"
} finally {
    $connection.Close()
}