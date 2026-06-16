CREATE TABLE IF NOT EXISTS "Announcements" (
  "Id"              SERIAL PRIMARY KEY,
  "ClassId"         INTEGER NOT NULL,
  "CreatedByUserId" INTEGER NOT NULL,
  "Title"           VARCHAR(200) NOT NULL,
  "Message"         VARCHAR(2000) NOT NULL,
  "Priority"        VARCHAR(20) NOT NULL DEFAULT 'Normal',
  "CreatedAt"       TIMESTAMP NOT NULL DEFAULT NOW(),
  "UpdatedAt"       TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_ann_class   FOREIGN KEY ("ClassId")         REFERENCES "SiteClasses"("Id") ON DELETE CASCADE,
  CONSTRAINT fk_ann_creator FOREIGN KEY ("CreatedByUserId") REFERENCES "Users"("Id")       ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_announcements_class   ON "Announcements"("ClassId");
CREATE INDEX IF NOT EXISTS idx_announcements_creator ON "Announcements"("CreatedByUserId");
