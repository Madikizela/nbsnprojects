import sys
import os

paths = [
    r"C:\Program Files\PostgreSQL\18\pgAdmin 4\web",
    r"C:\Program Files\PostgreSQL\18\pgAdmin 4\python\Lib\site-packages"
]

for p in paths:
    if os.path.exists(p):
        print(f"Contents of {p}:")
        try:
            print(os.listdir(p))
        except Exception as e:
            print(f"Error listing {p}: {e}")
    else:
        print(f"Path does not exist: {p}")

import site
print("Site packages:", site.getsitepackages())
