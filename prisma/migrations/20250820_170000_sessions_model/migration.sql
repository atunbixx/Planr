CREATE TABLE IF NOT EXISTS "sessions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "ipHash" TEXT,
  "uaHash" TEXT,
  "region" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "lastActiveAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "revokedAt" TIMESTAMPTZ,
  CONSTRAINT fk_sessions_user FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "sessions_user_lastactive_idx" ON "sessions" ("userId", "lastActiveAt");
CREATE INDEX IF NOT EXISTS "sessions_revoked_idx" ON "sessions" ("revokedAt");
