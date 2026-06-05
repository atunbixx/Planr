import { prisma, createRepositories } from "@planr/db";
import {
  makeTenancyService,
  makeEventService,
  makeEntitlementService,
  makeAuthorizationService,
  makeOnboardingService,
} from "@planr/core";

const repos = createRepositories(prisma);

export const container = {
  repos,
  tenancy: makeTenancyService(repos),
  events: makeEventService(repos),
  entitlements: makeEntitlementService(repos),
  authz: makeAuthorizationService(repos),
  onboarding: makeOnboardingService(repos),
};

export type Container = typeof container;
