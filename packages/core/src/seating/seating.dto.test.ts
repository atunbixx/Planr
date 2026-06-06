import { describe, it, expect } from "vitest";
import { seatingTableInput, toSeatingTableWrite, toSeatingTablePatch } from "./seating.dto";

describe("seatingTableInput", () => {
  it("accepts a valid table and coerces a string capacity", () => {
    expect(toSeatingTableWrite(seatingTableInput.parse({ label: "Top table", capacity: "8" }))).toEqual({
      label: "Top table",
      capacity: 8,
    });
    expect(toSeatingTableWrite(seatingTableInput.parse({ label: "T2", capacity: 10 })).capacity).toBe(10);
  });

  it("rejects an empty label and out-of-range / non-integer capacity", () => {
    expect(() => seatingTableInput.parse({ label: "", capacity: 8 })).toThrow();
    expect(() => seatingTableInput.parse({ label: "x", capacity: 0 })).toThrow();
    expect(() => seatingTableInput.parse({ label: "x", capacity: 65 })).toThrow();
    expect(() => seatingTableInput.parse({ label: "x", capacity: 2.5 })).toThrow();
  });

  it("toSeatingTablePatch only includes provided fields", () => {
    const patch = toSeatingTablePatch(seatingTableInput.partial().parse({ capacity: "12" }));
    expect(patch).toEqual({ capacity: 12 });
    expect("label" in patch).toBe(false);
  });
});
