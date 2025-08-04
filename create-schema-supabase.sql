-- Create users table and other essential tables for wedding planner
-- This SQL will be run directly in Supabase SQL editor

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clerk_user_id VARCHAR NOT NULL UNIQUE,
    email VARCHAR NOT NULL UNIQUE,
    first_name VARCHAR,
    last_name VARCHAR,
    phone VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create couples table
CREATE TABLE IF NOT EXISTS couples (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    partner_name VARCHAR,
    wedding_date DATE,
    venue_name VARCHAR,
    venue_location VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a test user
INSERT INTO users (clerk_user_id, email, first_name, last_name, phone) 
VALUES ('test_user_init', 'test@weddingplanner.com', 'Test', 'User', '+1234567890')
ON CONFLICT (clerk_user_id) DO NOTHING;

-- Verify tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('users', 'couples')
ORDER BY table_name;