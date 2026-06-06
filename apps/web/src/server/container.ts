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
  makeBudgetService,
  makeSeatingService,
  makePublicRsvpService,
  makeRsvpService,
  makeMessagingService,
  makePublicMessagingService,
  makeWebsiteService,
  makePublicWebsiteService,
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
  budget: makeBudgetService(repos),
  seating: makeSeatingService(repos),
  publicRsvp: makePublicRsvpService(repos),
  rsvp: makeRsvpService(repos),
  messaging: makeMessagingService(repos),
  publicMessaging: makePublicMessagingService(repos),
  website: makeWebsiteService(repos),
  publicWebsite: makePublicWebsiteService(repos),
};

export type Container = typeof container;
