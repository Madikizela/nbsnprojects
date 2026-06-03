
input_file = r"C:\Users\madik\Downloads\nbsnproject (1).sql"
import os
print("Checking file:", input_file)
print("File exists?", os.path.exists(input_file))
if os.path.exists(input_file):
    print("File size:", os.path.getsize(input_file) // 1024, "KB")
    with open(input_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        print(f"Number of lines: {len(lines)}")
        print("First 5 lines:")
        for i, l in enumerate(lines[:5]):
            print(f"  {i+1}. {repr(l)}")
