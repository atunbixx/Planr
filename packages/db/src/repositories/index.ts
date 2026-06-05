import type { Repositories } from "@planr/core";
import type { PrismaClient } from "../generated/client";
import { PrismaOrganizationRepository } from "./organization.repository";
import { PrismaUserRepository } from "./user.repository";
import { PrismaMembershipRepository } from "./membership.repository";
import { PrismaEventRepository } from "./event.repository";
import { PrismaEntitlementRepository } from "./entitlement.repository";
import { PrismaInvitationRepository } from "./invitation.repository";
import { PrismaGuestRepository } from "./guest.repository";

export function createRepositories(prisma: PrismaClient): Repositories {
  return {
    orgs: new PrismaOrganizationRepository(prisma),
    users: new PrismaUserRepository(prisma),
    memberships: new PrismaMembershipRepository(prisma),
    events: new PrismaEventRepository(prisma),
    entitlements: new PrismaEntitlementRepository(prisma),
    invitations: new PrismaInvitationRepository(prisma),
    guests: new PrismaGuestRepository(prisma),
  };
}
