-- Grant necessary permissions to existing prisma user
-- Run this in Supabase SQL Editor

-- First, update the password
ALTER USER "prisma" WITH PASSWORD 'PrismaWeddingPlanner2025!';

-- Grant necessary privileges for Prisma to work
ALTER USER "prisma" WITH BYPASSRLS CREATEDB;

-- Extend prisma's privileges to postgres (necessary to view changes in Dashboard)
GRANT "prisma" TO "postgres";

-- Grant permissions on public schema
GRANT USAGE ON SCHEMA public TO prisma;
GRANT CREATE ON SCHEMA public TO prisma;
GRANT ALL ON ALL TABLES IN SCHEMA public TO prisma;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO prisma;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO prisma;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO prisma;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO prisma;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO prisma;

-- Verify the updated permissions
SELECT usename, usebypassrls, usecreatedb FROM pg_user WHERE usename = 'prisma';