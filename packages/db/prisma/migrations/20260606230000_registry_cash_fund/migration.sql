-- Cash funds: a registry item can be a monetary fund guests contribute toward.
ALTER TABLE "RegistryItem" ADD COLUMN "isCashFund" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "RegistryItem" ADD COLUMN "goalCents" INTEGER NOT NULL DEFAULT 0;

-- Individual guest contributions toward a cash fund (made via the public event site).
CREATE TABLE "RegistryContribution" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "registryItemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "message" TEXT,
    "amountCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegistryContribution_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RegistryContribution_eventId_idx" ON "RegistryContribution"("eventId");
CREATE INDEX "RegistryContribution_registryItemId_idx" ON "RegistryContribution"("registryItemId");

ALTER TABLE "RegistryContribution" ADD CONSTRAINT "RegistryContribution_registryItemId_fkey" FOREIGN KEY ("registryItemId") REFERENCES "RegistryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RegistryContribution" ADD CONSTRAINT "RegistryContribution_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RegistryContribution" ADD CONSTRAINT "RegistryContribution_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
