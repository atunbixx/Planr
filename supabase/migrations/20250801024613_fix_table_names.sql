-- Simple migration to rename couples to wedding_couples
-- Only rename tables that exist

-- Check if couples table exists and rename it
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'couples') THEN
        ALTER TABLE couples RENAME TO wedding_couples;
    END IF;
END $$;

-- Check if guests table exists and rename it
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'guests') THEN
        ALTER TABLE guests RENAME TO wedding_guests;
    END IF;
END $$;