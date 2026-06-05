import type { Role, EventTypeKey, Entitlement, OrgType, InvitationStatus } from "../types";

export interface OrganizationRecord {
  id: string;
  name: string;
  type: OrgType;
}
export interface UserRecord {
  id: string;
  authUserId: string;
  email: string | null;
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
  create(input: { name: string; type?: OrgType }): Promise<OrganizationRecord>;
  findById(id: string): Promise<OrganizationRecord | null>;
  listForUser(userId: string): Promise<OrganizationRecord[]>;
}
export interface UserRepository {
  upsertByAuthUserId(input: {
    authUserId: string;
    email: string | null;
    name: string | null;
  }): Promise<UserRecord>;
  findByAuthUserId(authUserId: string): Promise<UserRecord | null>;
}
export interface MemberView {
  userId: string;
  email: string | null;
  name: string | null;
  role: Role;
}

export interface MembershipRepository {
  upsert(input: { organizationId: string; userId: string; role: Role }): Promise<MembershipRecord>;
  remove(input: { organizationId: string; userId: string }): Promise<void>;
  listByOrganization(organizationId: string): Promise<MembershipRecord[]>;
  find(input: { organizationId: string; userId: string }): Promise<MembershipRecord | null>;
  listMembersWithUsers(organizationId: string): Promise<MemberView[]>;
}

export interface InvitationRecord {
  id: string;
  organizationId: string;
  email: string;
  role: Role;
  token: string;
  status: InvitationStatus;
  invitedByUserId: string;
}

export interface InvitationRepository {
  create(input: {
    organizationId: string;
    email: string;
    role: Role;
    token: string;
    invitedByUserId: string;
  }): Promise<InvitationRecord>;
  findByToken(token: string): Promise<InvitationRecord | null>;
  findPending(input: { organizationId: string; email: string }): Promise<InvitationRecord | null>;
  listPendingByEmail(email: string): Promise<InvitationRecord[]>;
  listPendingByOrganization(organizationId: string): Promise<InvitationRecord[]>;
  setStatus(input: { id: string; status: InvitationStatus }): Promise<void>;
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
  grantIfAbsent(input: {
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
  invitations: InvitationRepository;
}
