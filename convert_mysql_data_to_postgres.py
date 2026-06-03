
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
    "legacy_qualifications": "LegacyQualifications",
    "legacy_unit_standards": "LegacyUnitStandards",
    "occupational_qualifications": "OccupationalQualifications",
    "occupational_unit_standards": "OccupationalUnitStandards"
}


def convert_mysql_to_postgres(mysql_file, postgres_file):
    with open(mysql_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Step 1: Extract only INSERT statements
    insert_statements = re.findall(r'INSERT INTO `([^`]+)` \(([^)]+)\) VALUES\s*([^;]+);', content, re.DOTALL)
    
    postgres_content = []
    
    for table_name, columns_str, values_str in insert_statements:
        # Skip __efmigrationshistory since EF Core handles that
        if table_name == "__efmigrationshistory":
            continue
        
        # Process column names: remove backticks and trim
        columns = [col.strip().strip('`') for col in columns_str.split(',')]
        # Quote column names with double quotes for PostgreSQL
        columns_part = ', '.join(f'"{col}"' for col in columns)
        
        # Process values:
        # First, remove any backticks around strings
        values_processed = re.sub(r'`([^`]+)`', r"'\1'", values_str)
        
        # Get the correct PascalCase table name
        pascal_table = table_name_mapping.get(table_name, table_name)
        
        postgres_insert = f'INSERT INTO "{pascal_table}" ({columns_part}) VALUES {values_processed};\n'
        postgres_content.append(postgres_insert)
    
    # Also add statements to reset sequences later
    postgres_content.append("\n-- Reset sequences\n")
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
        postgres_content.append(f"SELECT setval('\"{table}_Id_seq\"', COALESCE((SELECT MAX(\"Id\") FROM \"{table}\"), 1), TRUE);\n")
    
    with open(postgres_file, 'w', encoding='utf-8') as f:
        f.write(''.join(postgres_content))
    
    print(f"Converted {len(insert_statements)} insert statements!")


if __name__ == "__main__":
    input_file = r"C:\Users\madik\Downloads\nbsnproject (1).sql"
    output_file = r"C:\Users\madik\Documents\New_version\converted_data.sql"
    convert_mysql_to_postgres(input_file, output_file)
