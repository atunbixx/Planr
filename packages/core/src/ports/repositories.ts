import type { Role, EventTypeKey, Entitlement } from "../types";

export interface OrganizationRecord {
  id: string;
  clerkOrgId: string;
  name: string;
}
export interface UserRecord {
  id: string;
  clerkUserId: string;
  email: string;
  name: string | null;
}
export interface MembershipRecord {
  id: string;
  organizationId: string;
  userId: string;
  role: Role;
}
export interface EventRecord {
  id: string;
  organizationId: string;
  eventTypeKey: EventTypeKey;
  name: string;
  date: Date | null;
}
export interface EntitlementRecord {
  id: string;
  organizationId: string;
  eventId: string | null;
  key: Entitlement;
  source: string;
}

export interface OrganizationRepository {
  upsertByClerkOrgId(input: { clerkOrgId: string; name: string }): Promise<OrganizationRecord>;
  findByClerkOrgId(clerkOrgId: string): Promise<OrganizationRecord | null>;
}
export interface UserRepository {
  upsertByClerkUserId(input: {
    clerkUserId: string;
    email: string;
    name: string | null;
  }): Promise<UserRecord>;
  findByClerkUserId(clerkUserId: string): Promise<UserRecord | null>;
}
export interface MembershipRepository {
  upsert(input: { organizationId: string; userId: string; role: Role }): Promise<MembershipRecord>;
  remove(input: { organizationId: string; userId: string }): Promise<void>;
  listByOrganization(organizationId: string): Promise<MembershipRecord[]>;
  find(input: { organizationId: string; userId: string }): Promise<MembershipRecord | null>;
}
export interface EventRepository {
  create(input: {
    organizationId: string;
    eventTypeKey: EventTypeKey;
    name: string;
    date: Date | null;
  }): Promise<EventRecord>;
  listByOrganization(organizationId: string): Promise<EventRecord[]>;
  findById(input: { organizationId: string; id: string }): Promise<EventRecord | null>;
}
export interface EntitlementRepository {
  grant(input: {
    organizationId: string;
    eventId: string | null;
    key: Entitlement;
    source: string;
  }): Promise<EntitlementRecord>;
  heldFor(input: { organizationId: string; eventId: string | null }): Promise<Entitlement[]>;
}

export interface Repositories {
  orgs: OrganizationRepository;
  users: UserRepository;
  memberships: MembershipRepository;
  events: EventRepository;
  entitlements: EntitlementRepository;
}
