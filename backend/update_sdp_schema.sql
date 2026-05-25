-- Add missing columns to SkillsDevelopmentProviders table
ALTER TABLE "SkillsDevelopmentProviders" 
ADD COLUMN IF NOT EXISTS "ClientId" integer NOT NULL DEFAULT 1;

ALTER TABLE "SkillsDevelopmentProviders" 
ADD COLUMN IF NOT EXISTS "Status" integer NOT NULL DEFAULT 1;

-- Create indexes
CREATE INDEX IF NOT EXISTS "IX_SkillsDevelopmentProviders_ClientId" 
ON "SkillsDevelopmentProviders" ("ClientId");

CREATE INDEX IF NOT EXISTS "IX_SkillsDevelopmentProviders_Status" 
ON "SkillsDevelopmentProviders" ("Status");

-- Add foreign key constraint
ALTER TABLE "SkillsDevelopmentProviders" 
ADD CONSTRAINT "FK_SkillsDevelopmentProviders_Clients_ClientId" 
FOREIGN KEY ("ClientId") REFERENCES "Clients" ("Id") ON DELETE CASCADE;

-- Update migration history
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20250103130000_AddClientIdToSDP', '8.0.0')
ON CONFLICT ("MigrationId") DO NOTHING;