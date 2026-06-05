import type {
  Repositories,
  OrganizationRecord,
  UserRecord,
  MembershipRecord,
  EventRecord,
  EntitlementRecord,
  InvitationRecord,
} from "../ports/repositories";

export function makeFakeRepositories(): Repositories {
  let seq = 0;
  const id = (p: string) => `${p}_${++seq}`;

  const orgs: OrganizationRecord[] = [];
  const users: UserRecord[] = [];
  const memberships: MembershipRecord[] = [];
  const events: EventRecord[] = [];
  const entitlements: EntitlementRecord[] = [];
  const invitations: InvitationRecord[] = [];

  return {
    orgs: {
      async create({ name, type }) {
        const created: OrganizationRecord = { id: id("org"), name, type: type ?? "individual" };
        orgs.push(created);
        return { ...created };
      },
      async findById(orgId) {
        const found = orgs.find((o) => o.id === orgId);
        return found ? { ...found } : null;
      },
      async listForUser(userId) {
        const orgIds = new Set(
          memberships.filter((m) => m.userId === userId).map((m) => m.organizationId),
        );
        return orgs.filter((o) => orgIds.has(o.id)).map((o) => ({ ...o }));
      },
    },
    users: {
      async upsertByAuthUserId({ authUserId, email, name }) {
        const existing = users.find((u) => u.authUserId === authUserId);
        if (existing) {
          existing.email = email;
          existing.name = name;
          return { ...existing };
        }
        const created: UserRecord = { id: id("user"), authUserId, email, name };
        users.push(created);
        return { ...created };
      },
      async findByAuthUserId(authUserId) {
        const found = users.find((u) => u.authUserId === authUserId);
        return found ? { ...found } : null;
      },
    },
    memberships: {
      async upsert({ organizationId, userId, role }) {
        const existing = memberships.find(
          (m) => m.organizationId === organizationId && m.userId === userId,
        );
        if (existing) {
          existing.role = role;
          return { ...existing };
        }
        const created: MembershipRecord = { id: id("mem"), organizationId, userId, role };
        memberships.push(created);
        return { ...created };
      },
      async remove({ organizationId, userId }) {
        const i = memberships.findIndex(
          (m) => m.organizationId === organizationId && m.userId === userId,
        );
        if (i >= 0) memberships.splice(i, 1);
      },
      async listByOrganization(organizationId) {
        return memberships.filter((m) => m.organizationId === organizationId).map((m) => ({ ...m }));
      },
      async find({ organizationId, userId }) {
        const found = memberships.find(
          (m) => m.organizationId === organizationId && m.userId === userId,
        );
        return found ? { ...found } : null;
      },
      async listMembersWithUsers(organizationId) {
        return memberships
          .filter((m) => m.organizationId === organizationId)
          .map((m) => {
            const u = users.find((x) => x.id === m.userId);
            return {
              userId: m.userId,
              email: u?.email ?? null,
              name: u?.name ?? null,
              role: m.role,
            };
          });
      },
    },
    events: {
      async create({ organizationId, eventTypeKey, name, date }) {
        const created: EventRecord = { id: id("evt"), organizationId, eventTypeKey, name, date };
        events.push(created);
        return { ...created };
      },
      async listByOrganization(organizationId) {
        return events.filter((e) => e.organizationId === organizationId).map((e) => ({ ...e }));
      },
      async findById({ organizationId, id: eventId }) {
        const found = events.find((e) => e.organizationId === organizationId && e.id === eventId);
        return found ? { ...found } : null;
      },
    },
    entitlements: {
      async grant({ organizationId, eventId, key, source }) {
        const created: EntitlementRecord = { id: id("ent"), organizationId, eventId, key, source };
        entitlements.push(created);
        return { ...created };
      },
      async grantIfAbsent({ organizationId, eventId, key, source }) {
        const existing = entitlements.find(
          (e) => e.organizationId === organizationId && e.eventId === eventId && e.key === key,
        );
        if (existing) return { ...existing };
        const created: EntitlementRecord = { id: id("ent"), organizationId, eventId, key, source };
        entitlements.push(created);
        return { ...created };
      },
      async heldFor({ organizationId, eventId }) {
        return entitlements
          .filter(
            (e) =>
              e.organizationId === organizationId &&
              (e.eventId === null || e.eventId === eventId),
          )
          .map((e) => e.key);
      },
    },
    invitations: {
      async create({ organizationId, email, role, token, invitedByUserId }) {
        const created: InvitationRecord = {
          id: id("inv"),
          organizationId,
          email,
          role,
          token,
          status: "pending",
          invitedByUserId,
        };
        invitations.push(created);
        return { ...created };
      },
      async findByToken(token) {
        const found = invitations.find((i) => i.token === token);
        return found ? { ...found } : null;
      },
      async findPending({ organizationId, email }) {
        const found = invitations.find(
          (i) =>
            i.organizationId === organizationId && i.email === email && i.status === "pending",
        );
        return found ? { ...found } : null;
      },
      async listPendingByEmail(email) {
        return invitations
          .filter((i) => i.email === email && i.status === "pending")
          .map((i) => ({ ...i }));
      },
      async listPendingByOrganization(organizationId) {
        return invitations
          .filter((i) => i.organizationId === organizationId && i.status === "pending")
          .map((i) => ({ ...i }));
      },
      async setStatus({ id: invId, status }) {
        const inv = invitations.find((i) => i.id === invId);
        if (inv) inv.status = status;
      },
    },
  };
}
