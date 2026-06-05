export type EventTypeKey =
  | "wedding"
  | "birthday"
  | "funeral"
  | "bridal_shower"
  | "corporate";

export type ModuleKey =
  | "guests"
  | "venue"
  | "vendors"
  | "vendor_matching"
  | "budget"
  | "tasks"
  | "rsvp"
  | "messaging"
  | "seating"
  | "gift_registry"
  | "agenda"
  | "order_of_service";

export type ModuleTier = "core" | "advanced";

export type Role = "owner" | "admin" | "planner" | "editor" | "viewer";

export type OrgType = "individual" | "business";

export type Permission =
  | "org:delete"
  | "billing:manage"
  | "member:invite"
  | "member:remove"
  | "event:create"
  | "event:update"
  | "event:delete"
  | "content:edit"
  | "content:view";

export type Entitlement =
  | `event_type:${EventTypeKey}`
  | `module:${ModuleKey}`
  | "all_access";

export interface EventTypeProfile {
  key: EventTypeKey;
  label: string;
  modules: ModuleKey[];
  terminology: Record<string, string>;
  guestGroupings: string[];
  defaultVendorCategories: string[];
}
