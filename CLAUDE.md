# Wedding Planner v2 - Claude Code Configuration

## Development Server
- **Port**: 4000 (preferred for this project)
- **Command**: `npm run dev -- --port 4000`

## Core Build Commands
- `npm run build` - Build project
- `npm run dev` - Start development server  
- `npm run test` - Run tests
- `npm run lint` - Run linter
- `npm run typecheck` - Run TypeScript checking

## Project Architecture
Next.js 14 wedding planning application with:
- **Frontend**: React, TypeScript, Tailwind CSS
- **Database**: Prisma with Supabase PostgreSQL
- **Authentication**: Clerk
- **UI Components**: shadcn/ui
- **Testing**: Jest, Playwright

## Development Guidelines
- Follow existing project patterns and conventions
- Use absolute imports from `src/` directory
- Implement proper error boundaries and null safety
- Maintain responsive design with Tailwind CSS
- Test critical user paths before committing

## Important Files
- `prisma/schema.prisma` - Database schema
- `src/app/` - Next.js app router pages
- `src/components/` - Reusable React components
- `src/lib/` - Utility functions and services
- `middleware.ts` - Request middleware
- `tailwind.config.ts` - Tailwind configuration