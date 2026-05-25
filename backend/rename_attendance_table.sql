-- Rename LearnerAttendance table to LearnerAttendances to match EF Core DbSet name
ALTER TABLE "LearnerAttendance" RENAME TO "LearnerAttendances";

-- Rename AttendanceLog table to AttendanceLogs to match EF Core DbSet name  
ALTER TABLE "AttendanceLog" RENAME TO "AttendanceLogs";

-- Verify the rename
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%ttendance%'
ORDER BY table_name;
