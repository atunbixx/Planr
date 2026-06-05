import { describe, it, expect } from "vitest";
import { budgetItemInput, toBudgetItemWrite, toBudgetItemPatch } from "./budget.dto";

const write = (raw: unknown) => toBudgetItemWrite(budgetItemInput.parse(raw));

describe("budgetItemInput", () => {
  it("accepts a minimal item and defaults amounts to 0 / nulls optionals", () => {
    expect(write({ label: "Venue deposit" })).toEqual({
      label: "Venue deposit",
      category: null,
      estimatedCents: 0,
      paidCents: 0,
      notes: null,
    });
  });

  it("parses decimal-string amounts to exact integer cents (no float drift)", () => {
    expect(write({ label: "Cake", estimated: "19.99", paid: "1500" })).toMatchObject({
      estimatedCents: 1999,
      paidCents: 150000,
    });
    expect(write({ label: "x", estimated: "1500.5" }).estimatedCents).toBe(150050);
    expect(write({ label: "x", estimated: "0.30" }).estimatedCents).toBe(30);
    // The classic float-lossy value is exact via string parsing.
    expect(write({ label: "x", estimated: "2.01" }).estimatedCents).toBe(201);
  });

  it("treats a blank amount as not provided (defaults to 0 on create)", () => {
    expect(write({ label: "x", estimated: "" }).estimatedCents).toBe(0);
  });

  it("rejects an empty label, sub-penny precision, negatives and non-numeric amounts", () => {
    expect(() => budgetItemInput.parse({ label: "" })).toThrow();
    expect(() => budgetItemInput.parse({ label: "x", estimated: "2.675" })).toThrow();
    expect(() => budgetItemInput.parse({ label: "x", estimated: "-5" })).toThrow();
    expect(() => budgetItemInput.parse({ label: "x", paid: "1,500" })).toThrow();
    expect(() => budgetItemInput.parse({ label: "x", estimated: "30000000" })).toThrow(); // > £20m cap
  });

  it("blanks category/notes to null", () => {
    const w = write({ label: "x", category: "  ", notes: "" });
    expect(w.category).toBeNull();
    expect(w.notes).toBeNull();
  });

  it("toBudgetItemPatch only includes provided fields (absent amount is not zeroed)", () => {
    const patch = toBudgetItemPatch(budgetItemInput.partial().parse({ paid: "250" }));
    expect(patch).toEqual({ paidCents: 25000 });
    expect("estimatedCents" in patch).toBe(false);
    expect("label" in patch).toBe(false);
  });
});
