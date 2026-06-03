
import re
import psycopg2
from psycopg2.extras import execute_values

# Create a mapping from snake_case/mysql table names to PascalCase EF Core table names
table_name_mapping = {
    "assessmentquestions": "AssessmentQuestions",
    "assessmentstrategyplans": "AssessmentStrategyPlans",
    "assessmenttypes": "AssessmentTypes",
    "attendancelogs": "AttendanceLogs",
    "classenrollments": "ClassEnrollments",
    "classteachers": "ClassTeachers",
    "clients": "Clients",
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
    "lessons": "Lessons",
    "logbookentries": "LogbookEntries",
    "modules": "Modules",
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
    "__efmigrationshistory": "__EFMigrationsHistory",
}

def parse_value(val):
    val = val.strip()
    if val.upper() == 'NULL':
        return None
    if val.startswith("'") and val.endswith("'"):
        # Unescape the string
        s = val[1:-1]
        s = s.replace("''", "'")
        s = s.replace("\\'", "'")
        s = s.replace('\\"', '"')
        s = s.replace("\\n", "\n")
        s = s.replace("\\r", "\r")
        s = s.replace("\\t", "\t")
        s = s.replace("\\\\", "\\")
        return s
    # Try to parse as number
    try:
        if '.' in val or 'e' in val.lower():
            return float(val)
        return int(val)
    except ValueError:
        return val

def parse_mysql_insert(statement):
    match = re.match(r"INSERT INTO `([^`]+)` \(([^)]+)\) VALUES\s*(.*)", statement, re.DOTALL)
    if not match:
        return None
    
    mysql_table = match.group(1)
    columns_str = match.group(2)
    values_part = match.group(3)
    
    pg_table = table_name_mapping.get(mysql_table, mysql_table)
    
    columns = [col.strip().strip('`') for col in columns_str.split(',')]
    
    # Parse all value sets
    rows = []
    in_string = False
    in_escape = False
    current_row = []
    current_val = []
    paren_depth = 0
    
    for char in values_part:
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
                    # End of a row
                    if current_val:
                        current_row.append(''.join(current_val))
                        rows.append(current_row)
                    current_row = []
                else:
                    current_val.append(char)
            elif char == ',':
                if paren_depth == 1:
                    # End of a value in a row
                    current_row.append(''.join(current_val))
                    current_val = []
                elif paren_depth > 1:
                    current_val.append(char)
            elif char == ';':
                break
            else:
                if paren_depth > 0:
                    current_val.append(char)
        else:
            current_val.append(char)
    
    # Convert the rows to Python values
    processed_rows = []
    for row in rows:
        processed_row = [parse_value(v) for v in row]
        processed_rows.append(processed_row)
    
    return (pg_table, columns, processed_rows)

def main():
    input_file = r"C:\Users\madik\Downloads\nbsnproject (1).sql"
    
    # Connect to PostgreSQL
    conn = psycopg2.connect(
        host="localhost",
        database="nbsnproject",
        user="postgres",
        password="12345"
    )
    cur = conn.cursor()
    
    # Disable triggers
    cur.execute("SET session_replication_role = 'replica';")
    
    # Read the entire input file
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Split into individual statements
    statements = []
    in_string = False
    in_escape = False
    current_stmt = []
    
    for char in content:
        if in_escape:
            current_stmt.append(char)
            in_escape = False
            continue
        
        if char == '\\':
            in_escape = True
            current_stmt.append(char)
            continue
        
        if char == "'":
            in_string = not in_string
            current_stmt.append(char)
            continue
        
        if not in_string and char == ';':
            current_stmt.append(char)
            statements.append(''.join(current_stmt))
            current_stmt = []
        else:
            current_stmt.append(char)
    
    if current_stmt:
        statements.append(''.join(current_stmt))
    
    # Process each INSERT statement
    for stmt in statements:
        stmt = stmt.strip()
        if not stmt.startswith('INSERT INTO'):
            continue
        
        parsed = parse_mysql_insert(stmt)
        if not parsed:
            continue
        
        pg_table, columns, rows = parsed
        
        print(f"Importing table {pg_table} with {len(rows)} rows...")
        
        # Build the INSERT statement
        col_list = ', '.join([f'"{col}"' for col in columns])
        placeholders = ', '.join(['%s' for _ in columns])
        insert_sql = f'INSERT INTO "{pg_table}" ({col_list}) VALUES ({placeholders})'
        
        # Execute the insert
        try:
            execute_values(cur, insert_sql, rows)
            conn.commit()
        except Exception as e:
            print(f"Error importing {pg_table}: {e}")
            conn.rollback()
    
    # Reset sequences
    tables_with_id = [
        "Users", "SystemAdmins", "Clients", "Departments", "SkillsDevelopmentProviders",
        "Projects", "ProjectSites", "SiteClasses", "Learners", "ClassEnrollments",
        "ClassTeachers", "AttendanceLogs", "Documents", "DocumentPermissions",
        "DocumentAuditLogs", "DocumentAccessLogs", "Tasks", "TaskReminders",
        "AssessmentTypes", "UnitStandardAssessments", "FormativeAssessments",
        "SummativeAssessments", "AssessmentQuestions", "FormativeAssessmentQuestions",
        "SummativeAssessmentQuestions", "LearnerAssessmentAnswers", "LearnerAssessmentProgress",
        "LearnerAttendances", "LearnerDocuments", "LogbookEntries", "SickNotes",
        "Lessons", "LearningPathways", "PhaseActivities", "PhaseSubActivities",
        "ProjectLearningPathways", "ProjectPhaseLearningPathways",
        "ProjectPhaseQualifications", "ProjectPhases", "ProjectQualificationUnitStandards",
        "ProjectQualifications", "QualificationTypes", "AssessmentStrategyPlans",
        "ProjectAssignments"
    ]
    
    print("Resetting sequences...")
    for table in tables_with_id:
        try:
            cur.execute(f"SELECT setval('\"{table}_Id_seq\"', COALESCE((SELECT MAX(\"Id\") FROM \"{table}\"), 1), TRUE);")
            conn.commit()
        except Exception as e:
            print(f"Error resetting sequence for {table}: {e}")
    
    # Re-enable triggers
    cur.execute("SET session_replication_role = 'origin';")
    conn.commit()
    
    cur.close()
    conn.close()
    print("Import completed successfully!")

if __name__ == "__main__":
    main()
