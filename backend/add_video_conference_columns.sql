-- Add Video Conference columns to SiteClasses table
-- These columns support online class links for teachers

ALTER TABLE "SiteClasses" 
ADD COLUMN IF NOT EXISTS "VideoConferenceLink" VARCHAR(1000),
ADD COLUMN IF NOT EXISTS "VideoConferenceType" VARCHAR(50),
ADD COLUMN IF NOT EXISTS "VideoConferenceDescription" TEXT,
ADD COLUMN IF NOT EXISTS "VideoConferenceStartTime" TIMESTAMP;

-- Add comment
COMMENT ON COLUMN "SiteClasses"."VideoConferenceLink" IS 'URL for online class (Google Meet, Teams, Zoom, etc.)';
COMMENT ON COLUMN "SiteClasses"."VideoConferenceType" IS 'Type of video conference (Google Meet, MS Teams, Zoom, etc.)';
COMMENT ON COLUMN "SiteClasses"."VideoConferenceDescription" IS 'Optional description or meeting agenda';
COMMENT ON COLUMN "SiteClasses"."VideoConferenceStartTime" IS 'Scheduled start time for the online class';
