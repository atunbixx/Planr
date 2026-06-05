import type {
  Role,
  EventTypeKey,
  Entitlement,
  OrgType,
  InvitationStatus,
  RsvpStatus,
} from "../types";

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
  getById(id: string): Promise<EventRecord | null>;
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

export interface GuestRecord {
  id: string;
  organizationId: string;
  eventId: string;
  name: string;
  email: string | null;
  phone: string | null;
  groupLabel: string | null;
  plusOne: boolean;
  rsvpStatus: RsvpStatus;
  notes: string | null;
}

export interface GuestSummary {
  total: number;
  coming: number;
  declined: number;
  maybe: number;
  awaiting: number;
}

export interface GuestWrite {
  name: string;
  email: string | null;
  phone: string | null;
  groupLabel: string | null;
  plusOne: boolean;
  rsvpStatus: RsvpStatus;
  notes: string | null;
}

export interface GuestRepository {
  create(input: { organizationId: string; eventId: string } & GuestWrite): Promise<GuestRecord>;
  listByEvent(input: {
    organizationId: string;
    eventId: string;
    limit: number;
    cursor?: string;
  }): Promise<{ guests: GuestRecord[]; nextCursor: string | null }>;
  getById(input: {
    organizationId: string;
    eventId: string;
    id: string;
  }): Promise<GuestRecord | null>;
  update(input: {
    organizationId: string;
    eventId: string;
    id: string;
    patch: Partial<GuestWrite>;
  }): Promise<GuestRecord | null>;
  remove(input: { organizationId: string; eventId: string; id: string }): Promise<boolean>;
  summaryByEvent(input: { organizationId: string; eventId: string }): Promise<GuestSummary>;
}

export interface TaskRecord {
  id: string;
  organizationId: string;
  eventId: string;
  title: string;
  notes: string | null;
  done: boolean;
  dueDate: Date | null;
}

export interface TaskSummary {
  total: number;
  done: number;
  remaining: number;
  overdue: number;
}

export interface TaskWrite {
  title: string;
  notes: string | null;
  done: boolean;
  dueDate: Date | null;
}

export interface TaskRepository {
  create(input: { organizationId: string; eventId: string } & TaskWrite): Promise<TaskRecord>;
  listByEvent(input: {
    organizationId: string;
    eventId: string;
    limit: number;
    cursor?: string;
  }): Promise<{ tasks: TaskRecord[]; nextCursor: string | null }>;
  getById(input: {
    organizationId: string;
    eventId: string;
    id: string;
  }): Promise<TaskRecord | null>;
  update(input: {
    organizationId: string;
    eventId: string;
    id: string;
    patch: Partial<TaskWrite>;
  }): Promise<TaskRecord | null>;
  remove(input: { organizationId: string; eventId: string; id: string }): Promise<boolean>;
  // `now` is injected so the overdue boundary is deterministic and testable.
  summaryByEvent(input: {
    organizationId: string;
    eventId: string;
    now: Date;
  }): Promise<TaskSummary>;
}

export interface BudgetItemRecord {
  id: string;
  organizationId: string;
  eventId: string;
  label: string;
  category: string | null;
  estimatedCents: number;
  paidCents: number;
  notes: string | null;
}

export interface BudgetSummary {
  itemCount: number;
  totalEstimatedCents: number;
  totalPaidCents: number;
  // estimated - paid; may be negative when overspent.
  remainingCents: number;
}

export interface BudgetItemWrite {
  label: string;
  category: string | null;
  estimatedCents: number;
  paidCents: number;
  notes: string | null;
}

export interface BudgetItemRepository {
  create(
    input: { organizationId: string; eventId: string } & BudgetItemWrite,
  ): Promise<BudgetItemRecord>;
  listByEvent(input: {
    organizationId: string;
    eventId: string;
    limit: number;
    cursor?: string;
  }): Promise<{ items: BudgetItemRecord[]; nextCursor: string | null }>;
  getById(input: {
    organizationId: string;
    eventId: string;
    id: string;
  }): Promise<BudgetItemRecord | null>;
  update(input: {
    organizationId: string;
    eventId: string;
    id: string;
    patch: Partial<BudgetItemWrite>;
  }): Promise<BudgetItemRecord | null>;
  remove(input: { organizationId: string; eventId: string; id: string }): Promise<boolean>;
  summaryByEvent(input: { organizationId: string; eventId: string }): Promise<BudgetSummary>;
}

export interface SeatingTableRecord {
  id: string;
  organizationId: string;
  eventId: string;
  label: string;
  capacity: number;
}

export interface SeatAssignmentRecord {
  id: string;
  tableId: string;
  guestId: string;
}

export interface SeatingTableWrite {
  label: string;
  capacity: number;
}

export interface SeatingRepository {
  createTable(
    input: { organizationId: string; eventId: string } & SeatingTableWrite,
  ): Promise<SeatingTableRecord>;
  listTables(input: { organizationId: string; eventId: string }): Promise<SeatingTableRecord[]>;
  getTable(input: {
    organizationId: string;
    eventId: string;
    id: string;
  }): Promise<SeatingTableRecord | null>;
  updateTable(input: {
    organizationId: string;
    eventId: string;
    id: string;
    patch: Partial<SeatingTableWrite>;
  }): Promise<SeatingTableRecord | null>;
  removeTable(input: { organizationId: string; eventId: string; id: string }): Promise<boolean>;
  listAssignments(input: {
    organizationId: string;
    eventId: string;
  }): Promise<SeatAssignmentRecord[]>;
  countByTable(input: {
    organizationId: string;
    eventId: string;
    tableId: string;
  }): Promise<number>;
  // Upsert by guestId — moves the guest if already seated elsewhere.
  assign(input: {
    organizationId: string;
    eventId: string;
    tableId: string;
    guestId: string;
  }): Promise<SeatAssignmentRecord>;
  unassign(input: {
    organizationId: string;
    eventId: string;
    guestId: string;
  }): Promise<boolean>;
}

export interface Repositories {
  orgs: OrganizationRepository;
  users: UserRepository;
  memberships: MembershipRepository;
  events: EventRepository;
  entitlements: EntitlementRepository;
  invitations: InvitationRepository;
  guests: GuestRepository;
  tasks: TaskRepository;
  budget: BudgetItemRepository;
  seating: SeatingRepository;
}
