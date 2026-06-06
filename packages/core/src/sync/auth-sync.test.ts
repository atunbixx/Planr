import { describe, it, expect } from "vitest";
import { makeFakeRepositories } from "../testing/fakes";
import { syncAuthUser } from "./auth-sync";

describe("syncAuthUser", () => {
  it("upserts the authenticated user into our User table", async () => {
    const repos = makeFakeRepositories();
    const user = await syncAuthUser(repos, { authUserId: "auth_9", email: "z@x.com", name: "Zed" });
    expect(user).toMatchObject({ authUserId: "auth_9", email: "z@x.com" });
    expect(await repos.users.findByAuthUserId("auth_9")).toMatchObject({ id: user.id });
  });

  it("is idempotent and updates email/name on repeat", async () => {
    const repos = makeFakeRepositories();
    const a = await syncAuthUser(repos, { authUserId: "auth_9", email: "z@x.com", name: "Zed" });
    const b = await syncAuthUser(repos, { authUserId: "auth_9", email: "z2@x.com", name: "Zed II" });
    expect(b.id).toBe(a.id);
    expect(b.email).toBe("z2@x.com");
  });
});
