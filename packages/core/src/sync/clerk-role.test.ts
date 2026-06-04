import { describe, it, expect } from "vitest";
import { mapClerkRole } from "./clerk-role";

describe("mapClerkRole", () => {
  it("maps Clerk admin roles to admin", () => {
    expect(mapClerkRole("org:admin")).toBe("admin");
    expect(mapClerkRole("admin")).toBe("admin");
  });

  it("maps Clerk member roles to viewer", () => {
    expect(mapClerkRole("org:member")).toBe("viewer");
    expect(mapClerkRole("basic_member")).toBe("viewer");
  });

  it("falls back to viewer for any unknown role", () => {
    expect(mapClerkRole("org:something_custom")).toBe("viewer");
    expect(mapClerkRole("")).toBe("viewer");
  });
});
