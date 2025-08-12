-- CreateEnum for Communication Types
CREATE TYPE "CommunicationType" AS ENUM ('email', 'sms', 'both');

-- CreateEnum for Communication Status
CREATE TYPE "CommunicationStatus" AS ENUM ('draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled');

-- CreateEnum for Template Categories
CREATE TYPE "TemplateCategory" AS ENUM ('save_the_date', 'invitation', 'rsvp_reminder', 'thank_you', 'update', 'custom');

-- CreateEnum for Document Types
CREATE TYPE "DocumentType" AS ENUM ('contract', 'invoice', 'permit', 'insurance', 'receipt', 'other');

-- CreateEnum for Document Status
CREATE TYPE "DocumentStatus" AS ENUM ('draft', 'pending_signature', 'signed', 'expired', 'archived');

-- CreateTable for Communication Templates
CREATE TABLE "CommunicationTemplate" (
    "id" TEXT NOT NULL,
    "coupleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "TemplateCategory" NOT NULL,
    "subject" TEXT,
    "content" TEXT NOT NULL,
    "variables" JSONB DEFAULT '[]',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunicationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable for Guest Communications
CREATE TABLE "GuestCommunication" (
    "id" TEXT NOT NULL,
    "coupleId" TEXT NOT NULL,
    "templateId" TEXT,
    "type" "CommunicationType" NOT NULL,
    "subject" TEXT,
    "content" TEXT NOT NULL,
    "status" "CommunicationStatus" NOT NULL DEFAULT 'draft',
    "scheduledFor" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuestCommunication_pkey" PRIMARY KEY ("id")
);

-- CreateTable for Communication Recipients
CREATE TABLE "CommunicationRecipient" (
    "id" TEXT NOT NULL,
    "communicationId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sentAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "metadata" JSONB DEFAULT '{}',

    CONSTRAINT "CommunicationRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable for SMS Configuration
CREATE TABLE "SMSConfiguration" (
    "id" TEXT NOT NULL,
    "coupleId" TEXT NOT NULL,
    "twilioAccountSid" TEXT NOT NULL,
    "twilioAuthToken" TEXT NOT NULL,
    "twilioPhoneNumber" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "monthlyLimit" INTEGER NOT NULL DEFAULT 1000,
    "sentThisMonth" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SMSConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable for Documents
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "coupleId" TEXT NOT NULL,
    "vendorId" TEXT,
    "type" "DocumentType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'draft',
    "expiresAt" TIMESTAMP(3),
    "signedAt" TIMESTAMP(3),
    "signedBy" TEXT[],
    "tags" TEXT[],
    "metadata" JSONB DEFAULT '{}',
    "encryptionKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable for Document Access Logs
CREATE TABLE "DocumentAccessLog" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentAccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable for Document Shares
CREATE TABLE "DocumentShare" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "sharedWith" TEXT NOT NULL,
    "sharedBy" TEXT NOT NULL,
    "permissions" TEXT[] DEFAULT ARRAY['view']::TEXT[],
    "expiresAt" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "lastAccessedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable for Email Configuration
CREATE TABLE "EmailConfiguration" (
    "id" TEXT NOT NULL,
    "coupleId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'resend',
    "apiKey" TEXT NOT NULL,
    "fromEmail" TEXT NOT NULL,
    "fromName" TEXT NOT NULL,
    "replyToEmail" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "dailyLimit" INTEGER NOT NULL DEFAULT 100,
    "sentToday" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable for Communication Analytics
CREATE TABLE "CommunicationAnalytics" (
    "id" TEXT NOT NULL,
    "communicationId" TEXT NOT NULL,
    "totalRecipients" INTEGER NOT NULL DEFAULT 0,
    "delivered" INTEGER NOT NULL DEFAULT 0,
    "opened" INTEGER NOT NULL DEFAULT 0,
    "clicked" INTEGER NOT NULL DEFAULT 0,
    "bounced" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "unsubscribed" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunicationAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommunicationTemplate_coupleId_idx" ON "CommunicationTemplate"("coupleId");
CREATE INDEX "CommunicationTemplate_category_idx" ON "CommunicationTemplate"("category");

CREATE INDEX "GuestCommunication_coupleId_idx" ON "GuestCommunication"("coupleId");
CREATE INDEX "GuestCommunication_status_idx" ON "GuestCommunication"("status");
CREATE INDEX "GuestCommunication_scheduledFor_idx" ON "GuestCommunication"("scheduledFor");

CREATE INDEX "CommunicationRecipient_communicationId_idx" ON "CommunicationRecipient"("communicationId");
CREATE INDEX "CommunicationRecipient_guestId_idx" ON "CommunicationRecipient"("guestId");

CREATE UNIQUE INDEX "SMSConfiguration_coupleId_key" ON "SMSConfiguration"("coupleId");

CREATE INDEX "Document_coupleId_idx" ON "Document"("coupleId");
CREATE INDEX "Document_vendorId_idx" ON "Document"("vendorId");
CREATE INDEX "Document_type_idx" ON "Document"("type");
CREATE INDEX "Document_status_idx" ON "Document"("status");

CREATE INDEX "DocumentAccessLog_documentId_idx" ON "DocumentAccessLog"("documentId");
CREATE INDEX "DocumentAccessLog_userId_idx" ON "DocumentAccessLog"("userId");

CREATE INDEX "DocumentShare_documentId_idx" ON "DocumentShare"("documentId");
CREATE UNIQUE INDEX "DocumentShare_accessToken_key" ON "DocumentShare"("accessToken");

CREATE UNIQUE INDEX "EmailConfiguration_coupleId_key" ON "EmailConfiguration"("coupleId");

CREATE UNIQUE INDEX "CommunicationAnalytics_communicationId_key" ON "CommunicationAnalytics"("communicationId");

-- AddForeignKey
ALTER TABLE "CommunicationTemplate" ADD CONSTRAINT "CommunicationTemplate_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GuestCommunication" ADD CONSTRAINT "GuestCommunication_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GuestCommunication" ADD CONSTRAINT "GuestCommunication_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "CommunicationTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CommunicationRecipient" ADD CONSTRAINT "CommunicationRecipient_communicationId_fkey" FOREIGN KEY ("communicationId") REFERENCES "GuestCommunication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommunicationRecipient" ADD CONSTRAINT "CommunicationRecipient_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SMSConfiguration" ADD CONSTRAINT "SMSConfiguration_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Document" ADD CONSTRAINT "Document_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Document" ADD CONSTRAINT "Document_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DocumentAccessLog" ADD CONSTRAINT "DocumentAccessLog_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DocumentShare" ADD CONSTRAINT "DocumentShare_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EmailConfiguration" ADD CONSTRAINT "EmailConfiguration_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CommunicationAnalytics" ADD CONSTRAINT "CommunicationAnalytics_communicationId_fkey" FOREIGN KEY ("communicationId") REFERENCES "GuestCommunication"("id") ON DELETE CASCADE ON UPDATE CASCADE;