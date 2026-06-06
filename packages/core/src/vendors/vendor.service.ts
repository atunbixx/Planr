import type { Repositories, VendorRecord, VendorSummary, EventRecord } from "../ports/repositories";
import { makeAuthorizationService } from "../services/authorization.service";
import { resolveModuleAccess } from "../entitlements/resolver";
import { NotFoundError, ForbiddenError } from "../errors";
import { vendorInput, toVendorWrite, toVendorPatch, type VendorInput } from "./vendor.dto";
import { FREE_LAUNCH } from "../billing/launch";

export function makeVendorService(repos: Repositories, opts: { freeLaunch?: boolean } = {}) {
  const authz = makeAuthorizationService(repos);
  const freeLaunch = opts.freeLaunch ?? FREE_LAUNCH;

  async function assertModuleAvailable(event: EventRecord): Promise<void> {
    if (freeLaunch) return;
    const held = await repos.entitlements.heldFor({
      organizationId: event.organizationId,
      eventId: event.id,
    });
    const access = resolveModuleAccess({ module: "vendors", eventType: event.eventTypeKey, held });
    if (access.locked) throw new ForbiddenError(`The vendors module is locked (${access.reason}).`);
  }

  async function gateRead(userId: string, eventId: string): Promise<EventRecord> {
    const event = await repos.events.getById(eventId);
    if (!event) throw new NotFoundError("Event not found.");
    await authz.requireMembership(userId, event.organizationId);
    await assertModuleAvailable(event);
    return event;
  }
  async function gateWrite(userId: string, eventId: string): Promise<EventRecord> {
    const event = await repos.events.getById(eventId);
    if (!event) throw new NotFoundError("Event not found.");
    await authz.requirePermission(userId, event.organizationId, "content:edit");
    await assertModuleAvailable(event);
    return event;
  }

  return {
    async summary(userId: string, input: { eventId: string }): Promise<VendorSummary> {
      const event = await gateRead(userId, input.eventId);
      return repos.vendors.summaryByEvent({ organizationId: event.organizationId, eventId: event.id });
    },

    async list(userId: string, input: { eventId: string }): Promise<VendorRecord[]> {
      const event = await gateRead(userId, input.eventId);
      return repos.vendors.listByEvent({ organizationId: event.organizationId, eventId: event.id });
    },

    async create(userId: string, input: { eventId: string; vendor: VendorInput }): Promise<VendorRecord> {
      const event = await gateWrite(userId, input.eventId);
      const write = toVendorWrite(vendorInput.parse(input.vendor));
      return repos.vendors.create({ organizationId: event.organizationId, eventId: event.id, ...write });
    },

    async update(
      userId: string,
      input: { eventId: string; vendorId: string; patch: Partial<VendorInput> },
    ): Promise<VendorRecord> {
      const event = await gateWrite(userId, input.eventId);
      const patch = toVendorPatch(vendorInput.partial().parse(input.patch));
      const updated = await repos.vendors.update({
        organizationId: event.organizationId,
        eventId: event.id,
        id: input.vendorId,
        patch,
      });
      if (!updated) throw new NotFoundError("Vendor not found.");
      return updated;
    },

    async remove(userId: string, input: { eventId: string; vendorId: string }): Promise<void> {
      const event = await gateWrite(userId, input.eventId);
      const ok = await repos.vendors.remove({
        organizationId: event.organizationId,
        eventId: event.id,
        id: input.vendorId,
      });
      if (!ok) throw new NotFoundError("Vendor not found.");
    },
  };
}

export type VendorService = ReturnType<typeof makeVendorService>;
