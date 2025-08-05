-- Simple password update for existing prisma user
-- Run this in Supabase SQL Editor

-- Update the password
ALTER USER "prisma" WITH PASSWORD 'PrismaWeddingPlanner2025!';

-- Verify the user exists
SELECT usename, usebypassrls, usecreatedb FROM pg_user WHERE usename = 'prisma';