import { describe, it, expect } from "vitest";
import { guestInput, toGuestWrite } from "./guest.dto";

describe("guestInput", () => {
  it("accepts a minimal valid guest and normalises optionals to null", () => {
    const parsed = guestInput.parse({ name: "Aunt Mary" });
    const write = toGuestWrite(parsed);
    expect(write).toEqual({
      name: "Aunt Mary",
      email: null,
      phone: null,
      groupLabel: null,
      plusOne: false,
      rsvpStatus: "awaiting",
      notes: null,
    });
  });

  it("rejects an empty name", () => {
    expect(() => guestInput.parse({ name: "" })).toThrow();
  });

  it("rejects an invalid email but accepts a blank one", () => {
    expect(() => guestInput.parse({ name: "X", email: "not-an-email" })).toThrow();
    expect(toGuestWrite(guestInput.parse({ name: "X", email: "" })).email).toBeNull();
  });

  it("rejects an unknown rsvp status", () => {
    expect(() => guestInput.parse({ name: "X", rsvpStatus: "nope" })).toThrow();
  });
});
