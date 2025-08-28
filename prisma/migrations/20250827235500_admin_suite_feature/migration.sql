-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "my_new_schema";

-- CreateEnum
CREATE TYPE "my_new_schema"."RsvpStatus" AS ENUM ('pending', 'accepted', 'declined');

-- CreateEnum
CREATE TYPE "my_new_schema"."Side" AS ENUM ('bride', 'groom');

-- CreateEnum
CREATE TYPE "my_new_schema"."BudgetStatus" AS ENUM ('planned', 'quoted', 'booked', 'paid');

-- CreateEnum
CREATE TYPE "my_new_schema"."TaskPriority" AS ENUM ('low', 'medium', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "my_new_schema"."TaskStatus" AS ENUM ('pending', 'in_progress', 'completed', 'cancelled', 'on_hold');

-- CreateEnum
CREATE TYPE "my_new_schema"."TableShape" AS ENUM ('round', 'rectangle', 'square', 'oval');

-- CreateEnum
CREATE TYPE "my_new_schema"."MessageStatus" AS ENUM ('sent', 'queued', 'failed', 'delivered');

-- CreateEnum
CREATE TYPE "my_new_schema"."Role" AS ENUM ('OWNER', 'ADMIN', 'SUPPORT', 'MODERATOR', 'USER');

-- CreateEnum
CREATE TYPE "my_new_schema"."RegionTier" AS ENUM ('GLOBAL', 'COUNTRY', 'STATE', 'CITY');

-- CreateEnum
CREATE TYPE "my_new_schema"."CreditType" AS ENUM ('SYSTEM', 'PROMO', 'MANUAL', 'REFUND', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "my_new_schema"."SanctionType" AS ENUM ('WARN', 'THROTTLE', 'SUSPEND', 'BAN', 'SHADOW_LIMIT');

-- CreateEnum
CREATE TYPE "my_new_schema"."MessageChannel" AS ENUM ('EMAIL', 'SMS', 'INAPP');

-- CreateEnum
CREATE TYPE "my_new_schema"."ApprovalType" AS ENUM ('VENDOR', 'LISTING', 'KYC', 'QUOTA');

-- CreateEnum
CREATE TYPE "my_new_schema"."FeatureFlagType" AS ENUM ('BOOLEAN', 'PERCENT_ROLL');

-- CreateEnum
CREATE TYPE "my_new_schema"."VendorStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'BANNED', 'UNLISTED');

-- CreateEnum
CREATE TYPE "my_new_schema"."VerificationStatus" AS ENUM ('NONE', 'PENDING', 'VERIFIED', 'EXPIRED', 'REJECTED');

-- CreateEnum
CREATE TYPE "my_new_schema"."VendorEventType" AS ENUM ('LEAD_ACCEPTED', 'LEAD_IGNORED', 'LEAD_EXPIRED', 'DISPUTE', 'DOC_UPLOADED', 'VERIFIED', 'SANCTIONED');

-- CreateEnum
CREATE TYPE "my_new_schema"."UserRole" AS ENUM ('couple', 'planner', 'vendor');

-- CreateTable
CREATE TABLE "my_new_schema"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "my_new_schema"."UserRole" NOT NULL DEFAULT 'couple',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "my_new_schema"."user_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "my_new_schema"."Role" NOT NULL DEFAULT 'USER',
    "country" TEXT,
    "state" TEXT,
    "city" TEXT,
    "plan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "my_new_schema"."credit_ledger" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "type" "my_new_schema"."CreditType" NOT NULL,
    "reason" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "my_new_schema"."broadcasts" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "channel" "my_new_schema"."MessageChannel" NOT NULL,
    "segmentJson" JSONB NOT NULL,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "broadcasts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "my_new_schema"."sanctions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "my_new_schema"."SanctionType" NOT NULL,
    "reasonCode" TEXT NOT NULL,
    "notes" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sanctions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "my_new_schema"."approval_queue" (
    "id" TEXT NOT NULL,
    "targetType" "my_new_schema"."ApprovalType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "submittedBy" TEXT NOT NULL,
    "reviewedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "approval_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "my_new_schema"."feature_flags" (
    "key" TEXT NOT NULL,
    "type" "my_new_schema"."FeatureFlagType" NOT NULL,
    "enabled" BOOLEAN,
    "percent" INTEGER,
    "rulesJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "my_new_schema"."audit_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetId" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "my_new_schema"."vendors" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "country" TEXT,
    "state" TEXT,
    "city" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "instagram" TEXT,
    "status" "my_new_schema"."VendorStatus" NOT NULL DEFAULT 'PENDING',
    "verification" "my_new_schema"."VerificationStatus" NOT NULL DEFAULT 'NONE',
    "score" INTEGER NOT NULL DEFAULT 50,
    "responseMsP50" INTEGER,
    "responseSLAHit" DOUBLE PRECISION,
    "disputeRate" DOUBLE PRECISION,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "my_new_schema"."vendor_signals" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "emailHash" TEXT,
    "phoneHash" TEXT,
    "deviceHash" TEXT,
    "ipHash" TEXT,
    "bankHash" TEXT,
    "addressHash" TEXT,
    "imagesPhash" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendor_signals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "my_new_schema"."vendor_verifications" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "status" "my_new_schema"."VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "docsJson" JSONB,
    "reviewerId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendor_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "my_new_schema"."vendor_sanctions" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "type" "my_new_schema"."SanctionType" NOT NULL,
    "reasonCode" TEXT NOT NULL,
    "notes" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendor_sanctions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "my_new_schema"."vendor_events" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "type" "my_new_schema"."VendorEventType" NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendor_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "my_new_schema"."wedding_details" (
    "userId" TEXT NOT NULL,
    "venue" TEXT,
    "weddingDate" TIMESTAMP(3),
    "budget" DECIMAL(65,30),
    "guestCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wedding_details_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "my_new_schema"."directory_vendors" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "city" TEXT,
    "region" TEXT,
    "priceBand" TEXT,
    "averageRating" INTEGER,
    "reviewCount" INTEGER DEFAULT 0,
    "shortDescription" TEXT,
    "description" TEXT,
    "photos" TEXT,
    "website" TEXT,
    "websiteHost" TEXT,
    "email" TEXT,
    "emailLower" TEXT,
    "phone" TEXT,
    "phoneDigits" TEXT,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "tags" TEXT,
    "fraudFlags" TEXT,
    "duplicateOfId" TEXT,
    "isSuspended" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "directory_vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "my_new_schema"."sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ipHash" TEXT,
    "uaHash" TEXT,
    "region" TEXT,
    "country" TEXT,
    "city" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "my_new_schema"."directory_inquiries" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "message" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3),
    "budget" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "directory_inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "my_new_schema"."guests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rsvpStatus" "my_new_schema"."RsvpStatus" NOT NULL DEFAULT 'pending',
    "mealPreference" TEXT,
    "side" "my_new_schema"."Side",
    "invitationSent" BOOLEAN NOT NULL DEFAULT false,
    "plusOneAllowed" BOOLEAN NOT NULL DEFAULT false,
    "plusOneName" TEXT,
    "householdId" TEXT,
    "tags" TEXT,
    "relationshipCategory" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "my_new_schema"."rsvps" (
    "guestId" TEXT NOT NULL,
    "status" "my_new_schema"."RsvpStatus" NOT NULL DEFAULT 'pending',
    "dateResponded" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rsvps_pkey" PRIMARY KEY ("guestId")
);

-- CreateTable
CREATE TABLE "my_new_schema"."budgets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "allocated" DECIMAL(65,30) NOT NULL,
    "actual" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "status" "my_new_schema"."BudgetStatus" NOT NULL DEFAULT 'planned',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "my_new_schema"."tasks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "priority" "my_new_schema"."TaskPriority" NOT NULL DEFAULT 'medium',
    "status" "my_new_schema"."TaskStatus" NOT NULL DEFAULT 'pending',
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "assignedTo" TEXT,
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "templateId" TEXT,
    "timeline" TEXT,
    "order" INTEGER,
    "tags" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "my_new_schema"."task_assignments" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "assigneeId" TEXT NOT NULL,
    "assignedBy" TEXT NOT NULL,
    "status" "my_new_schema"."TaskStatus" NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "dueDate" TIMESTAMP(3),
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "my_new_schema"."tables" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shape" "my_new_schema"."TableShape" NOT NULL DEFAULT 'round',
    "capacity" INTEGER NOT NULL,
    "positionX" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "positionY" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rotation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "width" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "diameter" DOUBLE PRECISION,
    "color" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "my_new_schema"."seats" (
    "id" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "guestId" TEXT,
    "seatNumber" INTEGER NOT NULL,
    "positionX" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "positionY" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isHost" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "my_new_schema"."invites" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "country" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "my_new_schema"."invite_rsvps" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "inviteId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" "my_new_schema"."RsvpStatus" NOT NULL DEFAULT 'pending',
    "partySize" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invite_rsvps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "my_new_schema"."credit_balances" (
    "userId" TEXT NOT NULL,
    "credits" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_balances_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "my_new_schema"."messages" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT,
    "content" TEXT,
    "provider" TEXT,
    "providerMessageId" TEXT,
    "status" "my_new_schema"."MessageStatus" NOT NULL DEFAULT 'sent',
    "cost" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'credits',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "metadata" JSONB,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "my_new_schema"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_userId_key" ON "my_new_schema"."user_profiles"("userId");

-- CreateIndex
CREATE INDEX "user_profiles_country_state_city_plan_idx" ON "my_new_schema"."user_profiles"("country", "state", "city", "plan");

-- CreateIndex
CREATE INDEX "credit_ledger_userId_idx" ON "my_new_schema"."credit_ledger"("userId");

-- CreateIndex
CREATE INDEX "credit_ledger_createdAt_idx" ON "my_new_schema"."credit_ledger"("createdAt");

-- CreateIndex
CREATE INDEX "sanctions_userId_idx" ON "my_new_schema"."sanctions"("userId");

-- CreateIndex
CREATE INDEX "approval_queue_status_targetType_idx" ON "my_new_schema"."approval_queue"("status", "targetType");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "my_new_schema"."audit_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "vendors_slug_key" ON "my_new_schema"."vendors"("slug");

-- CreateIndex
CREATE INDEX "vendors_ownerUserId_idx" ON "my_new_schema"."vendors"("ownerUserId");

-- CreateIndex
CREATE INDEX "vendors_category_country_state_city_status_verification_idx" ON "my_new_schema"."vendors"("category", "country", "state", "city", "status", "verification");

-- CreateIndex
CREATE INDEX "vendor_signals_vendorId_idx" ON "my_new_schema"."vendor_signals"("vendorId");

-- CreateIndex
CREATE INDEX "vendor_signals_emailHash_idx" ON "my_new_schema"."vendor_signals"("emailHash");

-- CreateIndex
CREATE INDEX "vendor_signals_phoneHash_idx" ON "my_new_schema"."vendor_signals"("phoneHash");

-- CreateIndex
CREATE INDEX "vendor_signals_deviceHash_idx" ON "my_new_schema"."vendor_signals"("deviceHash");

-- CreateIndex
CREATE INDEX "vendor_signals_ipHash_idx" ON "my_new_schema"."vendor_signals"("ipHash");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_verifications_vendorId_key" ON "my_new_schema"."vendor_verifications"("vendorId");

-- CreateIndex
CREATE INDEX "vendor_sanctions_vendorId_idx" ON "my_new_schema"."vendor_sanctions"("vendorId");

-- CreateIndex
CREATE INDEX "vendor_events_vendorId_idx" ON "my_new_schema"."vendor_events"("vendorId");

-- CreateIndex
CREATE INDEX "vendor_events_createdAt_idx" ON "my_new_schema"."vendor_events"("createdAt");

-- CreateIndex
CREATE INDEX "dirvendors_category_region_idx" ON "my_new_schema"."directory_vendors"("category", "region");

-- CreateIndex
CREATE INDEX "dirvendors_rating_reviews_idx" ON "my_new_schema"."directory_vendors"("averageRating", "reviewCount");

-- CreateIndex
CREATE INDEX "dirvendors_owner_idx" ON "my_new_schema"."directory_vendors"("ownerUserId");

-- CreateIndex
CREATE INDEX "dirvendors_websitehost_idx" ON "my_new_schema"."directory_vendors"("websiteHost");

-- CreateIndex
CREATE INDEX "dirvendors_emaillower_idx" ON "my_new_schema"."directory_vendors"("emailLower");

-- CreateIndex
CREATE INDEX "dirvendors_phonedigits_idx" ON "my_new_schema"."directory_vendors"("phoneDigits");

-- CreateIndex
CREATE INDEX "sessions_user_lastactive_idx" ON "my_new_schema"."sessions"("userId", "lastActiveAt");

-- CreateIndex
CREATE INDEX "sessions_revoked_idx" ON "my_new_schema"."sessions"("revokedAt");

-- CreateIndex
CREATE INDEX "dirinquiries_vendor_created_idx" ON "my_new_schema"."directory_inquiries"("vendorId", "createdAt");

-- CreateIndex
CREATE INDEX "tasks_user_status_idx" ON "my_new_schema"."tasks"("userId", "status");

-- CreateIndex
CREATE INDEX "tasks_user_duedate_idx" ON "my_new_schema"."tasks"("userId", "dueDate");

-- CreateIndex
CREATE INDEX "tasks_user_category_idx" ON "my_new_schema"."tasks"("userId", "category");

-- CreateIndex
CREATE INDEX "tasks_template_timeline_idx" ON "my_new_schema"."tasks"("isTemplate", "timeline");

-- CreateIndex
CREATE UNIQUE INDEX "task_assignments_taskId_assigneeId_key" ON "my_new_schema"."task_assignments"("taskId", "assigneeId");

-- CreateIndex
CREATE INDEX "tables_user_idx" ON "my_new_schema"."tables"("userId");

-- CreateIndex
CREATE INDEX "seats_table_idx" ON "my_new_schema"."seats"("tableId");

-- CreateIndex
CREATE INDEX "seats_guest_idx" ON "my_new_schema"."seats"("guestId");

-- CreateIndex
CREATE UNIQUE INDEX "seats_table_number_unique" ON "my_new_schema"."seats"("tableId", "seatNumber");

-- CreateIndex
CREATE UNIQUE INDEX "invites_token_key" ON "my_new_schema"."invites"("token");

-- CreateIndex
CREATE INDEX "invites_user_idx" ON "my_new_schema"."invites"("userId");

-- CreateIndex
CREATE INDEX "invites_token_idx" ON "my_new_schema"."invites"("token");

-- CreateIndex
CREATE INDEX "invite_rsvps_user_idx" ON "my_new_schema"."invite_rsvps"("userId");

-- CreateIndex
CREATE INDEX "invite_rsvps_invite_idx" ON "my_new_schema"."invite_rsvps"("inviteId");

-- CreateIndex
CREATE UNIQUE INDEX "invite_rsvps_user_email_unique" ON "my_new_schema"."invite_rsvps"("userId", "email");

-- CreateIndex
CREATE INDEX "messages_user_created_idx" ON "my_new_schema"."messages"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "messages_status_created_idx" ON "my_new_schema"."messages"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "my_new_schema"."user_profiles" ADD CONSTRAINT "user_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "my_new_schema"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "my_new_schema"."vendors" ADD CONSTRAINT "vendors_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "my_new_schema"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "my_new_schema"."vendor_signals" ADD CONSTRAINT "vendor_signals_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "my_new_schema"."vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "my_new_schema"."vendor_verifications" ADD CONSTRAINT "vendor_verifications_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "my_new_schema"."vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "my_new_schema"."vendor_sanctions" ADD CONSTRAINT "vendor_sanctions_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "my_new_schema"."vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "my_new_schema"."vendor_events" ADD CONSTRAINT "vendor_events_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "my_new_schema"."vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "my_new_schema"."wedding_details" ADD CONSTRAINT "wedding_details_userId_fkey" FOREIGN KEY ("userId") REFERENCES "my_new_schema"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "my_new_schema"."sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "my_new_schema"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "my_new_schema"."guests" ADD CONSTRAINT "guests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "my_new_schema"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "my_new_schema"."rsvps" ADD CONSTRAINT "rsvps_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "my_new_schema"."guests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "my_new_schema"."budgets" ADD CONSTRAINT "budgets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "my_new_schema"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "my_new_schema"."tasks" ADD CONSTRAINT "tasks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "my_new_schema"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "my_new_schema"."task_assignments" ADD CONSTRAINT "task_assignments_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "my_new_schema"."tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "my_new_schema"."task_assignments" ADD CONSTRAINT "task_assignments_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "my_new_schema"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "my_new_schema"."task_assignments" ADD CONSTRAINT "task_assignments_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "my_new_schema"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "my_new_schema"."tables" ADD CONSTRAINT "tables_userId_fkey" FOREIGN KEY ("userId") REFERENCES "my_new_schema"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "my_new_schema"."seats" ADD CONSTRAINT "seats_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "my_new_schema"."tables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "my_new_schema"."seats" ADD CONSTRAINT "seats_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "my_new_schema"."guests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "my_new_schema"."invites" ADD CONSTRAINT "invites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "my_new_schema"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "my_new_schema"."invite_rsvps" ADD CONSTRAINT "invite_rsvps_userId_fkey" FOREIGN KEY ("userId") REFERENCES "my_new_schema"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "my_new_schema"."invite_rsvps" ADD CONSTRAINT "invite_rsvps_inviteId_fkey" FOREIGN KEY ("inviteId") REFERENCES "my_new_schema"."invites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "my_new_schema"."credit_balances" ADD CONSTRAINT "credit_balances_userId_fkey" FOREIGN KEY ("userId") REFERENCES "my_new_schema"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "my_new_schema"."messages" ADD CONSTRAINT "messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "my_new_schema"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
