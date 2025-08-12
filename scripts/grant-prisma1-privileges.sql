-- Grant Full Privileges to prisma1 User
-- Run this in your Supabase SQL Editor to give prisma1 complete database access

-- Grant superuser-like privileges to prisma1
ALTER USER prisma1 CREATEDB CREATEROLE BYPASSRLS;

-- Grant prisma1 to postgres role (necessary for Dashboard visibility)
GRANT prisma1 TO postgres;

-- Grant usage and create on public schema
GRANT USAGE ON SCHEMA public TO prisma1;
GRANT CREATE ON SCHEMA public TO prisma1;

-- Grant all privileges on all existing tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO prisma1;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO prisma1;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO prisma1;

-- Grant all privileges on all future objects created by any user
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO prisma1;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO prisma1;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO prisma1;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO prisma1;

-- Grant specific privileges for system catalogs (needed for migrations)
GRANT SELECT ON pg_catalog.pg_class TO prisma1;
GRANT SELECT ON pg_catalog.pg_namespace TO prisma1;
GRANT SELECT ON pg_catalog.pg_attribute TO prisma1;
GRANT SELECT ON pg_catalog.pg_index TO prisma1;
GRANT SELECT ON pg_catalog.pg_constraint TO prisma1;
GRANT SELECT ON information_schema.tables TO prisma1;
GRANT SELECT ON information_schema.columns TO prisma1;
GRANT SELECT ON information_schema.key_column_usage TO prisma1;
GRANT SELECT ON information_schema.table_constraints TO prisma1;

-- Grant privileges on Supabase system tables (if they exist)
DO $$
BEGIN
    -- Grant on auth schema if it exists
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth') THEN
        GRANT USAGE ON SCHEMA auth TO prisma1;
        GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA auth TO prisma1;
    END IF;
    
    -- Grant on extensions schema if it exists  
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'extensions') THEN
        GRANT USAGE ON SCHEMA extensions TO prisma1;
        GRANT SELECT ON ALL TABLES IN SCHEMA extensions TO prisma1;
    END IF;
    
    -- Grant on storage schema if it exists
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage') THEN
        GRANT USAGE ON SCHEMA storage TO prisma1;
        GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA storage TO prisma1;
    END IF;
END
$$;

-- Grant specific extension usage (UUID generation)
GRANT EXECUTE ON FUNCTION gen_random_uuid() TO prisma1;
GRANT EXECUTE ON FUNCTION uuid_generate_v4() TO prisma1;

-- Ensure prisma1 can create and drop tables, indexes, etc.
GRANT CREATE, USAGE ON SCHEMA public TO prisma1;

-- Grant trigger creation privileges
GRANT TRIGGER ON ALL TABLES IN SCHEMA public TO prisma1;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT TRIGGER ON TABLES TO prisma1;

-- Verify privileges were granted
SELECT 
    r.rolname as role_name,
    r.rolsuper as is_superuser,
    r.rolcreatedb as can_create_db,
    r.rolcreaterole as can_create_role,
    r.rolbypassrls as bypass_rls
FROM pg_roles r 
WHERE r.rolname = 'prisma1';

-- Show granted privileges on public schema
SELECT 
    n.nspname as schema_name,
    r.rolname as role_name,
    CASE 
        WHEN has_schema_privilege('prisma1', 'public', 'CREATE') THEN 'CREATE' 
        ELSE NULL 
    END as create_privilege,
    CASE 
        WHEN has_schema_privilege('prisma1', 'public', 'USAGE') THEN 'USAGE' 
        ELSE NULL 
    END as usage_privilege
FROM pg_namespace n, pg_roles r 
WHERE n.nspname = 'public' AND r.rolname = 'prisma1';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Successfully granted full privileges to prisma1 user';
    RAISE NOTICE '📊 prisma1 now has:';
    RAISE NOTICE '   • Full table/sequence/function privileges';
    RAISE NOTICE '   • Create database and role privileges';  
    RAISE NOTICE '   • Bypass row level security';
    RAISE NOTICE '   • Default privileges for future objects';
    RAISE NOTICE '   • System catalog access for migrations';
    RAISE NOTICE '🚀 Ready for Prisma migrations and operations';
END
$$;