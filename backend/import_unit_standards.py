import sqlite3
import os

def import_unit_standards():
    """Import unit standards data into SQLite database"""
    
    # Database file path
    db_path = "skills_development.db"
    
    # Check if database exists
    if not os.path.exists(db_path):
        print(f"Database not found: {db_path}")
        return False
    
    try:
        # Connect to the database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if the table exists
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='occupational_unit_standards'
        """)
        
        if not cursor.fetchone():
            print("occupational_unit_standards table does not exist")
            return False
        
        # Read the INSERT statements
        with open("unit_standards_inserts.sql", "r", encoding="utf-8") as f:
            sql_content = f.read()
        
        # Split into individual INSERT statements
        statements = sql_content.strip().split(';')
        
        # Execute each INSERT statement
        imported_count = 0
        for statement in statements:
            statement = statement.strip()
            if statement and statement.startswith('INSERT'):
                try:
                    cursor.execute(statement)
                    imported_count += 1
                except Exception as e:
                    print(f"Error executing statement: {statement[:100]}...")
                    print(f"Error: {e}")
        
        # Commit the changes
        conn.commit()
        print(f"Successfully imported {imported_count} unit standards")
        
        # Verify the import by checking some data
        cursor.execute("SELECT COUNT(*) FROM occupational_unit_standards")
        total_count = cursor.fetchone()[0]
        print(f"Total unit standards in database: {total_count}")
        
        # Show a sample of the data
        cursor.execute("SELECT * FROM occupational_unit_standards LIMIT 5")
        sample_data = cursor.fetchall()
        print("\nSample data:")
        for row in sample_data:
            print(f"ID: {row[0]}, QualID: {row[1]}, Code: {row[2]}, Name: {row[3][:50]}...")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"Error importing data: {e}")
        return False

if __name__ == "__main__":
    import_unit_standards()