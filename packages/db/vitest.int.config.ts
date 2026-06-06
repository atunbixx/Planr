import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.int.test.ts"],
    testTimeout: 60_000, // create db + migrate deploy
    hookTimeout: 60_000,
    fileParallelism: false, // bound connections; each file uses its own database
  },
});
