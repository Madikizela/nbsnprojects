import sqlite3
import json

# Connect to the database
conn = sqlite3.connect('backend/skills_development.db')
cursor = conn.cursor()

# Test query for qualification_id 91761
cursor.execute("SELECT COUNT(*) FROM occupational_unit_standards WHERE qualification_id = '91761'")
count = cursor.fetchone()[0]
print(f"Records with qualification_id '91761': {count}")

# Get all distinct qualification_id values
cursor.execute("SELECT DISTINCT qualification_id FROM occupational_unit_standards LIMIT 10")
distinct_ids = cursor.fetchall()
print(f"Sample qualification_ids: {distinct_ids}")

# Get actual data for 91761
cursor.execute("SELECT id, qualification_id, unit_standard_name FROM occupational_unit_standards WHERE qualification_id = '91761' LIMIT 5")
records = cursor.fetchall()
print(f"Sample records for 91761: {records}")

conn.close()