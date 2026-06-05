import { describe, it, expect } from "vitest";
import { taskInput, toTaskWrite, toTaskPatch } from "./task.dto";

describe("taskInput", () => {
  it("accepts a minimal valid task and normalises optionals to null/false", () => {
    const write = toTaskWrite(taskInput.parse({ title: "Book the venue" }));
    expect(write).toEqual({ title: "Book the venue", notes: null, done: false, dueDate: null });
  });

  it("rejects an empty title", () => {
    expect(() => taskInput.parse({ title: "" })).toThrow();
  });

  it("parses a bare yyyy-mm-dd due date into a Date and blanks to null", () => {
    const parsed = toTaskWrite(taskInput.parse({ title: "X", dueDate: "2026-07-01" }));
    expect(parsed.dueDate).toBeInstanceOf(Date);
    expect(toTaskWrite(taskInput.parse({ title: "X", dueDate: "" })).dueDate).toBeNull();
  });

  it("parses a full ISO datetime due date", () => {
    const parsed = toTaskWrite(taskInput.parse({ title: "X", dueDate: "2026-07-01T09:30:00.000Z" }));
    expect(parsed.dueDate?.toISOString()).toBe("2026-07-01T09:30:00.000Z");
  });

  it("rejects a malformed due date", () => {
    expect(() => taskInput.parse({ title: "X", dueDate: "next tuesday" })).toThrow();
  });

  it("toTaskPatch only includes provided fields (absent dueDate is not nulled)", () => {
    const patch = toTaskPatch(taskInput.partial().parse({ done: true }));
    expect(patch).toEqual({ done: true });
    expect("dueDate" in patch).toBe(false);
  });
});
