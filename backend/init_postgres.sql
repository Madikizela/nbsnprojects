-- PostgreSQL initialization script for Skills Development System

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables
CREATE TABLE IF NOT EXISTS "Clients" (
    "Id" SERIAL PRIMARY KEY,
    "Name" VARCHAR(255) NOT NULL,
    "Email" VARCHAR(255) NOT NULL,
    "Phone" VARCHAR(50),
    "Address" TEXT,
    "RegistrationNumber" VARCHAR(100),
    "Status" INTEGER NOT NULL DEFAULT 1,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "SkillsDevelopmentProviders" (
    "Id" SERIAL PRIMARY KEY,
    "Name" VARCHAR(255) NOT NULL,
    "Email" VARCHAR(255) NOT NULL,
    "Phone" VARCHAR(50),
    "Address" TEXT,
    "RegistrationNumber" VARCHAR(100),
    "Status" INTEGER NOT NULL DEFAULT 1,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ClientId" INTEGER
);

CREATE TABLE IF NOT EXISTS "Departments" (
    "Id" SERIAL PRIMARY KEY,
    "Name" VARCHAR(255) NOT NULL,
    "Description" TEXT,
    "Status" INTEGER NOT NULL DEFAULT 1,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "SkillsDevelopmentProviderId" INTEGER
);

CREATE TABLE IF NOT EXISTS "Users" (
    "Id" SERIAL PRIMARY KEY,
    "FirstName" VARCHAR(100) NOT NULL,
    "LastName" VARCHAR(100) NOT NULL,
    "Email" VARCHAR(255) NOT NULL UNIQUE,
    "PasswordHash" VARCHAR(255) NOT NULL,
    "Phone" VARCHAR(50),
    "Role" INTEGER NOT NULL DEFAULT 0,
    "Status" INTEGER NOT NULL DEFAULT 1,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ClientId" INTEGER,
    "SkillsDevelopmentProviderId" INTEGER,
    "DepartmentId" INTEGER
);

CREATE TABLE IF NOT EXISTS "SystemAdmins" (
    "Id" SERIAL PRIMARY KEY,
    "Username" VARCHAR(100) NOT NULL UNIQUE,
    "Email" VARCHAR(255) NOT NULL UNIQUE,
    "PasswordHash" VARCHAR(255) NOT NULL,
    "FirstName" VARCHAR(100) NOT NULL,
    "LastName" VARCHAR(100) NOT NULL,
    "Status" INTEGER NOT NULL DEFAULT 1,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create qualification tables
CREATE TABLE IF NOT EXISTS "OccupationalQualifications" (
    "Id" SERIAL PRIMARY KEY,
    "QualificationId" INTEGER NOT NULL,
    "QualificationName" VARCHAR(500) NOT NULL,
    "SaqaQualificationId" INTEGER,
    "QualificationType" VARCHAR(100),
    "NqfLevel" INTEGER,
    "Credits" INTEGER,
    "Status" INTEGER NOT NULL DEFAULT 1,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "LegacyQualifications" (
    "Id" SERIAL PRIMARY KEY,
    "QualificationId" INTEGER NOT NULL,
    "QualificationName" VARCHAR(500) NOT NULL,
    "SaqaQualificationId" INTEGER,
    "QualificationType" VARCHAR(100),
    "NqfLevel" INTEGER,
    "Credits" INTEGER,
    "Status" INTEGER NOT NULL DEFAULT 1,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "OccupationalUnitStandards" (
    "Id" SERIAL PRIMARY KEY,
    "QualificationId" INTEGER NOT NULL,
    "ModuleCode" VARCHAR(100) NOT NULL,
    "UnitStandardName" VARCHAR(500) NOT NULL,
    "ModuleType" VARCHAR(100),
    "Level" INTEGER,
    "Credits" INTEGER,
    "Status" INTEGER NOT NULL DEFAULT 1,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "LegacyUnitStandards" (
    "Id" SERIAL PRIMARY KEY,
    "QualificationId" INTEGER NOT NULL,
    "UnitStandardId" INTEGER NOT NULL,
    "UnitStandardName" VARCHAR(500) NOT NULL,
    "Credits" INTEGER,
    "NqfLevel" INTEGER,
    "Status" INTEGER NOT NULL DEFAULT 1,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "IX_Users_Email" ON "Users" ("Email");
CREATE INDEX IF NOT EXISTS "IX_Users_Role" ON "Users" ("Role");
CREATE INDEX IF NOT EXISTS "IX_Users_Status" ON "Users" ("Status");
CREATE INDEX IF NOT EXISTS "IX_Users_ClientId" ON "Users" ("ClientId");
CREATE INDEX IF NOT EXISTS "IX_Users_SkillsDevelopmentProviderId" ON "Users" ("SkillsDevelopmentProviderId");
CREATE INDEX IF NOT EXISTS "IX_Users_DepartmentId" ON "Users" ("DepartmentId");

CREATE INDEX IF NOT EXISTS "IX_Clients_Name" ON "Clients" ("Name");
CREATE INDEX IF NOT EXISTS "IX_Clients_Email" ON "Clients" ("Email");
CREATE INDEX IF NOT EXISTS "IX_Clients_Status" ON "Clients" ("Status");

CREATE INDEX IF NOT EXISTS "IX_SkillsDevelopmentProviders_Name" ON "SkillsDevelopmentProviders" ("Name");
CREATE INDEX IF NOT EXISTS "IX_SkillsDevelopmentProviders_Email" ON "SkillsDevelopmentProviders" ("Email");
CREATE INDEX IF NOT EXISTS "IX_SkillsDevelopmentProviders_ClientId" ON "SkillsDevelopmentProviders" ("ClientId");

CREATE INDEX IF NOT EXISTS "IX_Departments_Name" ON "Departments" ("Name");
CREATE INDEX IF NOT EXISTS "IX_Departments_SkillsDevelopmentProviderId" ON "Departments" ("SkillsDevelopmentProviderId");

CREATE INDEX IF NOT EXISTS "IX_OccupationalQualifications_QualificationId" ON "OccupationalQualifications" ("QualificationId");
CREATE INDEX IF NOT EXISTS "IX_OccupationalQualifications_QualificationName" ON "OccupationalQualifications" ("QualificationName");

CREATE INDEX IF NOT EXISTS "IX_LegacyQualifications_QualificationId" ON "LegacyQualifications" ("QualificationId");
CREATE INDEX IF NOT EXISTS "IX_LegacyQualifications_QualificationName" ON "LegacyQualifications" ("QualificationName");

CREATE INDEX IF NOT EXISTS "IX_OccupationalUnitStandards_QualificationId" ON "OccupationalUnitStandards" ("QualificationId");
CREATE INDEX IF NOT EXISTS "IX_OccupationalUnitStandards_ModuleCode" ON "OccupationalUnitStandards" ("ModuleCode");

CREATE INDEX IF NOT EXISTS "IX_LegacyUnitStandards_QualificationId" ON "LegacyUnitStandards" ("QualificationId");
CREATE INDEX IF NOT EXISTS "IX_LegacyUnitStandards_UnitStandardId" ON "LegacyUnitStandards" ("UnitStandardId");

-- Insert default system admin
INSERT INTO "SystemAdmins" ("Username", "Email", "PasswordHash", "FirstName", "LastName", "Status", "CreatedAt", "UpdatedAt")
VALUES ('admin', 'admin@system.com', '$2a$11$XlfnpM8l7jJ7lwM3uZ9y4O7z5wD6x8y9z0a1b2c3d4e5f6g7h8i9j0k', 'System', 'Administrator', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("Email") DO NOTHING;

-- Insert test user
INSERT INTO "Users" ("FirstName", "LastName", "Email", "PasswordHash", "Phone", "Role", "Status", "CreatedAt", "UpdatedAt")
VALUES ('Test', 'User', 'test@example.com', '$2a$11$XlfnpM8l7jJ7lwM3uZ9y4O7z5wD6x8y9z0a1b2c3d4e5f6g7h8i9j0k', '1234567890', 2, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("Email") DO NOTHING;