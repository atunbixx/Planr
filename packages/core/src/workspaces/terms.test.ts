import { describe, it, expect } from "vitest";
import { workspaceTerms } from "./terms";

describe("workspaceTerms", () => {
  it("uses friendly consumer copy for individuals", () => {
    const t = workspaceTerms("individual");
    expect(t.newEvent).toBe("Plan something new");
    expect(t.members).toBe("People helping you plan");
    expect(t.invite).toBe("Invite someone to help");
  });

  it("uses business copy for businesses", () => {
    const t = workspaceTerms("business");
    expect(t.newEvent).toBe("Create an event");
    expect(t.members).toBe("Team");
    expect(t.invite).toBe("Invite a team member");
  });
});
