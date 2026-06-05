-- Workspaces are typed: an individual's personal space vs a planner/agency business.
CREATE TYPE "OrgType" AS ENUM ('individual', 'business');
ALTER TABLE "Organization" ADD COLUMN "type" "OrgType" NOT NULL DEFAULT 'individual';
