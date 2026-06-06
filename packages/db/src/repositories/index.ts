import type { Repositories } from "@planr/core";
import type { PrismaClient } from "../generated/client";
import { PrismaOrganizationRepository } from "./organization.repository";
import { PrismaUserRepository } from "./user.repository";
import { PrismaMembershipRepository } from "./membership.repository";
import { PrismaEventRepository } from "./event.repository";
import { PrismaEntitlementRepository } from "./entitlement.repository";
import { PrismaInvitationRepository } from "./invitation.repository";
import { PrismaGuestRepository } from "./guest.repository";
import { PrismaTaskRepository } from "./task.repository";
import { PrismaBudgetItemRepository } from "./budget.repository";
import { PrismaSeatingRepository } from "./seating.repository";
import { PrismaAnnouncementRepository } from "./messaging.repository";
import { PrismaEventWebsiteRepository } from "./website.repository";
import { PrismaVendorRepository } from "./vendor.repository";
import { PrismaRegistryRepository } from "./registry.repository";

export function createRepositories(prisma: PrismaClient): Repositories {
  return {
    orgs: new PrismaOrganizationRepository(prisma),
    users: new PrismaUserRepository(prisma),
    memberships: new PrismaMembershipRepository(prisma),
    events: new PrismaEventRepository(prisma),
    entitlements: new PrismaEntitlementRepository(prisma),
    invitations: new PrismaInvitationRepository(prisma),
    guests: new PrismaGuestRepository(prisma),
    tasks: new PrismaTaskRepository(prisma),
    budget: new PrismaBudgetItemRepository(prisma),
    seating: new PrismaSeatingRepository(prisma),
    announcements: new PrismaAnnouncementRepository(prisma),
    websites: new PrismaEventWebsiteRepository(prisma),
    vendors: new PrismaVendorRepository(prisma),
    registry: new PrismaRegistryRepository(prisma),
  };
}
