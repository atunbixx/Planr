import type { Role } from "../types";

/**
 * Maps a Clerk organization-membership role string to a Planr Role.
 * Clerk's defaults are "org:admin" / "org:member" (and legacy "admin" / "basic_member").
 * Unknown/custom roles fall back to the least-privileged "viewer".
 * Note: "owner" is never assigned via Clerk role sync — it is set during
 * organization provisioning (the creator). See makeTenancyService.
 */
export function mapClerkRole(clerkRole: string): Role {
  if (clerkRole === "org:admin" || clerkRole === "admin") return "admin";
  return "viewer";
}
