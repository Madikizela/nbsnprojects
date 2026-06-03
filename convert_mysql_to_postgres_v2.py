
import re

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

def escape_postgres_string(s):
    if s is None:
        return 'NULL'
    # Escape single quotes by doubling them
    s = s.replace("'", "''")
    # Escape backslashes
    s = s.replace("\\", "\\\\")
    return f"'{s}'"

def parse_mysql_insert(mysql_insert_line):
    # Match INSERT INTO `table` (...) VALUES ...;
    match = re.match(r"INSERT INTO `([^`]+)` \(([^)]+)\) VALUES\s*(.*?);?$", mysql_insert_line, re.DOTALL)
    if not match:
        return None
    
    table_name = match.group(1)
    columns_str = match.group(2)
    values_str = match.group(3)
    
    # Parse columns
    columns = [col.strip().strip('`') for col in columns_str.split(',')]
    
    # Get PascalCase table name
    pg_table = table_name_mapping.get(table_name, table_name)
    
    # Now parse the values - this is tricky because of strings with commas and parentheses
    # We'll use a simple state machine
    values_list = []
    current_value = []
    in_string = False
    in_escape = False
    paren_depth = 0
    
    for char in values_str:
        if in_escape:
            current_value.append(char)
            in_escape = False
            continue
        if char == '\\':
            in_escape = True
            current_value.append(char)
            continue
        if char == "'":
            in_string = not in_string
            current_value.append(char)
            continue
        if not in_string:
            if char == '(':
                paren_depth += 1
                if paren_depth == 1:
                    # Start of a new row
                    current_value = []
                else:
                    current_value.append(char)
            elif char == ')':
                paren_depth -= 1
                if paren_depth == 0:
                    # End of a row
                    values_list.append(''.join(current_value))
                else:
                    current_value.append(char)
            elif char == ',':
                if paren_depth > 1:
                    current_value.append(char)
                # Else, just ignore (row separator)
            else:
                if paren_depth > 0:
                    current_value.append(char)
        else:
            current_value.append(char)
    
    # Now process each row
    pg_inserts = []
    for row in values_list:
        if not row.strip():
            continue
            
        # Now parse the individual values in the row
        row_values = []
        current_val = []
        in_string = False
        in_escape = False
        
        for char in row:
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
                if char == ',':
                    row_values.append(''.join(current_val).strip())
                    current_val = []
                else:
                    current_val.append(char)
            else:
                current_val.append(char)
        
        # Add the last value
        if current_val:
            row_values.append(''.join(current_val).strip())
        
        # Now process each value to convert to PostgreSQL syntax
        processed_values = []
        for val in row_values:
            val = val.strip()
            if val.upper() == 'NULL':
                processed_values.append('NULL')
            elif val.startswith("'") and val.endswith("'"):
                # It's a string - escape it properly
                inner = val[1:-1]
                # Escape single quotes and backslashes
                inner = inner.replace("'", "''")
                inner = inner.replace("\\", "\\\\")
                processed_values.append(f"'{inner}'")
            else:
                # Number or other type - use as is
                processed_values.append(val)
        
        # Build the INSERT statement
        columns_part = ', '.join([f'"{col}"' for col in columns])
        values_part = ', '.join(processed_values)
        pg_insert = f'INSERT INTO "{pg_table}" ({columns_part}) VALUES ({values_part});'
        pg_inserts.append(pg_insert)
    
    return pg_inserts

def convert_mysql_to_postgres(mysql_file, postgres_file):
    with open(mysql_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    postgres_content = []
    postgres_content.append('SET session_replication_role = \'replica\';\n')
    
    # Split content into statements
    statements = []
    current_statement = []
    in_string = False
    in_escape = False
    
    for char in content:
        if in_escape:
            current_statement.append(char)
            in_escape = False
            continue
        if char == '\\':
            in_escape = True
            current_statement.append(char)
            continue
        if char == "'":
            in_string = not in_string
            current_statement.append(char)
            continue
        if not in_string and char == ';':
            current_statement.append(char)
            statements.append(''.join(current_statement))
            current_statement = []
        else:
            current_statement.append(char)
    
    if current_statement:
        statements.append(''.join(current_statement))
    
    for stmt in statements:
        stmt = stmt.strip()
        if not stmt:
            continue
        if stmt.startswith('INSERT INTO'):
            inserts = parse_mysql_insert(stmt)
            if inserts:
                postgres_content.extend(inserts)
    
    postgres_content.append('\nSET session_replication_role = \'origin\';\n')
    
    # Add sequence reset statements
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
    for table in tables_with_id:
        postgres_content.append(f'SELECT setval(\'"{table}_Id_seq"\', COALESCE((SELECT MAX("Id") FROM "{table}"), 1), TRUE);\n')
    
    with open(postgres_file, 'w', encoding='utf-8') as f:
        f.write(''.join(postgres_content))
    
    print(f"Converted successfully! Output written to {postgres_file}")


if __name__ == "__main__":
    input_file = r"C:\Users\madik\Downloads\nbsnproject (1).sql"
    output_file = r"C:\Users\madik\Documents\New_version\converted_data_v2.sql"
    convert_mysql_to_postgres(input_file, output_file)
