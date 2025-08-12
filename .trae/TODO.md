# TODO:

- [x] update-onboarding-page: Update src/app/onboarding/page.tsx to use Supabase server-side authentication instead of Clerk (priority: High)
- [x] remove-middleware-clerk: Remove or update middleware.ts file that contains Clerk references (priority: High)
- [x] create-infrastructure-dir: Create src/infrastructure/api/documentation directory structure (priority: High)
- [x] implement-openapi-generator: Implement openApiGenerator.ts file with OpenApiGenerator class (priority: High)
- [x] test-build-fix: Run npm run build to verify the fix resolves the Module not found error (priority: High)
- [x] run-type-check: Run npm run typecheck to check for TypeScript errors (found separate type issues unrelated to build) (priority: High)
- [ ] update-api-routes-clerk: Update all API routes in src/app/api/ that still use @clerk/nextjs/server imports (**IN PROGRESS**) (priority: High)
- [ ] remove-clerk-provider: Remove ClerkProviderClient component from src/components/providers/ (priority: Medium)
- [ ] update-auth-helpers: Update src/infrastructure/auth/auth-helpers.ts to remove Clerk references (priority: Medium)
- [ ] test-migration-complete: Test the complete application to ensure all authentication flows work with Supabase (priority: Medium)
