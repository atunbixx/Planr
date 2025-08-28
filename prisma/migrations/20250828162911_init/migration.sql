-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'couple',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "wedding_details" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "venue" TEXT,
    "weddingDate" DATETIME,
    "budget" DECIMAL,
    "guestCount" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "wedding_details_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "vendors" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priceRange" TEXT,
    "contact" TEXT,
    "website" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "status" TEXT,
    "rating" INTEGER,
    "isfavorite" BOOLEAN DEFAULT false,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "tags" TEXT,
    "notes" TEXT,
    "quoteamount" DECIMAL,
    "bookeddate" DATETIME,
    "instagramurl" TEXT,
    "logourl" TEXT,
    "slug" TEXT,
    CONSTRAINT "vendors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "directory_vendors" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "latitude" REAL,
    "longitude" REAL,
    "tags" TEXT,
    "fraudFlags" TEXT,
    "duplicateOfId" TEXT,
    "isSuspended" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "admin_audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adminUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "details" JSONB,
    "ip" TEXT,
    "ua" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "ipHash" TEXT,
    "uaHash" TEXT,
    "region" TEXT,
    "country" TEXT,
    "city" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" DATETIME,
    CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "directory_inquiries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vendorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "message" TEXT NOT NULL,
    "eventDate" DATETIME,
    "budget" DECIMAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "guests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "relationship" TEXT,
    "relationshipCategory" TEXT,
    "side" TEXT,
    "rsvpStatus" TEXT NOT NULL DEFAULT 'pending',
    "plusOneAllowed" BOOLEAN NOT NULL DEFAULT false,
    "plusOneName" TEXT,
    "attendingCount" INTEGER NOT NULL DEFAULT 1,
    "dietaryRestrictions" TEXT,
    "notes" TEXT,
    "tags" TEXT,
    "invitationSent" BOOLEAN NOT NULL DEFAULT false,
    "rsvpDeadline" DATETIME,
    "householdId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "guests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "rsvps" (
    "guestId" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "dateResponded" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "rsvps_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guests" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "budgets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "allocated" DECIMAL NOT NULL,
    "actual" DECIMAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "budgets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "dueDate" DATETIME,
    "completedAt" DATETIME,
    "assignedTo" TEXT,
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "templateId" TEXT,
    "timeline" TEXT,
    "order" INTEGER,
    "tags" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tasks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "task_assignments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "assigneeId" TEXT NOT NULL,
    "assignedBy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "dueDate" DATETIME,
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "task_assignments_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "task_assignments_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "task_assignments_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tables" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shape" TEXT NOT NULL DEFAULT 'round',
    "capacity" INTEGER NOT NULL,
    "positionX" REAL NOT NULL DEFAULT 0,
    "positionY" REAL NOT NULL DEFAULT 0,
    "rotation" REAL NOT NULL DEFAULT 0,
    "width" REAL,
    "height" REAL,
    "diameter" REAL,
    "color" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tables_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "seats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tableId" TEXT NOT NULL,
    "guestId" TEXT,
    "seatNumber" INTEGER NOT NULL,
    "positionX" REAL NOT NULL DEFAULT 0,
    "positionY" REAL NOT NULL DEFAULT 0,
    "isHost" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "seats_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "tables" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "seats_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guests" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "invites" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "country" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "invites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "invite_rsvps" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "inviteId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "partySize" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "invite_rsvps_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "invite_rsvps_inviteId_fkey" FOREIGN KEY ("inviteId") REFERENCES "invites" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "credit_balances" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "credits" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "credit_balances_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT,
    "content" TEXT,
    "provider" TEXT,
    "providerMessageId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "cost" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'credits',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" DATETIME,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "metadata" JSONB,
    CONSTRAINT "messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "vendors_slug_key" ON "vendors"("slug");

-- CreateIndex
CREATE INDEX "vendors_userid_category_idx" ON "vendors"("userId", "category");

-- CreateIndex
CREATE INDEX "vendors_userid_createdat_idx" ON "vendors"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "vendors_userid_status_idx" ON "vendors"("userId", "status");

-- CreateIndex
CREATE INDEX "vendors_slug_idx" ON "vendors"("slug");

-- CreateIndex
CREATE INDEX "dirvendors_category_region_idx" ON "directory_vendors"("category", "region");

-- CreateIndex
CREATE INDEX "dirvendors_rating_reviews_idx" ON "directory_vendors"("averageRating", "reviewCount");

-- CreateIndex
CREATE INDEX "dirvendors_owner_idx" ON "directory_vendors"("ownerUserId");

-- CreateIndex
CREATE INDEX "dirvendors_websitehost_idx" ON "directory_vendors"("websiteHost");

-- CreateIndex
CREATE INDEX "dirvendors_emaillower_idx" ON "directory_vendors"("emailLower");

-- CreateIndex
CREATE INDEX "dirvendors_phonedigits_idx" ON "directory_vendors"("phoneDigits");

-- CreateIndex
CREATE INDEX "admin_audit_admin_created_idx" ON "admin_audit_logs"("adminUserId", "createdAt");

-- CreateIndex
CREATE INDEX "admin_audit_target_idx" ON "admin_audit_logs"("targetType", "targetId", "createdAt");

-- CreateIndex
CREATE INDEX "sessions_user_lastactive_idx" ON "sessions"("userId", "lastActiveAt");

-- CreateIndex
CREATE INDEX "sessions_revoked_idx" ON "sessions"("revokedAt");

-- CreateIndex
CREATE INDEX "dirinquiries_vendor_created_idx" ON "directory_inquiries"("vendorId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "guests_userId_email_key" ON "guests"("userId", "email");

-- CreateIndex
CREATE INDEX "tasks_user_status_idx" ON "tasks"("userId", "status");

-- CreateIndex
CREATE INDEX "tasks_user_duedate_idx" ON "tasks"("userId", "dueDate");

-- CreateIndex
CREATE INDEX "tasks_user_category_idx" ON "tasks"("userId", "category");

-- CreateIndex
CREATE INDEX "tasks_template_timeline_idx" ON "tasks"("isTemplate", "timeline");

-- CreateIndex
CREATE UNIQUE INDEX "task_assignments_taskId_assigneeId_key" ON "task_assignments"("taskId", "assigneeId");

-- CreateIndex
CREATE INDEX "tables_user_idx" ON "tables"("userId");

-- CreateIndex
CREATE INDEX "seats_table_idx" ON "seats"("tableId");

-- CreateIndex
CREATE INDEX "seats_guest_idx" ON "seats"("guestId");

-- CreateIndex
CREATE UNIQUE INDEX "seats_table_number_unique" ON "seats"("tableId", "seatNumber");

-- CreateIndex
CREATE UNIQUE INDEX "invites_token_key" ON "invites"("token");

-- CreateIndex
CREATE INDEX "invites_user_idx" ON "invites"("userId");

-- CreateIndex
CREATE INDEX "invites_token_idx" ON "invites"("token");

-- CreateIndex
CREATE INDEX "invite_rsvps_user_idx" ON "invite_rsvps"("userId");

-- CreateIndex
CREATE INDEX "invite_rsvps_invite_idx" ON "invite_rsvps"("inviteId");

-- CreateIndex
CREATE UNIQUE INDEX "invite_rsvps_user_email_unique" ON "invite_rsvps"("userId", "email");

-- CreateIndex
CREATE INDEX "messages_user_created_idx" ON "messages"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "messages_status_created_idx" ON "messages"("status", "createdAt");
