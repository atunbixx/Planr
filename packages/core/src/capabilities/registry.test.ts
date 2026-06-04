import { describe, it, expect } from "vitest";
import { getModule, modulesForEventType, moduleDefinitions } from "./registry";

describe("capability registry", () => {
  it("classifies guests as a shared core module", () => {
    const guests = getModule("guests");
    expect(guests.tier).toBe("core");
    expect(guests.appliesTo).toBe("all");
  });

  it("classifies vendor_matching as an advanced module", () => {
    expect(getModule("vendor_matching").tier).toBe("advanced");
  });

  it("scopes gift_registry to wedding only", () => {
    const reg = getModule("gift_registry");
    expect(reg.appliesTo).toEqual(["wedding"]);
  });

  it("returns every module relevant to a wedding (shared + wedding-scoped)", () => {
    const keys = modulesForEventType("wedding").map((m) => m.key);
    expect(keys).toContain("guests"); // shared
    expect(keys).toContain("gift_registry"); // wedding-scoped
    expect(keys).not.toContain("agenda"); // corporate-scoped
  });

  it("defines every ModuleKey exactly once", () => {
    expect(Object.keys(moduleDefinitions).length).toBe(12);
  });
});
