import { describe, it, expect } from "vitest";
import { announcementInput, toAnnouncementWrite, toAnnouncementPatch } from "./messaging.dto";

describe("announcementInput", () => {
  it("accepts and trims a valid announcement", () => {
    expect(toAnnouncementWrite(announcementInput.parse({ title: "  Save the date  ", body: "  Details  " }))).toEqual({
      title: "Save the date",
      body: "Details",
    });
  });

  it("rejects an empty title or body", () => {
    expect(() => announcementInput.parse({ title: "", body: "x" })).toThrow();
    expect(() => announcementInput.parse({ title: "x", body: "   " })).toThrow();
  });

  it("toAnnouncementPatch only includes provided fields", () => {
    const patch = toAnnouncementPatch(announcementInput.partial().parse({ body: "new" }));
    expect(patch).toEqual({ body: "new" });
    expect("title" in patch).toBe(false);
  });
});
