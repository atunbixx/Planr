import { describe, it, expect } from "vitest";
import { resolveModuleAccess } from "./resolver";

describe("resolveModuleAccess", () => {
  it("hides a module not relevant to the event type", () => {
    const r = resolveModuleAccess({
      module: "gift_registry",
      eventType: "funeral",
      held: ["all_access"],
    });
    expect(r.visible).toBe(false);
  });

  it("unlocks any relevant module when all_access is held", () => {
    const r = resolveModuleAccess({
      module: "vendor_matching",
      eventType: "wedding",
      held: ["all_access"],
    });
    expect(r).toMatchObject({ visible: true, locked: false });
  });

  it("unlocks a free-baseline core module with no entitlements", () => {
    const r = resolveModuleAccess({
      module: "guests",
      eventType: "wedding",
      held: [],
    });
    expect(r).toMatchObject({ visible: true, locked: false, reason: "free" });
  });

  it("locks a non-baseline core module until the event-type plan is held", () => {
    const locked = resolveModuleAccess({
      module: "seating",
      eventType: "wedding",
      held: [],
    });
    expect(locked).toMatchObject({ visible: true, locked: true, reason: "needs_event_type_plan" });

    const unlocked = resolveModuleAccess({
      module: "seating",
      eventType: "wedding",
      held: ["event_type:wedding"],
    });
    expect(unlocked.locked).toBe(false);
  });

  it("locks an advanced module until its module entitlement is held", () => {
    const locked = resolveModuleAccess({
      module: "vendor_matching",
      eventType: "wedding",
      held: ["event_type:wedding"],
    });
    expect(locked).toMatchObject({ visible: true, locked: true, reason: "needs_pro" });

    const unlocked = resolveModuleAccess({
      module: "vendor_matching",
      eventType: "wedding",
      held: ["module:vendor_matching"],
    });
    expect(unlocked.locked).toBe(false);
  });

  it("does not leak access when a plan for a DIFFERENT event type is held", () => {
    const r = resolveModuleAccess({
      module: "seating",
      eventType: "wedding",
      held: ["event_type:birthday"],
    });
    expect(r).toMatchObject({ visible: true, locked: true, reason: "needs_event_type_plan" });
  });

  it("locks an advanced module when held is empty", () => {
    const r = resolveModuleAccess({
      module: "gift_registry",
      eventType: "wedding",
      held: [],
    });
    expect(r).toMatchObject({ visible: true, locked: true, reason: "needs_pro" });
  });

  it("unlocks a core non-baseline module under all_access", () => {
    const r = resolveModuleAccess({
      module: "seating",
      eventType: "wedding",
      held: ["all_access"],
    });
    expect(r).toMatchObject({ visible: true, locked: false, reason: "all_access" });
  });
});
