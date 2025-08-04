-- Verification query for photo gallery schema
-- Run this after executing photo-gallery-schema.sql

-- Check if all tables exist
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('photo_albums', 'photos', 'photo_shares', 'photo_comments', 'photo_reactions')
ORDER BY table_name;

-- Check if album_id column exists in photos table
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'photos' 
    AND column_name = 'album_id';

-- Check if all expected columns exist in photos table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'photos'
ORDER BY ordinal_position;