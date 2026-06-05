import { prisma, createRepositories } from "@planr/db";
import {
  makeTenancyService,
  makeEventService,
  makeEntitlementService,
  makeAuthorizationService,
  makeOnboardingService,
  makeCollaborationService,
  makeGuestService,
  makeTaskService,
} from "@planr/core";

const repos = createRepositories(prisma);

export const container = {
  repos,
  tenancy: makeTenancyService(repos),
  events: makeEventService(repos),
  entitlements: makeEntitlementService(repos),
  authz: makeAuthorizationService(repos),
  onboarding: makeOnboardingService(repos),
  collaboration: makeCollaborationService(repos),
  // freeLaunch defaults from the FREE_LAUNCH constant — gate stays wired for later.
  guests: makeGuestService(repos),
  tasks: makeTaskService(repos),
};

export type Container = typeof container;
