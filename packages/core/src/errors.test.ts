import { describe, it, expect } from "vitest";
import { NotFoundError, ForbiddenError } from "./errors";

describe("domain errors", () => {
  it("NotFoundError carries a message and a stable name", () => {
    const e = new NotFoundError("Guest not found");
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("NotFoundError");
    expect(e.message).toBe("Guest not found");
  });

  it("ForbiddenError carries a message and a stable name", () => {
    const e = new ForbiddenError("Forbidden: nope");
    expect(e.name).toBe("ForbiddenError");
    expect(e.message).toMatch(/forbidden/i);
  });
});
