
import re
import psycopg2

# Table name mapping from MySQL (snake_case) to PostgreSQL (PascalCase)
table_name_mapping = {
    "assessmentquestions": "AssessmentQuestions",
    "assessmentstrategyplans": "AssessmentStrategyPlans",
    "assessmenttypes": "AssessmentTypes",
    "attendancelogs": "AttendanceLogs",
    "classenrollments": "ClassEnrollments",
    "classteachers": "ClassTeachers",
    "clients": "Clients",
    "courses": "Courses",
    "departments": "Departments",
    "documentaccesslogs": "DocumentAccessLogs",
    "documentauditlogs": "DocumentAuditLogs",
    "documentpermissions": "DocumentPermissions",
    "documents": "Documents",
    "formativeassessmentquestions": "FormativeAssessmentQuestions",
    "formativeassessments": "FormativeAssessments",
    "learnerassessmentanswers": "LearnerAssessmentAnswers",
    "learnerassessmentprogress": "LearnerAssessmentProgress",
    "learnerattendances": "LearnerAttendances",
    "learnerdocuments": "LearnerDocuments",
    "learners": "Learners",
    "learningpathways": "LearningPathways",
    "legacy_qualifications": "legacy_qualifications",
    "legacy_unit_standards": "legacy_unit_standards",
    "lessons": "Lessons",
    "logbookentries": "LogbookEntries",
    "modules": "Modules",
    "occupational_qualifications": "occupational_qualifications",
    "occupational_unit_standards": "occupational_unit_standards",
    "phaseactivities": "PhaseActivities",
    "phasesubactivities": "PhaseSubActivities",
    "projectassignments": "ProjectAssignments",
    "projectlearningpathways": "ProjectLearningPathways",
    "projectphaselearningpathways": "ProjectPhaseLearningPathways",
    "projectphasequalifications": "ProjectPhaseQualifications",
    "projectphases": "ProjectPhases",
    "projectqualificationunitstandards": "ProjectQualificationUnitStandards",
    "projectqualifications": "ProjectQualifications",
    "projectsites": "ProjectSites",
    "projects": "Projects",
    "qualificationtypes": "QualificationTypes",
    "sicknotes": "SickNotes",
    "siteclasses": "SiteClasses",
    "skillsdevelopmentproviders": "SkillsDevelopmentProviders",
    "summativeassessmentquestions": "SummativeAssessmentQuestions",
    "summativeassessments": "SummativeAssessments",
    "systemadmins": "SystemAdmins",
    "taskreminders": "TaskReminders",
    "tasks": "Tasks",
    "unitstandardassessments": "UnitStandardAssessments",
    "users": "Users",
    "__efmigrationshistory": "__EFMigrationsHistory"
}

# Columns that should be booleans
boolean_columns = {
    "IsRemedial", "ClockInVerified", "ClockOutVerified", "IsActive", 
    "FingerprintMatched", "HasPPE", "HasLearningMaterial", "HasToolkit", 
    "HasConsumables", "FormativeCompleted", "SummativeCompleted", 
    "RemedialRequired", "RemedialCompleted", "FormativeModerated", 
    "SummativeModerated"
}


def parse_value(val, column_name):
    val = val.strip()
    if val.upper() == 'NULL':
        return None
    if val.startswith("'") and val.endswith("'"):
        s = val[1:-1]
        s = s.replace("''", "'")
        s = s.replace("\\'", "'")
        s = s.replace('\\"', '"')
        s = s.replace("\\n", "\n")
        s = s.replace("\\r", "\r")
        s = s.replace("\\t", "\t")
        s = s.replace("\\\\", "\\")
        return s
    try:
        if '.' in val or 'e' in val.lower():
            return float(val)
        num = int(val)
        # Only convert 0/1 to booleans if column is in boolean_columns
        if num in (0, 1) and column_name in boolean_columns:
            return bool(num)
        return num
    except ValueError:
        return val


def extract_insert_statements(sql):
    inserts = []
    # Regex to find INSERT INTO statements, handle multi-line
    pattern = re.compile(r"INSERT\s+INTO\s+`([^`]+)`\s*\(([^)]+)\)\s*VALUES\s*([^;]+);", re.IGNORECASE | re.DOTALL)
    matches = pattern.findall(sql)
    for match in matches:
        mysql_table = match[0]
        columns_str = match[1]
        values_str = match[2]
        inserts.append((mysql_table, columns_str, values_str))
    return inserts


def parse_values(values_str, columns):
    rows = []
    in_string = False
    in_escape = False
    current_row = []
    current_val = []
    paren_depth = 0
    for char in values_str:
        if in_escape:
            current_val.append(char)
            in_escape = False
            continue
        if char == '\\':
            in_escape = True
            current_val.append(char)
            continue
        if char == "'":
            in_string = not in_string
            current_val.append(char)
            continue
        if not in_string:
            if char == '(':
                paren_depth += 1
                if paren_depth == 1:
                    current_val = []
                else:
                    current_val.append(char)
            elif char == ')':
                paren_depth -= 1
                if paren_depth == 0:
                    if current_val:
                        current_row.append(''.join(current_val))
                        rows.append(current_row)
                    current_row = []
                else:
                    current_val.append(char)
            elif char == ',':
                if paren_depth == 1:
                    current_row.append(''.join(current_val))
                    current_val = []
                elif paren_depth > 1:
                    current_val.append(char)
            else:
                if paren_depth > 0 or (current_val and current_val[-1]):
                    current_val.append(char)
        else:
            current_val.append(char)
    processed_rows = []
    for row in rows:
        processed_row = []
        for i, v in enumerate(row):
            col_name = columns[i] if i < len(columns) else ""
            processed_row.append(parse_value(v, col_name))
        processed_rows.append(processed_row)
    return processed_rows


def main():
    input_file = r"C:\Users\madik\Downloads\nbsnproject (1).sql"
    conn = psycopg2.connect(
        host="localhost",
        database="nbsnproject",
        user="postgres",
        password="12345"
    )
    cur = conn.cursor()

    # Disable triggers temporarily
    cur.execute("SET session_replication_role = 'replica';")
    conn.commit()

    # Read entire file
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Extract all INSERT statements using regex
    insert_statements = extract_insert_statements(content)
    print(f"Found {len(insert_statements)} INSERT statements")

    # Order of tables (based on foreign key constraints)
    import_order = [
        # Tables with no dependencies first
        "legacy_qualifications",
        "legacy_unit_standards",
        "occupational_qualifications",
        "occupational_unit_standards",
        "qualificationtypes",
        "learningpathways",
        "clients",
        "skillsdevelopmentproviders",
        "departments",
        "users",
        "systemadmins",
        "courses",
        "modules",
        "lessons",
        "phaseactivities",
        "phasesubactivities",
        "projects",
        "projectphases",
        "projectlearningpathways",
        "projectphaselearningpathways",
        "projectqualifications",
        "projectphasequalifications",
        "projectqualificationunitstandards",
        "projectsites",
        "siteclasses",
        "classteachers",
        "learners",
        "classenrollments",
        "documents",
        "documentpermissions",
        "documentauditlogs",
        "documentaccesslogs",
        "tasks",
        "taskreminders",
        "projectassignments",
        "assessmenttypes",
        "unitstandardassessments",
        "assessmentstrategyplans",
        "formativeassessments",
        "formativeassessmentquestions",
        "summativeassessments",
        "summativeassessmentquestions",
        "assessmentquestions",
        "learnerassessmentprogress",
        "learnerassessmentanswers",
        "learnerattendances",
        "attendancelogs",
        "learnerdocuments",
        "logbookentries",
        "sicknotes",
        "__efmigrationshistory"
    ]

    # Process in order
    for mysql_table in import_order:
        print(f"\nProcessing {mysql_table}...")
        for stmt in insert_statements:
            if stmt[0] != mysql_table:
                continue

            pg_table = table_name_mapping.get(mysql_table)
            if not pg_table:
                continue

            columns = [col.strip().strip('`') for col in stmt[1].split(',')]
            rows = parse_values(stmt[2], columns)
            print(f"  Found {len(rows)} rows for {pg_table}")

            if len(rows) == 0:
                continue

            col_list = ', '.join([f'"{col}"' for col in columns])
            placeholders = ', '.join(['%s' for _ in columns])
            insert_sql = f'INSERT INTO "{pg_table}" ({col_list}) VALUES ({placeholders})'

            for row in rows:
                try:
                    cur.execute(insert_sql, row)
                    conn.commit()
                except Exception as e:
                    print(f"  ERROR inserting row into {pg_table}: {e}")
                    conn.rollback()

    # Reset sequences!
    print("\nResetting sequences...")
    tables_with_id = [
        "AssessmentQuestions", "AssessmentStrategyPlans", "AssessmentTypes", 
        "AttendanceLogs", "ClassEnrollments", "ClassTeachers", "Clients", 
        "Courses", "Departments", "DocumentAccessLogs", "DocumentAuditLogs", 
        "DocumentPermissions", "Documents", "FormativeAssessmentQuestions", 
        "FormativeAssessments", "LearnerAssessmentAnswers", "LearnerAssessmentProgress", 
        "LearnerAttendances", "LearnerDocuments", "Learners", "LearningPathways", 
        "Lessons", "LogbookEntries", "Modules", "PhaseActivities", "PhaseSubActivities",
        "ProjectAssignments", "ProjectLearningPathways", "ProjectPhaseLearningPathways", 
        "ProjectPhaseQualifications", "ProjectPhases", "ProjectQualificationUnitStandards", 
        "ProjectQualifications", "ProjectSites", "Projects", "QualificationTypes", 
        "SickNotes", "SiteClasses", "SkillsDevelopmentProviders", "SummativeAssessmentQuestions", 
        "SummativeAssessments", "SystemAdmins", "TaskReminders", "Tasks", 
        "UnitStandardAssessments", "Users"
    ]
    for table in tables_with_id:
        try:
            cur.execute(f"SELECT setval('\"{table}_Id_seq\"', COALESCE((SELECT MAX(\"Id\") FROM \"{table}\"), 1), TRUE);")
            conn.commit()
        except Exception as e:
            conn.rollback()

    # Re-enable triggers
    cur.execute("SET session_replication_role = 'origin';")
    conn.commit()
    cur.close()
    conn.close()

    print("\nAll data imported successfully!")


if __name__ == "__main__":
    main()

