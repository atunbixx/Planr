import type {
  Role,
  EventTypeKey,
  Entitlement,
  OrgType,
  InvitationStatus,
  RsvpStatus,
  VendorStatus,
} from "../types";

export interface OrganizationRecord {
  id: string;
  name: string;
  type: OrgType;
  currency: string;
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
  rename(input: { id: string; name: string }): Promise<OrganizationRecord>;
  setCurrency(input: { id: string; currency: string }): Promise<OrganizationRecord>;
  // FK cascade removes memberships, events, guests, … with the organization.
  delete(id: string): Promise<void>;
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
  update(input: {
    organizationId: string;
    id: string;
    patch: { name?: string; date?: Date | null };
  }): Promise<EventRecord | null>;
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
  rsvpToken: string;
  mealChoice: string | null;
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
  mealChoice: string | null;
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
  // Public RSVP: resolve / mutate a single guest purely by their capability token (no tenant scope).
  findByRsvpToken(token: string): Promise<GuestRecord | null>;
  setRsvpByToken(input: {
    token: string;
    rsvpStatus: RsvpStatus;
    plusOne?: boolean;
    mealChoice?: string | null;
  }): Promise<GuestRecord | null>;
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

export interface AnnouncementRecord {
  id: string;
  organizationId: string;
  eventId: string;
  title: string;
  body: string;
  createdAt: Date;
}

export interface AnnouncementWrite {
  title: string;
  body: string;
}

export interface AnnouncementRepository {
  create(
    input: { organizationId: string; eventId: string } & AnnouncementWrite,
  ): Promise<AnnouncementRecord>;
  // Newest first.
  listByEvent(input: { organizationId: string; eventId: string }): Promise<AnnouncementRecord[]>;
  getById(input: {
    organizationId: string;
    eventId: string;
    id: string;
  }): Promise<AnnouncementRecord | null>;
  update(input: {
    organizationId: string;
    eventId: string;
    id: string;
    patch: Partial<AnnouncementWrite>;
  }): Promise<AnnouncementRecord | null>;
  remove(input: { organizationId: string; eventId: string; id: string }): Promise<boolean>;
}

export interface EventWebsiteRecord {
  id: string;
  organizationId: string;
  eventId: string;
  slug: string;
  published: boolean;
  theme: string;
  headline: string | null;
  welcomeMessage: string | null;
  story: string | null;
  scheduleText: string | null;
  travelText: string | null;
}

export type EventWebsitePatch = Partial<{
  published: boolean;
  theme: string;
  headline: string | null;
  welcomeMessage: string | null;
  story: string | null;
  scheduleText: string | null;
  travelText: string | null;
}>;

export interface EventWebsiteRepository {
  create(input: {
    organizationId: string;
    eventId: string;
    slug: string;
  }): Promise<EventWebsiteRecord>;
  getByEvent(input: { organizationId: string; eventId: string }): Promise<EventWebsiteRecord | null>;
  getBySlug(slug: string): Promise<EventWebsiteRecord | null>;
  slugExists(slug: string): Promise<boolean>;
  update(input: {
    organizationId: string;
    eventId: string;
    patch: EventWebsitePatch;
  }): Promise<EventWebsiteRecord | null>;
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
  announcements: AnnouncementRepository;
  websites: EventWebsiteRepository;
  vendors: VendorRepository;
  registry: RegistryRepository;
  photos: PhotoRepository;
}

export interface PhotoRecord {
  id: string;
  organizationId: string;
  eventId: string;
  storagePath: string;
  caption: string | null;
  createdAt: Date;
}

export interface PhotoRepository {
  create(input: {
    organizationId: string;
    eventId: string;
    storagePath: string;
    caption: string | null;
  }): Promise<PhotoRecord>;
  // Newest first.
  listByEvent(input: { organizationId: string; eventId: string }): Promise<PhotoRecord[]>;
  remove(input: { organizationId: string; eventId: string; id: string }): Promise<boolean>;
}

export interface RegistryItemRecord {
  id: string;
  organizationId: string;
  eventId: string;
  title: string;
  url: string | null;
  note: string | null;
  priceCents: number;
  isCashFund: boolean;
  goalCents: number;
}

export interface RegistryItemWrite {
  title: string;
  url: string | null;
  note: string | null;
  priceCents: number;
  isCashFund: boolean;
  goalCents: number;
}

export interface RegistryContributionRecord {
  id: string;
  organizationId: string;
  eventId: string;
  registryItemId: string;
  name: string;
  message: string | null;
  amountCents: number;
}

export interface RegistryRepository {
  create(
    input: { organizationId: string; eventId: string } & RegistryItemWrite,
  ): Promise<RegistryItemRecord>;
  listByEvent(input: { organizationId: string; eventId: string }): Promise<RegistryItemRecord[]>;
  getById(input: {
    organizationId: string;
    eventId: string;
    id: string;
  }): Promise<RegistryItemRecord | null>;
  update(input: {
    organizationId: string;
    eventId: string;
    id: string;
    patch: Partial<RegistryItemWrite>;
  }): Promise<RegistryItemRecord | null>;
  remove(input: { organizationId: string; eventId: string; id: string }): Promise<boolean>;
  // Cash-fund contributions.
  addContribution(input: {
    organizationId: string;
    eventId: string;
    registryItemId: string;
    name: string;
    message: string | null;
    amountCents: number;
  }): Promise<RegistryContributionRecord>;
  // Oldest first.
  listContributionsByEvent(input: {
    organizationId: string;
    eventId: string;
  }): Promise<RegistryContributionRecord[]>;
  // Total raised per registry item: { [registryItemId]: cents }.
  raisedByEvent(input: {
    organizationId: string;
    eventId: string;
  }): Promise<Record<string, number>>;
}

export interface VendorRecord {
  id: string;
  organizationId: string;
  eventId: string;
  category: string | null;
  name: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  website: string | null;
  status: VendorStatus;
  costCents: number;
  depositPaidCents: number;
  notes: string | null;
}

export interface VendorWrite {
  category: string | null;
  name: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  website: string | null;
  status: VendorStatus;
  costCents: number;
  depositPaidCents: number;
  notes: string | null;
}

export interface VendorSummary {
  total: number;
  byStatus: Record<VendorStatus, number>;
  // Money across non-declined vendors.
  estimatedCents: number;
  paidCents: number;
  outstandingCents: number;
}

export interface VendorRepository {
  create(input: { organizationId: string; eventId: string } & VendorWrite): Promise<VendorRecord>;
  listByEvent(input: { organizationId: string; eventId: string }): Promise<VendorRecord[]>;
  getById(input: {
    organizationId: string;
    eventId: string;
    id: string;
  }): Promise<VendorRecord | null>;
  update(input: {
    organizationId: string;
    eventId: string;
    id: string;
    patch: Partial<VendorWrite>;
  }): Promise<VendorRecord | null>;
  remove(input: { organizationId: string; eventId: string; id: string }): Promise<boolean>;
  summaryByEvent(input: { organizationId: string; eventId: string }): Promise<VendorSummary>;
}
