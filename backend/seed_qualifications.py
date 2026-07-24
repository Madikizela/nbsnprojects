"""
Converts MySQL dump files to PostgreSQL INSERT statements for Railway.
Run: python seed_qualifications.py
Output: seed_railway_qualifications.sql  (run this against Railway DB)
"""
import re, sys

def clean_string(s):
    """Escape single quotes for PostgreSQL"""
    return s.replace("'", "''")

def parse_mysql_values(line):
    """Parse a MySQL VALUES line into a list of values"""
    # Remove leading/trailing parens and whitespace
    line = line.strip().rstrip(',').rstrip(';')
    if line.startswith('('):
        line = line[1:]
    if line.endswith(')'):
        line = line[:-1]
    
    values = []
    current = ''
    in_string = False
    i = 0
    while i < len(line):
        c = line[i]
        if c == "'" and not in_string:
            in_string = True
            current += c
        elif c == "'" and in_string:
            # Check for escaped quote
            if i + 1 < len(line) and line[i+1] == "'":
                current += "''"
                i += 2
                continue
            in_string = False
            current += c
        elif c == ',' and not in_string:
            values.append(current.strip())
            current = ''
        else:
            current += c
        i += 1
    if current.strip():
        values.append(current.strip())
    return values

output_lines = [
    "-- Railway PostgreSQL Seed: Qualifications & Unit Standards",
    "-- Generated from local MySQL dumps",
    "-- Run this SQL against your Railway PostgreSQL database",
    "",
    "BEGIN;",
    "",
    "-- ── Legacy Qualifications ────────────────────────────────────────────",
    "-- Truncate and re-insert to avoid duplicates",
    "TRUNCATE TABLE legacy_qualifications RESTART IDENTITY CASCADE;",
    "",
]

# ── Parse legacy qualifications ──────────────────────────────────────────────
print("Parsing legacy qualifications...")
qual_count = 0
try:
    with open('backend/legacy_qualifications_import.sql', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find the INSERT block
    insert_match = re.search(r'INSERT INTO `qualification`.*?VALUES\s*([\s\S]+?)(?:;|\Z)', content, re.IGNORECASE)
    if insert_match:
        values_block = insert_match.group(1)
        # Split on rows - each row starts with (
        rows = re.findall(r'\(([^)]+)\)', values_block)
        for row in rows:
            parts = [p.strip() for p in row.split(',')]
            if len(parts) >= 7:
                try:
                    id_val = parts[0]
                    qual_id = parts[1]
                    name = parts[2].strip("'").replace("'", "''")
                    desc = parts[3].strip("'").replace("'", "''") if parts[3] != 'NULL' else ''
                    level = parts[4].strip("'").replace("'", "''")
                    credits = parts[5]
                    qual_type = parts[6].strip("'").replace("'", "''")
                    has_cat = parts[7].strip("'") if len(parts) > 7 else 'NO'
                    
                    output_lines.append(
                        f"INSERT INTO legacy_qualifications (id, qualification_id, name, description, level, credits, qualification_type, has_cat) "
                        f"VALUES ({id_val}, {qual_id}, '{name}', '{desc}', '{level}', {credits}, '{qual_type}', '{has_cat}') "
                        f"ON CONFLICT (id) DO NOTHING;"
                    )
                    qual_count += 1
                except Exception as e:
                    pass  # skip malformed rows
    print(f"  Parsed {qual_count} legacy qualifications")
except Exception as e:
    print(f"  Warning: {e}")

output_lines.extend([
    "",
    "-- Reset sequence",
    "SELECT setval('legacy_qualifications_id_seq', (SELECT MAX(id) FROM legacy_qualifications));",
    "",
    "-- ── Legacy Unit Standards ────────────────────────────────────────────",
    "TRUNCATE TABLE legacy_unit_standards RESTART IDENTITY CASCADE;",
    "",
])

# ── Parse legacy unit standards (already clean INSERT statements) ─────────────
print("Parsing legacy unit standards...")
us_count = 0
try:
    with open('backend/legacy_unit_standards_inserts.sql', 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    for line in lines:
        line = line.strip()
        if not line.startswith('INSERT'):
            continue
        # Convert: INSERT INTO LegacyUnitStandard (id, unitStandardId, qualificationId, unitStandardName, level, credits, synced)
        # To:      INSERT INTO legacy_unit_standards (id, unitstandard_id, qualification_id, unit_standard_name, level, credits, synced)
        line = re.sub(r'INSERT INTO LegacyUnitStandard\s*\(id, unitStandardId, qualificationId, unitStandardName, level, credits, synced\)',
                      'INSERT INTO legacy_unit_standards (id, unitstandard_id, qualification_id, unit_standard_name, level, credits, synced)',
                      line, flags=re.IGNORECASE)
        line = line.rstrip(';') + ' ON CONFLICT (id) DO NOTHING;'
        output_lines.append(line)
        us_count += 1
    print(f"  Parsed {us_count} legacy unit standards")
except Exception as e:
    print(f"  Warning: {e}")

output_lines.extend([
    "",
    "SELECT setval('legacy_unit_standards_id_seq', (SELECT MAX(id) FROM legacy_unit_standards));",
    "",
    "COMMIT;",
    "",
    f"-- Summary: {qual_count} qualifications, {us_count} unit standards",
])

# Write output
output_path = 'backend/seed_railway_qualifications.sql'
with open(output_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(output_lines))

print(f"\nDone! Written to {output_path}")
print(f"Total: {qual_count} qualifications, {us_count} unit standards")
print(f"\nNext step: Run this SQL against Railway database")
