-- Fix database permissions for the application user
-- Run this in your Supabase SQL editor as an admin user

-- Grant usage on the public schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant all permissions on all tables to authenticated users
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant read permissions to anonymous users (for public data if needed)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Ensure future tables also get permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT ALL ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT ALL ON SEQUENCES TO authenticated;

-- Specifically grant permissions on the tables your app uses
GRANT ALL ON TABLE users TO authenticated;
GRANT ALL ON TABLE couples TO authenticated;
GRANT ALL ON TABLE guests TO authenticated;
GRANT ALL ON TABLE vendors TO authenticated;
GRANT ALL ON TABLE budget_categories TO authenticated;
GRANT ALL ON TABLE budget_expenses TO authenticated;
GRANT ALL ON TABLE photos TO authenticated;
GRANT ALL ON TABLE photo_albums TO authenticated;
GRANT ALL ON TABLE checklist_items TO authenticated;

-- If you're using service role for specific operations
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;