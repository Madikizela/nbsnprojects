-- Add logo_path column to SkillsDevelopmentProviders table
ALTER TABLE "SkillsDevelopmentProviders" 
ADD COLUMN IF NOT EXISTS "LogoPath" VARCHAR(500) NULL;
