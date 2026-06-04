import { describe, it, expect } from "vitest";
import { ESLint } from "eslint";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const VIOLATION =
  'import { PrismaClient } from "@prisma/client";\nexport const x = new PrismaClient();\n';

async function ruleIdsFor(relPath: string): Promise<string[]> {
  const eslint = new ESLint({ cwd: repoRoot });
  const filePath = path.join(repoRoot, relPath);
  if (await eslint.isPathIgnored(filePath)) {
    throw new Error(`${relPath} is ignored by eslint; cannot probe boundary rule`);
  }
  const results = await eslint.lintText(VIOLATION, { filePath });
  return (results[0]?.messages ?? []).map((m) => m.ruleId ?? "");
}

describe("Prisma import boundary rule", () => {
  it("flags @prisma/client imports inside @planr/core (a non-db package)", async () => {
    const rules = await ruleIdsFor("packages/core/src/__boundary_probe.ts");
    expect(rules).toContain("no-restricted-imports");
  });

  it("allows @prisma/client imports inside @planr/db", async () => {
    const rules = await ruleIdsFor("packages/db/src/__boundary_probe.ts");
    expect(rules).not.toContain("no-restricted-imports");
  });
});
