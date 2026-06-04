import type { Role, Permission } from "../types";

const ALL: Permission[] = [
  "org:delete",
  "billing:manage",
  "member:invite",
  "member:remove",
  "event:create",
  "event:update",
  "event:delete",
  "content:edit",
  "content:view",
];

const rolePermissions: Record<Role, Permission[]> = {
  owner: ALL,
  admin: ALL.filter((p) => p !== "org:delete"),
  planner: ["event:create", "event:update", "event:delete", "content:edit", "content:view"],
  editor: ["event:update", "content:edit", "content:view"],
  viewer: ["content:view"],
};

export function permissionsForRole(role: Role): Permission[] {
  return rolePermissions[role];
}

export function roleHasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role].includes(permission);
}
