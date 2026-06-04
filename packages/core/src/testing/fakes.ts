import type {
  Repositories,
  OrganizationRecord,
  UserRecord,
  MembershipRecord,
  EventRecord,
  EntitlementRecord,
} from "../ports/repositories";

export function makeFakeRepositories(): Repositories {
  let seq = 0;
  const id = (p: string) => `${p}_${++seq}`;

  const orgs: OrganizationRecord[] = [];
  const users: UserRecord[] = [];
  const memberships: MembershipRecord[] = [];
  const events: EventRecord[] = [];
  const entitlements: EntitlementRecord[] = [];

  return {
    orgs: {
      async upsertByClerkOrgId({ clerkOrgId, name }) {
        const existing = orgs.find((o) => o.clerkOrgId === clerkOrgId);
        if (existing) {
          existing.name = name;
          return { ...existing };
        }
        const created: OrganizationRecord = { id: id("org"), clerkOrgId, name };
        orgs.push(created);
        return { ...created };
      },
      async findByClerkOrgId(clerkOrgId) {
        const found = orgs.find((o) => o.clerkOrgId === clerkOrgId);
        return found ? { ...found } : null;
      },
    },
    users: {
      async upsertByClerkUserId({ clerkUserId, email, name }) {
        const existing = users.find((u) => u.clerkUserId === clerkUserId);
        if (existing) {
          existing.email = email;
          existing.name = name;
          return { ...existing };
        }
        const created: UserRecord = { id: id("user"), clerkUserId, email, name };
        users.push(created);
        return { ...created };
      },
      async findByClerkUserId(clerkUserId) {
        const found = users.find((u) => u.clerkUserId === clerkUserId);
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
  };
}
