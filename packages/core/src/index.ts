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
} from "./ports/repositories";
export { makeTenancyService, type TenancyService } from "./services/tenancy.service";
export { mapClerkRole } from "./sync/clerk-role";
