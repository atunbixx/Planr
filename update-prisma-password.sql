-- Update existing prisma user password
-- Run this in Supabase SQL Editor

-- Change the prisma user password to our new secure password
ALTER USER "prisma" WITH PASSWORD 'PrismaWeddingPlanner2025!';

-- Verify the user exists and has correct privileges
SELECT usename, usebypassrls, usecreatedb FROM pg_user WHERE usename = 'prisma';

-- Also verify current permissions on public schema
SELECT grantee, privilege_type 
FROM information_schema.schema_privileges 
WHERE grantee = 'prisma' AND schema_name = 'public';