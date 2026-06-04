import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/generated/**",
      "**/.next/**",
      // Legacy Next.js app directories — removed in a later plan task
      "src/**",
      "src/**",
      "prisma/**",
      "scripts/**",
      "tests/**",
      "test-results/**",
      "playwright-report/**",
      "temp-data/**",
      // Root-level legacy config files (still present)
      "next.config.ts",
      "**/next-env.d.ts",
      "tsconfig.json",
      "tsconfig.seating.json",
      "tailwind.config.ts",
      "postcss.config.js",
      "playwright.config.ts",
    ],
  },
  ...tseslint.configs.recommended,
  {
    // Architectural boundary: Prisma may only be imported inside @planr/db.
    files: ["**/*.ts", "**/*.tsx"],
    ignores: ["packages/db/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@prisma/client",
              message: "Import Prisma only inside @planr/db. Use a repository instead.",
            },
          ],
          patterns: [
            {
              group: ["**/generated/client", "@planr/db/**/generated/**"],
              message: "Do not reach into @planr/db internals. Import from @planr/db.",
            },
          ],
        },
      ],
    },
  },
);
