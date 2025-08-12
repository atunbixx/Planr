-- Fix schema permissions for prisma1
-- Run this in Supabase SQL Editor

-- Grant CREATE and USAGE on public schema
GRANT CREATE, USAGE ON SCHEMA public TO prisma1;

-- Grant all privileges on existing objects
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO prisma1;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO prisma1;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO prisma1;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO prisma1;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO prisma1;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO prisma1;

-- Test permissions
DO $$
BEGIN
    -- Test if we can create a table
    EXECUTE 'CREATE TABLE IF NOT EXISTS _permissions_test (id int)';
    EXECUTE 'DROP TABLE IF EXISTS _permissions_test';
    RAISE NOTICE '✅ Schema permissions fixed - prisma1 can now create tables';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Still having permission issues: %', SQLERRM;
END
$$;