import { describe, it, expect } from "vitest";
import { eventTypeProfiles } from "./registry";
import { modulesForEventType } from "../capabilities/registry";
import type { EventTypeKey } from "../types";

describe("event-type profile / capability registry consistency", () => {
  it("every registered profile's modules match what the capability registry deems relevant", () => {
    for (const [key, profile] of Object.entries(eventTypeProfiles)) {
      if (!profile) continue;
      const relevant = modulesForEventType(key as EventTypeKey)
        .map((m) => m.key)
        .sort();
      const declared = [...profile.modules].sort();
      expect(declared, `event type "${key}" profile.modules vs capability registry`).toEqual(
        relevant,
      );
    }
  });
});
