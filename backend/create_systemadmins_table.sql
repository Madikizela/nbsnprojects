-- Create SystemAdmins table
CREATE TABLE IF NOT EXISTS "SystemAdmins" (
    "Id" SERIAL PRIMARY KEY,
    "FirstName" VARCHAR(50) NOT NULL,
    "LastName" VARCHAR(50) NOT NULL,
    "Username" VARCHAR(50) NOT NULL,
    "Email" VARCHAR(100) NOT NULL,
    "PasswordHash" VARCHAR(255) NOT NULL,
    "PhoneNumber" VARCHAR(20),
    "Status" INTEGER NOT NULL,
    "AccessLevel" INTEGER NOT NULL,
    "LastLoginAt" TIMESTAMP WITH TIME ZONE,
    "LoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "LockedUntil" TIMESTAMP WITH TIME ZONE,
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "UpdatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS "IX_SystemAdmins_Email" ON "SystemAdmins" ("Email");
CREATE UNIQUE INDEX IF NOT EXISTS "IX_SystemAdmins_Username" ON "SystemAdmins" ("Username");
CREATE INDEX IF NOT EXISTS "IX_SystemAdmins_Status" ON "SystemAdmins" ("Status");
CREATE INDEX IF NOT EXISTS "IX_SystemAdmins_AccessLevel" ON "SystemAdmins" ("AccessLevel");