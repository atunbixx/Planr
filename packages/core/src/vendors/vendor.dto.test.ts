import { describe, it, expect } from "vitest";
import { vendorInput, toVendorWrite, toVendorPatch } from "./vendor.dto";

const w = (raw: unknown) => toVendorWrite(vendorInput.parse(raw));

describe("vendorInput", () => {
  it("accepts a minimal vendor and defaults status/cost", () => {
    expect(w({ name: "Bloom Florist" })).toEqual({
      name: "Bloom Florist",
      category: null,
      contactName: null,
      contactEmail: null,
      contactPhone: null,
      website: null,
      status: "researching",
      costCents: 0,
      notes: null,
    });
  });

  it("parses cost to exact pence and keeps category/status", () => {
    const v = w({ name: "Caterer", category: "Catering", status: "booked", cost: "4250.50" });
    expect(v).toMatchObject({ category: "Catering", status: "booked", costCents: 425050 });
  });

  it("rejects empty name, bad status, and sub-penny cost", () => {
    expect(() => vendorInput.parse({ name: "" })).toThrow();
    expect(() => vendorInput.parse({ name: "x", status: "nope" })).toThrow();
    expect(() => vendorInput.parse({ name: "x", cost: "10.999" })).toThrow();
  });

  it("toVendorPatch only includes provided fields", () => {
    const patch = toVendorPatch(vendorInput.partial().parse({ status: "quoted" }));
    expect(patch).toEqual({ status: "quoted" });
    expect("name" in patch).toBe(false);
  });
});
