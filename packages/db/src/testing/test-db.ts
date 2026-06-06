import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { PrismaClient } from "../generated/client";

const execFileAsync = promisify(execFile);
const dbRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

/**
 * TEST_DATABASE_URL points at a running Postgres server (any maintenance database,
 * e.g. .../postgres). Each startTestDb() call creates a uniquely-named database,
 * applies all Prisma migrations into it, and returns a connected client. stop()
 * disconnects and drops the database, so runs are isolated and re-runnable.
 *
 * Local dev: start a Postgres and export TEST_DATABASE_URL.
 * CI: a `postgres` service container provides it.
 */
function adminUrl(): string {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error(
      "TEST_DATABASE_URL must be set to run @planr/db integration tests (a Postgres connection string).",
    );
  }
  return url;
}

function withDatabase(base: string, dbName: string): string {
  const u = new URL(base);
  u.pathname = `/${dbName}`;
  return u.toString();
}

export interface TestDb {
  prisma: PrismaClient;
  url: string;
  stop(): Promise<void>;
}

export async function startTestDb(): Promise<TestDb> {
  const admin = adminUrl();
  const dbName = `planr_test_${randomUUID().replace(/-/g, "")}`;

  const adminClient = new PrismaClient({ datasourceUrl: admin });
  await adminClient.$executeRawUnsafe(`CREATE DATABASE "${dbName}"`);
  await adminClient.$disconnect();

  const url = withDatabase(admin, dbName);
  await execFileAsync(
    "pnpm",
    ["exec", "prisma", "migrate", "deploy", "--schema", "prisma/schema.prisma"],
    { cwd: dbRoot, env: { ...process.env, DATABASE_URL: url } },
  );

  const prisma = new PrismaClient({ datasourceUrl: url });
  return {
    prisma,
    url,
    async stop() {
      await prisma.$disconnect();
      const cleanup = new PrismaClient({ datasourceUrl: admin });
      await cleanup.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${dbName}" WITH (FORCE)`);
      await cleanup.$disconnect();
    },
  };
}
