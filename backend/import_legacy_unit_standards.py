import sqlite3
import os

def import_legacy_unit_standards():
    """Import legacy unit standards from SQL file into the database"""
    
    # Database path
    db_path = 'skills_development.db'
    sql_file = 'legacy_unit_standards_inserts.sql'
    
    # Check if database exists
    if not os.path.exists(db_path):
        print(f"Error: Database {db_path} not found!")
        return False
    
    # Check if SQL file exists
    if not os.path.exists(sql_file):
        print(f"Error: SQL file {sql_file} not found!")
        return False
    
    try:
        # Connect to database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if LegacyUnitStandard table exists
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='LegacyUnitStandard'
        """)
        
        if not cursor.fetchone():
            print("LegacyUnitStandard table does not exist. Creating it...")
            cursor.execute('''
                CREATE TABLE LegacyUnitStandard (
                    id INTEGER PRIMARY KEY,
                    unitStandardId INTEGER,
                    qualificationId INTEGER,
                    unitStandardName TEXT,
                    level TEXT,
                    credits INTEGER,
                    synced INTEGER
                )
            ''')
            print("LegacyUnitStandard table created successfully!")
        
        # Read and execute the SQL file
        print("Reading SQL file...")
        with open(sql_file, 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        # Split into individual INSERT statements
        insert_statements = [stmt.strip() for stmt in sql_content.split(';') if stmt.strip()]
        
        print(f"Found {len(insert_statements)} INSERT statements to execute")
        
        # Execute each INSERT statement
        success_count = 0
        error_count = 0
        
        for i, statement in enumerate(insert_statements):
            try:
                if statement:  # Skip empty statements
                    cursor.execute(statement)
                    success_count += 1
                    if (i + 1) % 1000 == 0:
                        print(f"Progress: {i + 1}/{len(insert_statements)} statements executed")
            except sqlite3.Error as e:
                error_count += 1
                print(f"Error executing statement {i + 1}: {e}")
                print(f"Statement: {statement[:100]}...")
        
        # Commit the changes
        conn.commit()
        
        print(f"\nImport completed!")
        print(f"Successfully executed: {success_count} statements")
        print(f"Errors: {error_count}")
        
        # Verify the import by counting records
        cursor.execute("SELECT COUNT(*) FROM LegacyUnitStandard")
        total_records = cursor.fetchone()[0]
        print(f"Total records in LegacyUnitStandard table: {total_records}")
        
        # Show a few sample records
        print("\nSample records:")
        cursor.execute("SELECT * FROM LegacyUnitStandard LIMIT 5")
        samples = cursor.fetchall()
        for record in samples:
            print(f"ID: {record[0]}, Unit Standard ID: {record[1]}, Name: {record[3][:50]}...")
        
        cursor.close()
        conn.close()
        
        return True
        
    except Exception as e:
        print(f"Error importing legacy unit standards: {e}")
        return False

if __name__ == "__main__":
    print("Starting legacy unit standards import...")
    success = import_legacy_unit_standards()
    if success:
        print("Legacy unit standards import completed successfully!")
    else:
        print("Legacy unit standards import failed!")