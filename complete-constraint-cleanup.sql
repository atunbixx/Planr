-- Complete cleanup of all cross-schema constraints
-- Run this in Supabase SQL Editor to remove ALL auth schema references

-- Drop all foreign key constraints that reference auth.users
DO $$ 
DECLARE
    constraint_record RECORD;
BEGIN
    -- Find and drop all foreign key constraints that reference auth schema
    FOR constraint_record IN 
        SELECT tc.table_name, tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
        JOIN information_schema.key_column_usage kcu ON rc.unique_constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_schema = 'public'
        AND kcu.table_schema = 'auth'
    LOOP
        EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I', 
                      constraint_record.table_name, 
                      constraint_record.constraint_name);
        RAISE NOTICE 'Dropped constraint % from table %', 
                     constraint_record.constraint_name, 
                     constraint_record.table_name;
    END LOOP;
END $$;

-- Also explicitly drop known problematic constraints
ALTER TABLE IF EXISTS public.couples DROP CONSTRAINT IF EXISTS couples_partner1_user_id_fkey1;
ALTER TABLE IF EXISTS public.couples DROP CONSTRAINT IF EXISTS couples_partner2_user_id_fkey1;
ALTER TABLE IF EXISTS public.messages DROP CONSTRAINT IF EXISTS messages_recipient_id_fkey;

-- Show remaining tables in public schema
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;