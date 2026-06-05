import type { OrgType } from "../types";

export interface WorkspaceTerms {
  newEvent: string;
  members: string;
  invite: string;
  eventsHeading: string;
}

export function workspaceTerms(type: OrgType): WorkspaceTerms {
  if (type === "business") {
    return {
      newEvent: "Create an event",
      members: "Team",
      invite: "Invite a team member",
      eventsHeading: "Events",
    };
  }
  return {
    newEvent: "Plan something new",
    members: "People helping you plan",
    invite: "Invite someone to help",
    eventsHeading: "Your events",
  };
}
