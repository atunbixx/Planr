import type { EventTypeKey, EventTypeProfile } from "../types";

const wedding: EventTypeProfile = {
  key: "wedding",
  label: "Wedding",
  modules: [
    "guests",
    "venue",
    "vendors",
    "vendor_matching",
    "budget",
    "tasks",
    "rsvp",
    "messaging",
    "seating",
    "gift_registry",
  ],
  terminology: { party: "Wedding party", host: "Couple" },
  guestGroupings: ["Partner A", "Partner B", "Shared"],
  defaultVendorCategories: ["photographer", "caterer", "sound", "florist", "venue"],
};

export const eventTypeProfiles: Partial<Record<EventTypeKey, EventTypeProfile>> = {
  wedding,
};

export function getEventTypeProfile(key: EventTypeKey): EventTypeProfile {
  const profile = eventTypeProfiles[key];
  if (!profile) {
    throw new Error(`Event type "${key}" is not registered.`);
  }
  return profile;
}
