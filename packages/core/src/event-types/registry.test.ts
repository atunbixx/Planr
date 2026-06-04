import { describe, it, expect } from "vitest";
import { getEventTypeProfile, eventTypeProfiles } from "./registry";

describe("event-type registry", () => {
  it("registers the wedding profile with shared + wedding-specific modules", () => {
    const wedding = getEventTypeProfile("wedding");
    expect(wedding.label).toBe("Wedding");
    expect(wedding.modules).toContain("guests");
    expect(wedding.modules).toContain("seating");
    expect(wedding.modules).toContain("gift_registry");
  });

  it("uses configurable guest groupings, never a hardcoded bride/groom Side", () => {
    const wedding = getEventTypeProfile("wedding");
    expect(wedding.guestGroupings.length).toBeGreaterThan(0);
    expect(wedding.terminology).not.toHaveProperty("bride");
  });

  it("throws for an unregistered event type", () => {
    // @ts-expect-error intentionally invalid key
    expect(() => getEventTypeProfile("gala")).toThrowError(/not registered/);
  });

  it("only registers wedding in this phase", () => {
    expect(Object.keys(eventTypeProfiles)).toEqual(["wedding"]);
  });
});
