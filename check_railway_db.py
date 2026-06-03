
import psycopg2
from urllib.parse import urlparse

def parse_connection_string(connection_string):
    url = urlparse(connection_string)
    return {
        "host": url.hostname,
        "port": url.port,
        "database": url.path[1:],
        "user": url.username,
        "password": url.password
    }

railway_connection_string = "postgresql://postgres:HsHDTqivYAtEBXKhRbnWqWxEWVjsLFLO@kodama.proxy.rlwy.net:37095/railway"
conn_params = parse_connection_string(railway_connection_string)

print(f"Connecting to Railway database...")
conn = psycopg2.connect(**conn_params)
cur = conn.cursor()

print("\nList of all tables:")
cur.execute("""
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name;
""")
tables = cur.fetchall()
for tbl in tables:
    print(f"  - {tbl[0]}")

cur.close()
conn.close()

