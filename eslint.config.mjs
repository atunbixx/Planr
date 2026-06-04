import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/generated/**",
      // Legacy Next.js app directories — removed in a later plan task
      ".next/**",
      "src/**",
      "prisma/**",
      "scripts/**",
      "tests/**",
      "test-results/**",
      "playwright-report/**",
      "wedding-planner-new/**",
      "temp-data/**",
      // Root-level legacy loose files
      "debug-vendors.js",
      "run-migrations.js",
      "start-3003.js",
      "start-dev.js",
      "start-server-3003.js",
      "start-server.js",
      "next.config.ts",
      "next-env.d.ts",
      "tsconfig.json",
      "tsconfig.seating.json",
      "tailwind.config.ts",
      "postcss.config.js",
      "playwright.config.ts",
    ],
  },
  ...tseslint.configs.recommended,
);
