
import psycopg2
from urllib.parse import urlparse

print("Testing Railway database connection...")
railway_connection_string = "postgresql://postgres:HsHDTqivYAtEBXKhRbnWqWxEWVjsLFLO@kodama.proxy.rlwy.net:37095/railway"
url = urlparse(railway_connection_string)
conn_params = {
    "host": url.hostname,
    "port": url.port,
    "database": url.path[1:],
    "user": url.username,
    "password": url.password
}
print("Connection params:", conn_params)

try:
    print("Connecting...")
    conn = psycopg2.connect(**conn_params)
    print("Connection successful!")
    cur = conn.cursor()
    
    print("\nTesting query: SELECT NOW()")
    cur.execute("SELECT NOW()")
    res = cur.fetchone()
    print("Current time:", res)

    cur.close()
    conn.close()
    print("\nAll tests passed!")
except Exception as e:
    print("ERROR:", type(e))
    print("Error message:", str(e))
    import traceback
    print("\nStack trace:")
    traceback.print_exc()
