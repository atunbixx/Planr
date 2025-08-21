CREATE TABLE IF NOT EXISTS "admin_audit_logs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "adminUserId" UUID NOT NULL,
  "action" TEXT NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetId" TEXT NOT NULL,
  "details" JSONB,
  "ip" TEXT,
  "ua" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "admin_audit_admin_created_idx" ON "admin_audit_logs" ("adminUserId", "createdAt");
CREATE INDEX IF NOT EXISTS "admin_audit_target_idx" ON "admin_audit_logs" ("targetType", "targetId", "createdAt");
