-- Clean up cross-schema constraints that prevent Prisma from working
-- Run this in Supabase SQL Editor

-- Drop the problematic foreign key constraint
ALTER TABLE IF EXISTS public.couples DROP CONSTRAINT IF EXISTS couples_partner1_user_id_fkey1;
ALTER TABLE IF EXISTS public.couples DROP CONSTRAINT IF EXISTS couples_partner2_user_id_fkey1;

-- Check what tables exist in public schema
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;