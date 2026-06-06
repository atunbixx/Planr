import { describe, it, expect } from "vitest";
import { makeFakeRepositories } from "../testing/fakes";
import { makeEventService } from "./event.service";
import { makeEntitlementService } from "./entitlement.service";

describe("event service", () => {
  it("creates and lists events for an organization", async () => {
    const repos = makeFakeRepositories();
    const events = makeEventService(repos);
    await events.create({ organizationId: "o1", eventTypeKey: "wedding", name: "Smith", date: null });
    const list = await events.list("o1");
    expect(list).toHaveLength(1);
    expect(list[0]!.eventTypeKey).toBe("wedding");
  });

  it("resolveModules reflects free baseline when nothing is purchased", async () => {
    const repos = makeFakeRepositories();
    const events = makeEventService(repos);
    const event = await events.create({
      organizationId: "o1",
      eventTypeKey: "wedding",
      name: "Smith",
      date: null,
    });
    const modules = await events.resolveModules({ organizationId: "o1", eventId: event.id });
    const guests = modules.find((m) => m.module === "guests");
    const seating = modules.find((m) => m.module === "seating");
    const matching = modules.find((m) => m.module === "vendor_matching");
    expect(guests).toMatchObject({ locked: false, reason: "free" });
    expect(seating).toMatchObject({ locked: true, reason: "needs_event_type_plan" });
    expect(matching).toMatchObject({ locked: true, reason: "needs_pro" });
    // gift_registry is wedding-relevant; agenda (corporate) must be absent
    expect(modules.some((m) => m.module === "gift_registry")).toBe(true);
    expect(modules.some((m) => m.module === "agenda")).toBe(false);
  });

  it("resolveModules unlocks after the event-type plan is granted", async () => {
    const repos = makeFakeRepositories();
    const events = makeEventService(repos);
    const ents = makeEntitlementService(repos);
    const event = await events.create({
      organizationId: "o1",
      eventTypeKey: "wedding",
      name: "Smith",
      date: null,
    });
    await ents.grant({
      organizationId: "o1",
      eventId: event.id,
      key: "event_type:wedding",
      source: "purchase:1",
    });
    const modules = await events.resolveModules({ organizationId: "o1", eventId: event.id });
    expect(modules.find((m) => m.module === "seating")).toMatchObject({ locked: false });
  });

  it("resolveModules throws for an event not in the organization", async () => {
    const repos = makeFakeRepositories();
    const events = makeEventService(repos);
    await expect(
      events.resolveModules({ organizationId: "o1", eventId: "missing" }),
    ).rejects.toThrowError(/not found/);
  });
});
