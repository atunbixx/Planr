-- Create Prisma User for Supabase Database
-- Run this in Supabase SQL Editor

-- 1. Create the prisma_user with a secure password
CREATE USER prisma_user WITH PASSWORD 'Pr!sm4_WeddingDB_2024_$ecure#9K7mX2qL';

-- 2. Grant connection privileges to the database
GRANT CONNECT ON DATABASE postgres TO prisma_user;

-- 3. Grant usage on public schema
GRANT USAGE ON SCHEMA public TO prisma_user;

-- 4. Grant CRUD operations on all existing tables in public schema
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO prisma_user;

-- 5. Grant usage on all existing sequences (needed for auto-increment fields)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO prisma_user;

-- 6. Set default privileges for future tables
-- This ensures prisma_user automatically gets permissions on new tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO prisma_user;

-- 7. Set default privileges for future sequences
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT USAGE, SELECT ON SEQUENCES TO prisma_user;

-- 8. Grant CREATE privilege on public schema for Prisma Migrate
-- This allows Prisma to create new tables during migrations
GRANT CREATE ON SCHEMA public TO prisma_user;

-- 9. Grant USAGE and CREATE on the database's schema
-- This is needed for Prisma to manage migrations
GRANT USAGE, CREATE ON SCHEMA public TO prisma_user;

-- 10. Grant privileges needed for Prisma migrations
-- Allow prisma_user to create and manage the _prisma_migrations table
GRANT CREATE ON DATABASE postgres TO prisma_user;

-- 11. Grant ability to create temporary tables (used by some Prisma operations)
GRANT TEMPORARY ON DATABASE postgres TO prisma_user;

-- Verify the user was created and permissions granted
SELECT 
    'User created successfully' as status,
    usename as username,
    usesuper as is_superuser,
    usecreatedb as can_create_db
FROM pg_user 
WHERE usename = 'prisma_user';

-- Check granted privileges on tables
SELECT 
    'Table privileges' as privilege_type,
    table_name,
    string_agg(privilege_type, ', ') as privileges
FROM (
    SELECT 
        table_name, 
        privilege_type
    FROM information_schema.table_privileges
    WHERE grantee = 'prisma_user'
        AND table_schema = 'public'
) t
GROUP BY table_name
ORDER BY table_name;