export * from "./types";
export { eventTypeProfiles, getEventTypeProfile } from "./event-types/registry";
export {
  moduleDefinitions,
  getModule,
  modulesForEventType,
  type ModuleDefinition,
} from "./capabilities/registry";
export {
  resolveModuleAccess,
  FREE_BASELINE_MODULES,
  type ModuleAccess,
  type AccessReason,
  type ResolveInput,
} from "./entitlements/resolver";
export { roleHasPermission, permissionsForRole } from "./rbac/policy";
export type {
  OrganizationRecord,
  UserRecord,
  MembershipRecord,
  EventRecord,
  EntitlementRecord,
  OrganizationRepository,
  UserRepository,
  MembershipRepository,
  EventRepository,
  EntitlementRepository,
  Repositories,
  MemberView,
  InvitationRecord,
  InvitationRepository,
} from "./ports/repositories";
export { makeTenancyService, type TenancyService } from "./services/tenancy.service";
export { syncAuthUser } from "./sync/auth-sync";
export { makeEventService, type EventService, type ResolvedModule } from "./services/event.service";
export {
  makeEntitlementService,
  type EntitlementService,
} from "./services/entitlement.service";
export {
  makeAuthorizationService,
  type AuthorizationService,
} from "./services/authorization.service";
export {
  getPlan,
  planGrants,
  allPlans,
  type Plan,
  type PlanInterval,
  type PlanScope,
} from "./billing/plans";
export { makeBillingService, type BillingService } from "./services/billing.service";
export {
  makeOnboardingService,
  type OnboardingService,
} from "./services/onboarding.service";
export { workspaceTerms, type WorkspaceTerms } from "./workspaces/terms";
export {
  makeCollaborationService,
  type CollaborationService,
  type InviteRole,
} from "./services/collaboration.service";
