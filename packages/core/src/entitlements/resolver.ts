import type { EventTypeKey, ModuleKey, Entitlement } from "../types";
import { getModule, modulesForEventType } from "../capabilities/registry";

// Core modules available for free (capped at the UI/service layer) to drive conversion.
export const FREE_BASELINE_MODULES: ModuleKey[] = ["guests", "tasks", "budget"];

export type AccessReason =
  | "all_access"
  | "free"
  | "entitled"
  | "needs_event_type_plan"
  | "needs_pro"
  | "not_relevant";

export interface ModuleAccess {
  visible: boolean;
  locked: boolean;
  reason: AccessReason;
}

export interface ResolveInput {
  module: ModuleKey;
  eventType: EventTypeKey;
  held: Entitlement[];
}

export function resolveModuleAccess({ module, eventType, held }: ResolveInput): ModuleAccess {
  const relevant = modulesForEventType(eventType).some((m) => m.key === module);
  if (!relevant) {
    return { visible: false, locked: true, reason: "not_relevant" };
  }

  if (held.includes("all_access")) {
    return { visible: true, locked: false, reason: "all_access" };
  }

  const def = getModule(module);

  if (def.tier === "core") {
    if (held.includes(`event_type:${eventType}`)) {
      return { visible: true, locked: false, reason: "entitled" };
    }
    if (FREE_BASELINE_MODULES.includes(module)) {
      return { visible: true, locked: false, reason: "free" };
    }
    return { visible: true, locked: true, reason: "needs_event_type_plan" };
  }

  // advanced
  if (held.includes(`module:${module}`)) {
    return { visible: true, locked: false, reason: "entitled" };
  }
  return { visible: true, locked: true, reason: "needs_pro" };
}
