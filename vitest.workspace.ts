import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  {
    extends: false,
    test: {
      name: "unit",
      include: ["packages/*/src/**/*.test.ts", "packages/*/*.test.ts"],
      exclude: ["**/*.int.test.ts", "**/node_modules/**", "**/generated/**"],
    },
  },
]);
