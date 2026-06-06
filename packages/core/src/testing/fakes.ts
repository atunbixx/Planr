import type {
  Repositories,
  OrganizationRecord,
  UserRecord,
  MembershipRecord,
  EventRecord,
  EntitlementRecord,
  InvitationRecord,
  GuestRecord,
  TaskRecord,
  BudgetItemRecord,
  SeatingTableRecord,
  AnnouncementRecord,
  EventWebsiteRecord,
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
  const guests: GuestRecord[] = [];
  const tasks: TaskRecord[] = [];
  const budget: BudgetItemRecord[] = [];
  const seatingTables: SeatingTableRecord[] = [];
  const seatAssignments: {
    id: string;
    organizationId: string;
    eventId: string;
    tableId: string;
    guestId: string;
  }[] = [];
  const announcements: AnnouncementRecord[] = [];
  let annClock = 0; // deterministic, strictly-increasing createdAt for ordering
  const websites: EventWebsiteRecord[] = [];

  return {
    orgs: {
      async create({ name, type }) {
        const created: OrganizationRecord = {
          id: id("org"),
          name,
          type: type ?? "individual",
          currency: "GBP",
        };
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
      async rename({ id: orgId, name }) {
        const o = orgs.find((x) => x.id === orgId);
        if (!o) throw new Error("org not found");
        o.name = name;
        return { ...o };
      },
      async setCurrency({ id: orgId, currency }) {
        const o = orgs.find((x) => x.id === orgId);
        if (!o) throw new Error("org not found");
        o.currency = currency;
        return { ...o };
      },
      async delete(orgId) {
        // cascade: drop the org and every child row the fakes track
        const dropOrg = <T extends { organizationId: string }>(arr: T[]) => {
          for (let i = arr.length - 1; i >= 0; i--) {
            if (arr[i]!.organizationId === orgId) arr.splice(i, 1);
          }
        };
        dropOrg(memberships);
        dropOrg(events);
        dropOrg(entitlements);
        dropOrg(invitations);
        dropOrg(guests);
        dropOrg(tasks);
        dropOrg(budget);
        dropOrg(seatingTables);
        dropOrg(seatAssignments);
        dropOrg(announcements);
        const oi = orgs.findIndex((o) => o.id === orgId);
        if (oi >= 0) orgs.splice(oi, 1);
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
      async getById(eventId) {
        const found = events.find((e) => e.id === eventId);
        return found ? { ...found } : null;
      },
      async update({ organizationId, id: eventId, patch }) {
        const e = events.find((x) => x.organizationId === organizationId && x.id === eventId);
        if (!e) return null;
        if (patch.name !== undefined) e.name = patch.name;
        if (patch.date !== undefined) e.date = patch.date;
        return { ...e };
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
    guests: {
      async create({ organizationId, eventId, ...rest }) {
        const created: GuestRecord = {
          id: id("gst"),
          organizationId,
          eventId,
          rsvpToken: id("tok"),
          ...rest,
        };
        guests.push(created);
        return { ...created };
      },
      async listByEvent({ organizationId, eventId, limit, cursor }) {
        const all = guests
          .filter((g) => g.organizationId === organizationId && g.eventId === eventId)
          .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
        const start = cursor ? all.findIndex((g) => g.id === cursor) + 1 : 0;
        const page = all.slice(start, start + limit);
        const nextCursor =
          page.length === limit && start + limit < all.length ? page[page.length - 1]!.id : null;
        return { guests: page.map((g) => ({ ...g })), nextCursor };
      },
      async getById({ organizationId, eventId, id: gid }) {
        const found = guests.find(
          (g) => g.id === gid && g.organizationId === organizationId && g.eventId === eventId,
        );
        return found ? { ...found } : null;
      },
      async update({ organizationId, eventId, id: gid, patch }) {
        const g = guests.find(
          (x) => x.id === gid && x.organizationId === organizationId && x.eventId === eventId,
        );
        if (!g) return null;
        Object.assign(g, patch);
        return { ...g };
      },
      async remove({ organizationId, eventId, id: gid }) {
        const i = guests.findIndex(
          (x) => x.id === gid && x.organizationId === organizationId && x.eventId === eventId,
        );
        if (i < 0) return false;
        guests.splice(i, 1);
        return true;
      },
      async summaryByEvent({ organizationId, eventId }) {
        const mine = guests.filter(
          (g) => g.organizationId === organizationId && g.eventId === eventId,
        );
        return {
          total: mine.length,
          coming: mine.filter((g) => g.rsvpStatus === "coming").length,
          declined: mine.filter((g) => g.rsvpStatus === "declined").length,
          maybe: mine.filter((g) => g.rsvpStatus === "maybe").length,
          awaiting: mine.filter((g) => g.rsvpStatus === "awaiting").length,
        };
      },
      async findByRsvpToken(token) {
        const found = guests.find((g) => g.rsvpToken === token);
        return found ? { ...found } : null;
      },
      async setRsvpByToken({ token, rsvpStatus, plusOne }) {
        const g = guests.find((x) => x.rsvpToken === token);
        if (!g) return null;
        g.rsvpStatus = rsvpStatus;
        if (plusOne !== undefined) g.plusOne = plusOne;
        return { ...g };
      },
    },
    tasks: {
      async create({ organizationId, eventId, ...rest }) {
        const created: TaskRecord = { id: id("tsk"), organizationId, eventId, ...rest };
        tasks.push(created);
        return { ...created };
      },
      async listByEvent({ organizationId, eventId, limit, cursor }) {
        // Order: dueDate ASC (nulls last), then insertion order (createdAt proxy). Array.sort is
        // stable and filter preserves insertion order, so a single dueDate comparator suffices.
        const all = tasks
          .filter((t) => t.organizationId === organizationId && t.eventId === eventId)
          .sort((a, b) => {
            const ad = a.dueDate ? a.dueDate.getTime() : Infinity;
            const bd = b.dueDate ? b.dueDate.getTime() : Infinity;
            return ad - bd;
          });
        const start = cursor ? all.findIndex((t) => t.id === cursor) + 1 : 0;
        const page = all.slice(start, start + limit);
        const nextCursor =
          page.length === limit && start + limit < all.length ? page[page.length - 1]!.id : null;
        return { tasks: page.map((t) => ({ ...t })), nextCursor };
      },
      async getById({ organizationId, eventId, id: tid }) {
        const found = tasks.find(
          (t) => t.id === tid && t.organizationId === organizationId && t.eventId === eventId,
        );
        return found ? { ...found } : null;
      },
      async update({ organizationId, eventId, id: tid, patch }) {
        const t = tasks.find(
          (x) => x.id === tid && x.organizationId === organizationId && x.eventId === eventId,
        );
        if (!t) return null;
        Object.assign(t, patch);
        return { ...t };
      },
      async remove({ organizationId, eventId, id: tid }) {
        const i = tasks.findIndex(
          (x) => x.id === tid && x.organizationId === organizationId && x.eventId === eventId,
        );
        if (i < 0) return false;
        tasks.splice(i, 1);
        return true;
      },
      async summaryByEvent({ organizationId, eventId, now }) {
        const mine = tasks.filter(
          (t) => t.organizationId === organizationId && t.eventId === eventId,
        );
        return {
          total: mine.length,
          done: mine.filter((t) => t.done).length,
          remaining: mine.filter((t) => !t.done).length,
          overdue: mine.filter((t) => !t.done && t.dueDate != null && t.dueDate < now).length,
        };
      },
    },
    budget: {
      async create({ organizationId, eventId, ...rest }) {
        const created: BudgetItemRecord = { id: id("bdg"), organizationId, eventId, ...rest };
        budget.push(created);
        return { ...created };
      },
      async listByEvent({ organizationId, eventId, limit, cursor }) {
        const all = budget
          .filter((b) => b.organizationId === organizationId && b.eventId === eventId)
          .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
        const start = cursor ? all.findIndex((b) => b.id === cursor) + 1 : 0;
        const page = all.slice(start, start + limit);
        const nextCursor =
          page.length === limit && start + limit < all.length ? page[page.length - 1]!.id : null;
        return { items: page.map((b) => ({ ...b })), nextCursor };
      },
      async getById({ organizationId, eventId, id: bid }) {
        const found = budget.find(
          (b) => b.id === bid && b.organizationId === organizationId && b.eventId === eventId,
        );
        return found ? { ...found } : null;
      },
      async update({ organizationId, eventId, id: bid, patch }) {
        const b = budget.find(
          (x) => x.id === bid && x.organizationId === organizationId && x.eventId === eventId,
        );
        if (!b) return null;
        Object.assign(b, patch);
        return { ...b };
      },
      async remove({ organizationId, eventId, id: bid }) {
        const i = budget.findIndex(
          (x) => x.id === bid && x.organizationId === organizationId && x.eventId === eventId,
        );
        if (i < 0) return false;
        budget.splice(i, 1);
        return true;
      },
      async summaryByEvent({ organizationId, eventId }) {
        const mine = budget.filter(
          (b) => b.organizationId === organizationId && b.eventId === eventId,
        );
        const totalEstimatedCents = mine.reduce((s, b) => s + b.estimatedCents, 0);
        const totalPaidCents = mine.reduce((s, b) => s + b.paidCents, 0);
        return {
          itemCount: mine.length,
          totalEstimatedCents,
          totalPaidCents,
          remainingCents: totalEstimatedCents - totalPaidCents,
        };
      },
    },
    seating: {
      async createTable({ organizationId, eventId, label, capacity }) {
        const created: SeatingTableRecord = { id: id("tbl"), organizationId, eventId, label, capacity };
        seatingTables.push(created);
        return { ...created };
      },
      async listTables({ organizationId, eventId }) {
        return seatingTables
          .filter((t) => t.organizationId === organizationId && t.eventId === eventId)
          .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
          .map((t) => ({ ...t }));
      },
      async getTable({ organizationId, eventId, id: tid }) {
        const found = seatingTables.find(
          (t) => t.id === tid && t.organizationId === organizationId && t.eventId === eventId,
        );
        return found ? { ...found } : null;
      },
      async updateTable({ organizationId, eventId, id: tid, patch }) {
        const t = seatingTables.find(
          (x) => x.id === tid && x.organizationId === organizationId && x.eventId === eventId,
        );
        if (!t) return null;
        Object.assign(t, patch);
        return { ...t };
      },
      async removeTable({ organizationId, eventId, id: tid }) {
        const i = seatingTables.findIndex(
          (x) => x.id === tid && x.organizationId === organizationId && x.eventId === eventId,
        );
        if (i < 0) return false;
        seatingTables.splice(i, 1);
        // cascade: free any guests seated at this table
        for (let j = seatAssignments.length - 1; j >= 0; j--) {
          if (seatAssignments[j]!.tableId === tid) seatAssignments.splice(j, 1);
        }
        return true;
      },
      async listAssignments({ organizationId, eventId }) {
        return seatAssignments
          .filter((a) => a.organizationId === organizationId && a.eventId === eventId)
          .map((a) => ({ id: a.id, tableId: a.tableId, guestId: a.guestId }));
      },
      async countByTable({ organizationId, eventId, tableId }) {
        return seatAssignments.filter(
          (a) => a.organizationId === organizationId && a.eventId === eventId && a.tableId === tableId,
        ).length;
      },
      async assign({ organizationId, eventId, tableId, guestId }) {
        // upsert by guestId (one seat per guest) — move if already seated
        const existing = seatAssignments.find((a) => a.guestId === guestId);
        if (existing) {
          existing.tableId = tableId;
          existing.eventId = eventId;
          existing.organizationId = organizationId;
          return { id: existing.id, tableId: existing.tableId, guestId };
        }
        const created = { id: id("sat"), organizationId, eventId, tableId, guestId };
        seatAssignments.push(created);
        return { id: created.id, tableId, guestId };
      },
      async unassign({ guestId }) {
        const i = seatAssignments.findIndex((a) => a.guestId === guestId);
        if (i < 0) return false;
        seatAssignments.splice(i, 1);
        return true;
      },
    },
    announcements: {
      async create({ organizationId, eventId, title, body }) {
        const created: AnnouncementRecord = {
          id: id("ann"),
          organizationId,
          eventId,
          title,
          body,
          createdAt: new Date(1_700_000_000_000 + annClock++ * 1000),
        };
        announcements.push(created);
        return { ...created };
      },
      async listByEvent({ organizationId, eventId }) {
        return announcements
          .filter((a) => a.organizationId === organizationId && a.eventId === eventId)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) // newest first
          .map((a) => ({ ...a }));
      },
      async getById({ organizationId, eventId, id: aid }) {
        const found = announcements.find(
          (a) => a.id === aid && a.organizationId === organizationId && a.eventId === eventId,
        );
        return found ? { ...found } : null;
      },
      async update({ organizationId, eventId, id: aid, patch }) {
        const a = announcements.find(
          (x) => x.id === aid && x.organizationId === organizationId && x.eventId === eventId,
        );
        if (!a) return null;
        Object.assign(a, patch);
        return { ...a };
      },
      async remove({ organizationId, eventId, id: aid }) {
        const i = announcements.findIndex(
          (x) => x.id === aid && x.organizationId === organizationId && x.eventId === eventId,
        );
        if (i < 0) return false;
        announcements.splice(i, 1);
        return true;
      },
    },
    websites: {
      async create({ organizationId, eventId, slug }) {
        const created: EventWebsiteRecord = {
          id: id("web"),
          organizationId,
          eventId,
          slug,
          published: false,
          theme: "classic",
          headline: null,
          welcomeMessage: null,
          story: null,
          scheduleText: null,
          travelText: null,
        };
        websites.push(created);
        return { ...created };
      },
      async getByEvent({ organizationId, eventId }) {
        const found = websites.find(
          (w) => w.organizationId === organizationId && w.eventId === eventId,
        );
        return found ? { ...found } : null;
      },
      async getBySlug(slug) {
        const found = websites.find((w) => w.slug === slug);
        return found ? { ...found } : null;
      },
      async slugExists(slug) {
        return websites.some((w) => w.slug === slug);
      },
      async update({ organizationId, eventId, patch }) {
        const w = websites.find(
          (x) => x.organizationId === organizationId && x.eventId === eventId,
        );
        if (!w) return null;
        Object.assign(w, patch);
        return { ...w };
      },
    },
  };
}
