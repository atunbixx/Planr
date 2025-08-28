This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

## Database Setup and Migrations

This project uses Prisma with a PostgreSQL database hosted on Supabase.

### Environment Variables

Before running migrations or the application, you need to create a `.env` file in the root of the project. You can copy the `.env.example` file as a template:

```bash
cp .env.example .env
```

You will need to populate this file with two different connection strings from your Supabase project settings:

1.  `DATABASE_URL`: The pooled connection string, used by the application at runtime. Found under `Database -> Connection string -> "URI" (pooled)`.
2.  `DIRECT_URL`: The direct database connection string, used by Prisma for migrations. Found under `Database -> Connection string -> "URI" (direct)`.

### Running Migrations

With the `.env` file configured, you can run Prisma migrations with the following command:

```bash
npx prisma migrate dev
```

### Migration Fallback for Connectivity Issues

If you are unable to run `prisma migrate dev` due to network restrictions or other connectivity problems, you can use the following manual process:

1.  **Generate Migration SQL**: The repository contains migration files in the `prisma/migrations` directory. Each sub-directory contains a `migration.sql` file.
2.  **Apply Manually**: Copy the content of these SQL files and run them directly in your Supabase project's SQL Editor (`Database -> SQL Editor`). You should apply them in chronological order based on the timestamp in the directory name.

As a convenience, you can also generate a single SQL file for the entire current schema (if you have made changes) by running:

```bash
npm run generate:migration-sql
```

This will create a `migration.sql` file in the root directory. You can then copy its content and run it in the Supabase SQL Editor.
