import { describe, it, expect } from "vitest";
import { parseEnv } from "./env";

const valid = {
  DATABASE_URL: "postgresql://u:p@h/db?sslmode=require",
  CLERK_SECRET_KEY: "sk_test_1",
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_1",
  CLERK_WEBHOOK_SECRET: "whsec_1",
  STRIPE_SECRET_KEY: "sk_test_2",
  STRIPE_WEBHOOK_SECRET: "whsec_2",
  NEXT_PUBLIC_BASE_URL: "http://localhost:3000",
};

describe("parseEnv", () => {
  it("returns a typed config for valid input", () => {
    const env = parseEnv(valid);
    expect(env.DATABASE_URL).toBe(valid.DATABASE_URL);
    expect(env.SENTRY_DSN).toBeUndefined();
  });

  it("throws a clear error listing every missing required key", () => {
    expect(() => parseEnv({})).toThrowError(/DATABASE_URL/);
  });

  it("rejects a non-URL DATABASE_URL", () => {
    expect(() => parseEnv({ ...valid, DATABASE_URL: "not-a-url" })).toThrowError(
      /DATABASE_URL/,
    );
  });
});
