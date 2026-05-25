-- =====================================================
-- Teacher Assignment and Fingerprint Attendance System
-- =====================================================

-- 1. Create ClassTeachers table (assigns teachers to classes)
CREATE TABLE IF NOT EXISTS "ClassTeachers" (
    "Id" SERIAL PRIMARY KEY,
    "ClassId" INTEGER NOT NULL,
    "TeacherId" INTEGER NOT NULL,
    "AssignedDate" TIMESTAMP NOT NULL DEFAULT NOW(),
    "IsActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT "FK_ClassTeachers_SiteClasses"
        FOREIGN KEY ("ClassId")
        REFERENCES "SiteClasses"("Id")
        ON DELETE CASCADE,
        
    CONSTRAINT "FK_ClassTeachers_Users"
        FOREIGN KEY ("TeacherId")
        REFERENCES "Users"("Id")
        ON DELETE CASCADE,
        
    -- Prevent duplicate active assignments
    CONSTRAINT "UQ_ClassTeachers_Active"
        UNIQUE ("ClassId", "TeacherId", "IsActive")
);

-- 2. Create LearnerAttendance table (tracks attendance with fingerprint)
CREATE TABLE IF NOT EXISTS "LearnerAttendance" (
    "Id" SERIAL PRIMARY KEY,
    "LearnerId" INTEGER NOT NULL,
    "ClassId" INTEGER NOT NULL,
    "AttendanceDate" DATE NOT NULL DEFAULT CURRENT_DATE,
    "ClockInTime" TIMESTAMP,
    "ClockOutTime" TIMESTAMP,
    "ClockInMethod" VARCHAR(50), -- 'Fingerprint', 'Manual', 'QRCode'
    "ClockOutMethod" VARCHAR(50),
    "ClockInVerified" BOOLEAN DEFAULT FALSE, -- True if fingerprint matched
    "ClockOutVerified" BOOLEAN DEFAULT FALSE,
    "ClockInTeacherId" INTEGER, -- Teacher who clocked them in
    "ClockOutTeacherId" INTEGER, -- Teacher who clocked them out
    "Status" VARCHAR(50) DEFAULT 'Present', -- 'Present', 'Absent', 'Late', 'Excused'
    "Notes" TEXT,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT "FK_LearnerAttendance_Learners"
        FOREIGN KEY ("LearnerId")
        REFERENCES "Learners"("Id")
        ON DELETE CASCADE,
        
    CONSTRAINT "FK_LearnerAttendance_SiteClasses"
        FOREIGN KEY ("ClassId")
        REFERENCES "SiteClasses"("Id")
        ON DELETE CASCADE,
        
    CONSTRAINT "FK_LearnerAttendance_ClockInTeacher"
        FOREIGN KEY ("ClockInTeacherId")
        REFERENCES "Users"("Id")
        ON DELETE SET NULL,
        
    CONSTRAINT "FK_LearnerAttendance_ClockOutTeacher"
        FOREIGN KEY ("ClockOutTeacherId")
        REFERENCES "Users"("Id")
        ON DELETE SET NULL,
        
    -- Prevent duplicate attendance records for same day
    CONSTRAINT "UQ_LearnerAttendance_DailyRecord"
        UNIQUE ("LearnerId", "ClassId", "AttendanceDate")
);

-- 3. Create AttendanceLog table (audit trail for all attendance actions)
CREATE TABLE IF NOT EXISTS "AttendanceLog" (
    "Id" SERIAL PRIMARY KEY,
    "AttendanceId" INTEGER NOT NULL,
    "Action" VARCHAR(50) NOT NULL, -- 'ClockIn', 'ClockOut', 'Modified', 'Deleted'
    "ActionTime" TIMESTAMP NOT NULL DEFAULT NOW(),
    "ActionBy" INTEGER NOT NULL, -- Teacher/User who performed action
    "FingerprintMatched" BOOLEAN,
    "MatchScore" DECIMAL(5,2), -- Fingerprint match confidence score
    "DeviceInfo" TEXT, -- Mobile device info
    "Notes" TEXT,
    
    CONSTRAINT "FK_AttendanceLog_LearnerAttendance"
        FOREIGN KEY ("AttendanceId")
        REFERENCES "LearnerAttendance"("Id")
        ON DELETE CASCADE,
        
    CONSTRAINT "FK_AttendanceLog_Users"
        FOREIGN KEY ("ActionBy")
        REFERENCES "Users"("Id")
        ON DELETE CASCADE
);

-- =====================================================
-- INDEXES for Performance
-- =====================================================

-- ClassTeachers indexes
CREATE INDEX IF NOT EXISTS "IX_ClassTeachers_ClassId" 
    ON "ClassTeachers"("ClassId") WHERE "IsActive" = TRUE;
    
CREATE INDEX IF NOT EXISTS "IX_ClassTeachers_TeacherId" 
    ON "ClassTeachers"("TeacherId") WHERE "IsActive" = TRUE;

-- LearnerAttendance indexes (CRITICAL for fingerprint lookup performance)
CREATE INDEX IF NOT EXISTS "IX_LearnerAttendance_LearnerId_Date" 
    ON "LearnerAttendance"("LearnerId", "AttendanceDate");
    
CREATE INDEX IF NOT EXISTS "IX_LearnerAttendance_ClassId_Date" 
    ON "LearnerAttendance"("ClassId", "AttendanceDate");
    
CREATE INDEX IF NOT EXISTS "IX_LearnerAttendance_Date" 
    ON "LearnerAttendance"("AttendanceDate");
    
CREATE INDEX IF NOT EXISTS "IX_LearnerAttendance_Status" 
    ON "LearnerAttendance"("Status");

-- Composite index for teacher's daily attendance view
CREATE INDEX IF NOT EXISTS "IX_LearnerAttendance_Class_Date_Status" 
    ON "LearnerAttendance"("ClassId", "AttendanceDate", "Status");

-- AttendanceLog indexes
CREATE INDEX IF NOT EXISTS "IX_AttendanceLog_AttendanceId" 
    ON "AttendanceLog"("AttendanceId");
    
CREATE INDEX IF NOT EXISTS "IX_AttendanceLog_ActionTime" 
    ON "AttendanceLog"("ActionTime");
    
CREATE INDEX IF NOT EXISTS "IX_AttendanceLog_ActionBy" 
    ON "AttendanceLog"("ActionBy");

-- =====================================================
-- FINGERPRINT TEMPLATE INDEXES (for fast matching)
-- =====================================================

-- Index on Learners table for fingerprint lookups
CREATE INDEX IF NOT EXISTS "IX_Learners_LeftThumbTemplate" 
    ON "Learners"("LeftThumbTemplate") 
    WHERE "LeftThumbTemplate" IS NOT NULL;
    
CREATE INDEX IF NOT EXISTS "IX_Learners_RightThumbTemplate" 
    ON "Learners"("RightThumbTemplate") 
    WHERE "RightThumbTemplate" IS NOT NULL;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE "ClassTeachers" IS 'Assigns teachers to classes for attendance management';
COMMENT ON TABLE "LearnerAttendance" IS 'Tracks daily learner attendance with fingerprint verification';
COMMENT ON TABLE "AttendanceLog" IS 'Audit trail for all attendance actions';

COMMENT ON COLUMN "LearnerAttendance"."ClockInVerified" IS 'True if fingerprint was successfully matched during clock-in';
COMMENT ON COLUMN "LearnerAttendance"."ClockOutVerified" IS 'True if fingerprint was successfully matched during clock-out';
COMMENT ON COLUMN "AttendanceLog"."MatchScore" IS 'Fingerprint match confidence score (0-100)';

-- =====================================================
-- SAMPLE DATA (for testing)
-- =====================================================

-- Note: Run this only in development/testing environments
-- Assign a teacher to a class (example)
-- INSERT INTO "ClassTeachers" ("ClassId", "TeacherId", "IsActive")
-- VALUES (1, 2, TRUE);

