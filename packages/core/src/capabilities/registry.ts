import type { EventTypeKey, ModuleKey, ModuleTier } from "../types";

export interface ModuleDefinition {
  key: ModuleKey;
  tier: ModuleTier;
  appliesTo: EventTypeKey[] | "all";
}

function def(
  key: ModuleKey,
  tier: ModuleTier,
  appliesTo: EventTypeKey[] | "all",
): ModuleDefinition {
  return { key, tier, appliesTo };
}

export const moduleDefinitions: Record<ModuleKey, ModuleDefinition> = {
  guests: def("guests", "core", "all"),
  venue: def("venue", "core", "all"),
  vendors: def("vendors", "core", "all"),
  budget: def("budget", "core", "all"),
  tasks: def("tasks", "core", "all"),
  rsvp: def("rsvp", "core", "all"),
  messaging: def("messaging", "core", "all"),
  seating: def("seating", "core", ["wedding", "corporate", "bridal_shower", "birthday"]),
  vendor_matching: def("vendor_matching", "advanced", "all"),
  gift_registry: def("gift_registry", "advanced", ["wedding"]),
  agenda: def("agenda", "core", ["corporate"]),
  order_of_service: def("order_of_service", "core", ["funeral"]),
};

export function getModule(key: ModuleKey): ModuleDefinition {
  return moduleDefinitions[key];
}

export function modulesForEventType(eventType: EventTypeKey): ModuleDefinition[] {
  return Object.values(moduleDefinitions).filter(
    (m) => m.appliesTo === "all" || m.appliesTo.includes(eventType),
  );
}
