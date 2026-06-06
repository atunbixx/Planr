import { describe, it, expect } from "vitest";
import { roleHasPermission, permissionsForRole } from "./policy";

describe("RBAC policy", () => {
  it("grants the owner every permission, including org:delete and billing", () => {
    expect(roleHasPermission("owner", "org:delete")).toBe(true);
    expect(roleHasPermission("owner", "billing:manage")).toBe(true);
  });

  it("lets an admin manage members but never delete the org", () => {
    expect(roleHasPermission("admin", "member:invite")).toBe(true);
    expect(roleHasPermission("admin", "org:delete")).toBe(false);
  });

  it("lets a planner edit content and manage events but not members or billing", () => {
    expect(roleHasPermission("planner", "content:edit")).toBe(true);
    expect(roleHasPermission("planner", "event:create")).toBe(true);
    expect(roleHasPermission("planner", "member:invite")).toBe(false);
    expect(roleHasPermission("planner", "billing:manage")).toBe(false);
  });

  it("lets an editor edit content but not delete events", () => {
    expect(roleHasPermission("editor", "content:edit")).toBe(true);
    expect(roleHasPermission("editor", "event:delete")).toBe(false);
  });

  it("restricts a viewer to read-only", () => {
    expect(permissionsForRole("viewer")).toEqual(["content:view"]);
  });

  it("gives owner all nine permissions", () => {
    expect(permissionsForRole("owner")).toEqual([
      "org:delete",
      "billing:manage",
      "member:invite",
      "member:remove",
      "event:create",
      "event:update",
      "event:delete",
      "content:edit",
      "content:view",
    ]);
  });

  it("gives admin every permission except org:delete", () => {
    const perms = permissionsForRole("admin");
    expect(perms).not.toContain("org:delete");
    expect(perms).toHaveLength(8);
  });

  it("gives editor exactly event:update, content:edit, content:view", () => {
    expect(permissionsForRole("editor")).toEqual([
      "event:update",
      "content:edit",
      "content:view",
    ]);
  });
});
